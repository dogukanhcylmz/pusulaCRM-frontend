import { useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    // Açık bir takvim Esc'i kendisi işlerse (defaultPrevented) modal kapanmaz
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !e.defaultPrevented && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function ErrorNote({ message }: { message: string | null }) {
  return message ? <div className="error-note">{message}</div> : null;
}

export function Pagination({
  page,
  totalPages,
  disabled,
  onChange,
}: {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="pagination" aria-label="Sayfalama">
      <button className="btn small" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={15} /> Önceki
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={`btn small page-num${p === page ? " active" : ""}`}
          disabled={disabled}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button className="btn small" disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>
        Sonraki <ChevronRight size={15} />
      </button>
    </nav>
  );
}
