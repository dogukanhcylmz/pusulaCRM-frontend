import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle, Bot, CheckCircle2, Maximize2, MessageCircle, Minimize2, Send, ShieldCheck, Sparkles, Trash2, X, XCircle,
} from "lucide-react";
import { api, type ChatMessage, type PendingAction } from "../api";
import { notifyDataChanged } from "../utils";
import { useCurrentChatPage } from "../chatContext";
import RichText from "./RichText";

type PendingState = "waiting" | "busy" | "confirmed" | "cancelled" | "expired";

interface UiMessage {
  role: "user" | "assistant";
  kind: "text" | "pending" | "result" | "error" | "welcome";
  content: string;
  pending?: PendingAction;
  state?: PendingState;
  ok?: boolean;
}

const WELCOME: UiMessage = {
  role: "assistant",
  kind: "welcome",
  content:
    "Merhaba! Müşteri arayabilir, aktivite ve not ekleyebilir, teklif hazırlayabilir ve raporlarınızı özetleyebilirim. Kayıtlarda bir değişiklik yapmadan önce her zaman onayınızı alırım.",
};

const GENERAL_SUGGESTIONS = [
  "Bugünkü özetim ne?",
  "Bu ayın satış raporunu çıkar",
  "Ege için yarın 14:00'te toplantı ekle",
  "Başkent Yazılım'a 10 adet lisans, tanesi 2.500 TL teklif hazırla",
];

const CUSTOMER_SUGGESTIONS = [
  "Bu müşterinin özetini çıkar",
  "Bu müşteriye takip e-postası taslağı yaz",
  "Bu müşteri için yarın 10:00'da arama görevi ekle",
];

/**
 * Sağ alt köşedeki yüzen buton. Tıklanınca sohbet penceresi açılır; büyüt düğmesiyle genişler.
 * Asistan bir kayıt değişikliği önerdiğinde onay kartı gösterilir; kullanıcı onaylamadan hiçbir şey yazılmaz.
 */
