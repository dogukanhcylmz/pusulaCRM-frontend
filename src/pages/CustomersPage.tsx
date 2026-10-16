import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { api, type CustomerStatus } from "../api";
import { customerStatusLabel, formatDate, useData } from "../utils";
import { Empty, ErrorNote, Modal, PageHeader, Pagination } from "../components/ui";
import { CustomerStatusBadge } from "../components/StatusBadges";
import CustomerForm from "../components/CustomerForm";
import { useChatPage } from "../chatContext";

const PAGE_SIZE = 5;

export default function CustomersPage() {
  useChatPage("customers");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "">("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  // Her tuşta istek atmamak için kısa bekleme; arama değişince 1. sayfaya dön
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, error, loading, reload } = useData(
    () => api.customersPaged({ page, pageSize: PAGE_SIZE, search: debounced, status: status || undefined }),
    [page, debounced, status]
  );

  // Silme sonrası sayfada kayıt kalmadıysa önceki sayfaya geç
  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) setPage(page - 1);
  }, [data]);

  return (
    <>
      <PageHeader
        title="Müşteriler"
        subtitle={data ? `${data.totalCount} kayıt` : undefined}
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
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as CustomerStatus | "");
            setPage(1);
          }}
        >
          <option value="">Tüm durumlar</option>
          {(Object.keys(customerStatusLabel) as CustomerStatus[]).map((s) => (
            <option key={s} value={s}>{customerStatusLabel[s]}</option>
          ))}
        </select>
      </div>

      <ErrorNote message={error} />

      <div className={`card no-pad${loading && data ? " is-loading" : ""}`} aria-busy={loading}>
        {!data ? (
          <Empty>{loading ? "Yükleniyor…" : "Liste yüklenemedi."}</Empty>
        ) : data.totalCount === 0 ? (
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
              {data.items.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => navigate(`/customers/${c.id}`)}>
                  <td className="strong">{c.companyName}</td>
                  <td>
                    {c.contactName ?? "—"}
                    {c.email && <div className="muted small hide-sm">{c.email}</div>}
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

      {data && data.totalCount > 0 && (
        <div className="list-footer">
          <Pagination page={page} totalPages={data.totalPages} disabled={loading} onChange={setPage} />
        </div>
      )}

      {creating && (
        <Modal title="Yeni müşteri" onClose={() => setCreating(false)}>
          <CustomerForm
            onCancel={() => setCreating(false)}
            onSubmit={async (d) => {
              await api.createCustomer(d);
              setCreating(false);
              // Liste en yeni kayıt üstte sıralı: yeni müşteri 1. sayfada görünür
              if (page === 1) reload();
              else setPage(1);
            }}
          />
        </Modal>
      )}
    </>
  );
}
