/** Validation of routines and custom exercises, with user-facing Spanish messages. */
import type { Equipment, MuscleGroup, Routine, SessionExercise } from './types';

export const LIMITS = {
  nameMax: 60,
  setsMax: 20,
  repsMin: 1,
  repsMax: 100,
  weightMax: 500,
  restMaxS: 900,
} as const;

export interface ValidationError {
  /** Dot path to the offending field, e.g. `sessions.0.exercises.1.sets`. */
  path: string;
  message: string;
}

const isInt = (n: number): boolean => Number.isInteger(n);

export function validateSessionExercise(ex: SessionExercise, base = ''): ValidationError[] {
  const errors: ValidationError[] = [];
  const at = (p: string) => (base ? `${base}.${p}` : p);

  if (ex.sets.length === 0) {
    errors.push({ path: at('sets'), message: 'Añade al menos una serie.' });
  } else if (ex.sets.length > LIMITS.setsMax) {
    errors.push({ path: at('sets'), message: `Máximo ${LIMITS.setsMax} series por ejercicio.` });
  }

  ex.sets.forEach((s, i) => {
    const label = `Serie ${i + 1}`;
    if (!isInt(s.reps) || s.reps < LIMITS.repsMin || s.reps > LIMITS.repsMax) {
      errors.push({
        path: at(`sets.${i}.reps`),
        message: `${label}: las repeticiones van de ${LIMITS.repsMin} a ${LIMITS.repsMax}.`,
      });
    }
    if (
      s.repsMax !== undefined &&
      (!isInt(s.repsMax) || s.repsMax <= s.reps || s.repsMax > LIMITS.repsMax)
    ) {
      errors.push({
        path: at(`sets.${i}.repsMax`),
        message: `${label}: el máximo del rango debe ser mayor que el mínimo.`,
      });
    }
    if (s.weightKg !== undefined) {
      if (!Number.isFinite(s.weightKg) || s.weightKg < 0 || s.weightKg > LIMITS.weightMax) {
        errors.push({
          path: at(`sets.${i}.weightKg`),
          message: `${label}: el peso va de 0 a ${LIMITS.weightMax} kg.`,
        });
      } else if (!isInt(s.weightKg * 2)) {
        errors.push({
          path: at(`sets.${i}.weightKg`),
          message: `${label}: el peso va en pasos de 0,5 kg.`,
        });
      }
    }
  });

  const restOk = (n: number) => isInt(n) && n >= 0 && n <= LIMITS.restMaxS;
  if (!restOk(ex.restBetweenSetsS)) {
    errors.push({
      path: at('restBetweenSetsS'),
      message: `El descanso entre series va de 0 a ${LIMITS.restMaxS} s.`,
    });
  }
  if (!restOk(ex.restAfterExerciseS)) {
    errors.push({
      path: at('restAfterExerciseS'),
      message: `El descanso tras el ejercicio va de 0 a ${LIMITS.restMaxS} s.`,
    });
  }
  return errors;
}

export function validateRoutine(r: Routine): ValidationError[] {
  const errors: ValidationError[] = [];
  const name = r.name.trim();
  if (!name) errors.push({ path: 'name', message: 'Ponle un nombre a la rutina.' });
  else if (name.length > LIMITS.nameMax) {
    errors.push({
      path: 'name',
      message: `El nombre no puede superar ${LIMITS.nameMax} caracteres.`,
    });
  }

  if (r.sessions.length === 0) {
    errors.push({ path: 'sessions', message: 'Añade al menos una sesión.' });
  }

  r.sessions.forEach((s, i) => {
    const sName = s.name.trim();
    if (!sName) {
      errors.push({
        path: `sessions.${i}.name`,
        message: `La sesión ${i + 1} necesita un nombre.`,
      });
    } else if (sName.length > LIMITS.nameMax) {
      errors.push({
        path: `sessions.${i}.name`,
        message: `El nombre de la sesión ${i + 1} es demasiado largo.`,
      });
    }
    if (s.exercises.length === 0) {
      errors.push({
        path: `sessions.${i}.exercises`,
        message: `«${sName || `Sesión ${i + 1}`}» necesita al menos un ejercicio.`,
      });
    }
    s.exercises.forEach((ex, j) => {
      errors.push(...validateSessionExercise(ex, `sessions.${i}.exercises.${j}`));
    });
  });
  return errors;
}

export function isValidRoutine(r: Routine): boolean {
  return validateRoutine(r).length === 0;
}

export interface CustomExerciseInput {
  name: string;
  primaryMuscle: MuscleGroup | undefined;
  equipment: Equipment | undefined;
}

export function validateCustomExercise(input: CustomExerciseInput): string[] {
  const errors: string[] = [];
  const name = input.name.trim();
  if (!name) errors.push('Escribe el nombre del ejercicio.');
  else if (name.length > LIMITS.nameMax) errors.push('El nombre es demasiado largo.');
  if (!input.primaryMuscle) errors.push('Elige el grupo muscular.');
  if (!input.equipment) errors.push('Elige el material.');
  return errors;
}
