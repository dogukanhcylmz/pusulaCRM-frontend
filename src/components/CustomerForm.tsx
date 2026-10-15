import { useState, type FormEvent } from "react";
import type { Customer, CustomerInput, CustomerStatus } from "../api";
import { customerStatusLabel } from "../utils";
import { ErrorNote } from "./ui";

interface Props {
  initial?: Customer;
  onSubmit: (data: CustomerInput) => Promise<void>;
  onCancel: () => void;
}

export default function CustomerForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CustomerInput>({
    companyName: initial?.companyName ?? "",
    contactName: initial?.contactName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    city: initial?.city ?? "",
    status: initial?.status ?? "Lead",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof CustomerInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Boş metinleri null olarak gönder (e-posta doğrulaması boş metinde hata vermesin)
      const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "" ? undefined : v])) as CustomerInput;
      await onSubmit(clean);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="form">
      <ErrorNote message={error} />
      <label>
        Firma adı *
        <input required value={form.companyName} onChange={set("companyName")} autoFocus />
      </label>
      <div className="form-row">
        <label>
          Yetkili kişi
          <input value={form.contactName} onChange={set("contactName")} />
        </label>
        <label>
          Durum
          <select value={form.status} onChange={set("status")}>
            {(Object.keys(customerStatusLabel) as CustomerStatus[]).map((s) => (
              <option key={s} value={s}>{customerStatusLabel[s]}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          E-posta
          <input type="email" value={form.email} onChange={set("email")} />
        </label>
        <label>
          Telefon
          <input value={form.phone} onChange={set("phone")} />
        </label>
      </div>
      <label>
        Şehir
        <input value={form.city} onChange={set("city")} />
      </label>
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Vazgeç</button>
        <button type="submit" className="btn primary" disabled={saving}>{saving ? "Kaydediliyor…" : "Kaydet"}</button>
      </div>
    </form>
  );
}
