# misiu.co

Personal website built with [Hugo](https://gohugo.io/) and deployed automatically via GitHub Actions to GitHub Pages.

## Development

To run the site locally:

1. Install Hugo (extended version)
2. Clone this repository
3. Run `hugo server` to start the development server
4. Visit `http://localhost:1313` to see the site

## Deployment

The site is automatically built and deployed to GitHub Pages using GitHub Actions whenever changes are pushed to the `main` branch. The workflow is defined in `.github/workflows/hugo.yml`.

## Site Structure

- `content/` - Site content (pages and posts)
- `themes/basic/` - Custom Hugo theme
- `static/` - Static assets
- `hugo.toml` - Hugo configuration
