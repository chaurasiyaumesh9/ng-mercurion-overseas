#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateSspFiles } = require('./generate-ssp');

const DEFAULT_BUILD_DIR = path.resolve('dist/mercurion-overseas/browser');
const DEFAULT_ENV_FILE = path.resolve('.env.netsuite');
const DEFAULT_BATCH_BYTES = 4 * 1024 * 1024;
const DEFAULT_BATCH_FILES = 100;
const DEFAULT_SCRIPT_ID = 'customscript_sca_deployer';
const DEFAULT_DEPLOY_ID = 'customdeploy_sca_deployer';
const DEFAULT_CLEAN_TARGET = false;
const DEFAULT_REQUIRE_FOLDER_ARG = false;
const DEFAULT_DEPLOY_SUBFOLDER = 'fastcommerce';
const DEFAULT_FILE_RECORD_TYPES = ['mediaitem', 'mediaItem', 'file'];
const DEFAULT_FOLDER_RECORD_TYPES = ['folder', 'mediaitemfolder', 'mediaItemFolder'];
const DEFAULT_NG_SHOPPING_FILE_NAME = 'ng-shopping.ssp';
const DEFAULT_NG_SHOPPING_BASE_HREF = 'ng-shopping.ssp';
const DEFAULT_NG_SHOPPING_LOCAL_FILE_NAME = 'ng-shopping-local.ssp';
const DEFAULT_NG_SHOPPING_LOCAL_BASE_HREF = '/';

const BINARY_MIME_TYPES = new Set([
  'application/x-autocad',
  'image/x-xbitmap',
  'application/vnd.ms-excel',
  'application/x-shockwave-flash',
  'image/gif',
  'application/x-gzip-compressed',
  'image/ico',
  'image/jpeg',
  'message/rfc822',
  'audio/mpeg',
  'video/mpeg',
  'application/vnd.ms-project',
  'application/pdf',
  'image/pjpeg',
  'image/x-png',
  'image/png',
  'application/postscript',
  'application/vnd.ms-powerpoint',
  'video/quicktime',
  'application/rtf',
  'application/sms',
  'image/tiff',
  'application/vnd.visio',
  'application/msword',
  'application/zip',
  'image/svg+xml',
  'application/x-font-ttf',
  'application/font-woff',
  'application/vnd.ms-fontobject',
  'image/x-icon',
]);

function getArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseCsv(value, fallback) {
  if (!value) return fallback;
  const parsed = String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return parsed.length ? parsed : fallback;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return fallback;
}

function normalizeAccountId(accountId) {
  return String(accountId || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
}

function toBase64Url(input) {
  const raw = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64');
  return raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function collectFilesRecursively(rootDir) {
  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }

  return files.sort();
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const map = {
    '.css': 'text/css',
    '.gif': 'image/gif',
    '.htm': 'text/html',
    '.html': 'text/html',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.map': 'application/json',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff',
    '.xml': 'text/xml',
    '.zip': 'application/zip',
  };

  return map[ext] || 'text/plain';
}

function buildClientAssertion({ clientId, certificateId, privateKeyPem, tokenEndpoint }) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'PS256',
    typ: 'JWT',
    kid: certificateId,
  };

  const payload = {
    iss: clientId,
    aud: tokenEndpoint,
    iat: now,
    nbf: now,
    exp: now + 300,
    jti: crypto.randomUUID(),
    scope: ['restlets', 'rest_webservices'],
  };

  const signingInput = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}`;
  const signature = crypto.sign('sha256', Buffer.from(signingInput), {
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return `${signingInput}.${toBase64Url(signature)}`;
}

async function requestAccessToken({ accountId, clientId, certificateId, privateKeyPem }) {
  const account = normalizeAccountId(accountId);
  const tokenEndpoint = `https://${account}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;
  const assertion = buildClientAssertion({
    clientId,
    certificateId,
    privateKeyPem,
    tokenEndpoint,
  });

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: assertion,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Token request failed (${response.status}): ${text}`);
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Unable to parse token response: ${text}`);
  }

  if (!payload.access_token) {
    throw new Error(`Missing access_token in token response: ${text}`);
  }

  return { account, token: payload.access_token };
}

