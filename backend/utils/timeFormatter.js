/**
 * Format time remaining in human-readable format
 * @param {number} milliseconds
 * @returns {string}
 */
function formatTimeRemaining(milliseconds) {
  if (milliseconds <= 0) return 'Available now';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}

module.exports = {
  formatTimeRemaining,
};
