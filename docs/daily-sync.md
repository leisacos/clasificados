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

If nothing is new, skip sections 3–7 and go to **section 9: Improve one
existing story** instead.

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

Think like a searcher, not like the caption. For each new post, ask: **what would
someone type into Google to find a page about this?**

- **A new place or topic that people search for** (an attraction, a
  neighbourhood, a day trip, a "things to do in X", or "where to stay in X"):
  write a **new story** built around that search (section 5).
- **A place or topic that an existing story or guide already covers** (for
  example another Buenos Aires street-art photo): **don't create a competing
  page.** Two pages chasing the same search hurt each other. Instead:
  1. add the shortcode to that story's `instagram: [...]` list,
  2. add the new detail from the caption (a new spot, tip or photo) to both
     language sections, and
  3. add a new FAQ question if the caption answers one.
  Updating a page also signals freshness to Google.
- **No identifiable place, or nothing anyone would search for** (a teaser like
  "Can't wait :)", art with no location): only record it in `media.json`.

Before deciding, list the existing posts (`ls content/posts`) and read the
titles. The **evergreen guides** are hubs that new stories should link to:
`free-things-to-do-buenos-aires`, `buenos-aires-street-art-guide`,
`where-to-stay-buenos-aires` and `day-trips-from-santiago-chile`.

## 5. Writing a story for SEO

### 5a. Pick the target searches (one per language)

- Choose **one main English search phrase** and **one main Spanish search
  phrase**, such as "Arbórea Magna Buenos Aires" and "Arbórea Magna cómo llegar".
  Prefer specific, long-tail phrases with clear intent ("how to get to X",
  "is X free", "best time to visit X", "things to do in X", "where to stay in X")
  over broad ones ("Argentina travel").
- The Spanish phrase must be **what Spanish speakers actually search**, not a
  word-for-word translation of the English one.
- If web search is available, search both phrases and skim the top results.
  Note the questions they answer and anything they miss, then cover those
  questions and add what's missing. **Never copy their text.**

### 5b. Where the phrases go

| Element | Rule |
|---|---|
| File name / slug | `YYYY-MM-DD-<english-search-phrase>.md`, lowercase with hyphens, 3–6 words, no stop words where possible (`arborea-magna-buenos-aires`). The slug is the URL and never changes once published. |
| `title` / `title_es` | Contains the phrase near the start. **50–65 characters.** Add a benefit or angle after a colon ("…: free, and best at sunset"). |
| `excerpt` / `excerpt_es` | The meta description. **140–160 characters**, includes the phrase and says what the reader gets. |
| First paragraph | Uses the phrase naturally in the first 1–2 sentences and opens with the caption's hook. |
| Headings (`#`) | 4–7 sections, phrased as what people search: "How to get to …", "When to go", "Where to stay in …", "Is … worth it?". At least one heading contains the place name. |
| Tags | 3–6 tags: the place, the country and the topic (`streetart`, `beach`, `guide`). |

### 5c. Structure and length

- **600–1,000 words per language.** Long enough to fully answer the search,
  with no filler.
- Recommended order: hook from the caption → quick facts or answer (what, where,
  cost, best time) → how to get there → what to do or see → tips (photo tips if
  the post is visual) → where to stay → **FAQ** → `{{plan}}`.
- **FAQ section (required):** end with `# Frequently asked questions` (English)
  and `# Preguntas frecuentes` (Spanish), each with 3–4 questions written as
  `## Question?` followed by a 1–3 sentence answer on the next line. Use real
  questions people ask about the place. The build turns these into FAQ
  structured data for Google and AI search. See
  `content/posts/2026-10-03-arborea-magna-buenos-aires.md` for the format.
- Use short paragraphs, bullet lists for options, and **bold** for key names.

### 5d. Links

- **2–4 internal links per language** to related stories and the matching
  evergreen guide, using descriptive anchor text ("my [street art guide](…)",
  not "click here"). English links are `/posts/<slug>/`; Spanish links are
  `/es/posts/<slug>/`.
- **Also add a link back to the new story from 1–2 existing related stories or
  guides**, in both languages. This is how new pages get found and ranked.

### 5e. Monetisation

- Place `{{flights}}`, `{{hotels}}` and `{{tours}}` right after the section where
  the reader would act on it (after "How to get there" or "Where to stay").
  Add `{{esim}}` or `{{insurance}}` only where relevant, `{{cars}}` where the
  story recommends renting a car (road trips, coasts, national parks), and
  `{{transfers}}` where it discusses getting from the airport. End with `{{plan}}`.
- Hotel buttons go to Booking.com, which isn't approved for the site yet. Still
  include `{{hotels}}` where it helps readers; it starts earning once approved.
- Don't stack buttons, and don't put more than one of each kind before the FAQ.

### 5f. Accuracy and voice (unchanged and non-negotiable)

- First person, warm and practical, built on what the caption actually says.
  **Never invent personal experiences** (prices paid, hotels stayed in, people
  met). General, well-known facts are fine. Hedge anything that changes often
  (entry rules, prices, opening hours, transport) with "check before you go".
- The Spanish uses Rioplatense *vos* ("reservá", "guardalo") to match Leiser's
  captions, and must read naturally, not like a translation.

### 5g. Front matter checklist

