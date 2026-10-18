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

// Chatbot bir kayıt değiştirince sayfaları yenilemek için --- useDATA LAR DİNLİYOR
// chatle bir aktivite eklediğimde açık müşteri sayfası güncelleneck
const EVENT = "crm:changed";
export const notifyDataChanged = () => window.dispatchEvent(new Event(EVENT));

export function useData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRequest = useRef(0);

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
