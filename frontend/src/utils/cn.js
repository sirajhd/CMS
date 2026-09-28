import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines conditional class names and resolves Tailwind CSS conflicts.
 * Usage: cn('px-4 py-2 bg-blue-600', isActive && 'bg-blue-800', className)
 * 
 * @param {...any} inputs - Class names, expressions, or conditional objects
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;