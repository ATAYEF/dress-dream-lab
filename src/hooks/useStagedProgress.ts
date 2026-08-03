import { useEffect, useState } from 'react';

export interface ProgressStage {
  id: string;
  label: string;
  /** Approximate dwell time in ms before advancing (unless still active) */
  durationMs: number;
}

/** Default stages for AI outfit suggestion */
export const OUTFIT_SUGGESTION_STAGES: ProgressStage[] = [
  { id: 'analyze', label: 'در حال تحلیل لباس‌ها…', durationMs: 2200 },
  { id: 'arrange', label: 'در حال چیدمان ست…', durationMs: 2800 },
  { id: 'render', label: 'در حال ساخت پیشنهاد…', durationMs: 4500 },
];

/** Default stages for virtual try-on image generation */
export const TRYON_RENDER_STAGES: ProgressStage[] = [
  { id: 'analyze', label: 'در حال تحلیل لباس‌ها…', durationMs: 2000 },
  { id: 'arrange', label: 'در حال چیدمان روی مانکن…', durationMs: 2800 },
  { id: 'render', label: 'در حال رندر تصویر…', durationMs: 6000 },
];

/**
 * Cycles through stages while `active` is true.
 * Stays on the last stage until `active` becomes false.
 */
export function useStagedProgress(
  active: boolean,
  stages: ProgressStage[] = OUTFIT_SUGGESTION_STAGES
): { stageIndex: number; stage: ProgressStage; progress: number } {
  const [stageIndex, setStageIndex] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) {
      setStageIndex(0);
      setTick(0);
      return;
    }

    setStageIndex(0);
    setTick(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    for (let i = 0; i < stages.length - 1; i++) {
      elapsed += stages[i].durationMs;
      const next = i + 1;
      timers.push(setTimeout(() => setStageIndex(next), elapsed));
    }

    const interval = setInterval(() => setTick((t) => t + 1), 200);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [active, stages]);

  const stage = stages[Math.min(stageIndex, stages.length - 1)];
  const n = stages.length;
  // Base progress by completed stages + intra-stage creep (caps before 100%)
  const base = stageIndex / n;
  const slice = 1 / n;
  const intra = Math.min(0.85, (tick % 40) / 40) * slice * 0.9;
  const progress = active ? Math.min(0.94, base + intra + slice * 0.15) : 0;

  return { stageIndex, stage, progress };
}
