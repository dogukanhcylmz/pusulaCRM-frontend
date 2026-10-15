# Frontend Mimarisi — Ayrıntılı Referans

Son tam inceleme: 2026-10-15 (tüm `src/` dosyaları okundu, ~1.800 satır). Kod değiştikçe bu dosyayı güncelle.

## 1. Genel resim

```
Tarayıcı (5173, Vite) ──/api/* proxy──▶ ASP.NET Core 8 API (5080) ──EF Core──▶ PostgreSQL 16 (Docker, 5433)
                                              └─ ChatService ──▶ OpenRouter (OpenAI uyumlu, yedek model zinciri)
```
- Not: kök `README.md` / `SUNUM.md` hâlâ "SQLite + Gemini" diyor; güncel durum PostgreSQL + OpenRouter (backend `appsettings.json`). Backend'i çalıştırmadan önce `docker compose up -d` (backend klasöründe).
- Kimlik doğrulama yok. Kullanıcı `GET /api/me` ile ayarlardan gelir ("Demo Kullanıcı").

## 2. Dosya haritası

| Dosya | Satır | Görev |
|---|---|---|
| `index.html` | — | `lang="tr"`, Inter fontu, `#root` |
| `vite.config.ts` | — | port 5173, `/api` → `http://localhost:5080` |
| `src/main.tsx` | 13 | `StrictMode` + `BrowserRouter` + `styles.css` |
| `src/App.tsx` | 73 | Sidebar (nav + kullanıcı kutusu), `<Routes>`, `ChatWidget` |
| `src/api.ts` | 177 | Tüm tipler + `request<T>()` + `api` nesnesi |
| `src/utils.ts` | 67 | Biçimleme, Türkçe etiketler, `useData`, `notifyDataChanged`, `localInputToIso` |
| `src/chatContext.ts` | 37 | Modül düzeyinde mini store (`useSyncExternalStore`) |
| `src/components/ui.tsx` | 48 | `Modal`, `Badge`, `PageHeader`, `Empty`, `ErrorNote` |
| `src/components/StatusBadges.tsx` | 14 | `CustomerStatusBadge`, `QuoteStatusBadge` (durum → renk tonu) |
| `src/components/CustomerForm.tsx` | 81 | Müşteri ekle/düzenle formu (Modal içinde kullanılır) |
| `src/components/RichText.tsx` | 55 | Asistan cevabı için güvenli mini-Markdown (`**kalın**`, `-`/`•`/`1.` liste, `#` başlık silinir). innerHTML yok |
| `src/components/ChatWidget.tsx` | 264 | Asistan paneli + `ConfirmCard` |
| `src/pages/DashboardPage.tsx` | 94 | 4 istatistik kartı + yaklaşan aktiviteler + son teklifler |
| `src/pages/CustomersPage.tsx` | 102 | Arama (250 ms debounce) + durum filtresi + tablo + "Yeni müşteri" modalı |
| `src/pages/CustomerDetailPage.tsx` | 193 | Bilgi şeridi, aktiviteler (tamamla checkbox), teklifler, düzenle/sil; içinde `ActivityForm` |
| `src/pages/QuotesPage.tsx` | 71 | Durum sekmeleri + tablo + toplam |
| `src/pages/QuoteFormPage.tsx` | 129 | Yeni teklif: kalemler, iskonto, KDV, anlık toplam; `?customerId=` ön seçimi |
| `src/pages/QuoteDetailPage.tsx` | 102 | Teklif belgesi, durum select'i, Yazdır/PDF (`window.print`), sil |
| `src/styles.css` | 301 | Tüm stiller (aşağıda) |

## 3. Rotalar

| Yol | Sayfa | `useChatPage` |
|---|---|---|
| `/` | DashboardPage | `"dashboard"` |
| `/customers` | CustomersPage | `"customers"` |
| `/customers/:id` | CustomerDetailPage | `"customer-detail"`, `customerId`, `label=companyName` |
| `/quotes` | QuotesPage | `"quotes"` |
| `/quotes/new` | QuoteFormPage | `"quote-new"` |
| `/quotes/:id` | QuoteDetailPage | `"quote-detail"`, `quoteId`, `label="TKL-… · Müşteri"` |

