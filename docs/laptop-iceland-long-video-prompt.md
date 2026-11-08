# Prompt: Iceland long drone film (Claude on Leiser's laptop)

Open the Claude Desktop app on the laptop, start a Claude Code session in the folder that **contains** the `iceland` folder, and paste everything below the line. Attach the music track (a Suno MP3) to the session, or put it in the `iceland` folder first.

---

You are helping **Leiser Acosta** make a long YouTube video for **Places, Not Faces** (YouTube @theplacesnotfaces), a bilingual (English/Spanish) travel channel. The folder `iceland` holds Leiser's own drone and phone footage from Iceland. This computer runs **Windows**; use PowerShell.

**Why this video matters:** to be paid by YouTube, the channel needs 4,000 hours of watch time on long (non-Short) videos, and paid promotion views don't count. A calm, beautiful 10–15 minute drone film that people leave playing is the best way to earn those hours.

Work through the steps below and report back after each one. **Never delete, move or overwrite an original file.** Write everything you create to a new subfolder `iceland/_film`. **Do not upload anything to YouTube**: Leiser reviews the final video first.

## 1. Set up
- Check `ffmpeg -version`. If it is missing, install it with `winget install Gyan.FFmpeg` and open a new terminal.

## 2. Inventory
- List every video in `iceland` and its subfolders (`.mp4 .mov .mkv .m4v`, any letter case).
- For each one record, with `ffprobe`: file name, duration, width × height, rotation, frame rate, HDR or not (`color_transfer` = `arib-std-b67` or `smpte2084` means HDR), file size and creation date.
- Save it as `_film/inventory.csv` and show it to me.

## 3. Look at every clip
- Make a contact sheet per clip: 12 frames, tiled 4×3, with timestamps, saved to `_film/sheets/`.
  `ffmpeg -i "IN.mp4" -vf "fps=12/DURATION,scale=320:-2,drawtext=text='%{pts\:hms}':fontcolor=yellow:fontsize=18:x=5:y=5:box=1:boxcolor=black,tile=4x3" -frames:v 1 "_film/sheets/NAME.jpg"` (drop the drawtext part if fonts fail).
- Open and look at every sheet yourself. For each clip, note:
  - the place, if you can recognise it (Gullfoss, Skógafoss, Seljalandsfoss, Reynisfjara, Barnafoss, Kirkjufell, Kolgrafafjörður bridge — the "Viking Sword Road" — Jökulsárlón, and so on). **Say when you are guessing and ask Leiser to confirm**;
  - the usable segments (start and end time): smooth and in focus, no shaking, no sudden gimbal tilts up and down, no propellers or the drone's shadow in frame, and no people's faces as the subject.
- Save the notes as `_film/clips.md`.

## 4. Plan the film and wait for my OK
Group the clips by place. Propose the order (a natural road-trip order works well, e.g. Golden Circle → South Coast → Snæfellsnes) and the chapters with their target lengths. Aim for **10–15 minutes** in total, each shot **8–20 seconds**, and the most spectacular shot in the **first 10 seconds**.

Show me the plan as a table (chapter, clips, segments, length) and **wait for Leiser's OK before rendering**.

## 5. Edit rules (the channel's style)
- **Landscape 16:9, 3840×2160 (4K)** if most of the footage is 4K, otherwise 1920×1080. **Full frame: no black bars, no blurred bands, no picture-in-picture.** Crop vertical phone clips to 16:9, or leave them out.
- **Never jump-cut between two near-identical shots.** Use 1-second crossfades (`xfade`) between shots, and longer 2-second fades between chapters.
- If a clip is HDR, convert it to SDR first so it doesn't look washed out:
  `zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=mobius:desat=0:param=0.3,zscale=t=bt709:m=bt709:r=tv,format=yuv420p`
- **Colour:** a gentle lift only (`eq=contrast=1.05:saturation=1.08`). Iceland should look natural, not neon.
- **Speed:** normal speed. If you slow anything down, use frame interpolation (`minterpolate`), never plain stretching.
- **Text, kept minimal (it's a relaxing film):**
  - the opening title over the first shot for about 4 s: "ICELAND FROM ABOVE" (a serif font, white, with a soft shadow);
  - a small lower-third with the place name at the start of each chapter, about 3 s, bottom left (e.g. "Gullfoss · The Golden Falls");
  - nothing else on screen.
- **Leave the last 20 seconds clean** (a calm wide shot, no text), so Leiser can add YouTube end-screen elements there.
- **Sound:** mute the original camera and drone audio, then use Leiser's music track. If it's shorter than the film, loop it with a crossfade or ask for a second track. Final loudness about −14 LUFS (`loudnorm=I=-14:TP=-1.5`), with a 3-second fade in and a 5-second fade out.
- **Export:** H.264 High, `yuv420p`, 30 fps (or the footage's own frame rate), `-crf 18`, AAC 192 kb/s, `-movflags +faststart`. Save it as `_film/iceland-from-above-4k.mp4`.

## 6. Check before handing over
- Watch the whole export yourself at 2× speed, plus every transition at normal speed. Look for jumps, black frames, flashes, a frame-rate stutter and audio pops. Fix them and export again.
- Make `_film/preview-sheet.jpg`: one frame every 30 seconds, tiled, so Leiser can see the whole film at a glance.

## 7. YouTube package (write it in `_film/youtube.md`)
- **Title:** `Iceland from Above 4K | Waterfalls, Black Sand Beaches & the Viking Sword Road | Relaxing Drone Film`. Adjust it to what's really in the film.
- **Description:** two sentences on what the film shows and when it was filmed (ask Leiser for the month and year; **never invent dates, facts or experiences**), then the chapters with their timestamps (the first one must be `00:00`), then "More places like this: https://theplacesnotfaces.com", then 4–5 hashtags.
- **Tags:** 12–15, from specific to broad (each place name, "Iceland drone", "Iceland 4K", "relaxing drone footage", "Iceland waterfalls", "Iceland travel").
- **Thumbnail:** export 3 candidate frames at 1280×720 (`_film/thumb-1.jpg` to `thumb-3.jpg`), the brightest and most dramatic moments.
- **Settings to set when uploading:** not made for kids, Travel & Events, altered content No.

## 8. Bonus: three vertical Shorts from the same footage
From the best moments, cut three **vertical 1080×1920 Shorts of 15–20 seconds** (`_film/short-1.mp4` to `short-3.mp4`):
- Crop the 4K frame full-screen and follow the subject. **No bezels or blurred bands.**
- The first frame must be the most dramatic moment (falling water, a reveal).
- **Don't add text.** The editing session adds the hook, captions, music and end card.
- Each Short will link to this long film as its "Related video".

## 9. Report
Finish with: the film's length and file size, the chapter list, the three Shorts, and every question Leiser needs to answer (places to confirm, the month and year of filming). Leiser will review the video before uploading it.
