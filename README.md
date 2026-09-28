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

## Photos

Each folder in `src/content/photos/` is an album. Export your picks (e.g. from Lightroom, Capture One or Photos) as JPEGs into a folder and you're done:

```
src/content/photos/
  2026-08-14 Lofoten/
    album.md          # optional
    DSCF1000.jpg
    DSCF1007.jpg
```

- **Album title / date / URL** come from the folder name (`2026-08-14 Lofoten` → "Lofoten", `/photos/lofoten`).
  Without a date prefix, the earliest capture date in the photos is used.
- **Order** is filename order (natural sort), so Lightroom's "sequence" export naming keeps your custom sort.
- **Captions** are read from the photo's own metadata: the caption/description you set in your photo app.
- **Camera details** (camera, focal length, aperture, shutter, ISO, date) are read from EXIF and shown in the lightbox.
- **`album.md`** (optional) can override `title`, `date`, `description`, pick a `cover: DSCF1014.jpg`, set `draft: true`,
  and its body is shown as notes above the gallery.

Export at around 2400–3000px on the long edge. The build makes resized WebP versions (480–2400px) for every screen size.
Published images contain **no metadata**: resizing strips EXIF/GPS, and a post-build step (`src/lib/prune-originals.mjs`)
deletes the untouched originals Astro would otherwise copy into `dist/`.

Photos can also be used in posts with a relative path:
`![Caption](<../photos/2026-08-14 Lofoten/DSCF1000.jpg>)`. A photo on its own line renders wider than the text.

## Structure

```
src/
  content/posts/        Markdown posts
  content.config.ts     post collection schema
  lib/posts.ts          title/date/summary derivation, sorting, drafts
  content/photos/       one folder per album
  lib/photos.ts         album discovery, EXIF + caption reading
  lib/strip-title.mjs   removes the Ulysses title heading from the body
  lib/prune-originals.mjs  keeps full-size originals (and their GPS data) out of the build
  components/           Aurora, Rosette (wycinanki ornament), Gallery (justified grid + lightbox), AlbumCard, header, footer, post list
  pages/                home, /writing, /photos, /about, 404, /rss.xml
  styles/               global tokens + post typography
public/                 favicon, robots.txt, CNAME
```

## Deploy

`npm run build` outputs static files to `dist/`, which can be hosted anywhere (GitHub Pages, Netlify, Cloudflare Pages, …).
`public/CNAME` is set to `nil.ski` for GitHub Pages.
