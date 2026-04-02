async function fetchLogo() {
  const res = await fetch('https://regulabio.com.br/');
  const text = await res.text();
  const logoMatch = text.match(/<img[^>]+src="([^"]+logo[^"]+)"/i);
  console.log("Logo URL:", logoMatch ? logoMatch[1] : "Not found");
}
fetchLogo();
