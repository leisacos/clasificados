# Laser's Travel Diary

A fast, SEO-friendly static travel blog built from the Instagram posts of [@laser_2017_](https://www.instagram.com/laser_2017_/) and monetised with [Travelpayouts](https://www.travelpayouts.com/).

It has no framework and no dependencies. You only need Node.js 18+.

```bash
npm run dev      # build + preview at http://localhost:8080/clasificados/
npm run build    # build the site into dist/
npm run import   # turn your Instagram export into blog posts
```

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

- delete the three `SAMPLE POST` files in `content/posts/`,
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

## 3. Writing posts

Posts are Markdown files with front matter (see the samples). Put any of these on a line of its own to insert monetised blocks:

| Shortcode | Renders |
|---|---|
| `{{flights}}` `{{hotels}}` `{{tours}}` `{{insurance}}` `{{esim}}` | A booking button for the post's destination |
| `{{hotels Porto}}` | The same, for another city |
| `{{plan}}` | The full "Plan your trip" box. It's added automatically at the end if you don't place it |
| `{{instagram https://www.instagram.com/p/...}}` | An embedded Instagram post |
| `{{widget hotels}}` | Your configured Travelpayouts widget |

Put images in `content/images/` and reference them as `/images/photo.jpg`.

## 4. Publish (free) on GitHub Pages

1. Merge into `main`.
2. In the repo, go to **Settings → Pages → Source: GitHub Actions**.
3. Every push to `main` deploys to `https://leisacos.github.io/clasificados/`.

**Custom domain:** set `url` to your domain and `basePath` to `""` in `site.config.json`. Then add the domain under Settings → Pages. Netlify, Cloudflare Pages and Vercel also work: use build command `node build.js` and output folder `dist`.

## What's included

- Home page, posts, a destination page per country, About, Travel resources, Affiliate disclosure (required by Travelpayouts and the FTC), Privacy and 404 pages
- `sitemap.xml`, `robots.txt`, an RSS feed, Open Graph tags and JSON-LD for Google
- Affiliate links marked `rel="sponsored nofollow"`
- A responsive layout with dark mode
