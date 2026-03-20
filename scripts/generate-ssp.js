const fs = require('fs');
const path = require('path');

const DIST_PATH = './dist/mercurion-overseas/browser/index.html';
const OUTPUT_DIR = './dist/mercurion-overseas/browser';
const ASSET_BASE_PATH = '/fastcommerce/';
const DEFAULT_SSP_VARIANTS = [
  { name: 'ng-shopping.ssp', mode: 'generated', baseHref: '/' },
  { name: 'ng-shopping-local.ssp', mode: 'static-local' },
];
const LOCAL_SSP_STATIC_CONTENT = `<!doctype html>
<html>
<head>
  <base href="/sca-dev-2019-2/ng-shopping-local.ssp">
  <link rel="stylesheet" href="http://localhost:4200/styles.css">
</head>
<body>
  <app-root></app-root>
  <script type="module" src="http://localhost:4200/main.js"></script>
</body>
</html>
`;

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

function normalizeStylesheetLinks(content) {
  return content.replace(/\s+media="print"\s+onload="this\.media='all'"/g, '');
}

function generateSspFiles(options = {}) {
  const distPath = options.distPath || DIST_PATH;
  const outputDir = options.outputDir || OUTPUT_DIR;
  const basePath = options.basePath || ASSET_BASE_PATH;
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
    const mode = variant.mode || 'generated';
    const baseHref = variant.baseHref || '/';
    const outputPath = path.join(outputDir, variant.name);

    let content = null;
    let source = mode;
    if (mode === 'static-local') {
      content = LOCAL_SSP_STATIC_CONTENT;
    } else {
      if (assetResolvedHtml === null) {
        if (!fs.existsSync(distPath)) {
          throw new Error(`Unable to generate SSP file. index.html not found at: ${distPath}`);
        }
        const html = fs.readFileSync(distPath, 'utf8');
        assetResolvedHtml = convertAssetUrls(html, basePath);
      }
      content = ensureBaseHref(assetResolvedHtml, baseHref);
    }

    if (mode !== 'static-local') {
      content = normalizeStylesheetLinks(content);
    }

    fs.writeFileSync(outputPath, content);
    generatedFiles.push({
      name: variant.name,
      mode,
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
