/**
 * Per-user sliding-window limit on conversions, which are the expensive
 * requests (OCR + model). Kept in memory per instance: approximate across a
 * scaled-out Cloud Run service, which is acceptable for cost protection.
 */
export class ConversionLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Records a conversion and returns false when the user is over the limit. */
  tryConsume(uid: string): boolean {
    const now = this.now();
    const recent = (this.hits.get(uid) ?? []).filter((time) => now - time < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(uid, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(uid, recent);
    this.prune(now);
    return true;
  }

  private prune(now: number): void {
    if (this.hits.size < 5_000) return;
    for (const [uid, times] of this.hits) {
      if (times.every((time) => now - time >= this.windowMs)) this.hits.delete(uid);
    }
  }
}
