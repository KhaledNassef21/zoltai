/**
 * Ensure whoosh.mp3 exists at public/audio/sfx/whoosh.mp3.
 *
 * If the file is missing, synthesize a classic cinematic whoosh using the
 * ffmpeg binary bundled with Remotion — no external downloads, no API keys,
 * works on every runner (Windows dev + Linux CI).
 *
 * The synthesis recipe: brown noise, band-passed to 200–3000 Hz, with a
 * quick attack/decay envelope. Sounds like a real whoosh, not a tone.
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const SFX_DIR = path.join(process.cwd(), "public/audio/sfx");
const WHOOSH_PATH = path.join(SFX_DIR, "whoosh.mp3");

function findFfmpeg(): string {
  const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const candidates = [
    path.join(process.cwd(), "node_modules/@remotion/compositor-win32-x64-msvc", exe),
    path.join(process.cwd(), "node_modules/@remotion/compositor-linux-x64-gnu", exe),
    path.join(process.cwd(), "node_modules/@remotion/compositor-linux-x64-musl", exe),
    path.join(process.cwd(), "node_modules/@remotion/compositor-darwin-x64", exe),
    path.join(process.cwd(), "node_modules/@remotion/compositor-darwin-arm64", exe),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return "ffmpeg"; // hope it's on PATH
}

function main() {
  if (fs.existsSync(WHOOSH_PATH) && fs.statSync(WHOOSH_PATH).size > 1000) {
    console.log(`✅ whoosh.mp3 already exists (${(fs.statSync(WHOOSH_PATH).size / 1024).toFixed(1)}KB)`);
    return;
  }

  if (!fs.existsSync(SFX_DIR)) {
    fs.mkdirSync(SFX_DIR, { recursive: true });
  }

  const ffmpeg = findFfmpeg();
  console.log(`🎵 Synthesizing whoosh.mp3 via ${ffmpeg}`);

  try {
    execFileSync(
      ffmpeg,
      [
        "-y",
        // 0.45s of filtered brown noise → classic "air rush" texture
        "-f", "lavfi",
        "-i", "anoisesrc=d=0.45:c=brown:a=0.8",
        // Band-pass 200-3000 Hz for whoosh character,
        // fast 60ms attack, 150ms tail so it doesn't feel like a click.
        "-af",
        "highpass=f=200,lowpass=f=3000,afade=t=in:d=0.06,afade=t=out:st=0.30:d=0.15,volume=1.2",
        "-c:a", "libmp3lame",
        "-b:a", "128k",
        "-ar", "44100",
        "-ac", "2",
        WHOOSH_PATH,
      ],
      { stdio: "pipe", timeout: 20000 }
    );

    const size = fs.statSync(WHOOSH_PATH).size;
    console.log(`✅ whoosh.mp3 synthesized: ${(size / 1024).toFixed(1)}KB`);
  } catch (err) {
    console.warn(`⚠️ Could not synthesize whoosh.mp3: ${(err as Error).message?.slice(0, 200)}`);
    console.warn("   The pipeline will run without transition SFX.");
  }
}

main();
