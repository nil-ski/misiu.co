const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})[-_ ]+/;

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "posts/2026-09-22 Hello World.md" -> "hello-world"; "trip/index.md" -> "trip" */
export function slugFromPath(path: string): string {
  const parts = path.replace(/\.(md|markdown)$/i, '').split('/');
  let name = parts.pop() ?? '';
  if (name.toLowerCase() === 'index' && parts.length) name = parts.pop()!;
  return slugify(name.replace(DATE_PREFIX, ''));
}

export function dateFromPath(path: string): Date | undefined {
  for (const part of path.split('/').reverse()) {
    const match = part.match(DATE_PREFIX) ?? part.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (match) return new Date(`${match[1]}T12:00:00Z`);
  }
  return undefined;
}
