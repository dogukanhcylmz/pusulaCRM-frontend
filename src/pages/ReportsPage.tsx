import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, type ActivityType, type CustomerStatus, type QuoteStatus } from "../api";
import { useChatPage } from "../chatContext";
import { activityTypeLabel, customerStatusLabel, formatMoney, quoteStatusLabel, useData } from "../utils";
import { Empty, ErrorNote, PageHeader } from "../components/ui";

interface Point {
  label: string;
  value: number;
}

const COLORS = ["#2563eb", "#0284c7", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

export default function ReportsPage() {
  useChatPage("reports");
  const customers = useData(() => api.customers());
  const quotes = useData(() => api.quotes());
  const activities = useData(() => api.activities());

  const c = customers.data ?? [];
  const q = quotes.data ?? [];
  const a = activities.data ?? [];

  const byCustomerStatus = (Object.keys(customerStatusLabel) as CustomerStatus[]).map((s) => ({
    label: customerStatusLabel[s],
    value: c.filter((x) => x.status === s).length,
  }));

  const byQuoteStatus = (Object.keys(quoteStatusLabel) as QuoteStatus[]).map((s) => ({
    label: quoteStatusLabel[s],
    value: sum(q.filter((x) => x.status === s).map((x) => x.grandTotal)),
  }));

  // Son 6 ay, en eski solda
  const now = new Date();
  const byMonth = [5, 4, 3, 2, 1, 0].map((i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const inMonth = q.filter((x) => {
      const d = new Date(x.createdAt);
      return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
    });
    return {
      label: month.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
      value: sum(inMonth.map((x) => x.grandTotal)),
    };
  });

  const totals = new Map<string, number>();
  q.forEach((x) => totals.set(x.customerName, (totals.get(x.customerName) ?? 0) + x.grandTotal));
  const topCustomers = [...totals]
    .map(([label, value]) => ({ label, value }))
    .sort((x, y) => y.value - x.value)
    .slice(0, 5);

  const byActivityType = (Object.keys(activityTypeLabel) as ActivityType[]).map((t) => ({
    label: activityTypeLabel[t],
    value: a.filter((x) => x.type === t).length,
  }));

  return (
    <>
      <PageHeader title="Raporlar" subtitle="Müşteri, teklif ve aktivite verilerinin özeti" />
      <ErrorNote message={customers.error ?? quotes.error ?? activities.error} />

      <div className="grid-2">
        <ChartCard title="Müşteriler duruma göre" data={byCustomerStatus} pie />
        <ChartCard title="Teklif tutarı duruma göre" data={byQuoteStatus} money />
        <ChartCard title="Aylık teklif tutarı (son 6 ay)" data={byMonth} money />
        <ChartCard title="En yüksek teklif tutarlı müşteriler" data={topCustomers} money horizontal />
        <ChartCard title="Aktiviteler türe göre" data={byActivityType} pie />
      </div>
    </>
  );
}

const sum = (values: number[]) => values.reduce((t, v) => t + v, 0);

function ChartCard({ title, data, money, pie, horizontal }: {
  title: string;
  data: Point[];
  money?: boolean;
  pie?: boolean;
  horizontal?: boolean;
}) {
  const format = (v: number) => (money ? formatMoney(v) : String(v));
  const short = (v: number) => (money ? new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(v) : String(v));
  const tooltip = <Tooltip formatter={(v) => format(Number(v))} />;

  return (
    <section className="card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      {data.every((d) => d.value === 0) ? (
        <Empty>Henüz veri yok.</Empty>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          {pie ? (
            <PieChart>
              <Pie data={data.filter((d) => d.value > 0)} dataKey="value" nameKey="label" innerRadius={55} outerRadius={95} label={(p) => p.name}>
                {data.filter((d) => d.value > 0).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              {tooltip}
            </PieChart>
          ) : horizontal ? (
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={short} />
              <YAxis type="category" dataKey="label" width={120} />
              {tooltip}
              <Bar dataKey="value" name="Tutar" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ right: 10 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={short} />
              {tooltip}
              <Bar dataKey="value" name={money ? "Tutar" : "Adet"} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </section>
  );
}
