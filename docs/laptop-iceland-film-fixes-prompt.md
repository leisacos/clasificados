# Prompt: fixes for the Iceland long film (Claude on Leiser's laptop)

Paste everything below the line into the same laptop session that made `_film/iceland-from-above-4k.mp4`.

---

Leiser reviewed the 12:54 Iceland film. It looks great, but please make these changes. **Don't overwrite the current export**: save the new version as `_film/iceland-from-above-4k-v2.mp4`. Don't upload anything to YouTube.

## 1. On-screen text in English
- Opening title: replace "ISLANDIA" (and its Spanish subtitle) with **"ICELAND"**, with **"FROM ABOVE"** as the small line underneath. Keep the same font, size, position, timing and fade.
- Chapter labels: keep the Icelandic place names exactly as they are (Þingvellir, Geysir, Gullfoss, Fjaðrárgljúfur, Stuðlagil, Hverfjall, Goðafoss, Hvítserkur).
- Check the whole film for any other Spanish text and translate it to English.

## 2. Remove the tourists at the end of Gullfoss
- At about **3:38–3:46** the drone drops low over the viewing path, and people (pink and orange jackets) get big in frame. End that walkway shot at about **3:37**, before anyone is close, then crossfade (1 s) straight into the Fjaðrárgljúfur chapter.
- Then check the **whole film** for any other moment where a person is large enough to be recognised at 4K, and trim around it the same way. Tell me every timestamp you changed.

## 3. Re-export and check
- Same settings as before: 4K, H.264 High, yuv420p, CRF 18, AAC 192 kb/s, −14 LUFS, faststart. Music still fades out at the end. Keep the **last 20 seconds clean** (no text) for the end screen.
- Watch every transition at normal speed: no jumps, black frames, flashes or audio pops.
- Make a new small review copy for Leiser, under 30 MB:
  `ffmpeg -i _film\iceland-from-above-4k-v2.mp4 -vf scale=-2:480 -c:v libx264 -crf 31 -preset veryfast -c:a aac -b:a 96k -movflags +faststart _film\review-v2-480p.mp4`

## 4. Recalculate the chapters
The trim moves every chapter after Gullfoss earlier. Read the real start time of each chapter from the new export (where each place label first appears), and list them. The first chapter must be `0:00`, and each chapter must be at least 10 s long.

## 5. New thumbnails, in English (1280×720, JPG, under 2 MB)
Use the same style as before (bold condensed sans-serif in white, a smaller coloured second line, a subtle dark gradient behind the text for contrast), but in English:
1. `thumb_gullfoss_en.jpg`: the Gullfoss rainbow frame. Text: **"ICELAND"** / **"FROM ABOVE · 4K"**
2. `thumb_studlagil_en.jpg`: the Stuðlagil canyon from above. Text: **"ICELAND"** / **"FROM ABOVE"**
3. `thumb_godafoss_en.jpg`: the snowy Goðafoss horseshoe. Text: **"8 PLACES"** / **"ICELAND FROM ABOVE"**. Brighten this frame slightly; the old one was too dark.
- Keep the text away from the bottom-right corner, where YouTube shows the video length.
- No people in any thumbnail. On Gullfoss, crop or choose a frame so the tourists on the path aren't noticeable.

## 6. Update the YouTube package (`_film/youtube-v2.md`)
**English (main):**
- Title: `Iceland from Above 4K | Gullfoss, Stuðlagil, Goðafoss & 5 More Places | Relaxing Drone Film`
- Description:
  ```
  An aerial journey across Iceland in 4K: waterfalls, basalt canyons, snowy craters and the North Atlantic, filmed by drone between 27 October and 1 November 2022. No narration, just the landscapes and music.

  CHAPTERS
  0:00 Intro
  (the recalculated chapters, ending with "Kolgrafafjörður (Viking Sword Road)")

  More places like this: https://theplacesnotfaces.com
  Iceland waterfalls guide: https://theplacesnotfaces.com/posts/iceland-waterfalls-drone/

  #Iceland #Islandia #Drone4K
  ```
- Tags: keep the current list (English and Spanish keywords).

**Spanish (to add in YouTube Studio as a translation):**
- Title: `Islandia desde el aire en 4K | Gullfoss, Stuðlagil, Goðafoss y 5 lugares más`
- The same description in Spanish, with the same recalculated chapters (the last one as "Kolgrafafjörður (la Espada Vikinga)") and the same two links ("Más lugares como este" / "Guía de cascadas de Islandia").

Don't add facts, heights or history that you can't verify from the footage.

## 7. Report
Tell me:
- every timestamp you changed and the new length;
- the recalculated chapters;
- the file sizes of `review-v2-480p.mp4` and the three thumbnails, so Leiser can send them to the editing session.
