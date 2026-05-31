import { clearShield } from '@/services/focusControl';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type ClearShieldStatus = {
  ok: boolean;
  result: string;
  attempts: number;
};

export async function clearShieldWithRetry(): Promise<ClearShieldStatus> {
  let lastResult = 'unknown';
  const maxAttempts = 3;
  const timeoutMs = 2500;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    try {
      const result = await Promise.race<string>([
        clearShield(),
        new Promise<string>((_, reject) => {
          timeout = setTimeout(() => {
            reject(new Error(`clearShield timeout after ${timeoutMs}ms`));
          }, timeoutMs);
        }),
      ]);
      lastResult = result;

      if (result === 'cleared') {
        return { ok: true, result, attempts: attempt };
      }
    } catch (err) {
      lastResult = err instanceof Error ? err.message : JSON.stringify(err);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }

    if (attempt < maxAttempts) {
      await sleep(300);
    }
  }

  return { ok: false, result: lastResult, attempts: maxAttempts };
}
