async function checkImages() {
  const hero = await fetch('https://regulabio.com.br/assets/images/hero-bg.jpg');
  console.log("Hero status:", hero.status);
  
  const texture = await fetch('https://regulabio.com.br/assets/images/texture-straw.jpg');
  console.log("Texture status:", texture.status);
}
checkImages();
