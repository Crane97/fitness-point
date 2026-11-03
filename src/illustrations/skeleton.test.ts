import { LIMB, muscleBands, solve } from './skeleton';

const close = (a: readonly number[], b: readonly number[]) => {
  expect(a[0]).toBeCloseTo(b[0]!, 5);
  expect(a[1]).toBeCloseTo(b[1]!, 5);
};

describe('skeleton', () => {
  const standing = solve({ hip: [60, 63], torso: -90, arm: [90, 90], leg: [90, 90] });

  it('builds a standing figure with fixed limb lengths', () => {
    close(standing.neck, [60, 63 - LIMB.torso]);
    close(standing.elbow, [60, 63 - LIMB.torso + LIMB.shoulderDrop + LIMB.upperArm]);
    close(standing.ankle, [60, 63 + LIMB.thigh + LIMB.shin]);
    close(standing.toe, [60 + LIMB.foot, 63 + LIMB.thigh + LIMB.shin]);
  });

  it('places front muscles on the side the figure faces', () => {
    const [chest] = muscleBands(standing, 'pecho');
    const [back] = muscleBands(standing, 'espalda');
    expect(chest!.a[0]).toBeGreaterThan(60);
    expect(back!.a[0]).toBeLessThan(60);

    const mirrored = solve({ hip: [60, 63], torso: -90, arm: [90, 90], leg: [90, 90], facing: -1 });
    expect(muscleBands(mirrored, 'pecho')[0]!.a[0]).toBeLessThan(60);
  });

  it('spreads shoulders and hips in front view and highlights both sides', () => {
    const front = solve({ view: 'front', hip: [60, 63], torso: -90, arm: [90, 90], leg: [90, 90] });
    expect(front.shoulder[0] - front.shoulder2[0]).toBeCloseTo(LIMB.shoulderSpread * 2);
    expect(muscleBands(front, 'biceps')).toHaveLength(2);
  });
});
