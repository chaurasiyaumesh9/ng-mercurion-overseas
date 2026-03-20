const fs = require('fs');
const path = require('path');

const DIST_PATH = './dist/mercurion-overseas/browser/index.html';
const OUTPUT_DIR = './dist/mercurion-overseas/browser';
const REPO_SSP_DIR = './ssp';
const ASSET_BASE_PATH = '/fastcommerce/';
const DEFAULT_SSP_VARIANTS = [
  { name: 'ng-shopping.ssp', baseHref: 'ng-shopping.ssp' },
  { name: 'ng-shopping-local.ssp', baseHref: '/' },
];

function convertAssetUrls(content, basePath) {
  return content.replace(/(src|href)="([^"]+)"/g, (match, attr, url) => {
    if (
      url.startsWith('http') ||
      url.startsWith('data:') ||
      url.startsWith('#') ||
      url.includes('<%=')
    ) {
      return match;
    }

    return `${attr}="<%= session.getAbsoluteUrl2('${basePath}${url}') %>"`;
  });
}

function ensureBaseHref(content, baseHref) {
  const normalized = String(baseHref || '/').trim() || '/';
  if (/<base href="[^"]*">/.test(content)) {
    return content.replace(/<base href="[^"]*">/, `<base href="${normalized}">`);
  }

  return content.replace('<head>', `<head>\n  <base href="${normalized}">`);
}

function tryReadFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function generateSspFiles(options = {}) {
  const distPath = options.distPath || DIST_PATH;
  const outputDir = options.outputDir || OUTPUT_DIR;
  const repoSspDir = options.repoSspDir || REPO_SSP_DIR;
  const basePath = options.basePath || ASSET_BASE_PATH;
  const preferRepoFiles = options.preferRepoFiles !== false;
  const variants = Array.isArray(options.variants) && options.variants.length
    ? options.variants
    : DEFAULT_SSP_VARIANTS;

  let assetResolvedHtml = null;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const generatedFiles = [];
  for (const variant of variants) {
    if (!variant?.name) continue;
    const baseHref = variant.baseHref || '/';
    const outputPath = path.join(outputDir, variant.name);
    const variantPreferRepo = variant.preferRepoFile ?? preferRepoFiles;

    let content = null;
    let source = 'generated';
    if (variantPreferRepo) {
      const repoFilePath = path.resolve(repoSspDir, variant.name);
      content = tryReadFile(repoFilePath);
      if (content !== null) {
        source = 'repo';
      }
    }

    if (content === null) {
      if (assetResolvedHtml === null) {
        if (!fs.existsSync(distPath)) {
          throw new Error(`Unable to generate SSP file. index.html not found at: ${distPath}`);
        }
        const html = fs.readFileSync(distPath, 'utf8');
        assetResolvedHtml = convertAssetUrls(html, basePath);
      }
      content = ensureBaseHref(assetResolvedHtml, baseHref);
    }

    fs.writeFileSync(outputPath, content);
    generatedFiles.push({
      name: variant.name,
      baseHref,
      outputPath,
      source,
    });
  }

  return generatedFiles;
}

module.exports = {
  generateSspFiles,
};

if (require.main === module) {
  const generated = generateSspFiles();
  const names = generated
    .map((file) => `${file.name} [${file.source}] (base href: ${file.baseHref})`)
    .join(', ');
  console.log(`SSP files generated successfully: ${names}`);
}
