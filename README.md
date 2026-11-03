# Fitness Point

Demo **v0.1** de una app que te guía en el gimnasio **serie a serie**: eliges sesión, haces la serie, pulsas HECHO, descansas con temporizador y pasas al siguiente ejercicio hasta el resumen final.

- **Stack:** Expo SDK 58 · React Native · TypeScript (strict) · Expo Router · Zustand (`persist`) con validación Zod · ilustraciones con `react-native-svg` · `react-native-reanimated` · `expo-haptics`, `expo-notifications`, `expo-keep-awake`, `expo-audio` · `react-native-gifted-charts` (gráfica de peso).
- **Todo local:** un usuario demo, sin backend ni cuentas. Los datos se guardan en AsyncStorage.
- **Diseño:** fondo negro, formas cuadradas, un único acento `#FF3B1F`.

## Cómo arrancar

```bash
npm install
```

**Móvil (Expo Go):** necesitas la versión de Expo Go compatible con **SDK 58**.

```bash
npx expo start      # escanea el QR con Expo Go (Android) o la cámara (iOS)
```

**Web:**

```bash
npm run web         # equivale a: npx expo start --web
```

### Modo demo (solo web)

Añade `?demo=<escenario>` a cualquier URL para cargar un estado determinista (definido en `src/demo/scenarios.ts`):

| Escenario    | Qué muestra                                                            |
| ------------ | ---------------------------------------------------------------------- |
| `inicio`     | Usuario «Álex» con rutinas, historial y métricas corporales de ejemplo |
| `vacio`      | Primer uso: sin rutinas, historial ni métricas                         |
| `editor`     | Borrador abierto de la rutina «r-grupos» en el editor                  |
| `activa`     | Sesión «Pecho y tríceps» en curso: ejercicio 2/5, serie 2/3            |
| `descanso`   | Descanso entre series recién empezado (quedan 1:14 de 1:30)            |
| `transicion` | Pantalla de transición al siguiente ejercicio                          |
| `resumen`    | Sesión terminada con mejoras (+2,5 kg) respecto a la vez anterior      |

Ejemplo: `http://localhost:8081/sesion/descanso?demo=descanso`.

El estado demo vive **solo en memoria** (`memoryStorage()` en `src/store/index.ts`): nunca sobrescribe tus datos reales. Las builds nativas nunca arrancan en modo demo.

## Scripts

```bash
npm run lint          # ESLint (eslint-config-expo + prettier)
npm run format        # Prettier --write
npm run format:check  # Prettier --check
npm run typecheck     # tsc --noEmit
npm test              # Jest (jest-expo)
npm run test:e2e      # Playwright (exporta la web y la sirve en :4174)
npm run screenshots   # Genera las capturas en screenshots/
```

La primera vez que uses Playwright (E2E o capturas):

```bash
npx playwright install chromium
```

## Estructura del proyecto

```
src/
├── app/            # Rutas de Expo Router (finas: solo montan pantallas de features/)
│   ├── entrenar/   #   elegir sesión y vista previa
│   ├── rutinas/    #   lista, editor de rutina/sesión, catálogo, ejercicio propio
│   ├── sesion/     #   activa, descanso, transicion, resumen
│   ├── perfil.tsx
│   └── ilustraciones.tsx   # lámina con todas las ilustraciones (revisión)
├── features/       # Pantallas: home, profile, routines, workout
├── components/     # UI base: Button, Card, Dialog, Stepper, Text, Screen…
├── domain/         # Lógica pura y testeada, sin React
│   ├── sessionMachine.ts   # idle → performing → resting(betweenSets|afterExercise) → finished
│   ├── timer.ts            # descanso basado en `endsAt` absoluto (sobrevive a segundo plano/bloqueo)
│   └── planning, history, routineEditing, routineValidation, dates, format…
├── store/          # Zustand + persist; schema.ts (Zod), selectors.ts
├── services/       # clock, haptics, notifications (+ .web), sound
├── illustrations/  # esqueleto, poses, equipamiento y registro de ilustraciones
├── data/           # exercises.ts (catálogo ~30 ejercicios), seed.ts (datos demo)
├── demo/           # escenarios ?demo=
├── hooks/, theme/
scripts/            # screenshots.ts, serve.ts, static-server.ts
e2e/                # flow.spec.ts (Playwright)
.claude/            # subconjunto vendorizado de ECC (ver .claude/README.md)
```

## Cómo añadir ejercicios e ilustraciones al catálogo

1. **Datos.** Añade una fila a `DEFS` en `src/data/exercises.ts`:

   ```ts
   ['remo-t', 'Remo en T', 'espalda', ['biceps'], 'barra'],
   // [id, nombre, músculo principal, secundarios, equipamiento]
   ```

   El `id` es también su `illustrationKey`.

