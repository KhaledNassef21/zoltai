# SFX & Music Setup — Zoltai Cinematic Reels

This is a one-time setup guide to give your reels real **whoosh** transitions and royalty-free background music. **Cost: $0.**

The pipeline is fully optional — if you skip this guide, videos still render fine, just without SFX and music.

---

## 1. Whoosh SFX (transitions between scenes)

The Remotion template plays a short whoosh at every scene boundary. We only need **one** whoosh file — it's reused at every transition.

### Step 1.1 — Download a free whoosh

Pick any one of these (they're all CC0 / royalty-free):

- **Pixabay** — https://pixabay.com/sound-effects/search/whoosh/  
  Recommended: "Whoosh" by **freesound_community** (~0.5–1.0 sec, MP3).
- **Mixkit** — https://mixkit.co/free-sound-effects/whoosh/  
  Recommended: "Cinematic transition swoosh".
- **Freesound** (free account required) — https://freesound.org/search/?q=whoosh

Pick a sample that is **0.4–1.2 seconds long**, MP3 format, mono or stereo.

### Step 1.2 — Save it to the project

Save the file to:

```
public/audio/sfx/whoosh.mp3
```

Create the folders if they don't exist:

```bash
mkdir -p public/audio/sfx
mv ~/Downloads/whoosh.mp3 public/audio/sfx/whoosh.mp3
```

That's it. Next time you run `npx tsx scripts/generate-video.ts`, the whoosh will play at every transition automatically. If the file is missing, the template silently skips it (no error).

### Step 1.3 — Test it

```bash
npx tsx scripts/generate-video.ts <slug>
```

Open the generated MP4 and confirm you hear the whoosh at scene cuts.

---

## 2. Background music (optional, recommended)

We use the **YouTube Audio Library** — free, royalty-free, no attribution needed for most tracks.

### Step 2.1 — Pick tracks per vibe

Open https://studio.youtube.com → **Audio Library** (left sidebar).

Filter by **Genre** and **Mood**. Recommended categories for productivity / AI content:

| Reel format        | Recommended mood          | Genre                    |
| ------------------ | ------------------------- | ------------------------ |
| Hook/Curiosity     | Inspirational, Bright     | Electronic, Cinematic    |
| Tool Demo          | Calm, Bright              | Ambient, Electronic      |
| Step-by-Step       | Inspirational             | Electronic, Pop          |
| Before/After       | Dramatic, Inspirational   | Cinematic                |
| Value Breakdown    | Bright, Calm              | Ambient                  |
| Comparison         | Funky, Bright             | Electronic               |
| Quick Tip          | Funky, Bright             | Pop, Hip Hop & Rap       |
| Myth Buster        | Dramatic, Dark            | Cinematic                |
| Story              | Inspirational, Sad        | Cinematic, Ambient       |
| List/Ranking       | Bright, Funky             | Pop, Electronic          |

Tip: the `musicVibe` field on each generated reel (in `data/reels/<slug>.json`) already gives you a mood hint from the AI director.

### Step 2.2 — Download to the project

Save tracks to:

```
public/audio/music/
```

Naming convention (keeps things organized):

```
public/audio/music/inspirational-electronic-1.mp3
public/audio/music/cinematic-dramatic-1.mp3
public/audio/music/ambient-calm-1.mp3
```

### Step 2.3 — Wire a track into a reel (manual for now)

By default the pipeline does **not** auto-attach music. If you want music on a specific reel, edit `scripts/generate-video.ts` `renderVideo()` and add `backgroundMusic` to the props:

```ts
const props = JSON.stringify({
  hook: reel.hook,
  scenes: reel.scenes,
  cta: reel.cta,
  audioFile: audioPath ? `audio/${path.basename(audioPath)}` : undefined,
  whooshFile,
  backgroundMusic: "audio/music/inspirational-electronic-1.mp3", // ← add this
  images,
});
```

The template plays it at **12% volume** under the voiceover, on loop, for the whole reel.

> **Future enhancement:** map `reel.musicVibe` → a track filename automatically. Out of scope for this setup guide.

---

## 3. License compliance — read this once

| Source                  | License                  | Attribution required? |
| ----------------------- | ------------------------ | --------------------- |
| Pixabay SFX             | Pixabay License (CC0-ish) | No                    |
| Mixkit SFX              | Mixkit License            | No (for personal/commercial) |
| Freesound (CC0 only)    | CC0                      | No                    |
| Freesound (CC-BY)       | CC-BY                    | YES — credit creator  |
| YouTube Audio Library   | YT Audio Library license | Some tracks require attribution — check the **"Attribution"** column in the library |

**Rule of thumb:** if the YouTube Audio Library shows a person icon next to the track, you must credit the creator. Add the credit to the Instagram caption:

```
🎵 "Track Name" by Artist — YouTube Audio Library
```

---

## 4. Verifying everything works

```bash
# 1. Confirm the assets are in place
ls public/audio/sfx/whoosh.mp3
ls public/audio/music/

# 2. Render a test video
npx tsx scripts/generate-video.ts

# 3. Inspect output
ffprobe public/videos/<slug>-reel1.mp4 2>&1 | grep -E "Stream|Duration"
```

You should see **two audio streams** if music is wired in (voiceover + music mixed by Remotion into one final track). Whoosh transitions will be inside the same audio track at scene boundaries.

---

## 5. Troubleshooting

| Symptom                                  | Fix                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------- |
| No whoosh sound in output                | Check `public/audio/sfx/whoosh.mp3` exists and is a valid MP3       |
| Whoosh too loud / drowns voice           | Lower `volume={0.6}` in `WhooshTrigger` (in `ReelTemplate.tsx`)     |
| Music too loud                           | Lower `volume={0.12}` in the `<Audio backgroundMusic>` line         |
| Render fails with "asset not found"      | Make sure the path is relative to `public/` (no leading slash)      |
| Whoosh plays only once                   | Confirm `transitionFrames` array has all scene starts (it should)   |

---

## 6. Why we did NOT use Pexels / Stock APIs

The Pexels API requires a key and rate-limits at 200 req/hour for free. For SFX and music we don't need fresh content per render — one good whoosh + 5–10 good music tracks cover the next year of content. Static `public/` assets are zero-cost, zero-API-quota, and shippable to Vercel directly.
