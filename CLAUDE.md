# digitestCRM Web (frontend) — Proje Notları

Her oturumda otomatik yüklenir. Kısa tut; ayrıntı `docs/` altında.

## Teknoloji
- React 18 + TypeScript (strict, `noUnusedLocals/Parameters`) + Vite 5 + react-router-dom 6 + lucide-react (ikonlar). Başka kütüphane yok: state yönetimi, form, UI kiti, test, lint YOK.
- Stil: tek dosya `src/styles.css` (CSS değişkenleri `:root`'ta, sınıf tabanlı, Tailwind yok). Font: Inter (Google Fonts, `index.html`).
- `npm run dev` → `http://localhost:5173`. `/api` istekleri Vite proxy ile `http://localhost:5080`'e gider (`vite.config.ts`) → CORS gerekmez.
- Doğrulama: `npm run build` (= `tsc --noEmit && vite build`). Hızlı kontrol: `npx tsc --noEmit`.
- Git deposu: branch `main`, origin github.com/dogukanhcylmz/digitestCRM-frontend (backend ayrı repo). Backend: `../backend/DigitestCrm.Api` (kendi `CLAUDE.md` + `docs/BACKLOG.md` var; API değişikliği gerekirse önce onları oku).

## Mimari (özet — ayrıntı `docs/ARCHITECTURE.md`)
- `src/api.ts`: backend ile konuşan TEK yer. Tipler C# DTO'larıyla birebir (`Dtos/Dtos.cs`). Enum'lar string (`JsonStringEnumConverter`).
- `src/utils.ts`: `useData(loader, deps)` veri yükleme hook'u + para/tarih biçimleme + Türkçe etiket haritaları + `notifyDataChanged()` (`crm:changed` window event → tüm `useData`'lar yeniden yükler).
- `src/chatContext.ts`: sayfanın asistana "şu an buradayım" demesi. Her sayfa `useChatPage("<page>", {customerId?, quoteId?, label?})` çağırır.
- `src/components/ChatWidget.tsx`: yüzen asistan. Yazma işlemleri onay kartı (`PendingAction`) ile gelir; ONAYSIZ YAZMA YOK.
- Sayfalar `src/pages/`, ortak UI `src/components/ui.tsx` (Modal, Badge, PageHeader, Empty, ErrorNote).

## Kurallar (backend ile aynı, kullanıcıyla kararlaştırıldı)
- Dil: arayüz metinleri ve kod yorumları Türkçe; mevcut üslubu koru. Para `tr-TR`/`TRY`, tarih `tr-TR`.
- Yeni API çağrısı → `api.ts`'e tip + fonksiyon ekle; bileşenden doğrudan `fetch` yapma.
- Yeni sayfa → `App.tsx` rotası + (gerekirse) `nav` + `useChatPage` + backend `PromptBuilder.DescribePageAsync` eşlemesi.
- Asistanın onay akışını atlatan değişiklik yapma.
- Yeni bağımlılık eklemeden önce kullanıcıya sor.
- **Commit/push HER ZAMAN kullanıcıda.** Commit mesajını yalnızca istenirse yaz.
- Kapsam dışına taşma; fark edilen ek sorunları `docs/BACKLOG.md`'ye yaz.

## Çalışma düzeni
- Açık bulgular / yapılacaklar: `docs/BACKLOG.md` ← işe başlamadan önce oku, bitince güncelle
- Rapor sistemi: `docs/reports/README.md` (şablon + adlandırma, backend ile aynı)
- Yeni özellik tarifleri (sayfa/API/asistan): `docs/ARCHITECTURE.md` → "Tarifler"
