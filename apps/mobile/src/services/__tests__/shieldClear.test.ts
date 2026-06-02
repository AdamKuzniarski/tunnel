import { clearShield } from '@/services/focusControl';

import { clearShieldWithRetry } from '../shieldClear';

jest.mock('@/services/focusControl', () => ({
  clearShield: jest.fn(),
}));

const mockClearShield = jest.mocked(clearShield);

const retryDelayMs = 300;
const timeoutMs = 2_500;

async function advanceRetryDelay() {
  await jest.advanceTimersByTimeAsync(retryDelayMs);
}

async function advanceAttemptTimeout() {
  await jest.advanceTimersByTimeAsync(timeoutMs);
}

describe('clearShieldWithRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns success when the shield clears on the first attempt', async () => {
    mockClearShield.mockResolvedValue('cleared');

    await expect(clearShieldWithRetry()).resolves.toEqual({
      ok: true,
      result: 'cleared',
      attempts: 1,
    });

    expect(mockClearShield).toHaveBeenCalledTimes(1);
  });

  it('returns success after retrying a non-cleared native result', async () => {
    mockClearShield.mockResolvedValueOnce('unsupported').mockResolvedValueOnce('cleared');

    const result = clearShieldWithRetry();
    await advanceRetryDelay();

    await expect(result).resolves.toEqual({
      ok: true,
      result: 'cleared',
      attempts: 2,
    });
    expect(mockClearShield).toHaveBeenCalledTimes(2);
  });

  it('retries non-cleared native results up to the maximum attempt count', async () => {
    mockClearShield
      .mockResolvedValueOnce('unsupported')
      .mockResolvedValueOnce('noSelection')
      .mockResolvedValueOnce('unsupported');

    const result = clearShieldWithRetry();
    await advanceRetryDelay();
    await advanceRetryDelay();

    await expect(result).resolves.toEqual({
      ok: false,
      result: 'unsupported',
      attempts: 3,
    });
    expect(mockClearShield).toHaveBeenCalledTimes(3);
  });

  it('returns failed status with the last native rejection message', async () => {
    mockClearShield
      .mockRejectedValueOnce(new Error('first clear failed'))
      .mockRejectedValueOnce(new Error('second clear failed'))
      .mockRejectedValueOnce(new Error('native clear failed'));

    const result = clearShieldWithRetry();
    await advanceRetryDelay();
    await advanceRetryDelay();

    await expect(result).resolves.toEqual({
      ok: false,
      result: 'native clear failed',
      attempts: 3,
    });
    expect(mockClearShield).toHaveBeenCalledTimes(3);
  });

  it('times out deterministically without waiting in real time', async () => {
    mockClearShield.mockImplementation(() => new Promise(() => undefined));

    const result = clearShieldWithRetry();
    await advanceAttemptTimeout();
    await advanceRetryDelay();
    await advanceAttemptTimeout();
    await advanceRetryDelay();
    await advanceAttemptTimeout();

    await expect(result).resolves.toEqual({
      ok: false,
      result: `clearShield timeout after ${timeoutMs}ms`,
      attempts: 3,
    });
    expect(mockClearShield).toHaveBeenCalledTimes(3);
  });
});
