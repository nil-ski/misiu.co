/**
 * Ulysses puts the sheet title in the export as a leading `# Heading`.
 * The post layout renders the title itself, so drop that first H1 from the body.
 * (Sätteri mdast plugin — Astro's default Markdown processor.)
 */
export const stripLeadingTitle = {
  name: 'strip-leading-title',
  heading(node, ctx) {
    if (node.depth !== 1) return;
    const parent = ctx.parent(node);
    if (parent?.type !== 'root') return;
    const first = parent.children.findIndex((child) => !['yaml', 'toml', 'html'].includes(child.type));
    if (ctx.indexOf(node) === first) ctx.removeNode(node);
  },
};
