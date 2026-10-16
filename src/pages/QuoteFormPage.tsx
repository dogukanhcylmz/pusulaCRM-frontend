import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api, type Quote, type QuoteItem } from "../api";
import { formatMoney, useData } from "../utils";
import { Empty, ErrorNote, PageHeader } from "../components/ui";
import DateField from "../components/DateField";
import { useChatPage } from "../chatContext";

const emptyItem = (): QuoteItem => ({ description: "", quantity: 1, unitPrice: 0, discountPercent: 0 });
const lineTotal = (i: QuoteItem) => i.quantity * i.unitPrice * (1 - i.discountPercent / 100);

// Sunucudaki UTC gün, yerel saatte aynı günün gece yarısı olarak
const utcDayToLocal = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export default function QuoteFormPage() {
  const id = Number(useParams().id) || undefined;
  useChatPage(id ? "quote-detail" : "quote-new", { quoteId: id });
  return id ? <EditQuote id={id} /> : <QuoteForm />;
}

function EditQuote({ id }: { id: number }) {
  const { data: quote, error } = useData(() => api.quote(id), [id]);
  const settled = quote && (quote.status === "Accepted" || quote.status === "Rejected");

  if (quote && !settled) return <QuoteForm quote={quote} />;

  return (
    <>
      <Link to={`/quotes/${id}`} className="back-link"><ArrowLeft size={16} /> {quote?.quoteNumber ?? "Teklif"}</Link>
      <ErrorNote message={error} />
      {settled && (
        <>
          <PageHeader title={`Teklifi düzenle — ${quote.quoteNumber}`} />
          <div className="card">
            <Empty>Sonuçlanmış teklif düzenlenemez.</Empty>
          </div>
        </>
      )}
    </>
  );
}

function QuoteForm({ quote }: { quote?: Quote }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const customers = useData(() => api.customers());

  const [customerId, setCustomerId] = useState(quote ? String(quote.customerId) : params.get("customerId") ?? "");
  const [title, setTitle] = useState(quote?.title ?? "");
  const [taxRate, setTaxRate] = useState(quote?.taxRate ?? 20);
  const [validUntil, setValidUntil] = useState<Date | null>(() => {
    if (quote) return utcDayToLocal(quote.validUntil);
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 30);
    return d;
  });
  const [items, setItems] = useState<QuoteItem[]>(() =>
    quote
      ? quote.items.map(({ description, quantity, unitPrice, discountPercent }) => ({ description, quantity, unitPrice, discountPercent }))
      : [emptyItem()]
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Toplamlar anlık hesaplanır; kesin hesap backend'de tekrar yapılır
  const subTotal = items.reduce((s, i) => s + lineTotal(i), 0);
  const tax = subTotal * (taxRate / 100);

  // Süresi geçmiş teklif düzenlenirken mevcut tarih seçilebilir kalsın
  const today = new Date();
  const original = quote && utcDayToLocal(quote.validUntil);
  const minDate = original && original < today ? original : today;

  const updateItem = (index: number, patch: Partial<QuoteItem>) =>
    setItems(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data = {
      title,
      taxRate,
      // Seçilen günün UTC gece yarısı (önceki <input type="date"> ile aynı); boşsa sunucu varsayılanı/mevcut tarihi kullanır
      validUntil: validUntil
        ? new Date(Date.UTC(validUntil.getFullYear(), validUntil.getMonth(), validUntil.getDate())).toISOString()
        : undefined,
      items: items.filter((i) => i.description.trim()),
    };
    try {
      const saved = quote
        ? await api.updateQuote(quote.id, data)
        : await api.createQuote({ ...data, customerId: Number(customerId) });
      navigate(`/quotes/${saved.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <>
      {quote ? (
        <Link to={`/quotes/${quote.id}`} className="back-link"><ArrowLeft size={16} /> {quote.quoteNumber}</Link>
      ) : (
        <Link to="/quotes" className="back-link"><ArrowLeft size={16} /> Teklifler</Link>
      )}
      <PageHeader title={quote ? `Teklifi düzenle — ${quote.quoteNumber}` : "Yeni fiyat teklifi"} />

      <form className="card form" onSubmit={submit}>
        <ErrorNote message={error} />
        <div className="form-row">
          <label>
            Müşteri *
            <select required disabled={!!quote} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
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
              {/* Etiketler yalnız mobilde görünür; masaüstünde sütun başlıkları var */}
              <label className="item-field">
                <span className="item-label">Miktar</span>
                <input type="number" inputMode="decimal" min={0.01} step="any" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
              </label>
              <label className="item-field">
                <span className="item-label">Birim fiyat</span>
                <input type="number" inputMode="decimal" min={0} step="any" value={it.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} />
              </label>
              <label className="item-field">
                <span className="item-label">İskonto %</span>
                <input type="number" inputMode="decimal" min={0} max={100} step="any" value={it.discountPercent} onChange={(e) => updateItem(i, { discountPercent: Number(e.target.value) })} />
              </label>
              <div className="item-field item-total">
                <span className="item-label">Tutar</span>
                <span className="num strong">{formatMoney(lineTotal(it))}</span>
              </div>
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
              <DateField value={validUntil} onChange={setValidUntil} minDate={minDate} />
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
          <button type="submit" className="btn primary" disabled={saving}>{saving ? "Kaydediliyor…" : quote ? "Değişiklikleri kaydet" : "Teklifi oluştur"}</button>
        </div>
      </form>
    </>
  );
}
