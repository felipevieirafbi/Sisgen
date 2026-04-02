async function fetchCSS() {
  const res = await fetch('https://regulabio.com.br/');
  const text = await res.text();
  const cssLinks = text.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g) || [];
  console.log("CSS Links:", cssLinks);
}
fetchCSS();
