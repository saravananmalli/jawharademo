/**
 * Converts large PNG/JPG assets in public/ to WebP at 85% quality.
 * Run once: node scripts/optimize-images.mjs
 * Originals are kept so <picture> elements can use them as fallback.
 */
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const EXTS = new Set(['.png', '.jpg', '.jpeg']);
const MIN_SIZE_BYTES = 0; // convert all images regardless of size

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  let converted = 0;
  let skipped = 0;

  for await (const file of walk(PUBLIC_DIR)) {
    const ext = extname(file).toLowerCase();
    if (!EXTS.has(ext)) continue;

    const { size } = await stat(file);
    const webpPath = file.replace(/\.(png|jpe?g)$/i, '.webp');

    // Skip if WebP already exists and is newer than source (i.e. already up-to-date)
    try {
      const webpStat = await stat(webpPath);
      const srcStat = await stat(file);
      if (webpStat.mtimeMs >= srcStat.mtimeMs) {
        skipped++;
        continue;
      }
    } catch {
      // WebP doesn't exist yet — proceed to create it
    }

    if (size < MIN_SIZE_BYTES) {
      skipped++;
      continue;
    }

    try {
      const info = await sharp(file)
        .webp({ lossless: true, effort: 6 })
        .toFile(webpPath);

      if (info.size >= size) {
        // WebP is not smaller — remove it and keep the original format
        const { unlink } = await import('fs/promises');
        await unlink(webpPath).catch(() => {});
        console.log(`– ${basename(file)}  WebP larger than original, keeping PNG`);
        skipped++;
      } else {
        const reduction = (((size - info.size) / size) * 100).toFixed(1);
        console.log(`✓ ${basename(file)} → ${basename(webpPath)}  ${(size / 1024).toFixed(0)}KB → ${(info.size / 1024).toFixed(0)}KB  (-${reduction}%)`);
        converted++;
      }
    } catch (err) {
      console.error(`✗ ${basename(file)}: ${err.message}`);
    }
  }

  console.log(`\nDone: ${converted} converted, ${skipped} skipped.`);
}

main();
