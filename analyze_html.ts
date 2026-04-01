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

async function analyzeHtml() {
  try {
    const html = await fetchUrl('https://regulabio.com.br/');
    
    // Extract images
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    const images = new Set<string>();
    while ((match = imgRegex.exec(html)) !== null) {
      images.add(match[1]);
    }
    
    console.log("--- IMAGES ---");
    console.log(Array.from(images).join('\n'));
    
  } catch (e) {
    console.error(e);
  }
}

analyzeHtml();
