import { type JSX, lazy } from 'react';

const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 250,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
};

export const lazyWithRetry = <T extends { default: () => JSX.Element }>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 250,
) => {
  return lazy(() => retry(importFn, retries, delay));
};