function buildRestletUrl({ account, scriptId, deployId }) {
  const url = new URL(`https://${account}.restlets.api.netsuite.com/app/site/hosting/restlet.nl`);
  url.searchParams.set('script', scriptId);
  url.searchParams.set('deploy', deployId);
  return url.toString();
}

function toDeployFilePayload({ filePath, rootDir, setIsOnline }) {
  const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');
  const type = getMimeType(relativePath);
  const buffer = fs.readFileSync(filePath);
  const contents = BINARY_MIME_TYPES.has(type) ? buffer.toString('base64') : buffer.toString('utf8');

  return {
    path: relativePath,
    type,
    contents,
    setIsOnline,
  };
}

function chunkDeployFiles(files, maxBatchFiles, maxBatchBytes) {
  const batches = [];
  let current = [];
  let currentSize = 0;

  for (const file of files) {
    const roughSize = Buffer.byteLength(file.contents, 'utf8') + 256;
    const nextFileCount = current.length + 1;
    const nextBatchSize = currentSize + roughSize;
    const exceedsCount = nextFileCount > maxBatchFiles;
    const exceedsSize = nextBatchSize > maxBatchBytes;

    if (current.length > 0 && (exceedsCount || exceedsSize)) {
      batches.push(current);
      current = [];
      currentSize = 0;
    }

    current.push(file);
    currentSize += roughSize;
  }

  if (current.length > 0) {
    batches.push(current);
  }

  return batches;
}

function partitionDeployFilesBySsp(files, sspFileNames) {
  const normalized = new Set(
    (sspFileNames || [])
      .map((name) => String(name || '').trim())
      .filter(Boolean),
  );

  const sspFiles = [];
  const buildFiles = [];
  for (const file of files) {
    const pathName = String(file?.path || '');
    if (normalized.has(pathName)) {
      sspFiles.push(file);
    } else {
      buildFiles.push(file);
    }
  }

  return { sspFiles, buildFiles };
}

function applyPathPrefix(files, pathPrefix) {
  const prefix = String(pathPrefix || '').trim().replace(/^\/+|\/+$/g, '');
  if (!prefix) return files;

  return files.map((file) => ({
    ...file,
    path: `${prefix}/${String(file.path || '').replace(/^\/+/, '')}`,
  }));
}

function createProgressTracker(totalFiles) {
  let prepared = 0;
  let uploaded = 0;

  const render = () => {
    const totalSteps = Math.max(1, totalFiles * 2);
    const doneSteps = prepared + uploaded;
    const percent = Math.min(100, Math.round((doneSteps / totalSteps) * 100));
    const line = `Progress ${percent}% | prepared ${prepared}/${totalFiles} | uploaded ${uploaded}/${totalFiles}`;

    if (process.stdout.isTTY) {
      process.stdout.write(`\r${line}`);
    } else {
      console.log(line);
    }
  };

  return {
    setPrepared(value) {
      prepared = Math.max(0, Math.min(totalFiles, value));
      render();
    },
    setUploaded(value) {
      uploaded = Math.max(0, Math.min(totalFiles, value));
      render();
    },
    finish() {
      if (process.stdout.isTTY) {
        process.stdout.write('\n');
      }
    },
  };
}

async function postDeployBatch({ restletUrl, token, targetFolderId, files, batchNo, totalBatches }) {
  const body = JSON.stringify({
    target_folder: String(targetFolderId),
    files,
  });

  const response = await fetch(restletUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Batch ${batchNo}/${totalBatches} failed (${response.status}): ${text}`);
  }

  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Batch ${batchNo}/${totalBatches}: unable to parse response: ${text}`);
  }

  if (parsed?.error) {
    const errorDetail =
      typeof parsed.error === 'string' ? parsed.error : parsed.error.message || JSON.stringify(parsed.error);
    throw new Error(`Batch ${batchNo}/${totalBatches} returned error: ${errorDetail}`);
  }

  return parsed;
}