export default function ChatWidget() {
  const page = useCurrentChatPage();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const onCustomerPage = page.customerId !== undefined;
  const suggestions = onCustomerPage ? CUSTOMER_SUGGESTIONS : GENERAL_SUGGESTIONS;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /** Modele gönderilecek sohbet geçmişi: onay kartları ve sonuçları da metin olarak eklenir. */
  function toHistory(list: UiMessage[]): ChatMessage[] {
    return list
      .filter((m) => m.kind !== "welcome" && m.kind !== "error")
      .map((m) => ({
        role: m.role,
        content:
          m.kind === "pending"
            ? `[Onaya sunulan işlem] ${m.pending!.summary}${m.state === "expired" ? " (Kullanıcı onaylamadan yeni mesaj yazdı; işlem yapılmadı.)" : ""}`
            : m.content,
      }))
      .filter((m) => m.content.trim());
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    // Cevaplanmamış onay kartı varsa geçersiz say (sunucuda da iptal et)
    const expired = messages.map((m) => {
      if (m.kind === "pending" && m.state === "waiting") {
        api.cancelAction(m.pending!.id).catch(() => undefined);
        return { ...m, state: "expired" as const };
      }
      return m;
    });

    const next: UiMessage[] = [...expired, { role: "user", kind: "text", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await api.chat(toHistory(next), { page: page.page, customerId: page.customerId, quoteId: page.quoteId });
      setAiEnabled(res.aiEnabled);
      const add: UiMessage[] = [];
      if (res.reply) add.push({ role: "assistant", kind: "text", content: res.reply });
      if (res.pending) add.push({ role: "assistant", kind: "pending", content: "", pending: res.pending, state: "waiting" });
      setMessages((m) => [...m, ...add]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", kind: "error", content: `Bir sorun oluştu: ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function decide(index: number, confirm: boolean) {
    const target = messages[index];
    if (!target?.pending || target.state !== "waiting") return;

    const setState = (state: PendingState) =>
      setMessages((list) => list.map((m, i) => (i === index ? { ...m, state } : m)));

    setState("busy");
    try {
      const res = confirm ? await api.confirmAction(target.pending.id) : await api.cancelAction(target.pending.id);
      setState(confirm && res.ok ? "confirmed" : confirm ? "expired" : "cancelled");
      setMessages((list) => [...list, { role: "assistant", kind: "result", content: res.message, ok: res.ok && confirm }]);
      if (confirm && res.ok) notifyDataChanged(); // açık sayfalar kendini yeniler
    } catch (e) {
      setState("waiting");
      setMessages((list) => [...list, { role: "assistant", kind: "error", content: `İşlem gönderilemedi: ${(e as Error).message}` }]);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      {open && (
        <section className={`chat-panel ${expanded ? "expanded" : ""}`} aria-label="digitestCRM asistanı">
          <header className="chat-header">
            <div className="chat-title">
              <div className="chat-avatar"><Sparkles size={16} /></div>
              <div>
                <strong>digitestCRM Asistanı</strong>
                <span>{aiEnabled === false ? "Basit mod" : "Yapay zeka destekli"}</span>
              </div>
            </div>
            <div className="row gap-xs">
              <button className="icon-btn light" title="Sohbeti temizle" onClick={() => setMessages([WELCOME])}>
                <Trash2 size={16} />
              </button>
              <button className="icon-btn light" title={expanded ? "Küçült" : "Büyüt"} onClick={() => setExpanded((v) => !v)}>
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button className="icon-btn light" title="Kapat" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </header>

          {page.label && (
            <div className="chat-context" title="Asistan bu kaydı bağlam olarak kullanır">
              Bağlam: <strong>{page.label}</strong>
            </div>
          )}

          <div className="chat-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role} ${m.kind}`}>
                {m.role === "assistant" && <div className="msg-icon"><Bot size={14} /></div>}
                <div className="msg-body">
                  {m.kind === "pending" && m.pending ? (
                    <ConfirmCard action={m.pending} state={m.state!} onDecide={(ok) => decide(i, ok)} />
                  ) : m.kind === "result" ? (
                    <div className={`result-chip ${m.ok ? "ok" : "neutral"}`}>
                      {m.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {m.content}
                    </div>
                  ) : (
                    <div className="bubble">{m.role === "assistant" ? <RichText text={m.content} /> : m.content}</div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="msg assistant">
                <div className="msg-icon"><Bot size={14} /></div>
                <div className="bubble typing"><span /><span /><span /></div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="suggestions">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>

          <form className="chat-input" onSubmit={onSubmit}>
            <textarea
              ref={inputRef}
              rows={1}
              maxLength={2000}
              placeholder="Bir şey sorun veya isteyin…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button type="submit" className="send-btn" disabled={loading || !input.trim()} aria-label="Gönder">
              <Send size={16} />
            </button>
          </form>
        </section>
      )}

      <button className={`chat-fab ${open ? "hidden" : ""}`} onClick={() => setOpen(true)} aria-label="Asistanı aç">
        <MessageCircle size={24} />
      </button>
    </>
  );
}

function ConfirmCard({ action, state, onDecide }: { action: PendingAction; state: PendingState; onDecide: (ok: boolean) => void }) {
  const done = state !== "waiting" && state !== "busy";
  const statusText: Partial<Record<PendingState, string>> = {
    confirmed: "Onaylandı",
    cancelled: "Vazgeçildi",
    expired: "Geçersiz",
  };

  return (
    <div className={`confirm-card ${action.danger ? "danger" : ""} ${done ? "done" : ""}`}>
      <div className="confirm-title">
        {action.danger ? <AlertTriangle size={15} /> : <ShieldCheck size={15} />}
        <span>{action.title}</span>
        {done && <em>{statusText[state]}</em>}
      </div>
      <p>{action.summary}</p>
      {action.details.length > 0 && (
        <ul>
          {action.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
      {!done && (
        <div className="confirm-actions">
          <button className="btn small ghost" disabled={state === "busy"} onClick={() => onDecide(false)}>Vazgeç</button>
          <button className={`btn small ${action.danger ? "danger-solid" : "primary"}`} disabled={state === "busy"} onClick={() => onDecide(true)}>
            {state === "busy" ? "İşleniyor…" : action.danger ? "Evet, sil" : "Onayla"}
          </button>
        </div>
      )}
    </div>
  );
}
