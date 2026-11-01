# Prompt: pick the best waterfall clips (Claude on Leiser's laptop)

Open the Claude Desktop app on the laptop, start a Claude Code session in the waterfalls folder, and paste everything below the line.

---

You are helping **Leiser Acosta** choose and prepare video clips for **Places, Not Faces**, a bilingual (English/Spanish) travel brand on Instagram and YouTube (@theplacesnotfaces). The current folder holds Leiser's own waterfall videos (phone and drone). This computer runs **Windows**; use PowerShell.

Work through these steps and report back after each one. Do not delete, move or overwrite any original file. Write everything you create to a new subfolder called `_picks`.

## 1. Set up
- Check whether `ffmpeg` and `ffprobe` are installed (`ffmpeg -version`). If not, install them with `winget install Gyan.FFmpeg`, then open a new terminal.

## 2. Inventory
- List every video in this folder and its subfolders (`.mp4`, `.mov`, `.mkv`, `.avi`, `.m4v`, `.MP4`, `.MOV`).
- For each one, use `ffprobe` to record: file name, duration, resolution (width × height, and whether it is rotated), frame rate, file size, and creation date if available.
- Save the table as `_picks/inventory.csv` and show it to me.

## 3. Look at them
- For each video, make a contact sheet: about 12 frames spread evenly across the clip, tiled 4×3, with the timestamp burned on each frame. Save it as `_picks/sheets/<video name>.jpg`, for example:
  `ffmpeg -i "IN.mp4" -vf "fps=12/DURATION,scale=320:-2,drawtext=text='%{pts\:hms}':fontcolor=yellow:fontsize=18:x=5:y=5:box=1:boxcolor=black,tile=4x3" -frames:v 1 "_picks/sheets/IN.jpg"`
  (replace DURATION with the clip length in seconds). If `drawtext` fails because of fonts, drop the drawtext part.
- Open and look at every contact sheet yourself before judging.

## 4. Judge them with what works for this channel
Our own analytics show what holds viewers on Shorts and Reels:
- **The first second must be the most dramatic moment**: water crashing, a big drop, a rainbow, a drone reveal. Calm, grey or misty openings get swiped away (a grey Reynisfjara opening kept only 21.8% of viewers; the Devil's Throat at Iguazú, overwhelming from frame 1, kept 46–50%).
- **Bright, colourful or high-contrast footage** beats flat, grey footage.
- **15–20 seconds is the target length.** The 55-second Devil's Throat Short lost two-thirds of viewers by 15 seconds.
- **Movement helps**: drone moves, the camera approaching the falls, spray, people for scale (but faces must not be the subject — the brand is "places, not faces").
- **Places people rarely see beat famous landmarks**, unless there is an unusual angle or a story (a legend, a record, a film location).
- **Sharpness**: 4K or 1080p is best. Footage below 1080p needs care.
- **Avoid**: other people's faces as the main subject, private items in frame (medicines, documents, screens), shaky or out-of-focus footage, and clips with copyrighted music playing in the background.
- **Already posted — skip these places**: Iguazú (Devil's Throat and boat ride), Skógafoss rainbow, Barnafoss, Reynisfjara.

Score each video from 1 to 10 and give a one-line reason. Then pick the **top 3**, and for each one give:
- the **best 15–20 second segment** (start and end time), starting on its most dramatic frame;
- which **waterfall and country** it seems to be (say if you are guessing, and ask Leiser to confirm);
- whether it is **vertical or horizontal**, and how it should be cropped for a 9:16 Short.

Save this as `_picks/shortlist.md` and show me the three contact sheets for the picks.

## 5. Prepare the clips to send
For each of the top 3, export the chosen segment without changing the picture or adding text, so the editing session can do the full edit:
- Keep the original resolution and orientation; just cut the segment and re-encode:
  `ffmpeg -ss START -to END -i "IN.mp4" -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "_picks/pick1_<name>.mp4"`
- Each file must be **under 30 MB**. If one is bigger, raise `-crf` to 23–26 until it fits.
- Keep the original sound (it may be useful, or it will be replaced with music later).

## 6. Report
Finish with a short summary: the three picks, their segments, file sizes, and the questions Leiser needs to answer (where and when each was filmed). Leiser will attach the three files to the editing session, which adds the hook text, music, captions and the end card, and writes the title, description and tags.
