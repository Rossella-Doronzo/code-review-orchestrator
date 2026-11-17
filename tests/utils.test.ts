import { describe, it, expect, vi } from 'vitest';
import {
  withRetry,
  withTimeout,
  RateLimiter,
  ReviewError,
  ErrorCodes,
} from '../src/utils/index.js';

describe('withRetry', () => {
  it('returns the result when the function succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(fn, 3, 1)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries after a failure and then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue('ok');
    await expect(withRetry(fn, 3, 1)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws RETRY_EXHAUSTED when every attempt fails', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(withRetry(fn, 2, 1)).rejects.toMatchObject({
      code: ErrorCodes.RETRY_EXHAUSTED,
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('withTimeout', () => {
  it('returns the result when the function finishes in time', async () => {
    await expect(withTimeout(async () => 'done', 100)).resolves.toBe('done');
  });

  it('rejects with AGENT_TIMEOUT when the function is too slow', async () => {
    const slow = () => new Promise<string>((resolve) => setTimeout(() => resolve('late'), 200));
    const promise = withTimeout(slow, 20, 'too slow');
    await expect(promise).rejects.toBeInstanceOf(ReviewError);
    await expect(promise).rejects.toMatchObject({ code: ErrorCodes.AGENT_TIMEOUT });
  });
});

describe('RateLimiter', () => {
  it('allows a request when under the limits', () => {
    const limiter = new RateLimiter({ maxConcurrent: 2, maxRequestsPerMinute: 10 });
    expect(limiter.canProceed(100)).toBe(true);
  });

  it('blocks when the concurrent limit is reached', async () => {
    const limiter = new RateLimiter({ maxConcurrent: 1 });
    await limiter.acquire(100);
    expect(limiter.canProceed(100)).toBe(false);
    limiter.release();
    expect(limiter.canProceed(100)).toBe(true);
  });

  it('blocks when the requests-per-minute limit is reached', async () => {
    const limiter = new RateLimiter({ maxRequestsPerMinute: 1, maxConcurrent: 5 });
    await limiter.acquire(100);
    limiter.release();
    expect(limiter.canProceed(100)).toBe(false);
  });
});