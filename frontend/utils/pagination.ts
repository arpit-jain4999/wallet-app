/**
 * Pagination utility functions
 */

/**
 * Configuration for pagination display
 */
export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  maxVisible?: number; // default: 7
}

/**
 * Generates an array of page numbers with ellipsis for pagination display
 * 
 * Examples:
 * - getPageNumbers(1, 5) → [1, 2, 3, 4, 5]
 * - getPageNumbers(1, 20) → [1, 2, '...', 20]
 * - getPageNumbers(10, 20) → [1, '...', 9, 10, 11, '...', 20]
 * - getPageNumbers(20, 20) → [1, '...', 18, 19, 20]
 * 
 * @param currentPage - Current active page (1-based)
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum number of page buttons to show (default: 7)
 * @returns Array of page numbers and ellipsis strings
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | string)[] {
  const pages: (number | string)[] = [];

  // If total pages fit within max visible, show all
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Always show first page
  pages.push(1);

  // Show ellipsis if current page is far from start
  if (currentPage > 3) {
    pages.push('...');
  }

  // Calculate range around current page
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  // Add pages around current page
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Show ellipsis if current page is far from end
  if (currentPage < totalPages - 2) {
    pages.push('...');
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
}

/**
 * Calculates the total number of pages based on total items and page size
 * 
 * @param totalItems - Total number of items
 * @param pageSize - Number of items per page
 * @returns Total number of pages
 */
export function calculateTotalPages(totalItems: number, pageSize: number): number {
  return Math.ceil(totalItems / pageSize);
}

/**
 * Validates if a page number is within valid range
 * 
 * @param page - Page number to validate
 * @param totalPages - Total number of pages
 * @returns True if page is valid
 */
export function isValidPage(page: number, totalPages: number): boolean {
  return page >= 1 && page <= totalPages;
}

/**
 * Clamps a page number to valid range
 * 
 * @param page - Page number to clamp
 * @param totalPages - Total number of pages
 * @returns Clamped page number
 */
export function clampPage(page: number, totalPages: number): number {
  return Math.max(1, Math.min(page, totalPages));
}
