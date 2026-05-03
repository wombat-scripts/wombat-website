# wombat-website

Source for [wombathomeloans.com.au](https://wombathomeloans.com.au) — Wombat Home Loans, Tom Carr's Sydney mortgage brokerage.

## What's in here

| Folder | What it is |
|---|---|
| `public/` | Everything Netlify serves to the world. HTML, images, assets. |
| `public/images/` | Web-optimised photos. High-res originals stay in Drive. |
| `public/articles/` | One HTML file per article. |
| `docs/` | Briefing, brand notes, change log. **Not deployed.** |
| `netlify.toml` | Deploy config + redirects (e.g. old domain → new). |

## Deployment

- **Host:** Netlify (auto-deploys on push to `main`)
- **Live URL:** https://wombathomeloans.com.au
- **Branch previews:** every PR gets its own preview URL automatically

## Editing workflow

For most changes:

1. Open the file on github.com → click the pencil icon (or press `.` to open the full editor)
2. Edit in the browser
3. Commit at the bottom of the page — write a short description of what changed
4. If it's a small change, commit straight to `main` and Netlify deploys in ~30 seconds
5. If it's bigger, commit to a new branch and open a pull request — Netlify gives you a preview URL to check before merging

## Working with Claude

Start fresh chats per task. Drop in `docs/briefing.md` plus a link to the specific file you want changed. Then describe the change.

After Claude produces the updated file, paste it back into GitHub via the pencil-icon edit flow.

## Logging changes

Update `docs/CHANGELOG.md` after meaningful changes. Append entries to the top so the most recent is always first.
