async function checkLogo() {
  const res = await fetch('https://regulabio.com.br/assets/logo/regulabio-logo-dark.png');
  console.log("Dark logo status:", res.status);
}
checkLogo();
