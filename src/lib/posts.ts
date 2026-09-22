import { statSync } from 'node:fs';
import { getCollection, type CollectionEntry } from 'astro:content';
import { dateFromPath } from './slug';

export type Post = {
  id: string;
  entry: CollectionEntry<'posts'>;
  title: string;
  date: Date;
  updated?: Date;
  description: string;
  tags: string[];
  draft: boolean;
  readingMinutes: number;
};

const H1 = /^#\s+(.+?)\s*#*\s*$/m;

function stripMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~=>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(body: string, max = 180): string {
  const paragraph =
    body
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block && !/^(#|!\[|```|>|---|<)/.test(block)) ?? '';
  const text = stripMarkdown(paragraph);
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}

function toPost(entry: CollectionEntry<'posts'>): Post {
  const body = entry.body ?? '';
  const path = entry.filePath ?? entry.id;
  const title = entry.data.title ?? body.match(H1)?.[1] ?? entry.id.replace(/-/g, ' ');
  const date =
    entry.data.date ??
    dateFromPath(path) ??
    (entry.filePath ? statSync(entry.filePath).mtime : new Date());
  const words = stripMarkdown(body).split(' ').filter(Boolean).length;

  return {
    id: entry.id,
    entry,
    title,
    date,
    updated: entry.data.updated,
    description: entry.data.description ?? excerpt(body),
    tags: entry.data.tags,
    draft: entry.data.draft,
    readingMinutes: Math.max(1, Math.round(words / 220)),
  };
}

/** All posts, newest first. Drafts are only included while running `astro dev`. */
export async function getPosts(): Promise<Post[]> {
  const entries = await getCollection('posts');
  return entries
    .map(toPost)
    .filter((post) => import.meta.env.DEV || !post.draft)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export function formatDate(date: Date, style: 'long' | 'short' = 'long'): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
