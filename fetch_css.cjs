const https = require('https');

https.get('https://regulabio.com.br/css/style.css', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data.substring(0, 2000));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
