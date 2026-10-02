import { readdir, readFile, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGE = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;
const TEXT = /\.(html|xml|css|js|json|txt|webmanifest)$/i;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])),
  );
  return files.flat();
}

/**
 * Photos are imported so Astro can resize them, which also copies the untouched
 * originals — full resolution, with EXIF and GPS — into dist/_astro.
 * No page links to them, so delete every built image nothing references.
 */
export function pruneOriginals() {
  return {
    name: 'prune-unreferenced-originals',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const assets = join(root, '_astro');
        const files = await walk(root);
        const text = (await Promise.all(files.filter((f) => TEXT.test(f)).map((f) => readFile(f, 'utf8')))).join('\n');

        let removed = 0;
        for (const file of files) {
          if (!file.startsWith(assets) || !IMAGE.test(file)) continue;
          const name = relative(assets, file);
          if (!text.includes(name)) {
            await rm(file);
            removed++;
          }
        }
        logger.info(`removed ${removed} unreferenced original image(s)`);
      },
    },
  };
}
