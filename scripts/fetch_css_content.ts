async function fetchCSSContent() {
  const res = await fetch('https://regulabio.com.br/wp-content/themes/regulabio/style.css').catch(() => null);
  if (res && res.ok) {
    const text = await res.text();
    console.log("WP Style length:", text.length);
  } else {
    const res2 = await fetch('https://regulabio.com.br/css/style.css').catch(() => null);
    if (res2 && res2.ok) {
        const text2 = await res2.text();
        const colors = text2.match(/#[0-9a-fA-F]{3,6}/g) || [];
        const counts: Record<string, number> = {};
        colors.forEach(c => { counts[c.toLowerCase()] = (counts[c.toLowerCase()] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
        console.log("Colors in CSS:", sorted);
        
        const fonts = text2.match(/font-family:[^;"]+/g) || [];
        const fontCounts: Record<string, number> = {};
        fonts.forEach(f => { fontCounts[f] = (fontCounts[f] || 0) + 1; });
        console.log("Fonts in CSS:", Object.entries(fontCounts).sort((a, b) => b[1] - a[1]).slice(0, 5));
    }
  }
}
fetchCSSContent();
