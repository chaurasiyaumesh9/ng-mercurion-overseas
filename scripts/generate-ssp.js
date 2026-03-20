const fs = require('fs');
const path = require('path');

const DIST_PATH = './dist/mercurion-overseas/browser/index.html';
const OUTPUT_PATH = './dist/mercurion-overseas/browser/home.ssp';
const BASE_PATH = '/angular/browser/';

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

function generateHomeSsp(options = {}) {
  const distPath = options.distPath || DIST_PATH;
  const outputPath = options.outputPath || OUTPUT_PATH;
  const basePath = options.basePath || BASE_PATH;

  let html = fs.readFileSync(distPath, 'utf8');

  html = convertAssetUrls(html, basePath);
  html = html.replace(/<base href="[^"]*">/, '<base href="/">');

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html);
  return html;
}

module.exports = {
  generateHomeSsp,
};

if (require.main === module) {
  generateHomeSsp();
  console.log('home.ssp generated successfully');
}
