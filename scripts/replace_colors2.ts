import fs from 'fs';
import path from 'path';

const dir = './src';

const replacements = {
  '#212529': '#132a37',
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
