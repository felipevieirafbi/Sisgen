const https = require('https');

https.get('https://regulabio.com.br/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const colors = data.match(/#[0-9a-fA-F]{6}/g) || [];
    const counts = {};
    colors.forEach(c => { counts[c.toLowerCase()] = (counts[c.toLowerCase()] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
    console.log("Colors:", sorted);
    
    const fonts = data.match(/font-family:[^;"]+/g) || [];
    const fontCounts = {};
    fonts.forEach(f => { fontCounts[f] = (fontCounts[f] || 0) + 1; });
    console.log("Fonts:", Object.entries(fontCounts).sort((a, b) => b[1] - a[1]).slice(0, 5));
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
