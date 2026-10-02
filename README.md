# nil.ski

Personal website of Nils — the successor to misiu.co.

Built with [Astro](https://astro.build) as a fully static site. Posts are plain Markdown files, written in Ulysses.

## Develop

```sh
npm install
npm run photos   # mirror the photo bucket (also runs before dev and build)
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

Photos are **not stored in git**. They live in a private, S3-compatible bucket
(Cloudflare R2, Backblaze B2, Amazon S3…), one folder per album:

```
nilski-photos/              ← the bucket
  2026-08-14 Lofoten/
    album.md                # optional
    DSCF1000.jpg
    DSCF1007.jpg
```

`npm run dev` and `npm run build` first run `npm run photos` (`scripts/sync-photos.mjs`), which mirrors the bucket into
`src/content/photos/` (gitignored). Only new or changed files are downloaded, and files removed from the bucket are
removed locally too: the bucket is the source of truth. Without bucket credentials the sync is skipped and the site
builds without photos. With wrong credentials the build fails with the bucket's error, rather than silently
publishing a site without photos.

### Adding an album

Export your picks (e.g. from Lightroom, Capture One or Photos) as JPEGs into a folder on your computer, one subfolder
per album, then upload with [rclone](https://rclone.org/) (or any S3 tool):

```sh
rclone sync ~/Pictures/nil.ski r2:nilski-photos   # mirror your local folder to the bucket
```

Then rebuild the site. `rclone sync` also deletes from the bucket what you deleted locally; use `rclone copy` to only add.

- **Album title / date / URL** come from the folder name (`2026-08-14 Lofoten` → "Lofoten", `/photos/lofoten`).
  Without a date prefix, the earliest capture date in the photos is used.
- **Order** is filename order (natural sort), so Lightroom's "sequence" export naming keeps your custom sort.
- **Captions** are read from the photo's own metadata: the caption/description you set in your photo app.
- **Camera details** (camera, focal length, aperture, shutter, ISO, date) are read from EXIF and shown in the lightbox.
- **`album.md`** (optional) can override `title`, `date`, `description`, pick a `cover: DSCF1014.jpg`, set `draft: true`,
  and its body is shown as notes above the gallery.

Export at around 2400–3000px on the long edge. The build makes resized WebP versions (480–2400px) for every screen size.
Published images contain **no metadata**: resizing strips EXIF/GPS, and a post-build step (`src/lib/prune-originals.mjs`)
deletes the untouched originals Astro would otherwise copy into `dist/`. Keep the bucket private; only the build reads it.

Photos from an album can be used in posts with a relative path:
`![Caption](<../photos/2026-08-14 Lofoten/DSCF1000.jpg>)`. A photo on its own line renders wider than the text.
Note that such a post then needs the bucket to build.

### Setting up the bucket (Cloudflare R2)

1. Create a bucket, e.g. `nilski-photos`, and leave public access **off**.
2. Create an R2 API token with **Object Read only** for that bucket, for the site build.
   For uploading with rclone, create a separate token with read & write.
3. Copy `.env.example` to `.env` and fill in the endpoint (`https://<account-id>.r2.cloudflarestorage.com`),
   bucket name and the read-only key. Set the same `PHOTOS_S3_*` variables as secrets on the build server.
4. On the build server, cache `src/content/photos/` and `node_modules/.astro/` between builds so only new photos are
   downloaded and resized.

For Backblaze B2 or S3, use their S3 endpoint and set `PHOTOS_S3_REGION` to the bucket's region.

## Structure

```
src/
  content/posts/        Markdown posts
  content.config.ts     post collection schema
  lib/posts.ts          title/date/summary derivation, sorting, drafts
  content/photos/       local mirror of the photo bucket (gitignored)
  lib/photos.ts         album discovery, EXIF + caption reading
  lib/strip-title.mjs   removes the Ulysses title heading from the body
  lib/prune-originals.mjs  keeps full-size originals (and their GPS data) out of the build
  components/           Prints (home photo snapshots), Gallery (justified grid + lightbox), AlbumCard, header, footer, post list
  pages/                home, /writing, /photos, /about, 404, /rss.xml
  styles/               global tokens + post typography
public/                 favicon, robots.txt, CNAME
scripts/sync-photos.mjs mirrors the photo bucket into src/content/photos/ before dev/build
.env.example            photo bucket settings
```

## Deploy

`npm run build` outputs static files to `dist/`, which can be hosted anywhere (GitHub Pages, Netlify, Cloudflare Pages, …).
`public/CNAME` is set to `nil.ski` for GitHub Pages.
