const REFERRAL_STORAGE_KEY = 'tripuz_referral';
const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 kun (30 days)

export interface StoredReferral {
  code: string;
  expiresAt: number;
}

/**
 * URL query parametrida ?ref=... bo'lsa, uni o'qib localStorage'ga 30 kunlik muddat bilan saqlaydi.
 * Yangi referral kelsa, eskisining o'rnini bosadi (last touch).
 */
export function captureReferralFromUrl(searchQuery?: string): void {
  try {
    if (typeof window === 'undefined') return;
    const search = searchQuery !== undefined ? searchQuery : window.location.search;
    const params = new URLSearchParams(search);
    const ref = params.get('ref');
    if (ref && ref.trim()) {
      const expiresAt = Date.now() + REFERRAL_TTL_MS;
      localStorage.setItem(
        REFERRAL_STORAGE_KEY,
        JSON.stringify({ code: ref.trim(), expiresAt })
      );
    }
  } catch (err) {
    console.error('Referral kodni saqlashda xatolik:', err);
  }
}

/**
 * localStorage'dan faol (muddati o'tmagan) referral kodni qaytaradi.
 * Agar muddati o'tgan bo'lsa, localStorage'dan o'chirib null qaytaradi.
 */
export function getActiveReferral(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!raw) return null;

    const parsed: StoredReferral = JSON.parse(raw);
    if (!parsed || !parsed.code) {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }

    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }

    return parsed.code;
  } catch {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    return null;
  }
}
