import fs from 'fs';
import path from 'path';

const dir = './src';

const replacements = {
  '#1B4332': '#1b3a4b',
  '#2D6A4F': '#234b61',
  '#D4A843': '#b8975a',
  '#f8f9fa': '#f5f0eb',
  'bg-gray-50': 'bg-[#e8e0d8]',
  'hover:bg-yellow-500': 'hover:bg-[#a47248]',
  'text-yellow-500': 'text-[#a47248]'
};

function walk(currentDir: string) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [oldVal, newVal] of Object.entries(replacements)) {
        if (content.includes(oldVal)) {
          content = content.split(oldVal).join(newVal);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walk(dir);
console.log("Done replacing colors.");
