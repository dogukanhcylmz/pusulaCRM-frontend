import { useEffect, useSyncExternalStore } from "react";
import type { ChatPageContext } from "./api";

// Kullanıcının hangi sayfada olduğunu tutan küçük bir depo.
// Sayfalar useChatPage ile kendini bildirir, asistan useCurrentChatPage ile okur.
// Not: label yalnızca ekranda gösterilir; sunucu kayıt adını id üzerinden kendisi bulur.

export type PageState = ChatPageContext & { label?: string };

let current: PageState = { page: "dashboard" };
const listeners = new Set<() => void>();

function set(next: PageState) {
  current = next;
  listeners.forEach((l) => l());
}

/** Sayfa bileşenleri çağırır: "Şu an bu sayfadayım." */
export function useChatPage(page: string, ids: { customerId?: number; quoteId?: number; label?: string } = {}) {
  const { customerId, quoteId, label } = ids;
  useEffect(() => {
    set({ page, customerId, quoteId, label });
  }, [page, customerId, quoteId, label]);
}

/** Asistan bileşeni çağırır. */
export function useCurrentChatPage() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => current
  );
}
