// Entrypoint for ai-excited-01: Cybernetic Phoenix Breakout
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Target directory resolution
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(out, { recursive: true });

// Verify and copy 1024x1024 Cybernetic Phoenix artwork to output target
const src = new URL('./entry.png', import.meta.url);
const dest = join(out, 'entry.png');
copyFileSync(src, dest);
console.log(`[ai-excited-01] Successfully copied visual asset to: ${dest}`);
