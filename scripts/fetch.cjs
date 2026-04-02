const https = require('https');

https.get('https://regulabio.com.br/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const cssLinks = data.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g);
    const styleTags = data.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
    const images = data.match(/<img[^>]+src="([^"]+)"/g);
    const bgImages = data.match(/background-image:\s*url\(([^)]+)\)/g);
    
    console.log("CSS Links:", cssLinks);
    console.log("Style Tags:", styleTags ? styleTags.map(s => s.substring(0, 100) + '...') : null);
    console.log("Images:", images);
    console.log("Background Images:", bgImages);
    
    // Also print some of the HTML to see classes
    console.log("HTML Sample:", data.substring(0, 1000));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
