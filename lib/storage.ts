import { supabase } from '@/utils/supabaseClient';

/**
 * Private buckets return a 400 for public URLs, so rows must store the object
 * path (`<bucket>/<path>`) and readers must exchange it for a signed URL.
 * Absolute URLs are still accepted because legacy rows and provider-supplied
 * links point at external hosts.
 */
export function parseStoredFile(value?: string | null): { bucket: string; path: string } | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return null;

  const separator = trimmed.indexOf('/');
  if (separator <= 0 || separator === trimmed.length - 1) return null;

  return { bucket: trimmed.slice(0, separator), path: trimmed.slice(separator + 1) };
}

export async function resolveStoredFileUrl(
  value?: string | null,
  expiresIn = 3600
): Promise<string | null> {
  if (!value) return null;

  const stored = parseStoredFile(value);
  if (!stored) return value.trim();

  const { data, error } = await supabase.storage
    .from(stored.bucket)
    .createSignedUrl(stored.path, expiresIn);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function resolveStoredFileUrls<T extends object>(
  rows: T[],
  fields: (keyof T)[],
  expiresIn = 3600
): Promise<T[]> {
  return Promise.all(
    rows.map(async (row) => {
      const source = row as Record<string, unknown>;
      const next: Record<string, unknown> = { ...source };

      await Promise.all(
        fields.map(async (field) => {
          const key = field as string;
          if (typeof source[key] !== 'string') return;
          const resolved = await resolveStoredFileUrl(source[key] as string, expiresIn);
          if (resolved) next[key] = resolved;
        })
      );

      return next as T;
    })
  );
}
