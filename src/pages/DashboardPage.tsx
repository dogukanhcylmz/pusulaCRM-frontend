import { Link } from "react-router-dom";
import { CalendarClock, FileText, TrendingUp, Users } from "lucide-react";
import { api } from "../api";
import { useChatPage } from "../chatContext";
import { activityTypeLabel, formatDateTime, formatMoney, useData } from "../utils";
import { Empty, ErrorNote, PageHeader } from "../components/ui";
import { QuoteStatusBadge } from "../components/StatusBadges";

export default function DashboardPage() {
  useChatPage("dashboard");
  const { data, error } = useData(api.dashboard);

  return (
    <>
      <PageHeader title="Genel Bakış" subtitle="Satış süreçlerinizin özeti" />
      <ErrorNote message={error} />

      {data && (
        <>
          <div className="stats">
            <Stat icon={<Users size={18} />} label="Müşteri" value={data.customerCount} hint={`${data.leadCount} potansiyel`} />
            <Stat icon={<CalendarClock size={18} />} label="Açık aktivite" value={data.openActivityCount} />
            <Stat icon={<FileText size={18} />} label="Açık teklif tutarı" value={formatMoney(data.pipelineTotal)} hint={`${data.openQuoteCount} teklif`} />
            <Stat icon={<TrendingUp size={18} />} label="Kazanılan" value={formatMoney(data.wonTotal)} tone="green" />
          </div>

          <div className="grid-2">
            <section className="card">
              <div className="card-header">
                <h3>Yaklaşan aktiviteler</h3>
              </div>
              {data.upcomingActivities.length === 0 ? (
                <Empty>Planlanmış aktivite yok.</Empty>
              ) : (
                <ul className="list">
                  {data.upcomingActivities.map((a) => (
                    <li key={a.id}>
                      <div>
                        <div className="strong">{a.subject}</div>
                        <Link to={`/customers/${a.customerId}`} className="muted small">{a.customerName}</Link>
                      </div>
                      <div className="right">
                        <div className="small">{formatDateTime(a.dueDate)}</div>
                        <div className="muted small">{activityTypeLabel[a.type]}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <div className="card-header">
                <h3>Son teklifler</h3>
                <Link to="/quotes" className="small">Tümü</Link>
              </div>
              {data.recentQuotes.length === 0 ? (
                <Empty>Henüz teklif yok.</Empty>
              ) : (
                <ul className="list">
                  {data.recentQuotes.map((q) => (
                    <li key={q.id}>
                      <div>
                        <div className="strong">{q.title}</div>
                        <div className="muted small">{q.quoteNumber} · {q.customerName}</div>
                      </div>
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
        </>
      )}
    </>
  );
}

function Stat({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <div className={`stat ${tone ?? ""}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="muted small">{label}</div>
        <div className="stat-value">{value}</div>
        {hint && <div className="muted small">{hint}</div>}
      </div>
    </div>
  );
}
