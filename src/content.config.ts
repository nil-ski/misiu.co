import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { slugFromPath } from './lib/slug';

/**
 * Posts are plain Markdown files, e.g. exported from Ulysses.
 * Frontmatter is optional — see README for how titles and dates are derived.
 */
const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,markdown}',
    base: './src/content/posts',
    generateId: ({ entry, data }) =>
      typeof data.slug === 'string' ? data.slug : slugFromPath(entry),
  }),
  schema: z.object({
    title: z.string().optional(),
    date: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
