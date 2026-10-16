import { useEffect, useState, useCallback, useRef } from "react";
import type { ActivityType, CustomerStatus, QuoteStatus } from "./api";

// ---------- Biçimlendirme ----------
const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
export const formatMoney = (v: number) => money.format(v);

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Tarihsiz";

// ---------- Türkçe etiketler ----------
export const customerStatusLabel: Record<CustomerStatus, string> = {
  Lead: "Potansiyel",
  Active: "Aktif",
  Passive: "Pasif",
};
export const activityTypeLabel: Record<ActivityType, string> = {
  Call: "Arama",
  Meeting: "Toplantı",
  Email: "E-posta",
  Task: "Görev",
  Note: "Not",
};
export const quoteStatusLabel: Record<QuoteStatus, string> = {
  Draft: "Taslak",
  Sent: "Gönderildi",
  Accepted: "Kabul edildi",
  Rejected: "Reddedildi",
};

// ---------- Chatbot bir kayıt değiştirince sayfaları yenilemek için ----------
const EVENT = "crm:changed";
export const notifyDataChanged = () => window.dispatchEvent(new Event(EVENT));

/** Veriyi yükler; chatbot bir değişiklik yaptığında otomatik yeniden yükler. */
export function useData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Yalnızca en son isteğin cevabı işlenir; geç gelen eski cevap yenisini ezmez
  const lastRequest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);

  const reload = useCallback(() => {
    const requestId = ++lastRequest.current;
    const isLatest = () => requestId === lastRequest.current;
    setLoading(true);
    load()
      .then((d) => {
        if (!isLatest()) return;
        setData(d);
        setError(null);
      })
      .catch((e: Error) => isLatest() && setError(e.message))
      .finally(() => isLatest() && setLoading(false));
  }, [load]);

  useEffect(() => {
    reload();
    window.addEventListener(EVENT, reload);
    return () => window.removeEventListener(EVENT, reload);
  }, [reload]);

  return { data, error, loading, reload };
}
