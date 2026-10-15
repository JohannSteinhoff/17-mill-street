# 17 Mill Street: relet website & marketing kit

A small static site for finding someone to take over the lease. It's hosted free on GitHub Pages, and people reach it by QR code.

**You only ever edit one file: [`listing.json`](listing.json).** Everything else reads from it.

| Page | Who it's for | What it does |
|---|---|---|
| `index.html` | Renters (QR code lands here) | Photos, rent, dates, costs, FAQ, one-tap text/call/email |
| `kit.html` | You | QR download, square + story images, copy-ready posts, AI brief, list of unfilled fields |
| `flyer.html` | You | Letter-size flyer with photos + QR code → Print or Save as PDF |
| `listing.json` | You + AI | The single source of truth |
| `llms.txt` | AI assistants | Tells AI tools where the data is and how to use it |

## 1. Fill in the details
Open `listing.json` and replace everything in `[square brackets]`. The **Status** box on `kit.html` lists whatever is still left.

## 2. Add photos
1. Drop images into `photos/` (JPG, ideally under ~500 KB each and about 1600 px wide).
2. List them in `listing.json`. The first one is the cover for the site, flyer and social images:
   ```json
   "photos": [
     { "src": "photos/01-living-room.jpg", "caption": "Living room" },
     { "src": "photos/02-kitchen.jpg", "caption": "Kitchen" }
   ]
   ```

## 3. Publish on GitHub Pages
1. Create a new **public** repo on github.com (e.g. `17-mill-street`).
2. Upload this folder's contents (drag-and-drop on the repo page works, or use git).
3. In the repo, go to **Settings → Pages → Source: Deploy from a branch → `main` / root → Save**.
4. After about a minute the site is live at https://johannsteinhoff.github.io/17-mill-street/.
5. Put that URL in `listing.json` → `site_url`, then upload the change. **Do this before printing anything**, because the QR codes use `site_url`.

## 4. Use it
- **Print flyers:** `kit.html` → Open flyer → Print (or Save as PDF).
- **Facebook Marketplace:** `kit.html` → download the square image → copy the Marketplace text.
- **Someone messages you:** `kit.html` → copy "Reply to an inquiry".
- **Make anything else with AI:** copy the AI brief and paste it into Claude/ChatGPT with your request. AI tools that can browse can also read `https://…/listing.json` directly.

Bookmark `kit.html` on your phone for quick access.

## Preview locally
The pages load `listing.json`, so they need a local server (double-clicking the HTML file won't work):
```bash
python -m http.server 8417
```
Then open http://localhost:8417.

> Note: the site is public, so anyone with the link can see `kit.html` too (it's hidden from search engines). Only put contact info in `listing.json` that you're OK sharing publicly.
