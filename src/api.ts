// Backend ile konuşan tek yer. Tipler C# DTO'larıyla birebir aynıdır.

export type CustomerStatus = "Lead" | "Active" | "Passive";
export type ActivityType = "Call" | "Meeting" | "Email" | "Task" | "Note";
export type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

export interface Customer {
  id: number;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  city?: string;
  status: CustomerStatus;
  createdAt: string;
  openActivityCount: number;
  quoteCount: number;
}
export type CustomerInput = Omit<Customer, "id" | "createdAt" | "openActivityCount" | "quoteCount">;

export interface Activity {
  id: number;
  customerId: number;
  customerName: string;
  type: ActivityType;
  subject: string;
  notes?: string;
  dueDate?: string;
  isCompleted: boolean;
  createdAt: string;
}
export interface ActivityInput {
  customerId: number;
  type: ActivityType;
  subject: string;
  notes?: string;
  dueDate?: string;
}

export interface QuoteItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal?: number;
}
export interface Quote {
  id: number;
  quoteNumber: string;
  customerId: number;
  customerName: string;
  title: string;
  status: QuoteStatus;
  taxRate: number;
  validUntil: string;
  createdAt: string;
  subTotal: number;
  taxAmount: number;
  grandTotal: number;
  items: QuoteItem[];
}
export interface QuoteInput {
  customerId: number;
  title: string;
  taxRate: number;
  validUntil?: string;
  items: QuoteItem[];
}
export type QuoteUpdateInput = Omit<QuoteInput, "customerId">;

export interface Dashboard {
  customerCount: number;
  leadCount: number;
  openActivityCount: number;
  openQuoteCount: number;
  pipelineTotal: number;
  wonTotal: number;
  upcomingActivities: Activity[];
  recentQuotes: Quote[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
/** Kullanıcının bulunduğu sayfa; asistan "bu müşteri" gibi ifadeleri buna göre anlar. */
export interface ChatPageContext {
  page: string;
  customerId?: number;
  quoteId?: number;
}
export interface PendingAction {
  id: string;
  title: string;
  summary: string;
  details: string[];
  danger: boolean;
}
export interface ChatResponse {
  reply: string;
  actions: string[];
  aiEnabled: boolean;
  pending?: PendingAction | null;
}
export interface ConfirmResult {
  ok: boolean;
  message: string;
}
export interface CurrentUser {
  name: string;
  role: string;
  team: string;
  productName: string;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `İstek başarısız (${res.status})`;
    try {
      const body = await res.json();
      // ASP.NET doğrulama hataları "errors" alanında gelir
      if (body.errors) message = Object.values(body.errors).flat().join(" ");
      else if (body.title) message = body.title;
    } catch {
      /* gövde JSON değil */
    }
    throw new Error(message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = {
  dashboard: () => request<Dashboard>("/api/dashboard"),

  customers: (search?: string, status?: CustomerStatus) =>
    request<Customer[]>(`/api/customers${qs({ search, status })}`),
  customer: (id: number) => request<Customer>(`/api/customers/${id}`),
  createCustomer: (data: CustomerInput) =>
    request<Customer>("/api/customers", { method: "POST", body: JSON.stringify(data) }),
  updateCustomer: (id: number, data: CustomerInput) =>
    request<Customer>(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCustomer: (id: number) => request<void>(`/api/customers/${id}`, { method: "DELETE" }),

  activities: (customerId?: number) => request<Activity[]>(`/api/activities${qs({ customerId })}`),
  createActivity: (data: ActivityInput) =>
    request<Activity>("/api/activities", { method: "POST", body: JSON.stringify(data) }),
  completeActivity: (id: number, value: boolean) =>
    request<Activity>(`/api/activities/${id}/complete${qs({ value })}`, { method: "PATCH" }),
  deleteActivity: (id: number) => request<void>(`/api/activities/${id}`, { method: "DELETE" }),

  quotes: (customerId?: number, status?: QuoteStatus) =>
    request<Quote[]>(`/api/quotes${qs({ customerId, status })}`),
  quote: (id: number) => request<Quote>(`/api/quotes/${id}`),
  createQuote: (data: QuoteInput) =>
    request<Quote>("/api/quotes", { method: "POST", body: JSON.stringify(data) }),
  updateQuote: (id: number, data: QuoteUpdateInput) =>
    request<Quote>(`/api/quotes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  setQuoteStatus: (id: number, status: QuoteStatus) =>
    request<Quote>(`/api/quotes/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteQuote: (id: number) => request<void>(`/api/quotes/${id}`, { method: "DELETE" }),

  me: () => request<CurrentUser>("/api/me"),

  chat: (messages: ChatMessage[], context: ChatPageContext) =>
    request<ChatResponse>("/api/chat", { method: "POST", body: JSON.stringify({ messages, context }) }),
  confirmAction: (id: string) => request<ConfirmResult>(`/api/chat/actions/${id}/confirm`, { method: "POST" }),
  cancelAction: (id: string) => request<ConfirmResult>(`/api/chat/actions/${id}/cancel`, { method: "POST" }),
};
