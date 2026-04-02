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
    console.log(css.substring(0, 2000)); // Print first 2000 chars to see variables/structure
  } catch (e) {
    console.error(e);
  }
}

analyzeCssDetails();
