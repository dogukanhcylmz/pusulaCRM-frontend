import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { api, type CustomerStatus } from "../api";
import { customerStatusLabel, formatDate, useData } from "../utils";
import { Empty, ErrorNote, Modal, PageHeader } from "../components/ui";
import { CustomerStatusBadge } from "../components/StatusBadges";
import CustomerForm from "../components/CustomerForm";
import { useChatPage } from "../chatContext";

export default function CustomersPage() {
  useChatPage("customers");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "">("");
  const [creating, setCreating] = useState(false);

  // Her tuşta istek atmamak için kısa bekleme
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, error, reload } = useData(() => api.customers(debounced, status || undefined), [debounced, status]);

  return (
    <>
      <PageHeader
        title="Müşteriler"
        subtitle={data ? `${data.length} kayıt` : undefined}
        actions={
          <button className="btn primary" onClick={() => setCreating(true)}>
            <Plus size={16} /> Yeni müşteri
          </button>
        }
      />

      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input placeholder="Firma, kişi veya şehir ara…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as CustomerStatus | "")}>
          <option value="">Tüm durumlar</option>
          {(Object.keys(customerStatusLabel) as CustomerStatus[]).map((s) => (
            <option key={s} value={s}>{customerStatusLabel[s]}</option>
          ))}
        </select>
      </div>

      <ErrorNote message={error} />

      <div className="card no-pad">
        {data && data.length === 0 ? (
          <Empty>Kayıt bulunamadı.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Firma</th>
                <th>Yetkili</th>
                <th className="hide-sm">Şehir</th>
                <th>Durum</th>
                <th className="hide-sm num">Açık iş</th>
                <th className="hide-sm">Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => navigate(`/customers/${c.id}`)}>
                  <td className="strong">{c.companyName}</td>
                  <td>
                    {c.contactName ?? "—"}
                    {c.email && <div className="muted small">{c.email}</div>}
                  </td>
                  <td className="hide-sm">{c.city ?? "—"}</td>
                  <td><CustomerStatusBadge status={c.status} /></td>
                  <td className="hide-sm num">{c.openActivityCount}</td>
                  <td className="hide-sm muted">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <Modal title="Yeni müşteri" onClose={() => setCreating(false)}>
          <CustomerForm
            onCancel={() => setCreating(false)}
            onSubmit={async (d) => {
              await api.createCustomer(d);
              setCreating(false);
              reload();
            }}
          />
        </Modal>
      )}
    </>
  );
}