- 404 / catch-all rota yok. Sidebar `nav` dizisi `App.tsx` başında (Genel Bakış, Müşteriler, Teklifler).
- Backend `PromptBuilder.DescribePageAsync` yalnız `customers`, `quotes`, `quote-new` string'lerini tanır; `customerId`/`quoteId` varsa onlara öncelik verir; diğer her şey "Genel bakış". **Yeni sayfa eklersen backend switch'ine de ekle.**

## 4. Veri katmanı

### `request<T>(url, options)` (`api.ts`)
- Her zaman `Content-Type: application/json`. `204` → `undefined`.
- Hata: `İstek başarısız (<status>)`; gövdede `errors` (ASP.NET model doğrulama, `{alan: [mesaj]}`) varsa mesajlar birleştirilir, yoksa `title` (backend exception handler `{status,title}` döner; `NotFound()` ProblemDetails'ı "Not Found" İngilizce başlık döner).
- `qs()` boş/undefined parametreleri atlar.

### `api` uç noktaları
| Fonksiyon | HTTP |
|---|---|
| `dashboard()` | GET `/api/dashboard` |
| `customers(search?, status?)` / `customer(id)` | GET `/api/customers[?search&status]` / `/{id}` |
| `createCustomer` / `updateCustomer(id)` / `deleteCustomer(id)` | POST / PUT / DELETE |
| `activities(customerId?)` | GET `/api/activities?customerId` (backend `completed` filtresini de destekler, frontend kullanmıyor) |
| `createActivity` / `completeActivity(id, value)` / `deleteActivity(id)` | POST / PATCH `…/complete?value=` / DELETE (`deleteActivity` UI'da kullanılmıyor) |
| `quotes(customerId?, status?)` / `quote(id)` | GET |
| `createQuote` / `setQuoteStatus(id, status)` / `deleteQuote(id)` | POST / PATCH `…/status` `{status}` / DELETE |
| `me()` | GET `/api/me` |
| `chat(messages, context)` | POST `/api/chat` `{messages, context:{page, customerId?, quoteId?}}` |
| `confirmAction(id)` / `cancelAction(id)` | POST `/api/chat/actions/{id}/confirm|cancel` |

- Teklif düzenleme (PUT) backend'de YOK; sadece durum değişir.
- Backend doğrulama kuralları (`Dtos.cs`): firma adı zorunlu ≤200, e-posta formatı, konu zorunlu ≤300, teklif ≥1 kalem, miktar 0.01–1e6, birim fiyat 0–1e8, iskonto/KDV 0–100.

### Tipler
`CustomerStatus = Lead|Active|Passive`, `ActivityType = Call|Meeting|Email|Task|Note`, `QuoteStatus = Draft|Sent|Accepted|Rejected`. `CustomerInput = Omit<Customer, id|createdAt|openActivityCount|quoteCount>`. Tarihler ISO string (UTC). Para alanları `number` (backend `decimal`).

### `useData(loader, deps = [])` (`utils.ts`)
- `{ data, error, reload }` döner. `loader` `useCallback(loader, deps)` ile sabitlenir → **deps'i doğru ver** (ör. `useData(() => api.customer(id), [id])`). Parametresiz `useData(api.dashboard)` güvenli.
- `crm:changed` olayını dinler; `notifyDataChanged()` çağrılınca ekrandaki tüm veriler yeniden yüklenir (asistan onaylı işlemden sonra kullanır).
- Yükleme durumu (`loading`) yok: `data === null` = yükleniyor. İptal/eski cevap koruması yok (bkz. BACKLOG F1).
- Ekrandan yapılan değişikliklerden sonra sayfalar `reload()` çağırır; `notifyDataChanged` çağırmaz.

## 5. Asistan (ChatWidget) akışı

1. Mesaj gönderilmeden önce cevaplanmamış (`waiting`) onay kartları `expired` yapılır ve sunucuda `cancelAction` çağrılır.
2. `toHistory`: `welcome`/`error` mesajları atılır; `pending` kartlar `"[Onaya sunulan işlem] <summary>"` metnine çevrilir (expired ise not eklenir). Tüm geçmiş gönderilir; backend son 20'yi alır (`ChatService.MaxHistory`).
3. Cevap: `reply` metni (RichText ile) + varsa `pending` → `ConfirmCard`. `aiEnabled=false` → başlıkta "Basit mod" (ilk cevaptan önce bilinmez).
4. `decide(index, confirm)`: `busy` → confirm/cancel → `confirmed|cancelled|expired` + `result` chip. Başarılı onayda `notifyDataChanged()`.
5. `danger=true` kart kırmızı, buton "Evet, sil".
- Öneri butonları yalnız ilk açılışta (mesaj sayısı 1). Müşteri sayfasında `CUSTOMER_SUGGESTIONS`.
- `page.label` varsa "Bağlam: …" şeridi. Label sadece görsel; sunucu adı id'den çözer.
- Sohbet geçmişi yalnız bileşen state'inde (yenilemede kaybolur, kalıcılık yok). `res.actions` alanı ve `.action-chip` CSS'i kullanılmıyor.
- Panel: 380×580, `expanded` → 760px / tam yükseklik; ≤760px ekranda tam ekran.

## 6. Stil sistemi (`styles.css`)
- Değişkenler: `--bg --surface --border --text --muted --primary(#4f46e5) --primary-soft --primary-dark --sidebar --sidebar-text --green --red --radius(12px) --shadow --shadow-lg`. Taban font 14px. Karanlık mod yok.
- Yardımcı sınıflar: `.row .gap-xs .muted .small .strong .mono .num .right .hide-sm .no-print .clickable`.
- Bileşen sınıfları: `.card(.no-pad) .card-header .grid-2 .stats/.stat .btn(.primary|.ghost|.danger|.small|.danger-solid) .icon-btn(.light) .form .form-row(.narrow) .form-actions .toolbar .search .tabs .table .list(li.done) .check .note .badge-{green|amber|blue|red|gray} .info-bar .items/.items-head/.items-row .totals(.end, .grand) .quote-meta .quote-doc .modal-backdrop/.modal .chat-*`.
- Kırılımlar: ≤1000px (stats 2 sütun, grid-2 tek sütun), ≤760px (sidebar üstte yatay, ikon-only nav, `.hide-sm` gizli, chat tam ekran). `@media print`: sidebar/chat/`.no-print` gizlenir → teklif PDF.

## 7. Kod stili / kalıplar
- Fonksiyon bileşenleri, `export default function XPage()`. Küçük yardımcı bileşenler aynı dosyanın altında (`Stat`, `ActivityForm`, `ConfirmCard`).
- `import { api, type X } from "../api"` biçiminde type-only import.
- Formlar: kontrollü input, `submit` içinde try/catch → `setError(err.message)` → `<ErrorNote>`; `saving` bayrağı ile buton "Kaydediliyor…".
- Silme onayı native `confirm()` (ekran) — asistan ise kendi kartını kullanır.
- Ikonlar lucide-react, boyut 14–18.
- Yorumlar kısa, Türkçe, "neden"i anlatır.

## 8. Tarifler

**Yeni sayfa:** `src/pages/XPage.tsx` → `useChatPage("x")` → `App.tsx`'e `<Route>` (+ `nav` girişi) → backend `PromptBuilder.DescribePageAsync` switch'ine `"x" => "…"`.

**Yeni API çağrısı:** backend DTO'yu oku → `api.ts`'e interface (camelCase alanlar) + `api.xxx` → bileşende `useData` veya event handler'da çağır.

**Yeni enum değeri / etiket:** `api.ts` union tipi + `utils.ts` `…Label` haritası + gerekirse `StatusBadges.tsx` ton haritası (Record tipleri eksik anahtarda derleme hatası verir — iyi).

**Asistana yeni yazma aracı:** tamamen backend işi (`CrmToolbox` + `PromptBuilder`, bkz. backend CLAUDE.md). Frontend `PendingAction` kartını genel gösterdiği için değişiklik gerekmez; yalnız yeni öneri metni eklenebilir.

**Asistanın değişikliğinden sonra yenilenmesi gereken yeni veri:** `useData` kullanırsan otomatik.
