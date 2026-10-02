// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { stripLeadingTitle } from './src/lib/strip-title.mjs';
import { pruneOriginals } from './src/lib/prune-originals.mjs';

export default defineConfig({
  site: 'https://nil.ski',
  output: 'static',
  integrations: [sitemap(), pruneOriginals()],
  image: {
    // Photos in posts get a responsive srcset instead of one full-size file
    layout: 'constrained',
    breakpoints: [480, 800, 1200, 1600, 2400],
  },
  markdown: {
    processor: satteri({ mdastPlugins: [stripLeadingTitle] }),
    shikiConfig: { theme: 'github-light' },
  },
});
