import { z } from 'zod';

export const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;

/**
 * Normalizes input by stripping spaces, dashes, parentheses and converting
 * international Egyptian prefixes (+20, 0020, 20) to the standard 01 format.
 */
export function normalizeEgyptianPhone(input: string): string {
  if (!input) return '';
  let clean = input.replace(/[\s\-\(\)\.]/g, '');
  if (clean.startsWith('+20')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('0020')) {
    clean = '0' + clean.slice(4);
  } else if (clean.startsWith('20') && clean.length === 12) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

/**
 * Reusable Zod schema for Egyptian phone numbers (11 digits starting with 01)
 */
export const egyptianPhoneSchema = z
  .string()
  .min(1, 'يرجى إدخال رقم الهاتف')
  .transform((val) => normalizeEgyptianPhone(val))
  .refine((val) => EGYPT_PHONE_REGEX.test(val), {
    message: 'رقم الهاتف يجب أن يتكون من 11 رقماً ويبدأ بـ 01 (مثل: 01012345678)',
  });

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Helper function to validate phone inputs against the 11-digit Egyptian phone rule
 */
export function validateEgyptianPhone(phone: string): PhoneValidationResult {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      normalized: '',
      error: 'يرجى إدخال رقم الهاتف للتواصل',
    };
  }

  const result = egyptianPhoneSchema.safeParse(phone);
  if (!result.success) {
    return {
      isValid: false,
      normalized: normalizeEgyptianPhone(phone),
      error: (result.error as any).issues?.[0]?.message || (result.error as any).errors?.[0]?.message || 'رقم الهاتف يجب أن يتكون من 11 رقماً ويبدأ بـ 01 (مثل: 01012345678)',
    };
  }

  return {
    isValid: true,
    normalized: result.data,
  };
}

/**
 * Reusable Zod schema for user registration with matching password validation
 */
export const registrationAuthSchema = z
  .object({
    email: z.string().email('يرجى إدخال بريد إلكتروني صالح'),
    phone: egyptianPhoneSchema,
    whatsapp: egyptianPhoneSchema,
    password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
    confirmPassword: z.string().min(6, 'يرجى تأكيد كلمة المرور'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين',
    path: ['confirmPassword'],
  });
