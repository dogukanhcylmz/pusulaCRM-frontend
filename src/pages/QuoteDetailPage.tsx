import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Trash2 } from "lucide-react";
import { api, type QuoteStatus } from "../api";
import { formatDate, formatMoney, quoteStatusLabel, useData } from "../utils";
import { ErrorNote, PageHeader } from "../components/ui";
import { QuoteStatusBadge } from "../components/StatusBadges";
import { useChatPage } from "../chatContext";

export default function QuoteDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { data: q, error, reload } = useData(() => api.quote(id), [id]);
  useChatPage("quote-detail", { quoteId: id, label: q ? `${q.quoteNumber} · ${q.customerName}` : undefined });

  async function setStatus(status: QuoteStatus) {
    await api.setQuoteStatus(id, status);
    reload();
  }

  async function remove() {
    if (!confirm("Teklif silinsin mi?")) return;
    await api.deleteQuote(id);
    navigate("/quotes");
  }

  return (
    <>
      <Link to="/quotes" className="back-link no-print"><ArrowLeft size={16} /> Teklifler</Link>
      <ErrorNote message={error} />

      {q && (
        <>
          <PageHeader
            title={q.title}
            subtitle={`${q.quoteNumber} · ${q.customerName}`}
            actions={
              <div className="row no-print">
                <select value={q.status} onChange={(e) => setStatus(e.target.value as QuoteStatus)} aria-label="Durum">
                  {(Object.keys(quoteStatusLabel) as QuoteStatus[]).map((s) => (
                    <option key={s} value={s}>{quoteStatusLabel[s]}</option>
                  ))}
                </select>
                <button className="btn ghost" onClick={() => window.print()}><Printer size={15} /> Yazdır / PDF</button>
                <button className="btn ghost danger" onClick={remove}><Trash2 size={15} /></button>
              </div>
            }
          />

          <div className="card quote-doc">
            <div className="quote-meta">
              <div>
                <div className="muted small">Müşteri</div>
                <Link to={`/customers/${q.customerId}`} className="strong">{q.customerName}</Link>
              </div>
              <div>
                <div className="muted small">Tarih</div>
                <div>{formatDate(q.createdAt)}</div>
              </div>
              <div>
                <div className="muted small">Geçerlilik</div>
                <div>{formatDate(q.validUntil)}</div>
              </div>
              <div>
                <div className="muted small">Durum</div>
                <QuoteStatusBadge status={q.status} />
              </div>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Ürün / hizmet</th>
                  <th className="num">Miktar</th>
                  <th className="num">Birim fiyat</th>
                  <th className="num hide-sm">İskonto</th>
                  <th className="num">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {q.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.description}</td>
                    <td className="num">{i.quantity.toLocaleString("tr-TR")}</td>
                    <td className="num">{formatMoney(i.unitPrice)}</td>
                    <td className="num hide-sm">{i.discountPercent ? `%${i.discountPercent}` : "—"}</td>
                    <td className="num strong">{formatMoney(i.lineTotal ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="totals end">
              <div><span>Ara toplam</span><span>{formatMoney(q.subTotal)}</span></div>
              <div><span>KDV (%{q.taxRate})</span><span>{formatMoney(q.taxAmount)}</span></div>
              <div className="grand"><span>Genel toplam</span><span>{formatMoney(q.grandTotal)}</span></div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
