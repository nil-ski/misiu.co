# nil.ski

Personal website of Nils — the successor to misiu.co.

Built with [Astro](https://astro.build) as a fully static site. Posts are plain Markdown files, written in Ulysses.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321 (drafts are visible here)
npm run build    # static site in ./dist
npm run preview  # serve ./dist locally
npx astro check  # type-check
```

Requires Node 22.12+.

## Writing posts

Export a sheet from Ulysses as **Markdown** into `src/content/posts/`. No frontmatter is needed:

| What        | Where it comes from (first match wins)                                                   |
| ----------- | ---------------------------------------------------------------------------------------- |
| Title       | `title:` in frontmatter → the first `# Heading` → the filename                           |
| Date        | `date:` in frontmatter → a `YYYY-MM-DD` prefix on the file or folder name → file mtime   |
| URL         | `slug:` in frontmatter → the filename without date prefix, e.g. `/writing/hello-nil-ski` |
| Summary     | `description:` in frontmatter → the first paragraph                                      |

The leading `# Heading` Ulysses exports is removed from the post body, since the page renders the title itself.

The easiest workflow is to name the file with a date prefix: `2026-09-22 Hello, nil.ski.md`.
The file mtime fallback isn't reliable after a git checkout, so give every post a date one of the other ways.

Optional frontmatter, if you want it:

```yaml
---
title: On slow tools
date: 2026-09-10
updated: 2026-09-12
description: Shown in lists, RSS and link previews.
tags: [tools, writing]
draft: true # only shown in `npm run dev`
---
```

**Images:** export with images and keep them next to the `.md` file (a folder per post works well:
`src/content/posts/2026-09-22 Trip/index.md` + images). Relative image paths are optimised by Astro at build time.

## Structure

```
src/
  content/posts/        Markdown posts
  content.config.ts     post collection schema
  lib/posts.ts          title/date/summary derivation, sorting, drafts
  lib/strip-title.mjs   removes the Ulysses title heading from the body
  components/           Aurora (colour blobs), SlalomTrail (hero doodle), header, footer, post list
  pages/                home, /writing, /writing/[slug], /about, 404, /rss.xml
  styles/               global tokens + post typography
public/                 favicon, robots.txt, CNAME
```

## Deploy

`npm run build` outputs static files to `dist/`, which can be hosted anywhere (GitHub Pages, Netlify, Cloudflare Pages, …).
`public/CNAME` is set to `nil.ski` for GitHub Pages.
