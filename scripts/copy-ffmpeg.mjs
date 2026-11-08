import fs from 'node:fs';
import path from 'node:path';

const targetDir = path.resolve('public/ffmpeg');
fs.mkdirSync(targetDir, { recursive: true });

const sources = [
  path.resolve('node_modules/@ffmpeg/core/dist/esm'),
  path.resolve('node_modules/@ffmpeg/ffmpeg/dist/esm')
];

for (const srcDir of sources) {
  if (fs.existsSync(srcDir)) {
    for (const file of fs.readdirSync(srcDir)) {
      fs.copyFileSync(path.join(srcDir, file), path.join(targetDir, file));
    }
  }
}
