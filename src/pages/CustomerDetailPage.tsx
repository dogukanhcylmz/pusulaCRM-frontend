import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Pencil, Phone, Plus, Trash2, User } from "lucide-react";
import { api, type ActivityType } from "../api";
import { activityTypeLabel, formatDate, formatDateTime, formatMoney, useData } from "../utils";
import DateField from "../components/DateField";
import { Empty, ErrorNote, Modal, PageHeader } from "../components/ui";
import { CustomerStatusBadge, QuoteStatusBadge } from "../components/StatusBadges";
import CustomerForm from "../components/CustomerForm";
import { useChatPage } from "../chatContext";

export default function CustomerDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [addingActivity, setAddingActivity] = useState(false);

  const customer = useData(() => api.customer(id), [id]);
  const activities = useData(() => api.activities(id), [id]);
  const quotes = useData(() => api.quotes(id), [id]);
  const c = customer.data;
  useChatPage("customer-detail", { customerId: id, label: c?.companyName });

  async function remove() {
    if (!confirm("Müşteri ve tüm kayıtları silinsin mi?")) return;
    await api.deleteCustomer(id);
    navigate("/customers");
  }

  async function toggle(activityId: number, value: boolean) {
    await api.completeActivity(activityId, value);
    activities.reload();
    customer.reload();
  }

  return (
    <>
      <Link to="/customers" className="back-link"><ArrowLeft size={16} /> Müşteriler</Link>
      <ErrorNote message={customer.error} />

      {c && (
        <>
          <PageHeader
            title={c.companyName}
            actions={
              <>
                <button className="btn ghost" onClick={() => setEditing(true)}><Pencil size={15} /> Düzenle</button>
                <button className="btn ghost danger" onClick={remove}><Trash2 size={15} /> Sil</button>
              </>
            }
          />

          <div className="info-bar card">
            <CustomerStatusBadge status={c.status} />
            {c.contactName && <span><User size={15} /> {c.contactName}</span>}
            {c.email && <a href={`mailto:${c.email}`}><Mail size={15} /> {c.email}</a>}
            {c.phone && <a href={`tel:${c.phone}`}><Phone size={15} /> {c.phone}</a>}
            {c.city && <span><MapPin size={15} /> {c.city}</span>}
          </div>

          <div className="grid-2">
            <section className="card">
              <div className="card-header">
                <h3>Aktiviteler</h3>
                <button className="btn small" onClick={() => setAddingActivity(true)}><Plus size={14} /> Ekle</button>
              </div>
              {activities.data?.length === 0 ? (
                <Empty>Henüz aktivite yok.</Empty>
              ) : (
                <ul className="list">
                  {activities.data?.map((a) => (
                    <li key={a.id} className={a.isCompleted ? "done" : ""}>
                      <label className="check">
                        <input type="checkbox" checked={a.isCompleted} onChange={(e) => toggle(a.id, e.target.checked)} />
                        <div>
                          <div className="strong">{a.subject}</div>
                          <div className="muted small">
                            {activityTypeLabel[a.type]} · {formatDateTime(a.dueDate)}
                          </div>
                          {a.notes && <div className="small note">{a.notes}</div>}
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <div className="card-header">
                <h3>Teklifler</h3>
                <Link to={`/quotes/new?customerId=${id}`} className="btn small"><Plus size={14} /> Yeni teklif</Link>
              </div>
              {quotes.data?.length === 0 ? (
                <Empty>Henüz teklif yok.</Empty>
              ) : (
                <ul className="list">
                  {quotes.data?.map((q) => (
                    <li key={q.id}>
                      <Link to={`/quotes/${q.id}`}>
                        <div className="strong">{q.title}</div>
                        <div className="muted small">{q.quoteNumber} · {formatDate(q.createdAt)}</div>
                      </Link>
                      <div className="right">
                        <div className="strong small">{formatMoney(q.grandTotal)}</div>
                        <QuoteStatusBadge status={q.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {editing && (
            <Modal title="Müşteriyi düzenle" onClose={() => setEditing(false)}>
              <CustomerForm
                initial={c}
                onCancel={() => setEditing(false)}
                onSubmit={async (d) => {
                  await api.updateCustomer(id, d);
                  setEditing(false);
                  customer.reload();
                }}
              />
            </Modal>
          )}

          {addingActivity && (
            <Modal title="Yeni aktivite" onClose={() => setAddingActivity(false)}>
              <ActivityForm
                customerId={id}
                onDone={() => {
                  setAddingActivity(false);
                  activities.reload();
                  customer.reload();
                }}
              />
            </Modal>
          )}
        </>
      )}
    </>
  );
}

function ActivityForm({ customerId, onDone }: { customerId: number; onDone: () => void }) {
  const [type, setType] = useState<ActivityType>("Call");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.createActivity({ customerId, type, subject, notes: notes || undefined, dueDate: dueDate?.toISOString() });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <ErrorNote message={error} />
      <div className="form-row">
        <label>
          Tür
          <select value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
            {(Object.keys(activityTypeLabel) as ActivityType[]).map((t) => (
              <option key={t} value={t}>{activityTypeLabel[t]}</option>
            ))}
          </select>
        </label>
        <label>
          Tarih ve saat
          <DateField withTime value={dueDate} onChange={setDueDate} />
        </label>
      </div>
      <label>
        Konu *
        <input required value={subject} onChange={(e) => setSubject(e.target.value)} autoFocus />
      </label>
      <label>
        Açıklama
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Görüşmenin özeti, sonraki adım vb." />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn primary">Kaydet</button>
      </div>
    </form>
  );
}
