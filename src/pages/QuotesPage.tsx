import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { api, type QuoteStatus } from "../api";
import { formatDate, formatMoney, quoteStatusLabel, useData } from "../utils";
import { Empty, ErrorNote, PageHeader } from "../components/ui";
import { QuoteStatusBadge } from "../components/StatusBadges";
import { useChatPage } from "../chatContext";

export default function QuotesPage() {
  useChatPage("quotes");
  const navigate = useNavigate();
  const [status, setStatus] = useState<QuoteStatus | "">("");
  const { data, error } = useData(() => api.quotes(undefined, status || undefined), [status]);
  const total = data?.reduce((s, q) => s + q.grandTotal, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Fiyat Teklifleri"
        subtitle={data ? `${data.length} teklif · ${formatMoney(total)}` : undefined}
        actions={
          <Link to="/quotes/new" className="btn primary">
            <Plus size={16} /> Yeni teklif
          </Link>
        }
      />

      <div className="tabs">
        {(["", "Draft", "Sent", "Accepted", "Rejected"] as const).map((s) => (
          <button key={s} className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
            {s ? quoteStatusLabel[s] : "Tümü"}
          </button>
        ))}
      </div>

      <ErrorNote message={error} />

      <div className="card no-pad">
        {data && data.length === 0 ? (
          <Empty>Bu filtrede teklif yok.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="hide-sm">No</th>
                <th>Başlık</th>
                <th className="hide-sm">Müşteri</th>
                <th>Durum</th>
                <th className="hide-sm">Geçerlilik</th>
                <th className="num">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((q) => (
                <tr key={q.id} className="clickable" onClick={() => navigate(`/quotes/${q.id}`)}>
                  <td className="mono hide-sm">{q.quoteNumber}</td>
                  <td className="strong">
                    {q.title}
                    <div className="mono muted show-sm">{q.quoteNumber}</div>
                  </td>
                  <td className="hide-sm">{q.customerName}</td>
                  <td><QuoteStatusBadge status={q.status} /></td>
                  <td className="hide-sm muted">{formatDate(q.validUntil)}</td>
                  <td className="num strong">{formatMoney(q.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
