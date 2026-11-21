// Vice Panel Studio — hand-in program for the make.fun bounty gta6-cover-art-01.
//
// The entry itself is the static web app in app/ (open app/index.html in a
// browser; it runs fully offline). This program's job is only the hand-in:
// it mirrors app/ and screenshots/ from beside this file into the output
// directory, then writes dossier.json there — the summary the judge reads —
// using the vendored library in vendor/makefun-app.ts.
//
// The gate limits below are the bounty's own. They are passed to
// buildDossier unchanged so this program refuses, loudly and locally, any
// entry the scorer would refuse anyway (too many screenshots, one image
// over 256 KiB, too many or too-large app files, an over-long app path).
//
// Run it:
//   node main.ts                                   (writes to /output)
//   MAKEFUN_OUTPUT_DIR=out node main.ts            (writes to ./out)
// Preview the app with: node serve.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const entryDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copies one entry folder (app/ or screenshots/) into the output, if present. */
function mirrorIntoOutput(folderName: string): void {
  const source = join(entryDir, folderName);
  if (!existsSync(source)) return;
  const target = join(outputDir, folderName);
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
mirrorIntoOutput('app');
mirrorIntoOutput('screenshots');

const dossierText = buildDossier(outputDir, GATE_CAPS);
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(dossierPath, dossierText);

const { size } = statSync(dossierPath);
console.log(`vice panel studio: hand-in assembled at ${outputDir} (dossier.json, ${size} bytes)`);
