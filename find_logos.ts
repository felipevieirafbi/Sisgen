async function findLogos() {
  const res = await fetch('https://regulabio.com.br/');
  const text = await res.text();
  const logos = text.match(/<img[^>]+src="([^"]+logo[^"]+)"/gi) || [];
  console.log("Logos:", logos);
}
findLogos();
