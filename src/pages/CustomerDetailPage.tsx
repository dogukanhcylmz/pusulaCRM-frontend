import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Mail, MapPin, Pencil, Phone, Plus, StickyNote, Trash2, User } from "lucide-react";
import { api, type Activity, type ActivityType } from "../api";
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
  const [activityForm, setActivityForm] = useState<{ mode: ActivityFormMode; initial?: Activity } | null>(null);

  const customer = useData(() => api.customer(id), [id]);
  const activities = useData(() => api.activities(id), [id]);
  const quotes = useData(() => api.quotes(id), [id]);
  const c = customer.data;

  const tasks = activities.data?.filter((a) => a.type !== "Note"); //not bilgi kaydı oldu sadece
  const notes = activities.data
    ?.filter((a) => a.type === "Note")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

  async function removeActivity(a: Activity) {
    if (!confirm(a.type === "Note" ? "Not silinsin mi?" : "Aktivite silinsin mi?")) return;
    await api.deleteActivity(a.id);
    activities.reload();
    customer.reload();
  }

  const editActivity = (a: Activity) => setActivityForm({ mode: a.type === "Note" ? "note" : "activity", initial: a });

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
            {c.contactName && <span><User size={15} /> {c.contactName}{c.contactTitle && ` · ${c.contactTitle}`}</span>}
            {c.email && <a href={`mailto:${c.email}`}><Mail size={15} /> {c.email}</a>}
            {c.phone && <a href={`tel:${c.phone}`}><Phone size={15} /> {c.phone}</a>}
            {c.landline && <a href={`tel:${c.landline}`} title="Sabit telefon"><Phone size={15} /> {c.landline} (sabit)</a>}
            {c.website && (
              <a href={/^https?:\/\//i.test(c.website) ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer">
                <Globe size={15} /> {c.website}
              </a>
            )}
            {(c.address || c.city) && <span><MapPin size={15} /> {[c.address, c.city].filter(Boolean).join(", ")}</span>}
          </div>

          <div className="grid-2">
            <section className="card">
              <div className="card-header">
                <h3>Aktiviteler</h3>
                <button className="btn small" onClick={() => setActivityForm({ mode: "activity" })}><Plus size={14} /> Ekle</button>
              </div>
              {tasks?.length === 0 ? (
                <Empty>Henüz aktivite yok.</Empty>
              ) : (
                <ul className="list">
                  {tasks?.map((a) => (
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
                      <RowActions onEdit={() => editActivity(a)} onDelete={() => removeActivity(a)} />
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

          <section className="card notes">
            <div className="card-header">
              <h3>Notlar</h3>
              <button className="btn small" onClick={() => setActivityForm({ mode: "note" })}><StickyNote size={14} /> Not ekle</button>
            </div>
            {notes?.length === 0 ? (
              <Empty>Henüz not yok.</Empty>
            ) : (
              <ul className="list">
                {notes?.map((n) => (
                  <li key={n.id}>
                    <div>
                      <div className="strong">{n.subject}</div>
                      {n.notes && <div className="small note">{n.notes}</div>}
                      <div className="muted small">{formatDateTime(n.createdAt)}</div>
                    </div>
                    <RowActions onEdit={() => editActivity(n)} onDelete={() => removeActivity(n)} />
                  </li>
                ))}
              </ul>
            )}
          </section>

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

          {activityForm && (
            <Modal title={activityFormTitle(activityForm.mode, !!activityForm.initial)} onClose={() => setActivityForm(null)}>
              <ActivityForm
                {...activityForm}
                customerId={id}
                onDone={() => {
                  setActivityForm(null);
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

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="row gap-xs">
      <button className="icon-btn" onClick={onEdit} aria-label="Düzenle"><Pencil size={15} /></button>
      <button className="icon-btn" onClick={onDelete} aria-label="Sil"><Trash2 size={15} /></button>
    </div>
  );
}

type ActivityFormMode = "activity" | "note";

const activityFormTitle = (mode: ActivityFormMode, editing: boolean) =>
  mode === "note" ? (editing ? "Notu düzenle" : "Yeni not") : editing ? "Aktiviteyi düzenle" : "Yeni aktivite";

const activityTypes = (Object.keys(activityTypeLabel) as ActivityType[]).filter((t) => t !== "Note");

interface ActivityFormProps {
  mode: ActivityFormMode;
  initial?: Activity;
  customerId: number;
  onDone: () => void;
}

function ActivityForm({ mode, initial, customerId, onDone }: ActivityFormProps) {
  const isNote = mode === "note";
  const [type, setType] = useState<ActivityType>(initial?.type ?? (isNote ? "Note" : "Call"));
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [dueDate, setDueDate] = useState<Date | null>(initial?.dueDate ? new Date(initial.dueDate) : null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const data = { type, subject, notes: notes || undefined, dueDate: dueDate?.toISOString() };
      if (initial) await api.updateActivity(initial.id, data);
      else await api.createActivity({ ...data, customerId });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <ErrorNote message={error} />
      {!isNote && (
        <div className="form-row">
          <label>
            Tür
            <select value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
              {activityTypes.map((t) => (
                <option key={t} value={t}>{activityTypeLabel[t]}</option>
              ))}
            </select>
          </label>
          <label>
            {type === "Task" ? "Son tarih" : "Tarih ve saat"}
            <DateField withTime value={dueDate} onChange={setDueDate} />
          </label>
        </div>
      )}
      <label>
        Konu *
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={isNote ? "Örn. Bütçe bilgisi alındı" : undefined}
          autoFocus
        />
      </label>
      <label>
        {isNote ? "Not" : "Açıklama"}
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isNote ? "Müşteriyle ilgili bilgi, gözlem vb." : "Görüşmenin özeti, sonraki adım vb."}
        />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn primary">Kaydet</button>
      </div>
    </form>
  );
}
