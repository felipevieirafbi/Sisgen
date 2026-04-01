async function fetchColors() {
  const res = await fetch('https://regulabio.com.br/');
  const text = await res.text();
  
  const colors = text.match(/#[0-9a-fA-F]{6}/g) || [];
  const counts: Record<string, number> = {};
  colors.forEach(c => { counts[c.toLowerCase()] = (counts[c.toLowerCase()] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log("Colors:", sorted);
  
  const fonts = text.match(/font-family:[^;"]+/g) || [];
  const fontCounts: Record<string, number> = {};
  fonts.forEach(f => { fontCounts[f] = (fontCounts[f] || 0) + 1; });
  console.log("Fonts:", Object.entries(fontCounts).sort((a, b) => b[1] - a[1]).slice(0, 5));
}
fetchColors();
