import { useEffect, useSyncExternalStore } from "react";
import type { ChatPageContext } from "./api";

// Kullanıcının hangi sayfada olduğunu tutuyo 

export type PageState = ChatPageContext & { label?: string };

let current: PageState = { page: "dashboard" };
const listeners = new Set<() => void>();

function set(next: PageState) {
  current = next;
  listeners.forEach((l) => l());
}

/** Şu an bu sayfadayın */
export function useChatPage(page: string, ids: { customerId?: number; quoteId?: number; label?: string } = {}) {
  const { customerId, quoteId, label } = ids;
  useEffect(() => {
    set({ page, customerId, quoteId, label });
  }, [page, customerId, quoteId, label]);
}

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
