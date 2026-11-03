/**
 * Generates every screenshot of the demo into screenshots/:
 *   npm run screenshots
 * Exports the web build (npx expo export -p web), serves it, opens each screen with a
 * deterministic ?demo=<scenario> state and a fixed clock in an iPhone 15 viewport.
 * Set SCREENSHOT_URL to reuse a running server (e.g. `expo start --web`) instead.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium, type Page } from '@playwright/test';

import { serveDist } from './static-server';

const OUT = join(__dirname, '..', 'screenshots');
const PORT = 4173;
/** Fixed "now" for every screenshot: martes 3 nov 2026, 18:30 local time. */
export const DEMO_DATE = new Date(2026, 10, 3, 18, 30, 0);

interface Shot {
  file: string;
  title: string;
  path: string;
  waitFor: string;
  /** Optional interaction before the capture. */
  prepare?: (page: Page) => Promise<void>;
}

export const SHOTS: Shot[] = [
  { file: '01-inicio.png', title: 'Inicio', path: '/?demo=inicio', waitFor: 'screen-home' },
  {
    file: '02-elegir-sesion.png',
    title: 'Elegir sesión',
    path: '/entrenar?demo=inicio',
    waitFor: 'screen-choose',
  },
  {
    file: '03-vista-sesion.png',
    title: 'Vista de sesión',
    path: '/entrenar/r-grupos/s-pecho?demo=inicio',
    waitFor: 'screen-preview',
  },
  {
    file: '04-mis-rutinas.png',
    title: 'Mis rutinas',
    path: '/rutinas?demo=inicio',
    waitFor: 'screen-routines',
  },
  {
    file: '05-editor-rutina.png',
    title: 'Editor de rutina',
    path: '/rutinas/editor?demo=editor',
    waitFor: 'screen-routine-editor',
  },
  {
    file: '06-editor-sesion.png',
    title: 'Editor de sesión',
    path: '/rutinas/editor/s-pecho?demo=editor',
    waitFor: 'screen-session-editor',
  },
  {
    file: '07-catalogo.png',
    title: 'Catálogo',
    path: '/rutinas/editor/s-pecho/catalogo?demo=editor',
    waitFor: 'screen-catalog',
  },
  {
    file: '08-configurar-ejercicio.png',
    title: 'Configurar ejercicio',
    path: '/rutinas/editor/s-pecho/e-pi?demo=editor',
    waitFor: 'screen-configure',
  },
  {
    file: '09-ejercicio-activo.png',
    title: 'Ejercicio activo',
    path: '/sesion/activa?demo=activa',
    waitFor: 'screen-active',
  },
  {
    file: '10-ejercicio-editando.png',
    title: 'Editando una serie',
    path: '/sesion/activa?demo=activa&editar=0',
    waitFor: 'editing-label',
  },
  {
    file: '11-descanso.png',
    title: 'Descanso',
    path: '/sesion/descanso?demo=descanso',
    waitFor: 'screen-rest',
  },
  {
    file: '12-transicion.png',
    title: 'Transición',
    path: '/sesion/transicion?demo=transicion',
    waitFor: 'screen-transition',
  },
  {
    file: '13-resumen.png',
    title: 'Resumen',
    path: '/sesion/resumen?demo=resumen',
    waitFor: 'screen-summary',
  },
  {
    file: '14-perfil.png',
    title: 'Perfil',
    path: '/perfil?demo=inicio',
    waitFor: 'screen-profile',
  },
];

async function settle(page: Page, testId: string) {
  await page.getByTestId(testId).first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(450); // let entering animations finish
}

function gallery(): string {
  const items = SHOTS.map(
    (s) =>
      `<figure><img src="${s.file}" alt="${s.title}" loading="lazy"><figcaption>${s.file.slice(0, 2)} · ${s.title}</figcaption></figure>`,
  ).join('\n');
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fitness Point · Capturas v0.1</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #000; color: #fff; font: 14px/1.4 Inter, system-ui, sans-serif; }
  header { padding: 32px 24px 8px; } h1 { margin: 0; font-size: 28px; letter-spacing: -0.5px; }
  p { color: #8a8a8a; margin: 4px 0 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; padding: 24px; }
  figure { margin: 0; border: 1px solid #262626; background: #0d0d0d; }
  img { display: block; width: 100%; height: auto; }
  figcaption { padding: 10px 12px; text-transform: uppercase; letter-spacing: 2px; font-size: 11px; color: #8a8a8a; border-top: 1px solid #262626; }
  .sheet { padding: 0 24px 48px; } .sheet img { border: 1px solid #262626; }
</style></head><body>
<header><h1>Fitness Point · Demo v0.1</h1><p>iPhone 15 · 393×852 @3x · modo demo determinista</p></header>
<section class="grid">
${items}
</section>
<section class="sheet"><h2>Ilustraciones del catálogo</h2><img src="ilustraciones.png" alt="Lámina de ilustraciones"></section>
</body></html>
`;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let base = process.env.SCREENSHOT_URL;
  let close: (() => void) | undefined;
  if (!base) {
    console.log('› Exportando la web (expo export -p web)…');
    execSync('npx expo export -p web', { stdio: 'inherit' });
    const server = await serveDist('dist', PORT);
    close = () => server.close();
    base = `http://127.0.0.1:${PORT}`;
  }

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      locale: 'es-ES',
      colorScheme: 'dark',
    });
    for (const shot of SHOTS) {
      const page = await context.newPage();
      await page.clock.setFixedTime(DEMO_DATE);
      await page.goto(base + shot.path);
      await settle(page, shot.waitFor);
      await shot.prepare?.(page);
      await page.screenshot({ path: join(OUT, shot.file) });
      console.log(`✓ ${shot.file}`);
      await page.close();
    }

    // Illustration sheet: wide viewport, cropped to the grid.
    const sheet = await browser.newPage({
      viewport: { width: 1200, height: 2200 },
      deviceScaleFactor: 2,
    });
    await sheet.clock.setFixedTime(DEMO_DATE);
    await sheet.goto(`${base}/ilustraciones?demo=inicio`);
    await settle(sheet, 'illustration-grid');
    const box = await sheet.getByTestId('illustration-grid').boundingBox();
    if (!box) throw new Error('illustration grid not found');
    await sheet.screenshot({
      path: join(OUT, 'ilustraciones.png'),
      clip: { x: 0, y: 0, width: 1200, height: Math.ceil(box.y + box.height + 24) },
    });
    console.log('✓ ilustraciones.png');

    writeFileSync(join(OUT, 'index.html'), gallery());
    console.log('✓ index.html');
  } finally {
    await browser.close();
    close?.();
  }
}

if (require.main === module) {
  main().catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