async function suiteQlAll({ account, token, query, limit = 1000 }) {
  const rows = [];
  let offset = 0;

  while (true) {
    const paged = `https://${account}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql?limit=${limit}&offset=${offset}`;
    const response = await fetch(paged, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'transient',
      },
      body: JSON.stringify({ q: query }),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`SuiteQL failed (${response.status}): ${text}`);
    }

    let parsed;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`SuiteQL parse error: ${text}`);
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const hasMore =
      parsed?.hasMore === true ||
      (Number.isInteger(parsed?.totalResults) && offset + items.length < parsed.totalResults);
    rows.push(...items);
    if (!hasMore || items.length === 0 || items.length < limit) break;
    offset += limit;
  }

  return rows;
}

function isInvalidSearchTypeError(error) {
  const message = String(error?.message || '');
  return message.includes('Invalid search type');
}

function parseNetSuiteErrorPayload(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function extractNetSuiteErrorInfo(text) {
  const payload = parseNetSuiteErrorPayload(text);
  const detailFromPayload = payload?.['o:errorDetails']?.[0]?.detail;
  const detail = String(detailFromPayload || payload?.message || text || '');
  const errorCode = String(payload?.['o:errorCode'] || '');
  return { detail, errorCode };
}

function isMissingRecordTypeError(detail) {
  return detail.includes("Record type '") && detail.includes('does not exist');
}

function isNonexistentIdError(errorCode, detail) {
  return errorCode === 'NONEXISTENT_ID' || detail.includes('NONEXISTENT_ID');
}

async function suiteQlAllFirstSuccessful({ account, token, queries, limit = 1000 }) {
  let lastError = null;
  for (const query of queries) {
    try {
      return await suiteQlAll({ account, token, query, limit });
    } catch (error) {
      if (isInvalidSearchTypeError(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error(`All SuiteQL queries failed. Tried ${queries.length} candidate query forms.`);
}

async function deleteRecordByCandidates({ account, token, recordId, candidateTypes }) {
  let lastError = null;
  let sawMissingRecordType = false;
  let sawNonexistentId = false;

  for (const type of candidateTypes) {
    const endpoint = `https://${account}.suitetalk.api.netsuite.com/services/rest/record/v1/${type}/${recordId}`;
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'transient',
      },
    });

    if (response.ok || response.status === 204) {
      return { status: 'deleted', recordType: type };
    }

    const text = await response.text();
    const { detail, errorCode } = extractNetSuiteErrorInfo(text);
    const missingRecordType = isMissingRecordTypeError(detail);
    const nonexistentId = isNonexistentIdError(errorCode, detail);

    if (nonexistentId) {
      sawNonexistentId = true;
      lastError = new Error(detail || text);
      continue;
    }

    if (missingRecordType) {
      sawMissingRecordType = true;
      lastError = new Error(text);
      continue;
    }

    throw new Error(`Delete ${type}/${recordId} failed (${response.status}): ${detail || text}`);
  }

  if (sawNonexistentId) {
    return { status: 'not_found' };
  }

  if (sawMissingRecordType) {
    return { status: 'unsupported_record_type', detail: lastError?.message || '' };
  }

  throw new Error(`Unable to delete id ${recordId}. Tried: ${candidateTypes.join(', ')}.`);
}

async function cleanTargetFolder({
  account,
  token,
  targetFolderId,
  fileRecordTypes,
  folderRecordTypes,
}) {
  const rootId = Number(targetFolderId);
  if (!Number.isInteger(rootId) || rootId <= 0) {
    throw new Error(`Invalid NS_TARGET_FOLDER_ID: ${targetFolderId}`);
  }

  const folders = [{ id: rootId, level: 0 }];
  const queue = [{ id: rootId, level: 0 }];
  while (queue.length > 0) {
    const current = queue.shift();
    const childFolders = await suiteQlAllFirstSuccessful({
      account,
      token,
      queries: [
        `SELECT id FROM mediaitemfolder WHERE parent = ${current.id}`,
        `SELECT id FROM folder WHERE parent = ${current.id}`,
      ],
    });

    for (const row of childFolders) {
      const id = Number(row.id);
      if (!Number.isInteger(id) || id <= 0) continue;
      const node = { id, level: current.level + 1 };
      folders.push(node);
      queue.push(node);
    }
  }

  let deletedFiles = 0;
  let skippedFilesUnsupportedType = 0;
  let skippedFilesNotFound = 0;
  for (const folder of folders) {
    const files = await suiteQlAllFirstSuccessful({
      account,
      token,
      queries: [
        `SELECT id FROM file WHERE folder = ${folder.id}`,
        `SELECT id FROM mediaitem WHERE folder = ${folder.id}`,
      ],
    });

    for (const file of files) {
      const result = await deleteRecordByCandidates({
        account,
        token,
        recordId: file.id,
        candidateTypes: fileRecordTypes,
      });
      if (result.status === 'deleted') {
        deletedFiles += 1;
      } else if (result.status === 'not_found') {
        skippedFilesNotFound += 1;
      } else if (result.status === 'unsupported_record_type') {
        skippedFilesUnsupportedType += 1;
      }
    }
  }

  const childFoldersDeepFirst = folders
    .filter((f) => f.id !== rootId)
    .sort((a, b) => b.level - a.level);
  let deletedFolders = 0;
  let skippedFoldersUnsupportedType = 0;
  let skippedFoldersNotFound = 0;
  for (const folder of childFoldersDeepFirst) {
    const result = await deleteRecordByCandidates({
      account,
      token,
      recordId: folder.id,
      candidateTypes: folderRecordTypes,
    });
    if (result.status === 'deleted') {
      deletedFolders += 1;
    } else if (result.status === 'not_found') {
      skippedFoldersNotFound += 1;
    } else if (result.status === 'unsupported_record_type') {
      skippedFoldersUnsupportedType += 1;
    }
  }

  console.log(
    `Cleaned target folder ${targetFolderId}: deleted ${deletedFiles} files, ${deletedFolders} subfolders.`,
  );
  if (skippedFilesUnsupportedType || skippedFoldersUnsupportedType) {
    console.warn(
      [
        'Cleanup skipped some records because REST record types were not supported for this account/role.',
        `Skipped files (unsupported type): ${skippedFilesUnsupportedType}`,
        `Skipped folders (unsupported type): ${skippedFoldersUnsupportedType}`,
      ].join(' '),
    );
  }
  if (skippedFilesNotFound || skippedFoldersNotFound) {
    console.warn(
      `Cleanup skipped missing records: files=${skippedFilesNotFound}, folders=${skippedFoldersNotFound}.`,
    );
  }
}

async function main() {
  const envFile = path.resolve(getArg('envFile') || process.env.NS_ENV_FILE || DEFAULT_ENV_FILE);
  loadEnvFile(envFile);

  const accountId = getArg('account') || process.env.NS_ACCOUNT_ID;
  const clientId = getArg('clientId') || process.env.NS_CLIENT_ID;
  const certificateId = getArg('certificateId') || process.env.NS_CERTIFICATE_ID;
  const privateKey = getArg('privateKey') || process.env.NS_PRIVATE_KEY;
  const targetFolderId =
    getArg('folderId') || process.env.NS_TARGET_FOLDER_ID || process.env.NS_FILECABINET_FOLDER_ID;
  const scriptId = getArg('scriptId') || process.env.NS_DEPLOY_SCRIPT_ID || DEFAULT_SCRIPT_ID;
  const deployId = getArg('deployId') || process.env.NS_DEPLOY_DEPLOY_ID || DEFAULT_DEPLOY_ID;
  const sspBasePath = getArg('sspBasePath') || process.env.NS_SSP_BASE_PATH || '/fastcommerce/';
  const deploySubfolder =
    getArg('deploySubfolder') || process.env.NS_DEPLOY_SUBFOLDER || DEFAULT_DEPLOY_SUBFOLDER;
  const preferRepoSspFiles = parseBoolean(
    getArg('preferRepoSspFiles') || process.env.NS_PREFER_REPO_SSP_FILES,
    true,
  );
  const requireFolderArg = parseBoolean(
    getArg('requireFolderArg') || process.env.NS_REQUIRE_FOLDER_ARG,
    DEFAULT_REQUIRE_FOLDER_ARG,
  );
  const ngShoppingFileName =
    getArg('ngShoppingFileName') ||
    process.env.NS_NG_SHOPPING_FILE_NAME ||
    DEFAULT_NG_SHOPPING_FILE_NAME;
  const ngShoppingBaseHref =
    getArg('ngShoppingBaseHref') ||
    process.env.NS_NG_SHOPPING_BASE_HREF ||
    DEFAULT_NG_SHOPPING_BASE_HREF;
  const ngShoppingLocalFileName =
    getArg('ngShoppingLocalFileName') ||
    process.env.NS_NG_SHOPPING_LOCAL_FILE_NAME ||
    DEFAULT_NG_SHOPPING_LOCAL_FILE_NAME;
  const ngShoppingLocalBaseHref =
    getArg('ngShoppingLocalBaseHref') ||
    process.env.NS_NG_SHOPPING_LOCAL_BASE_HREF ||
    DEFAULT_NG_SHOPPING_LOCAL_BASE_HREF;
  const cleanTarget = parseBoolean(
    getArg('cleanTarget') || process.env.NS_CLEAN_TARGET_FOLDER,
    DEFAULT_CLEAN_TARGET,
  );
  const fileRecordTypes = parseCsv(
    getArg('fileRecordTypes') || process.env.NS_FILE_RECORD_TYPES,
    DEFAULT_FILE_RECORD_TYPES,
  );
  const folderRecordTypes = parseCsv(
    getArg('folderRecordTypes') || process.env.NS_FOLDER_RECORD_TYPES,
    DEFAULT_FOLDER_RECORD_TYPES,
  );
  const buildDir = path.resolve(getArg('dir') || process.env.NS_BUILD_DIR || DEFAULT_BUILD_DIR);
  const maxBatchBytes = parsePositiveInt(
    getArg('batchBytes') || process.env.NS_DEPLOY_BATCH_BYTES,
    DEFAULT_BATCH_BYTES,
  );
  const maxBatchFiles = parsePositiveInt(
    getArg('batchFiles') || process.env.NS_DEPLOY_BATCH_FILES,
    DEFAULT_BATCH_FILES,
  );
  const setIsOnline = parseBoolean(
    getArg('setIsOnline') || process.env.NS_SET_IS_ONLINE,
    true,
  );
  const folderIdFromArg = getArg('folderId');

  if (requireFolderArg && !folderIdFromArg) {
    throw new Error(
      'Missing --folderId=<target_folder_id>. This deploy command requires an explicit target folder.',
    );
  }

  if (!accountId || !clientId || !certificateId || !privateKey || !targetFolderId) {
    throw new Error(
      [
        'Missing required config. Provide in .env.netsuite (or CLI args):',
        '- NS_ACCOUNT_ID',
        '- NS_CLIENT_ID',
        '- NS_CERTIFICATE_ID',
        '- NS_PRIVATE_KEY',
        '- NS_TARGET_FOLDER_ID (or NS_FILECABINET_FOLDER_ID)',
      ].join('\n'),
    );
  }

  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build directory does not exist: ${buildDir}`);
  }

  const indexHtmlPath = path.join(buildDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    const generatedSspFiles = generateSspFiles({
      distPath: indexHtmlPath,
      outputDir: buildDir,
      basePath: sspBasePath,
      preferRepoFiles: preferRepoSspFiles,
      variants: [
        {
          name: ngShoppingFileName,
          baseHref: ngShoppingBaseHref,
          // Always regenerate from current index.html so hashed build assets stay in sync.
          preferRepoFile: false,
        },
        {
          name: ngShoppingLocalFileName,
          baseHref: ngShoppingLocalBaseHref,
          preferRepoFile: preferRepoSspFiles,
        },
      ],
    });
    const generatedSummary = generatedSspFiles
      .map((file) => `${file.name} [${file.source}] (base href: ${file.baseHref})`)
      .join(', ');
    console.log(`Generated SSP files: ${generatedSummary}`);
  } else {
    console.warn(`Skipping SSP generation. index.html not found at ${indexHtmlPath}.`);
  }

  const privateKeyPem = privateKey.replace(/\\n/g, '\n').trim();
  const absFiles = collectFilesRecursively(buildDir);
  if (absFiles.length === 0) {
    console.log(`No files found in ${buildDir}. Nothing to deploy.`);
    return;
  }

  console.log(`Authenticating to NetSuite account ${normalizeAccountId(accountId)}...`);
  const { account, token } = await requestAccessToken({
    accountId,
    clientId,
    certificateId,
    privateKeyPem,
  });

  const restletUrl = buildRestletUrl({ account, scriptId, deployId });
  console.log(`Using Restlet script=${scriptId}, deploy=${deployId}`);
  console.log(`Parent folder id: ${targetFolderId}`);
  console.log(`Deploy subfolder: ${deploySubfolder}`);
  console.log(`Build files will be uploaded under "${deploySubfolder}/" in the parent folder.`);
  console.log(`Clean target folder before deploy: ${cleanTarget ? 'yes' : 'no'}`);

  if (cleanTarget) {
    if (String(deploySubfolder || '').trim()) {
      console.warn(
        'Skipping cleanup because subfolder deploy mode is enabled. Set NS_DEPLOY_SUBFOLDER empty to clean root target folder.',
      );
    } else {
      await cleanTargetFolder({
        account,
        token,
        targetFolderId,
        fileRecordTypes,
        folderRecordTypes,
      });
    }
  }

  const totalFiles = absFiles.length;
  const progress = createProgressTracker(totalFiles);
  progress.setPrepared(0);
  progress.setUploaded(0);

  const payloadFiles = [];
  for (let i = 0; i < absFiles.length; i++) {
    payloadFiles.push(toDeployFilePayload({ filePath: absFiles[i], rootDir: buildDir, setIsOnline }));
    progress.setPrepared(i + 1);
  }

  const { sspFiles, buildFiles } = partitionDeployFilesBySsp(payloadFiles, [
    ngShoppingFileName,
    ngShoppingLocalFileName,
  ]);
  const buildFilesInSubfolder = applyPathPrefix(buildFiles, deploySubfolder);
  const sspBatches = chunkDeployFiles(sspFiles, maxBatchFiles, maxBatchBytes);
  const buildBatches = chunkDeployFiles(buildFilesInSubfolder, maxBatchFiles, maxBatchBytes);

  console.log(
    [
      `Deploying ${totalFiles} files from ${buildDir}:`,
      `- SSP files to parent folder ${targetFolderId}: ${sspFiles.length} file(s) in ${sspBatches.length} batch(es)`,
      `- Build files to subfolder path "${deploySubfolder}/" in parent folder ${targetFolderId}: ${buildFiles.length} file(s) in ${buildBatches.length} batch(es)`,
    ].join('\n'),
  );

  let uploaded = 0;
  for (let i = 0; i < sspBatches.length; i++) {
    const batch = sspBatches[i];
    await postDeployBatch({
      restletUrl,
      token,
      targetFolderId,
      files: batch,
      batchNo: i + 1,
      totalBatches: sspBatches.length,
    });
    uploaded += batch.length;
    progress.setUploaded(uploaded);
    console.log(
      `Uploaded SSP batch ${i + 1}/${sspBatches.length} (${uploaded}/${totalFiles} files).`,
    );
  }

  for (let i = 0; i < buildBatches.length; i++) {
    const batch = buildBatches[i];
    await postDeployBatch({
      restletUrl,
      token,
      targetFolderId,
      files: batch,
      batchNo: i + 1,
      totalBatches: buildBatches.length,
    });
    uploaded += batch.length;
    progress.setUploaded(uploaded);
    console.log(
      `Uploaded build batch ${i + 1}/${buildBatches.length} (${uploaded}/${totalFiles} files).`,
    );
  }

  progress.finish();

  console.log('Deployment completed successfully.');
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
