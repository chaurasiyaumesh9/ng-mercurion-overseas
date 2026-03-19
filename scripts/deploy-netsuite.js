#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_BUILD_DIR = path.resolve('dist/mercurion-overseas/browser');
const DEFAULT_ENV_FILE = path.resolve('.env.netsuite');
const DEFAULT_BATCH_BYTES = 4 * 1024 * 1024;
const DEFAULT_BATCH_FILES = 100;
const DEFAULT_SCRIPT_ID = 'customscript_sca_deployer';
const DEFAULT_DEPLOY_ID = 'customdeploy_sca_deployer';

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
  console.log(`Target folder id: ${targetFolderId}`);

  const totalFiles = absFiles.length;
  const progress = createProgressTracker(totalFiles);
  progress.setPrepared(0);
  progress.setUploaded(0);

  const payloadFiles = [];
  for (let i = 0; i < absFiles.length; i++) {
    payloadFiles.push(toDeployFilePayload({ filePath: absFiles[i], rootDir: buildDir, setIsOnline }));
    progress.setPrepared(i + 1);
  }

  const batches = chunkDeployFiles(payloadFiles, maxBatchFiles, maxBatchBytes);

  console.log(
    `Deploying ${totalFiles} files in ${batches.length} batch(es) from ${buildDir}...`,
  );

  let uploaded = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    await postDeployBatch({
      restletUrl,
      token,
      targetFolderId,
      files: batch,
      batchNo: i + 1,
      totalBatches: batches.length,
    });
    uploaded += batch.length;
    progress.setUploaded(uploaded);
    console.log(`Uploaded batch ${i + 1}/${batches.length} (${uploaded}/${totalFiles} files).`);
  }

  progress.finish();
  console.log('Deployment completed successfully.');
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
