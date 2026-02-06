import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return '0';
  const hrs = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  const paddedSec = sec.toString().padStart(2, '0');
  //  More than 1 hour: H:MM:SS
  if (hrs > 0) {
    const paddedMin = min.toString().padStart(2, '0');
    return `${hrs}:${paddedMin}:${paddedSec}`;
  }

  //  More than 1 minute: M:SS
  if (min > 0) {
    return `${min}:${paddedSec}`;
  }

  //  Seconds only: S
  return `${sec}`;
}
