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

async function analyze() {
  try {
    const html = await fetchUrl('https://regulabio.com.br/');
    
    // Extract images
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    const images = new Set<string>();
    while ((match = imgRegex.exec(html)) !== null) {
      images.add(match[1]);
    }
    
    // Extract background images from inline styles
    const bgRegex = /background(?:-image)?:\s*url\(['"]?([^'"()]+)['"]?\)/gi;
    const backgrounds = new Set<string>();
    while ((match = bgRegex.exec(html)) !== null) {
      backgrounds.add(match[1]);
    }
    
    // Extract colors (hex)
    const colorRegex = /#[0-9a-fA-F]{3,6}/g;
    const colors = new Set<string>();
    while ((match = colorRegex.exec(html)) !== null) {
      colors.add(match[0].toLowerCase());
    }

    // Extract CSS files
    const cssRegex = /<link[^>]+href=["']([^"']+\.css)["']/gi;
    const cssFiles = new Set<string>();
    while ((match = cssRegex.exec(html)) !== null) {
      cssFiles.add(match[1]);
    }

    console.log("--- IMAGES ---");
    console.log(Array.from(images).join('\n'));
    console.log("\n--- BACKGROUNDS ---");
    console.log(Array.from(backgrounds).join('\n'));
    console.log("\n--- COLORS (Sample) ---");
    console.log(Array.from(colors).slice(0, 20).join(', '));
    console.log("\n--- CSS FILES ---");
    console.log(Array.from(cssFiles).join('\n'));
    
  } catch (e) {
    console.error(e);
  }
}

analyze();
