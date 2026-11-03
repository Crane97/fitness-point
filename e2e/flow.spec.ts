import { expect, test, type Page } from '@playwright/test';

/** Web keeps previous stack screens mounted (hidden): always target the visible element. */
const id = (page: Page, testId: string) => page.getByTestId(testId).locator('visible=true').first();

async function addExercise(page: Page, search: string, catalogId: string) {
  await id(page, 'add-exercise').click();
  await id(page, 'catalog-search').fill(search);
  await id(page, `catalog-${catalogId}`).click();
  await expect(id(page, 'screen-configure')).toBeVisible();
}

/** Completes the active session pressing only HECHO and SALTAR. */
async function trainToSummary(page: Page) {
  for (let i = 0; i < 80; i++) {
    if (await id(page, 'screen-summary').isVisible()) return;
    if (await id(page, 'done').isVisible()) await id(page, 'done').click();
    else if (await id(page, 'skip-rest').isVisible()) await id(page, 'skip-rest').click();
    else if (await id(page, 'start-exercise').isVisible()) await id(page, 'start-exercise').click();
    else await page.waitForTimeout(100);
  }
  throw new Error('Session did not reach the summary');
}

test('crear rutina → entrenar solo con HECHO y SALTAR → resumen → «la última vez»', async ({
  page,
}) => {
  await page.goto('/');
  await expect(id(page, 'screen-home')).toBeVisible();

  // 1. Crear «Mi rutina» por grupo muscular con «Pecho y tríceps» y 4 ejercicios.
  await id(page, 'my-routines').click();
  await id(page, 'new-routine').click();
  await id(page, 'routine-name').fill('Mi rutina');
  await id(page, 'organization-muscle').click();
  await id(page, 'session-0').getByRole('button').first().click();
  await expect(id(page, 'session-name')).toHaveValue('Pecho y tríceps');

  await addExercise(page, 'press banca', 'press-banca');
  await id(page, 'sets-plus').click(); // 4 series
  await id(page, 'weight-plus').click(); // 20,5 kg
  await id(page, 'rest-between-60').click();
  await id(page, 'exercise-done').click();

  await addExercise(page, 'inclinado', 'press-inclinado-mancuernas');
  await id(page, 'toggle-range').click(); // 10-12
  await id(page, 'exercise-done').click();

  await addExercise(page, 'fondos', 'fondos');
  await id(page, 'exercise-done').click();

  await addExercise(page, 'triceps polea', 'extension-triceps-polea');
  await id(page, 'rest-after-30').click();
  await id(page, 'exercise-done').click();

  await expect(id(page, 'exercise-row-3')).toContainText('Extensión de tríceps en polea');
  await expect(id(page, 'exercise-row-0')).toContainText('4 × 10 · 20,5 kg · 60 s');
  // Each exercise shows its illustration in the editor.
  await expect(page.locator('[data-testid^="exercise-row-"] [role="img"]')).toHaveCount(4);

  await id(page, 'back').click();
  await id(page, 'save-routine').click();
  await expect(id(page, 'screen-routines')).toBeVisible();
  await expect(page.getByText('Mi rutina').locator('visible=true').first()).toBeVisible();

  // 2. ENTRENAR → elegir la sesión → COMENZAR, cambiar el peso de la primera serie.
  await id(page, 'back').click();
  await id(page, 'train').click();
  await page
    .getByRole('button', { name: /^Pecho y tríceps/ })
    .locator('visible=true')
    .first()
    .click();
  await id(page, 'start').click();
  await expect(id(page, 'screen-active')).toBeVisible();
  await expect(id(page, 'exercise-counter')).toHaveText(/Ejercicio 1\/4/i);
  await expect(id(page, 'active-illustration')).toBeVisible();
  await id(page, 'active-weight-plus').click(); // 23 kg
  await id(page, 'active-reps-minus').click(); // 9 reps

  await trainToSummary(page);
  await expect(id(page, 'stat-sets')).toHaveText(/13\/13/);
  await id(page, 'save-exit').click();
  await expect(id(page, 'last-session')).toContainText('Pecho y tríceps');

  // 3. El cambio aparece en «La última vez» de la siguiente sesión.
  await id(page, 'train').click();
  await page
    .getByRole('button', { name: /^Pecho y tríceps/ })
    .locator('visible=true')
    .first()
    .click();
  await expect(id(page, 'preview-exercise-0')).toContainText('La última vez: 23 kg × 9');
  await id(page, 'start').click();
  await expect(id(page, 'last-time')).toHaveText('23 kg × 9');
});

const PERSISTED = {
  version: 1,
  state: {
    profile: { name: 'Atleta' },
    settings: { keepAwake: true, sound: false, haptics: false },
    routines: [
      {
        id: 'r1',
        name: 'Mi rutina',
        organization: 'muscle',
        createdAt: 0,
        updatedAt: 0,
        sessions: [
          {
            id: 's1',
            name: 'Pecho y tríceps',
            exercises: [
              {
                id: 'e1',
                exerciseId: 'press-banca',
                sets: [
                  { reps: 8, weightKg: 60 },
                  { reps: 8, weightKg: 60 },
                ],
                restBetweenSetsS: 90,
                restAfterExerciseS: 120,
                notes: '',
              },
            ],
          },
        ],
      },
    ],
    customExercises: [],
    draft: null,
    history: [],
    bodyMetrics: [],
    active: null,
  },
};

test('al reabrir la app durante un descanso el temporizador muestra el tiempo correcto', async ({
  page,
}) => {
  await page.clock.install({ time: new Date(2026, 10, 3, 18, 0, 0) });
  await page.addInitScript((state) => {
    if (!localStorage.getItem('fitness-point/v1')) {
      localStorage.setItem('fitness-point/v1', state);
    }
  }, JSON.stringify(PERSISTED));

  await page.goto('/');
  await id(page, 'train').click();
  await id(page, 'choose-s1').getByRole('button').first().click();
  await id(page, 'start').click();
  await id(page, 'done').click();
  await expect(id(page, 'rest-countdown')).toHaveText('1:30');

  await page.clock.fastForward(20_000);
  await expect(id(page, 'rest-countdown')).toHaveText('1:10');

  // "Close" the app and open it again 30 s later.
  await page.goto('about:blank');
  await page.clock.fastForward(30_000);
  await page.goto('/');
  // The app offers to resume the session, and the rest kept running meanwhile.
  await expect(id(page, 'resume-card')).toBeVisible();
  await id(page, 'resume').click();
  await expect(id(page, 'screen-rest')).toBeVisible();
  // Remaining time = endsAt − now, including the 30 s the app was closed.
  const expected = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('fitness-point/v1') ?? '{}');
    return Math.ceil((saved.state.active.machine.phase.endsAt - Date.now()) / 1000);
  });
  expect(expected).toBeLessThanOrEqual(40);
  const shown = await id(page, 'rest-countdown').textContent();
  const [m, sec] = (shown ?? '').split(':').map(Number);
  expect(Math.abs((m ?? 0) * 60 + (sec ?? 0) - expected)).toBeLessThanOrEqual(1);

  // When the time is up it moves on to the next set by itself.
  await page.clock.fastForward(45_000);
  await expect(id(page, 'screen-active')).toBeVisible();
  await expect(id(page, 'next-line')).toContainText('Fin de la sesión');
});
