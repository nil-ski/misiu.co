import { join } from 'node:path';
import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import exifr from 'exifr';
import { albumDate, albumSlug, albumTitle, PHOTO_ROOT } from './photo-paths';

export type Exif = {
  camera?: string;
  lens?: string;
  focalLength?: number;
  aperture?: number;
  shutter?: number;
  iso?: number;
  taken?: Date;
  caption?: string;
};

export type Photo = {
  id: string;
  file: string;
  image: ImageMetadata;
  exif: Exif;
  alt: string;
};

export type Album = {
  id: string;
  title: string;
  date: Date;
  description?: string;
  entry?: CollectionEntry<'albums'>;
  cover: Photo;
  photos: Photo[];
  draft: boolean;
};

// Every image inside a folder of src/content/photos becomes part of that album.
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/photos/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true },
);

const text = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value.trim() || undefined;
  if (value && typeof value === 'object' && 'value' in value) return text((value as { value: unknown }).value);
  return undefined;
};

function cameraName(make?: string, model?: string): string | undefined {
  if (!model) return make;
  if (!make) return model;
  const brand = make.split(' ')[0];
  const cleanBrand = brand.charAt(0) + brand.slice(1).toLowerCase();
  return model.toLowerCase().startsWith(brand.toLowerCase()) ? model : `${cleanBrand} ${model}`;
}

async function readExif(path: string): Promise<Exif> {
  try {
    const raw = await exifr.parse(join(process.cwd(), path), { xmp: true, iptc: true, gps: false });
    if (!raw) return {};
    return {
      camera: cameraName(text(raw.Make), text(raw.Model)),
      lens: text(raw.LensModel),
      focalLength: raw.FocalLength,
      aperture: raw.FNumber,
      shutter: raw.ExposureTime,
      iso: raw.ISO,
      taken: raw.DateTimeOriginal instanceof Date ? raw.DateTimeOriginal : undefined,
      // Captions set in Lightroom, Photos, Capture One etc. end up in one of these.
      caption: text(raw.description) ?? text(raw.Caption) ?? text(raw.ImageDescription) ?? text(raw.title),
    };
  } catch {
    return {};
  }
}

let cache: Promise<Album[]> | undefined;

async function load(): Promise<Album[]> {
  const meta = new Map((await getCollection('albums')).map((entry) => [entry.id, entry]));
  const folders = new Map<string, Photo[]>();

  const naturally = new Intl.Collator('en', { numeric: true }).compare;
  for (const path of Object.keys(images).sort(naturally)) {
    const [folder, file] = path.slice(PHOTO_ROOT.length).split('/');
    const exif = await readExif(path);
    const list = folders.get(folder) ?? [];
    list.push({
      id: `${list.length + 1}`,
      file,
      image: images[path].default,
      exif,
      alt: exif.caption ?? `Photo from ${albumTitle(folder)}`,
    });
    folders.set(folder, list);
  }

  const albums: Album[] = [];
  for (const [folder, photos] of folders) {
    const id = albumSlug(folder);
    const entry = meta.get(id);
    const taken = photos.map((p) => p.exif.taken?.valueOf()).filter((t): t is number => !!t);
    albums.push({
      id,
      title: entry?.data.title ?? albumTitle(folder),
      date: entry?.data.date ?? albumDate(folder) ?? new Date(taken.length ? Math.min(...taken) : Date.now()),
      description: entry?.data.description,
      entry,
      cover: photos.find((p) => p.file === entry?.data.cover) ?? photos[0],
      photos,
      draft: entry?.data.draft ?? false,
    });
  }

  return albums.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

/** All albums, newest first. Drafts are only included while running `astro dev`. */
export async function getAlbums(): Promise<Album[]> {
  cache ??= load();
  const albums = await cache;
  return albums.filter((album) => import.meta.env.DEV || !album.draft);
}

export function formatExif(exif: Exif): string[] {
  const parts: string[] = [];
  if (exif.camera) parts.push(exif.camera);
  if (exif.focalLength) parts.push(`${Math.round(exif.focalLength)}mm`);
  if (exif.aperture) parts.push(`ƒ/${Number(exif.aperture.toFixed(1))}`);
  if (exif.shutter)
    parts.push(exif.shutter >= 1 ? `${Number(exif.shutter.toFixed(1))}s` : `1/${Math.round(1 / exif.shutter)}s`);
  if (exif.iso) parts.push(`ISO ${exif.iso}`);
  return parts;
}
