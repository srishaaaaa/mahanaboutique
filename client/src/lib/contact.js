// Contact helpers. Everything is derived from the store settings (Admin → Store settings), so one edit updates the whole site.
export const digits = p => (p || '').replace(/\D/g, '');
export const telLink = p => (p ? `tel:${p.replace(/[^+\d]/g, '')}` : null);
// 8-digit Singapore numbers get the 65 country code for WhatsApp; numbers already written with a country code are used as-is.
export const waLink = (phone, text = '') => {
  const d = digits(phone); if (!d) return null;
  return `https://wa.me/${d.length === 8 ? '65' + d : d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
