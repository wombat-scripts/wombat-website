# How to upload these files to GitHub

This is a one-time setup. Once it's done, future edits use the "edit file" pencil icon — much simpler.

## Step 1 — Unzip this bundle

You should now have a folder called `wombat-bootstrap` with this structure:

```
wombat-bootstrap/
├── README.md
├── netlify.toml
├── .gitignore
├── docs/
│   ├── briefing.md
│   ├── CHANGELOG.md
│   ├── pending-changes.md
│   ├── redesign-review.md
│   └── url-strategy-note.md
└── public/
    ├── 404.html
    ├── index.html              ← current live site
    ├── index-current.html      ← same as above, kept as backup
    ├── index-v2.html           ← redesign prototype, not yet live
    ├── og-image.jpeg
    ├── podcast.html
    ├── privacy-policy.html
    ├── terms.html
    ├── articles/               ← empty for now, articles get added here
    └── images/
        └── tom-hero-01.jpg
```

## Step 2 — Upload to GitHub

1. Go to https://github.com/wombat-scripts/wombat-website
2. Click **"Add file"** (top right) → **"Upload files"**
3. Open the unzipped `wombat-bootstrap` folder on your computer
4. **Select all the contents** (Cmd+A on Mac, Ctrl+A on Windows) — both files AND folders
5. Drag them into the GitHub upload area
6. Wait for the files to upload (the tom-hero photo is the largest — under a minute on decent internet)
7. Scroll down. Under "Commit changes":
   - Title: `Initial site bootstrap`
   - Description: `Existing live site files plus redesign prototype, docs, and Netlify config`
   - Leave "Commit directly to main" selected
8. Click **"Commit changes"**

> **Heads up:** GitHub's web uploader sometimes flattens nested folders. If after uploading you don't see the `docs/` and `public/images/` folders, you'll need to upload the folders one at a time. Do `public/` first, then `docs/`, by clicking into each empty folder before dragging in the contents.

## Step 3 — Verify Netlify auto-deployed

If you've already connected Netlify to this repo:

1. Go to https://app.netlify.com
2. Open the wombat-website site
3. You should see a deploy in progress or just-completed (green tick)
4. Click the deploy URL — you should see the current Wombat Home Loans site

## Step 4 — Point the domain at Netlify

Only do this when ready to go live (you can keep testing on the netlify.app URL first):

1. In Netlify, go to **Domain management** for the site
2. Add `wombatloans.com.au` as a custom domain
3. Netlify will give you DNS records to set up at your domain registrar
4. Add the same for `wombathomeloans.com.au` (the redirect from netlify.toml will handle the rest)

## What lives where, going forward

- **Edit a page?** github.com → click file → pencil icon → make change → commit
- **Add a new article?** Add a new file in `public/articles/` → commit. Then edit `public/index.html` to link to it.
- **Add a new photo?** Optimise it (resize to ~1200px wide max, save as JPG or WebP) → upload to `public/images/` with a name like `tom-portrait-02.jpg` → commit.
- **Track a decision or change?** Add a line at the top of `docs/CHANGELOG.md`.
- **Need Claude's help?** Open a fresh chat → paste contents of `docs/briefing.md` → describe what you want.

Done! Welcome to a real website setup.
