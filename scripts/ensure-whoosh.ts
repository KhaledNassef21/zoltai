/**
 * Ensure whoosh.mp3 exists at public/audio/sfx/whoosh.mp3.
 *
 * Tries 3 synthesis strategies in order. Whichever succeeds first wins:
 *   1. Brown noise (best-sounding, requires `anoisesrc` filter)
 *   2. Frequency sweep (always works, cleaner "swoosh")
 *   3. Silence clip (last resort — prevents 404 without real SFX)
 *
 * All strategies use the ffmpeg binary bundled with Remotion.
 * Verbose logging so CI failures are diagnosable.
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const SFX_DIR = path.join(process.cwd(), "public/audio/sfx");
const WHOOSH_PATH = path.join(SFX_DIR, "whoosh.mp3");
const MIN_VALID_SIZE = 500; // bytes — below this the MP3 is unusable

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
    if (fs.existsSync(c)) {
      console.log(`   ffmpeg: ${c}`);
      return c;
    }
  }
  console.log(`   ffmpeg: <PATH fallback>`);
  return "ffmpeg";
}

function isValidOutput(): boolean {
  if (!fs.existsSync(WHOOSH_PATH)) return false;
  const size = fs.statSync(WHOOSH_PATH).size;
  return size >= MIN_VALID_SIZE;
}

function trySynthesis(label: string, args: string[], ffmpeg: string): boolean {
  console.log(`\n🔧 Attempt: ${label}`);
  try {
    const result = execFileSync(ffmpeg, args, {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 20000,
    });
    if (result) {
      console.log(result.toString().slice(-400));
    }
  } catch (err: any) {
    const stderr = err?.stderr?.toString?.() || "";
    const stdout = err?.stdout?.toString?.() || "";
    console.warn(`   ❌ ${label} failed: ${err?.message?.slice(0, 200)}`);
    if (stderr) console.warn(`   stderr: ${stderr.slice(-600)}`);
    if (stdout) console.warn(`   stdout: ${stdout.slice(-300)}`);
    return false;
  }

  if (isValidOutput()) {
    const size = fs.statSync(WHOOSH_PATH).size;
    console.log(`   ✅ ${label} produced ${(size / 1024).toFixed(1)}KB`);
    return true;
  }
  console.warn(`   ❌ ${label} ran but produced invalid/empty file`);
  return false;
}

function main() {
  console.log("🎵 ensure-whoosh: starting");
  console.log(`   target: ${WHOOSH_PATH}`);
  console.log(`   cwd:    ${process.cwd()}`);

  if (isValidOutput()) {
    const size = fs.statSync(WHOOSH_PATH).size;
    console.log(`✅ whoosh.mp3 already exists (${(size / 1024).toFixed(1)}KB) — nothing to do`);
    return;
  }

  if (!fs.existsSync(SFX_DIR)) {
    fs.mkdirSync(SFX_DIR, { recursive: true });
    console.log(`   created directory: ${SFX_DIR}`);
  }

  const ffmpeg = findFfmpeg();

  // ─── Strategy 1: Brown noise (best sound, may require anoisesrc filter) ───
  const brownArgs = [
    "-y",
    "-f", "lavfi",
    "-i", "anoisesrc=d=0.45:c=brown:a=0.8",
    "-af",
    "highpass=f=200,lowpass=f=3000,afade=t=in:d=0.06,afade=t=out:st=0.30:d=0.15,volume=1.2",
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    "-ar", "44100",
    "-ac", "2",
    WHOOSH_PATH,
  ];
  if (trySynthesis("brown-noise whoosh", brownArgs, ffmpeg)) return;

  // ─── Strategy 2: Frequency sweep with sine (always available) ───
  // Combine a descending sweep with white noise for texture. Uses only
  // universally-available filters: sine, anoisesrc isn't used here; aevalsrc
  // is the fallback noise source on minimal ffmpeg builds.
  const sweepArgs = [
    "-y",
    "-f", "lavfi",
    "-i", "sine=frequency=800:beep_factor=4:duration=0.4",
    "-af",
    "asetrate=44100*1.5,aresample=44100,highpass=f=150,lowpass=f=2500," +
      "afade=t=in:d=0.05,afade=t=out:st=0.30:d=0.1,volume=0.8",
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    "-ar", "44100",
    "-ac", "2",
    WHOOSH_PATH,
  ];
  if (trySynthesis("sine-sweep whoosh", sweepArgs, ffmpeg)) return;

  // ─── Strategy 3: Plain sine burst (most minimal) ───
  const plainSineArgs = [
    "-y",
    "-f", "lavfi",
    "-i", "sine=frequency=600:duration=0.3",
    "-af", "volume=0.5",
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    "-ar", "44100",
    "-ac", "2",
    WHOOSH_PATH,
  ];
  if (trySynthesis("plain-sine tone", plainSineArgs, ffmpeg)) return;

  // ─── Strategy 4: Silence placeholder (prevents 404, no actual sound) ───
  const silenceArgs = [
    "-y",
    "-f", "lavfi",
    "-i", "anullsrc=r=44100:cl=stereo",
    "-t", "0.3",
    "-c:a", "libmp3lame",
    "-b:a", "64k",
    WHOOSH_PATH,
  ];
  if (trySynthesis("silence placeholder", silenceArgs, ffmpeg)) {
    console.log("   ⚠️ Note: placeholder is silent — transitions will have no whoosh.");
    return;
  }

  // ─── Last resort: remove the file so generate-video.ts won't set whooshFile ───
  console.warn("❌ All synthesis strategies failed. whoosh.mp3 will NOT exist.");
  console.warn("   Pipeline will render without transition SFX (no crash).");
  try {
    if (fs.existsSync(WHOOSH_PATH)) fs.unlinkSync(WHOOSH_PATH);
  } catch {}
}

main();
