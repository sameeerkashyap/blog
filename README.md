# blog

A statically-exported Next.js blog powered by a Notion database. Write in Notion, deploy to GitHub Pages automatically on every push.

## How it works

- Posts live in a Notion database. The build fetches them at compile time via the Notion API and generates static HTML.
- Pushing to `main` triggers a GitHub Actions workflow that builds and deploys to GitHub Pages.
- Without credentials the site falls back to mock data, so local development always works out of the box.

## Notion database setup

Create a Notion database with these properties:

| Property | Type |
|---|---|
| Title | Title |
| Slug | Text (optional — auto-generated from title if omitted) |
| Summary | Text |
| Date | Date |
| Tags | Multi-select |
| Published | Checkbox |

Share the database with your Notion integration and note the **Database ID** from the URL (`notion.so/.../<database-id>?v=...`).

## Local development

1. Copy the example env file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

`.env.local`:

```
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
```

2. Run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000/blog](http://localhost:3000/blog).

## Deployment (GitHub Pages)

1. Add two repository secrets under `Settings → Secrets and variables → Actions`:
   - `NOTION_API_KEY`
   - `NOTION_DATABASE_ID`

2. Enable GitHub Pages under `Settings → Pages`, set source to **GitHub Actions**.

3. Push to `main` — the site deploys to `https://<username>.github.io/blog/`.

## Stack

- [Next.js 16](https://nextjs.org) — static export (`output: "export"`)
- [Notion API](https://developers.notion.com) — content source
- [notion-to-md](https://github.com/souvikinator/notion-to-md) — page content to Markdown
- [react-markdown](https://github.com/remarkjs/react-markdown) + [rehype](https://github.com/rehypejs/rehype) — Markdown rendering with syntax highlighting and LaTeX
- GitHub Actions + GitHub Pages — CI/CD
