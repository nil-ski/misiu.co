// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { stripLeadingTitle } from './src/lib/strip-title.mjs';

export default defineConfig({
  site: 'https://nil.ski',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    processor: satteri({ mdastPlugins: [stripLeadingTitle] }),
    shikiConfig: { theme: 'github-light' },
  },
});
