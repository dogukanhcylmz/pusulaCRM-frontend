import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api, type QuoteItem } from "../api";
import { formatMoney, useData } from "../utils";
import { ErrorNote, PageHeader } from "../components/ui";
import { useChatPage } from "../chatContext";

const emptyItem = (): QuoteItem => ({ description: "", quantity: 1, unitPrice: 0, discountPercent: 0 });
const lineTotal = (i: QuoteItem) => i.quantity * i.unitPrice * (1 - i.discountPercent / 100);

export default function QuoteFormPage() {
  useChatPage("quote-new");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const customers = useData(() => api.customers());

  const [customerId, setCustomerId] = useState(params.get("customerId") ?? "");
  const [title, setTitle] = useState("");
  const [taxRate, setTaxRate] = useState(20);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Toplamlar anlık hesaplanır; kesin hesap backend'de tekrar yapılır
  const subTotal = items.reduce((s, i) => s + lineTotal(i), 0);
  const tax = subTotal * (taxRate / 100);

  const updateItem = (index: number, patch: Partial<QuoteItem>) =>
    setItems(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.createQuote({
        customerId: Number(customerId),
        title,
        taxRate,
        validUntil: new Date(validUntil).toISOString(),
        items: items.filter((i) => i.description.trim()),
      });
      navigate(`/quotes/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <>
      <Link to="/quotes" className="back-link"><ArrowLeft size={16} /> Teklifler</Link>
      <PageHeader title="Yeni fiyat teklifi" />

      <form className="card form" onSubmit={submit}>
        <ErrorNote message={error} />
        <div className="form-row">
          <label>
            Müşteri *
            <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Seçin…</option>
              {customers.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </label>
          <label>
            Başlık *
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Yıllık lisans teklifi" />
          </label>
        </div>

        <div className="items">
          <div className="items-head">
            <span>Ürün / hizmet</span>
            <span>Miktar</span>
            <span>Birim fiyat</span>
            <span>İskonto %</span>
            <span className="num">Tutar</span>
            <span />
          </div>
          {items.map((it, i) => (
            <div className="items-row" key={i}>
              <input placeholder="Açıklama" value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} />
              <input type="number" min={0.01} step="any" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
              <input type="number" min={0} step="any" value={it.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} />
              <input type="number" min={0} max={100} step="any" value={it.discountPercent} onChange={(e) => updateItem(i, { discountPercent: Number(e.target.value) })} />
              <span className="num strong">{formatMoney(lineTotal(it))}</span>
              <button type="button" className="icon-btn" disabled={items.length === 1} onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Kalemi sil">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="btn ghost small" onClick={() => setItems([...items, emptyItem()])}>
            <Plus size={14} /> Kalem ekle
          </button>
        </div>

        <div className="quote-footer">
          <div className="form-row narrow">
            <label>
              KDV %
              <input type="number" min={0} max={100} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
            </label>
            <label>
              Geçerlilik tarihi
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </label>
          </div>
          <div className="totals">
            <div><span>Ara toplam</span><span>{formatMoney(subTotal)}</span></div>
            <div><span>KDV (%{taxRate})</span><span>{formatMoney(tax)}</span></div>
            <div className="grand"><span>Genel toplam</span><span>{formatMoney(subTotal + tax)}</span></div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Vazgeç</button>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? "Kaydediliyor…" : "Teklifi oluştur"}</button>
        </div>
      </form>
    </>
  );
}
