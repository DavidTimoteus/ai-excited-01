import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAX_BYTES = 1_048_576;

function validateHeader(buf: Buffer): "jpeg" | "png" {
  const isJpeg =
    buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng =
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a;
  if (isJpeg) return "jpeg";
  if (isPng) return "png";
  throw new Error("entry.png has invalid magic bytes — not a JPEG or PNG");
}

function validateSize(buf: Buffer): void {
  if (buf.length > MAX_BYTES)
    throw new Error(`entry.png exceeds 1 MiB (${buf.length} bytes)`);
}

const MAX_DIM = 1024;

function jpegDimensions(buf: Buffer): { w: number; h: number } {
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    const segLen = buf.readUInt16BE(i + 2);
    const isSOF =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSOF) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + segLen;
  }
  throw new Error("Could not locate JPEG SOF segment");
}

function pngDimensions(buf: Buffer): { w: number; h: number } {
  // IHDR starts at byte 16
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function validateDimensions(buf: Buffer, format: "jpeg" | "png"): void {
  const { w, h } = format === "jpeg" ? jpegDimensions(buf) : pngDimensions(buf);
  if (w > MAX_DIM || h > MAX_DIM)
    throw new Error(`dimensions ${w}x${h} exceed ${MAX_DIM}x${MAX_DIM}`);
  console.log(`dimensions: ${w}x${h} — OK`);
}

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const srcPath = path.join(__dirname, "entry.png");
const destPath = path.join(outputDir, "entry.png");

const src = fs.readFileSync(srcPath);
validateSize(src);
const format = validateHeader(src);
console.log(`format: ${format}, size: ${src.length} bytes — OK`);
validateDimensions(src, format);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(destPath, src);

const copiedSize = fs.statSync(destPath).size;
if (copiedSize !== src.length)
  throw new Error(`output size mismatch: ${copiedSize} vs ${src.length}`);

console.log(`entry.png -> ${destPath} (${copiedSize} bytes verified)`);
