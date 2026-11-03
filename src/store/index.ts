import { buildScenario, scenarioFromLocation } from '@/demo/scenarios';
import { now } from '@/services/clock';

import { asyncStorage, createAppStore, memoryStorage, useHydration } from './appStore';

export const demoScenario = scenarioFromLocation();

/** The single app store. In demo mode it uses in-memory storage seeded with the scenario. */
export const useApp = createAppStore(demoScenario ? memoryStorage() : asyncStorage);

if (demoScenario) {
  useApp.getState().replaceAll(buildScenario(demoScenario, now()));
  useHydration.setState({ hydrated: true });
}

export { useHydration };
export type { AppState } from './appStore';
