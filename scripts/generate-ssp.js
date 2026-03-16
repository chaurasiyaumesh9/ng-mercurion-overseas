const fs = require('fs');
const path = require('path');

const DIST_PATH = './dist/mercurion-overseas/browser/index.html';
const OUTPUT_PATH = './dist/mercurion-overseas/browser/home.ssp';
const BASE_PATH = '/angular/browser/';

let html = fs.readFileSync(DIST_PATH, 'utf8');

/*
---------------------------------------------------
1. Fix base href explicitly
---------------------------------------------------
*/

html = html.replace(
  /<base href="[^"]*">/,
  `<base href="<%= session.getAbsoluteUrl2('${BASE_PATH}') %>">`,
);

/*
---------------------------------------------------
2. Convert asset URLs
---------------------------------------------------
*/

function convertAssetUrls(content) {
  return content.replace(/(src|href)="([^"]+)"/g, (match, attr, url) => {
    if (
      url.startsWith('http') ||
      url.startsWith('data:') ||
      url.startsWith('#') ||
      url.includes('<%=')
    ) {
      return match;
    }

    return `${attr}="<%= session.getAbsoluteUrl2('${BASE_PATH}${url}') %>"`;
  });
}

html = convertAssetUrls(html);

/*
---------------------------------------------------
3. Ensure output directory exists
---------------------------------------------------
*/

const outputDir = path.dirname(OUTPUT_PATH);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/*
---------------------------------------------------
4. Write file
---------------------------------------------------
*/

fs.writeFileSync(OUTPUT_PATH, html);

console.log('home.ssp generated successfully');
