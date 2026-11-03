import type { ReactNode } from 'react';

import type { Joints, Pose } from './skeleton';

/** Definition of one exercise drawing: start pose (solid), optional end pose (ghost). */
export interface Art {
  start: Pose;
  end?: Pose;
  /** Static scenery (bench, machine, bar). Receives the start pose joints. */
  scene?: (j: Joints) => ReactNode;
  /** Equipment that moves with the figure; drawn for both poses. */
  hold?: (j: Joints) => ReactNode;
  /** Draw the floor line (default true). */
  floor?: boolean;
}
