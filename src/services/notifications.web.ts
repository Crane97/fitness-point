/** Web: no local notifications (the countdown is visible on screen). */
export async function scheduleRestEnd(_endsAt: number, _body: string): Promise<string | null> {
  return null;
}

export async function cancelRestEnd(_id: string | null): Promise<void> {}
