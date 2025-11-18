/**
 * Wraps a promise with a timeout. If the promise does not resolve within the specified time,
 * it rejects with a timeout error.
 * @param {Promise<any>} promise - The promise to wrap.
 * @param {number} [timeoutMs=2000] - The timeout duration in milliseconds.
 * @returns {Promise<any>} A promise that resolves with the original promise's result or rejects on timeout.
 */
async function withDbTimeout(promise, timeoutMs = 2000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Database operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

module.exports = {
  withDbTimeout,
};
