type IntParseOptions = {
  min?: number;
  max?: number;
};

export const parseIntQuery = (
  value: unknown,
  fallback?: number,
  options?: IntParseOptions
): number | undefined => {
  if (typeof value !== 'string') return fallback;
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  let result = parsed;
  if (options?.min !== undefined) result = Math.max(options.min, result);
  if (options?.max !== undefined) result = Math.min(options.max, result);
  return result;
};

export const parseNumberQuery = (value: unknown, fallback?: number): number | undefined => {
  if (typeof value !== 'string') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

export const parseBooleanQuery = (value: unknown, fallback?: boolean): boolean | undefined => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return fallback;
};