2. **Ilustración.** Añade una entrada `Art` con **el mismo id** en `src/illustrations/poses/upper.tsx` (pecho, espalda, hombro, bíceps, tríceps) o `src/illustrations/poses/lower.tsx` (piernas, gemelo, core):

   ```tsx
   'remo-t': {
     start: { hip: [60, 80], torso: -150, arm: [90, 90], leg: [60, 110] }, // pose inicial (sólida)
     end:   { hip: [60, 80], torso: -150, arm: [140, -60], leg: [60, 110] }, // pose final (fantasma), opcional
     scene: () => <Bench x1={30} x2={80} y={90} />,   // escenario fijo (banco, máquina…)
     hold: (j) => <Plate at={j.wrist} />,             // material que se mueve con la figura
   },
   ```

   - El tipo `Art` está en `src/illustrations/art.ts`; los elementos (`Bench`, `Dumbbell`, `Plate`, `Pulley`, `Cable`, `Pad`, `Seg`…) en `src/illustrations/gear.tsx`.
   - **Ángulos** (`src/illustrations/skeleton.ts`): en grados, convención SVG — `0` = derecha, `90` = abajo, `-90` = arriba. Son **absolutos por segmento** (no relativos a la articulación anterior). `torso` es el ángulo cadera → cuello; `arm`/`leg` son `[superior, inferior]`; `arm2`/`leg2` para la extremidad lejana; `view: 'front'` para vista frontal.
   - Las longitudes de cada segmento son fijas (`LIMB`), así que todas las figuras tienen las mismas proporciones.
   - Todas comparten `viewBox` 120×120 y grosor de trazo (`illustration` en `src/theme/index.ts`).
   - Los músculos se resaltan **automáticamente** en el acento a partir de `primary`/`secondary`; no hay que dibujarlos.

3. **Comprueba.** `npm test` — `src/illustrations/registry.test.ts` falla si algún ejercicio del catálogo no tiene ilustración.

4. **Revisa visualmente** en la ruta `/ilustraciones` (p. ej. `npm run web` → `/ilustraciones`) o en `screenshots/ilustraciones.png` tras `npm run screenshots`.

Los ejercicios personalizados (creados en la app) usan la figura genérica `generic-<músculo>` (p. ej. `generic-pecho`).

## Capturas

```bash
npm run screenshots
```

`scripts/screenshots.ts` exporta la web (`npx expo export -p web`), sirve `dist/`, y abre cada pantalla con su `?demo=` en un viewport **iPhone 15 (393×852 @3x)**, modo oscuro y reloj fijo (**martes 3 nov 2026, 18:30**). Genera en `screenshots/`:

- `01-inicio.png` · `02-elegir-sesion.png` · `03-vista-sesion.png` · `04-mis-rutinas.png` · `05-editor-rutina.png` · `06-editor-sesion.png` · `07-catalogo.png` · `08-configurar-ejercicio.png` · `09-ejercicio-activo.png` · `10-ejercicio-editando.png` · `11-descanso.png` · `12-transicion.png` · `13-resumen.png` · `14-perfil.png`
- `ilustraciones.png` — lámina con todas las ilustraciones
- `index.html` — galería con todo lo anterior

Para reutilizar un servidor de desarrollo ya arrancado:

```bash
SCREENSHOT_URL=http://localhost:8081 npm run screenshots
```

## Calidad

**Jest** (`src/**/*.test.ts`):

- `domain/`: máquina de estados de la sesión, temporizador, planificación (duración estimada, `createWorkout`, siguiente sesión sugerida), historial («la última vez», mejor serie, volumen), edición y validación de rutinas, fechas.
- `store/`: validación Zod al rehidratar (`sanitizePersisted`); store completo — flujo crear rutina → entrenar → resumen, el historial no cambia al editar la rutina, restauración del descanso desde `endsAt`, cancelación de notificaciones, métricas corporales.
- `data/`, `demo/`, `features/routines/describe`: catálogo (ids únicos, búsqueda sin acentos, filtros), seed demo, escenarios deterministas.
- `illustrations/`: esqueleto (longitudes fijas, vistas lateral/frontal) y registro (todo ejercicio tiene ilustración, fallback genérico).

**E2E** (`e2e/flow.spec.ts`, Playwright sobre la build web):

1. Crear rutina → entrenar solo con HECHO y SALTAR → resumen → aparece «la última vez».
2. Reabrir la app durante un descanso muestra el tiempo restante correcto.

**CI** (`.github/workflows/ci.yml`, en cada push/PR, Node 22): `npm ci` → `lint` → `format:check` → `typecheck` → `npm test -- --ci`. Los E2E no se ejecutan en CI.

## Fuera de alcance (preparado para)

No incluido en v0.1:

- Importación de rutinas desde Excel.
- Backend Supabase y cuentas de usuario.
- Live Activities (iOS) / notificación persistente en Android durante la sesión.
- Panel para entrenadores.

Dónde deja hueco la arquitectura:

- **Dominio puro** (`src/domain/`): sin dependencias de UI ni almacenamiento; reutilizable desde un importador o un backend.
- **Store validado con Zod** y clave versionada `fitness-point/v1` (`persist` con `version: 1`): permite migraciones y sincronizar sin confiar en datos externos.
- **Sesiones como snapshot**: cada entrenamiento copia los datos de la rutina al empezar, así que el historial es inmutable aunque la rutina cambie después — listo para subirse tal cual a un servidor.

## Limitaciones conocidas

- **Reordenar** ejercicios y sesiones se hace con flechas subir/bajar en todas las plataformas; no hay drag & drop.
- Las funciones nativas (notificaciones, vibración, pantalla siempre encendida, sonido) **no se han verificado en un dispositivo físico** en este entorno; solo se ha probado la versión web.
- `npm audit` muestra 5 avisos moderados en dependencias de build del Expo CLI (`glob`/`minimatch`); no forman parte de la app distribuida.
- El store se persiste completo en cada cambio. Suficiente para la demo; más adelante convendría aplicar debounce.
