import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDirectory = path.resolve('src/assets/pack-wrappers');
const outputDirectory = path.resolve('src/assets/pack-wrappers/optimized');
const maxWidth = 720;

await mkdir(outputDirectory, { recursive: true });

const files = await readdir(sourceDirectory);
const pngFiles = files.filter((file) => file.toLowerCase().endsWith('.png'));

for (const file of pngFiles) {
  const sourcePath = path.join(sourceDirectory, file);
  const outputFile = file.replace(/\.png$/i, '.webp');
  const outputPath = path.join(outputDirectory, outputFile);
  const metadata = await sharp(sourcePath).metadata();
  const width = metadata.width && metadata.width > maxWidth ? maxWidth : metadata.width;

  await sharp(sourcePath)
    .resize({ width, withoutEnlargement: true })
    .webp({ effort: 6, quality: 82 })
    .toFile(outputPath);

  const sourceSize = await stat(sourcePath);
  const outputSize = await stat(outputPath);
  const savings = 100 - (outputSize.size / sourceSize.size) * 100;

  console.log(`${file} -> optimized/${outputFile} (${savings.toFixed(1)}% smaller)`);
}
