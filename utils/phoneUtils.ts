/**
 * Formats a phone number for WhatsApp wa.me links, specifically handling Egyptian numbers.
 * If the number starts with '01', strips the leading '0' and prepends '20' (e.g. 01033134413 -> 201033134413).
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0020')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('01') && cleaned.length >= 10) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '20' + cleaned;
  }

  return cleaned;
}

/**
 * Returns a fully formed WhatsApp click-to-chat URL with country code and optional pre-filled message.
 */
export function getWhatsAppLink(phone: string, message?: string): string {
  const formatted = formatWhatsAppNumber(phone);
  const base = `https://wa.me/${formatted}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
