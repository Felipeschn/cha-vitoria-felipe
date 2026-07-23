const WHATSAPP_SHARE_URL = "https://wa.me/";

export function buildWhatsAppShareUrl(message: string) {
  const query = new URLSearchParams({ text: message });
  return `${WHATSAPP_SHARE_URL}?${query.toString()}`;
}
