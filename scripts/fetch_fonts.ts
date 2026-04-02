async function fetchFonts() {
  const res = await fetch('https://regulabio.com.br/');
  const text = await res.text();
  const fonts = text.match(/fonts\.googleapis\.com\/css2\?family=([^&"]+)/g) || [];
  console.log("Google Fonts:", fonts);
}
fetchFonts();
