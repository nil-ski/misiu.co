import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { slugFromPath } from './lib/slug';
import { albumSlug } from './lib/photo-paths';

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

/**
 * Optional `album.md` inside a photo folder: title, date, description, cover.
 * Photos themselves are picked up from the folder automatically (see lib/photos.ts).
 */
const albums = defineCollection({
  loader: glob({
    pattern: '*/album.md',
    base: './src/content/photos',
    generateId: ({ entry }) => albumSlug(entry.split('/')[0]),
  }),
  schema: z.object({
    title: z.string().optional(),
    date: z.coerce.date().optional(),
    description: z.string().optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, albums };
