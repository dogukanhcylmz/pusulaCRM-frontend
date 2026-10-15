import { NavLink, Route, Routes } from "react-router-dom";
import { FileText, LayoutDashboard, Users } from "lucide-react";
import { api } from "./api";
import { useData } from "./utils";
import DashboardPage from "./pages/DashboardPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import QuotesPage from "./pages/QuotesPage";
import QuoteFormPage from "./pages/QuoteFormPage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import ChatWidget from "./components/ChatWidget";

const nav = [
  { to: "/", label: "Genel Bakış", icon: LayoutDashboard, end: true },
  { to: "/customers", label: "Müşteriler", icon: Users },
  { to: "/quotes", label: "Teklifler", icon: FileText },
];

export default function App() {
  const { data: me } = useData(api.me);
  const initials = me?.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr-TR");

  return (
    <div className="layout">
      <aside className="sidebar no-print">
        <div className="brand">
          <span>
            digitest<b>CRM</b>
          </span>
        </div>
        <nav>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {me && (
          <div className="user-box" title={`${me.name} · ${me.role} · ${me.team}`}>
            <div className="avatar">{initials}</div>
            <div className="user-meta">
              <strong>{me.name}</strong>
              <span>{me.role} · {me.team}</span>
            </div>
          </div>
        )}
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/quotes/new" element={<QuoteFormPage />} />
          <Route path="/quotes/:id" element={<QuoteDetailPage />} />
        </Routes>
      </main>

      <div className="no-print">
        <ChatWidget />
      </div>
    </div>
  );
}
