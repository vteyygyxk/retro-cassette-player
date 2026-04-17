/**
 * Time formatting utility functions
 */

/**
 * Format time in seconds to MM:SS format
 * 
 * @param seconds - Time in seconds
 * @returns Formatted time string (MM:SS)
 */
export function formatTime(seconds: number): string {
  // Handle invalid or negative values
  if (!isFinite(seconds) || seconds < 0) {
    return '--:--';
  }
  
  // Calculate minutes and seconds
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  // Format with leading zeros
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
}
