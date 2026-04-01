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

async function analyzeCssDetails() {
  try {
    const css = await fetchUrl('https://regulabio.com.br/css/style.css');
    
    // Find lines with background-image or background: url
    const lines = css.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('url(')) {
        console.log(`Line ${i}: ${lines[i]}`);
        // print a few lines around it
        console.log(lines.slice(Math.max(0, i-3), Math.min(lines.length, i+4)).join('\n'));
        console.log('---');
      }
    }
  } catch (e) {
    console.error(e);
  }
}

analyzeCssDetails();
