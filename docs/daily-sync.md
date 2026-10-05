# Daily Instagram → blog sync

This is the runbook a scheduled Claude session follows each day. Edit it to
change how new Instagram posts become blog content.

## 1. Get the repo

Work in the `leisacos/clasificados` checkout on the branch named in the
scheduled prompt. Clone it if it isn't there, then pull so you start from the
latest commit. The GitHub Action may have pushed photo commits since the last run.

## 2. Find new Instagram posts

Use the Windsor.ai `instagram` connector, account `laser_2017_`:

- `get_data` with fields `date, media_id, media_caption, media_permalink,
  media_shortcode, media_type, media_url, media_thumbnail_url` and
  `date_preset: "last_7d"`. If the call returns `pending`, call it again with the same parameters.
- A post is **new** if its `media_shortcode` is not already in
  `content/instagram/media.json`.
- Skip `STORY` products. Only feed posts, reels and carousels count.

If nothing is new, stop. Don't commit or push anything.

## 3. Record every new post in `content/instagram/media.json`

Add one entry per new post, newest first, in this format:

```json
{"shortcode":"…","date":"YYYY-MM-DD","type":"IMAGE|VIDEO|CAROUSEL_ALBUM","permalink":"…","caption":"short English summary","src":"…"}
```

`src` is `media_url` for images and carousels, and `media_thumbnail_url` for
videos and reels. The GitHub Action downloads these to
`content/images/instagram/<shortcode>.jpg`. Every post shows in the
"Follow along on Instagram" grid, even ones that don't become a story.

## 4. Decide what each new post becomes

- **A new destination or a clear travel topic** (a place, attraction or
  experience that is identifiable from the caption or hashtags):
  write a **new story** in `content/posts/`.
- **The same destination as an existing story** (for example another Buenos
  Aires street-art photo): add the shortcode to that story's
  `instagram: [...]` list, and add a sentence or tip to both language
  sections if the caption adds something new. Don't create a near-duplicate post.
- **No identifiable place** (a teaser like "Can't wait :)", or art with no
  location): only record it in `media.json`.

When in doubt, prefer updating an existing story over creating a thin new one.

## 5. Writing a new story

Copy the structure of the existing posts in `content/posts/`:

- File name: `YYYY-MM-DD-short-english-slug.md`, using the Instagram post date.
- Front matter: `title`, `title_es`, `date`, `city` (+ `city_es` if it's
  spelled differently), `country` (+ `country_es`), `iata` (an Aviasales city
  or airport code, such as `BUE`, `SCL`, `TYO`), `cover: "ig:<shortcode>"`,
  `excerpt`, `excerpt_es`, `tags`, `instagram: [<shortcodes>]`.
- Write the English body first, then a line with just `:::es`, then the Spanish body.
  The Spanish uses Rioplatense *vos* ("reservá", "guardalo") to match Leiser's
  captions.
- Voice: first person, warm and practical. Build on what the caption actually
  says. **Never invent personal experiences** (prices paid, hotels stayed in,
  people met). General, well-known travel facts are fine. Hedge anything that
  changes often (entry rules, prices, opening hours).
- Useful structure: hook from the caption → when to go → how to get there →
  what to do nearby → where to stay. Aim for 250–450 words per language.
- Add monetised shortcodes where they fit naturally: `{{flights}}`, `{{hotels}}`,
  `{{tours}}`, and `{{esim}}` / `{{insurance}}` when relevant. End with `{{plan}}`.
- Link related stories, using `/posts/<slug>/` in English and
  `/es/posts/<slug>/` in Spanish.

## 6. Check and publish

1. Run `node build.js`. It must finish without errors and show the new post count.
2. Commit with a message like `Daily sync: add <title> (+N Instagram posts)`.
3. Push to the branch named in the scheduled prompt. On a network error, retry
   up to 4 times with backoff.

## 7. Report

End with a short summary: which posts were new, what became a story, which
stories were updated, and anything that needs Leiser's input (for example a
post with an unclear location).
