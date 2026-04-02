import * as https from 'https';

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function analyzeCss() {
  try {
    const css = await fetchUrl('https://regulabio.com.br/css/style.css');
    
    // Extract background images
    const bgRegex = /url\(['"]?([^'"()]+)['"]?\)/gi;
    let match;
    const backgrounds = new Set<string>();
    while ((match = bgRegex.exec(css)) !== null) {
      backgrounds.add(match[1]);
    }
    
    console.log("--- BACKGROUNDS IN CSS ---");
    console.log(Array.from(backgrounds).join('\n'));
    
  } catch (e) {
    console.error(e);
  }
}

analyzeCss();
