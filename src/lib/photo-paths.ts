import { dateFromPath, slugFromPath } from './slug';

export const PHOTO_ROOT = '/src/content/photos/';

/** "2026-08-14 Lofoten" -> "lofoten" */
export const albumSlug = (folder: string) => slugFromPath(folder);

/** "2026-08-14 Lofoten" -> "Lofoten" */
export const albumTitle = (folder: string) => folder.replace(/^\d{4}-\d{2}-\d{2}[-_ ]+/, '').trim();

export const albumDate = (folder: string) => dateFromPath(folder);
