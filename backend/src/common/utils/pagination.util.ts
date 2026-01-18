export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  items: T[];
  skip: number;
  limit: number;
  total: number;
}

export function normalizePagination(
  skip?: number,
  limit?: number,
): { skip: number; limit: number } {
  const normalizedSkip = Math.max(0, skip || 0);
  const normalizedLimit = Math.min(100, Math.max(1, limit || 10));
  return { skip: normalizedSkip, limit: normalizedLimit };
}
