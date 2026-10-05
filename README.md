# Places, Not Faces · Lugares, no caras

A fast, SEO-friendly **English + Spanish** travel blog built from the Instagram posts of [@laser_2017_](https://www.instagram.com/laser_2017_/) and monetised with [Travelpayouts](https://www.travelpayouts.com/).

## Download your photos first

The posts use photos from your Instagram. Download them once (on your computer, with Node.js installed):

```bash
npm run photos
```

This saves them to `content/images/instagram/`. Commit that folder so the photos are published with the site. Instagram's photo links **expire after a few days**, so do this soon. If they've expired, ask Claude to refresh `content/instagram/media.json` from your connected Instagram account and run the command again.

It has no framework and no dependencies. You only need Node.js 18+.

## Preview locally

1. Install [Node.js](https://nodejs.org/) 18 or newer (LTS is fine).
2. Get the code:
   ```bash
   git clone https://github.com/leisacos/clasificados.git
   cd clasificados
   git checkout claude/instagram-travel-blog-site-ux9ovx   # until it's merged into main
   ```
3. Start the preview:
   ```bash
   npm run dev
   ```
4. Open **http://localhost:8080/**.

`npm run dev` rebuilds the site and refreshes your browser every time you save a post, an image, the CSS or `site.config.json`. Press Ctrl+C to stop it. There's nothing to `npm install`.

| Command | What it does |
|---|---|
| `npm run dev` | Live preview with auto-reload |
| `npm run preview` | One build, then a plain preview server (no watching) |
| `npm run build` | Build the site into `dist/` |
| `npm run import` | Turn your Instagram export into blog posts |
| `npm run photos` | Download the photos listed in `content/instagram/media.json` |

Port 8080 busy? Run `PORT=3000 npm run dev` (on Windows PowerShell: `$env:PORT=3000; npm run dev`).

## 1. Import your Instagram posts

Instagram doesn't allow automated scraping, so use the official export:

1. In the Instagram app, go to **Settings → Accounts Center → Your information and permissions → Download your information**.
2. Choose **Some of your information → Posts**, with **Format: JSON** and **Media quality: High**.
3. Unzip the download into an `instagram-export/` folder in this repo (it's git-ignored).
4. Run `npm run import`. Add `--draft` to hide the imported posts until you've reviewed them.

Each post becomes `content/posts/YYYY-MM-DD-title.md`, and its photos are copied to `content/images/instagram/`. The importer:

- repairs Instagram's garbled accents and emoji,
- turns hashtags into tags,
- guesses the country from your caption and hashtags (English and Spanish names).

Then:

- fill in `city`, `country` and `iata` (the nearest airport code, e.g. `LIS`) in each post so the booking buttons point to the right destination,
- paste the post's Instagram link into `instagram:` to embed the original post,
- expand the caption into a real story. Guides like "how to get there", "where to stay" and "what it cost" rank on Google, and that's where affiliate income comes from.

## 2. Connect Travelpayouts

Open `site.config.json` → `travelpayouts`:

| Field | Where to find it |
|---|---|
| `marker` | Your partner ID (Travelpayouts dashboard → profile) |
| `trs` | Your project ID (Projects) |
| `programs.flights / hotels / tours / insurance / esim` | Join each program, then open **Tools → Links**. The `p=` number in a generated link is the program ID |
| `driveScript` | Optional. Paste the **Travelpayouts Drive** `<script>` here to auto-convert any partner links |
| `widgets.flights / widgets.hotels` | Optional. Paste a flight or hotel search widget's embed code (Tools → Widgets). It appears on the homepage, post sidebars and the resources page |
| `defaultOrigin` | Airport your readers usually fly from. Flight buttons open a dated search from here to the post's `iata` |

Every booking button goes through `https://tp.media/r?...`, so your commissions are tracked. A program with no ID links to the partner directly, with no tracking. To use different brands (e.g. Hotellook or Klook instead of Booking.com or GetYourGuide), edit `partners` in the config. `{city}` is replaced with the post's city.

## Daily automation

New Instagram posts reach the blog without you doing anything:

1. **Every morning**, a scheduled Claude session (a Routine) reads your latest posts from the connected Instagram account. It records them in `content/instagram/media.json`, turns new travel posts into bilingual stories (or adds them to an existing story about the same place), builds the site and pushes.
2. **The GitHub Action** `Download Instagram photos` runs on that push and saves the new photos to `content/images/instagram/`.

The rules the daily session follows are in [`docs/daily-sync.md`](docs/daily-sync.md). Edit that file to change its behaviour. You can still add stories by hand at any time: drop a Markdown file into `content/posts/`.

## English and Spanish

Every page is published twice: English at `/` and Spanish at `/es/`. A 🌐 **EN / ES** button in the header switches between the two versions of the same page. Visitors whose browser is set to the other language see a one-time banner offering their language. Both versions are linked with `hreflang` tags so Google shows each audience the right one.

In a post, add `title_es`, `excerpt_es`, `city_es` and `country_es` to the front matter. Write the English text first, then put a line with just `:::es` and the Spanish text below it. If a post has no Spanish section, the Spanish site shows the English text with a "not translated yet" note. Site-wide text lives in `site.config.json` (`title_es`, `tagline_es`, `description_es`), and button and menu labels live in `src/i18n.js`.

## 3. Writing posts

Posts are Markdown files with front matter (see the samples). Put any of these on a line of its own to insert monetised blocks:

| Shortcode | Renders |
|---|---|
| `{{flights}}` `{{hotels}}` `{{tours}}` `{{insurance}}` `{{esim}}` | A booking button for the post's destination |
| `{{hotels Porto}}` | The same, for another city |
| `{{plan}}` | The full "Plan your trip" box. It's added automatically at the end if you don't place it |
| `{{instagram DdWT0InxgD4 Dc9vbhkxClG}}` | Embedded Instagram posts (shortcodes or full URLs). Posts also embed everything listed in `instagram: [...]` |
| `{{widget hotels}}` | Your configured Travelpayouts widget |

Put images in `content/images/` and reference them as `/images/photo.jpg`. For a cover photo, use `cover: "ig:<shortcode>"` to use a downloaded Instagram photo, or a path like `/images/photo.jpg`.

## 4. Publish on Cloudflare Pages (free)

The site lives at **https://theplacesnotfaces.com**.

1. In Cloudflare, go to **Workers & Pages → Create → Import a repository**, and pick `leisacos/clasificados`.
2. Use these settings:
   - **Project name:** `clasificados`. It must match `name` in `wrangler.jsonc`; if you rename one, rename the other.
   - **Build command:** `node build.js`
   - **Deploy command:** `npx wrangler deploy` (the default)
3. After the first deploy, open the project, go to **Settings → Domains & Routes → Add → Custom domain**, and add `theplacesnotfaces.com` and `www.theplacesnotfaces.com`.

Every push to the production branch rebuilds the site in about a minute, including the daily Instagram sync. Pushes to other branches get their own preview URLs.

The domain is set in `site.config.json` (`url`). `basePath` stays `""` because the site is served from the root of the domain.

## What's included

- Home page, posts, a destination page per country, About, Travel resources, Affiliate disclosure (required by Travelpayouts and the FTC), Privacy and 404 pages
- `sitemap.xml`, `robots.txt`, an RSS feed, Open Graph tags and JSON-LD for Google
- Affiliate links marked `rel="sponsored nofollow"`
- A responsive layout with dark mode