`title`, `title_es`, `date` (Instagram post date), `city` (+ `city_es` if
spelled differently), `country` (+ `country_es`), `iata` (an Aviasales city or
airport code such as `BUE`, `SCL` or `TYO`), `cover: "ig:<shortcode>"`, `excerpt`,
`excerpt_es`, `tags`, `instagram: [<shortcodes>]`. Write the English body first,
then a line with just `:::es`, then the Spanish body.

## 6. Check and publish

1. Run `node build.js`. It must finish without errors and show the new post count.
   Then check every internal link resolves:
   `grep -rhoE 'href="/(es/)?posts/[^"#]+' dist | sed 's/href="//' | sort -u | while read l; do [ -f "dist${l}index.html" ] || echo "BROKEN $l"; done`
   Fix any `BROKEN` line before committing.
2. Commit with a message like `Daily sync: add <title> (+N Instagram posts)`.
3. Push to the branch named in the scheduled prompt. On a network error, retry
   up to 4 times with backoff.

## 7. Pinterest

Nothing to do. When the GitHub Action downloads the new photos, it also creates
tall Pinterest images for new stories. Pinterest then picks them up from
`/pins.xml` and `/es/pins.xml`.

## 7b. YouTube Shorts (channel: youtube.com/@theplacesnotfaces)

Leiser uploads the Reels to YouTube as Shorts by hand (or with a scheduler).
Your job is to have the title and description ready, and to embed the video on
the site once it's live. Queue file: `docs/youtube-shorts.md`, newest first.

1. **For every new `VIDEO` post** (whether it became a new story, updated an
   existing one, or was only recorded in `media.json`), add a block at the top
   of the queue:

   ```markdown
   ## YYYY-MM-DD · <place> · <Instagram permalink>
   - Story: /posts/<slug>/   (or "none")
   - YouTube ID: (pending)
   - Title EN: <≤70 characters, main search phrase first, e.g. "Henty Dunes, Tasmania: giant sand dunes next to a rainforest">
   - Title ES: <same idea in Spanish, ≤70 characters>
   - Description:
     <2–3 sentences in English: what and where, one useful fact from the story.>
     Full guide: https://theplacesnotfaces.com/posts/<slug>/

     <The same 2–3 sentences in Spanish (Rioplatense, vos).>
     Guía completa: https://theplacesnotfaces.com/es/posts/<slug>/

     #<Place> #<Country> #travel
   ```

   Same accuracy rules as section 5f: only facts from the caption or the
   story, hedge anything that changes often. With no story, link the closest
   guide or the home page. YouTube allows one title, so Leiser picks EN or ES
   depending on the video's on-screen language.
2. **Embed videos that are live.** For every queue block whose `YouTube ID` is
   filled in (an 11-character ID such as `dQw4w9WgXcQ` from the Shorts URL)
   and whose story doesn't have it yet, add `youtube: <id>` to that story's
   front matter. The site shows the video near the top of the story in both
   languages. Then set the queue line to `YouTube ID: <id> (embedded)`.
3. If the Windsor.ai `youtube` connector is connected, you can find the IDs
   yourself: match the new Shorts' titles to queue blocks.

## 8. Report

**On days with new posts**, end with a short summary: which posts were new, what became a story (with its
target English and Spanish search phrases), which stories were updated, which
YouTube Shorts are ready to upload (title EN/ES, from section 7b), and
anything that needs Leiser's input (for example a post with an unclear
location, or a personal detail only Leiser knows that would make the story
stronger).

## 9. Improve one existing story (days with no new Instagram posts)

Improve **exactly one** story per run, so changes stay small and reviewable.

1. Run `node scripts/content-audit.js`. It scores every story (missing FAQ,
   thin content, missing links, title or description length, age) and prints a
   **Recommended** file. Work on that one. If it prints "Nothing needs improving
   right now", stop without committing.
2. Read the whole story, in both languages, and fix every issue the audit lists,
   following section 5:
   - **Missing FAQ:** add 3–4 real questions people ask about the place, in both
     languages, in the `## Question?` format.
   - **Short:** expand to **600–1,000 words per language** with genuinely useful
     sections: how to get there, best time to go, practical tips, what's nearby,
     where to stay. No filler and no repeating yourself.
   - **Links:** add 2–4 internal links out to related stories and guides, and
     add a link **to** this story from 1–2 related stories (in both languages).
   - **Title or excerpt length:** rewrite to 50–65 characters (title) and
     140–160 characters (excerpt), keeping the main search phrase near the start.
   - Check that the buttons sit after the sections where readers act on them
     (section 5e).
3. **Never change** the file name or slug (it's the URL), the `date`, or the
   `cover`. Keep everything that's already accurate, and keep Leiser's own words
   from captions.
4. Add or update `updated: YYYY-MM-DD` (today) in the front matter. The site
   then shows "Updated …" and tells Google the page is fresh.
5. The accuracy rules from 5f still apply: no invented personal experiences,
   and hedge anything that changes often.
6. Run the checks from section 6 (build + link check), then commit with a
   message like `Improve <slug>: add FAQ, expand to N words, +M links` and push.
7. Report: which story you improved, what changed (word counts before → after,
   FAQ added, links added), and any personal detail Leiser could add to make
   it stronger.

