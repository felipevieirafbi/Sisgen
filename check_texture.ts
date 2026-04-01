async function check() {
  const res = await fetch('https://regulabio.com.br/assets/images/texture-straw.jpg');
  console.log(res.status, res.statusText);
}
check();
