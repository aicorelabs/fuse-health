// Per-workflow concurrency slotter. In-process only — assumes a single
// Node instance owns scheduling. Multi-instance deployments would need a
// shared queue (Redis, Postgres advisory lock, etc.).

type SlotState = {
  max: number;
  running: number;
  queue: Array<() => void>;
};

const slots = new Map<string, SlotState>();

export function configureSlots(workflowId: string, max: number): void {
  const existing = slots.get(workflowId);
  if (existing) {
    existing.max = max;
    drain(existing);
    return;
  }
  slots.set(workflowId, { max, running: 0, queue: [] });
}

export async function acquireSlot(
  workflowId: string,
  max: number,
): Promise<void> {
  let state = slots.get(workflowId);
  if (!state) {
    state = { max, running: 0, queue: [] };
    slots.set(workflowId, state);
  } else {
    state.max = max;
  }

  if (state.running < state.max) {
    state.running += 1;
    return;
  }

  await new Promise<void>((resolve) => {
    state!.queue.push(resolve);
  });
  // running was already incremented inside drain() before our resolver fired.
}

export function releaseSlot(workflowId: string): void {
  const state = slots.get(workflowId);
  if (!state) return;
  state.running = Math.max(0, state.running - 1);
  drain(state);
}

function drain(state: SlotState): void {
  while (state.running < state.max && state.queue.length > 0) {
    const next = state.queue.shift();
    if (!next) break;
    state.running += 1;
    next();
  }
}
