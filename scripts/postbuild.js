import { appendFileSync, copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';

copyFileSync('manifest.json', 'dist/manifest.json');

mkdirSync('dist/sidepanel', { recursive: true });
if (existsSync('dist/src/sidepanel/index.html')) {
  copyFileSync('dist/src/sidepanel/index.html', 'dist/sidepanel/index.html');
}

mkdirSync('dist/icons', { recursive: true });
if (existsSync('public/icons')) {
  readdirSync('public/icons').forEach((file) => {
    if (file.endsWith('.png')) {
      copyFileSync(`public/icons/${file}`, `dist/icons/${file}`);
    }
  });
}

const injectFile = 'dist/inject/extractPage.js';
if (existsSync(injectFile)) {
  appendFileSync(injectFile, '\nHermesPageExtractor;\n');
}
