# BACKLOG (frontend)

İlk inceleme (2026-10-15) bulguları. Durum: `[ ]` açık, `[x]` bitti. Bitirince raporu `docs/reports/` altına yaz.
Backend bulguları ayrı: `../backend/DigitestCrm.Api/docs/BACKLOG.md`.

## Hatalar
- [ ] F1 `utils.ts` `useData` — eski isteğin cevabı yeniyi ezebilir (iptal/sıra koruması yok). Örn. müşteri aramasında hızlı yazınca sonuçlar eski aramaya dönebilir; `/customers/1` → `/customers/2` geçişinde bir an eski kayıt görünür. Çözüm: effect içinde `cancelled` bayrağı veya istek sayacı.
- [ ] F2 `CustomerDetailPage.tsx` `remove`/`toggle`, `QuoteDetailPage.tsx` `setStatus`/`remove` — try/catch yok; hata olursa kullanıcı hiçbir şey görmez (unhandled rejection).
- [ ] F3 `QuoteFormPage.tsx` — geçerlilik tarihi temizlenirse `new Date("").toISOString()` RangeError → ekranda "Invalid time value". Boşsa `validUntil` gönderme (backend varsayılan veriyor).
- [ ] F4 `CustomerDetailPage.tsx` `ActivityForm` — `saving` bayrağı yok, çift tıklamada iki aktivite oluşur. Ayrıca "Vazgeç" butonu yok (diğer formlarla tutarsız).
- [ ] F5 `api.ts` `request` — backend'in `BadRequest("metin")` (düz string gövde) ve `NotFound()` ("Not Found" İngilizce) cevapları kullanıcıya anlamsız/İngilizce mesaj olarak çıkıyor.
- [ ] F6 `CustomerForm.tsx` — hata sonrası tekrar gönderimde eski `error` temizlenmiyor (başarısız→başarılı arası kısa süre görünür; küçük).

## Eksik özellikler (backend destekliyor, UI yok)
- [ ] E1 Aktivite silme (`api.deleteActivity` var, UI yok).
- [ ] E2 Tüm aktiviteler sayfası / tamamlanan-açık filtresi (`GET /api/activities?completed=`).
- [ ] E3 404 / bilinmeyen rota sayfası yok; geçersiz `/customers/abc` → `NaN` id ile istek.
- [ ] E4 Teklif düzenleme — backend'de de yok (backend K5).

## UX / iyileştirme
- [ ] U1 Yükleme göstergesi yok (`data === null` iken boş ekran).
- [ ] U2 Silme onayı native `confirm()`; uygulamanın `Modal`'ı ile tutarsız.
- [ ] U3 Asistan sohbeti sayfa yenilemede kayboluyor (sessionStorage'a yazılabilir).
- [ ] U4 `aiEnabled` ilk mesajdan önce bilinmiyor; başlık her zaman "Yapay zeka destekli" ile açılıyor.
- [ ] U5 Kullanılmayan: `ChatResponse.actions`, `.action-chip` CSS.
- [ ] U6 Liste sayfalarında sayfalama yok (backend P4 ile birlikte).

## Altyapı
- [x] A1 Git deposu kuruldu (2026-10-15): `main`, origin `digitestCRM-frontend`, `.gitignore` eklendi.
- [ ] A2 Test (Vitest) ve lint (ESLint) yok. `useData` içinde `eslint-disable` yorumu var ama ESLint kurulu değil.
- [ ] A3 Kök `README.md`/`SUNUM.md` güncel değil: SQLite → PostgreSQL (Docker 5433), Gemini → OpenRouter.

## Yapıldı
- (henüz yok)

## Önerilen sıra
F2 → F3 → F4 → F1 → E3 → U1 → geri kalanı (sunum öncesiyse önce F2/F3: görünür hatalar)
