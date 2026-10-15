# Raporlama Sistemi (frontend)

Backend'deki sistemle aynı. Her anlamlı iş (geliştirme, test, inceleme) için bir rapor yazılır. Değişiklik geçmişi git'te; raporlar "neden ve nasıl doğrulandı" bilgisini tutar.

## Adlandırma
`YYYY-MM-DD_<rol>_<konu>.md` — rol: `dev` | `test` | `review`

## Şablon

```markdown
# <Başlık>
- Tarih: YYYY-MM-DD   - Rol: dev|test|review   - Durum: tamamlandı | kısmi | engelli

## Amaç
Neden yapıldı (1-2 cümle).

## Yapılanlar
- dosya:satır — ne değişti

## Doğrulama
- Çalıştırılan komut → sonuç (ör. `npm run build` geçti / tarayıcıda denenen senaryo)
- Yapılamayan doğrulamalar ve nedeni

## Bulgular / Riskler
- Yeni fark edilenler (BACKLOG'a eklendi mi?)

## Sonraki adım
- ...
```

## Kurallar
- Doğrulanmayan şey "çalışıyor" diye yazılmaz.
- Başarısız derleme çıktısı özetlenir, gizlenmez.
- Rapor sonrası `docs/BACKLOG.md` (ve gerekiyorsa `docs/ARCHITECTURE.md`) güncellenir.
- Raporlar silinmez; yanlışsa altına düzeltme notu eklenir.

## Rapor listesi
| Tarih | Rol | Konu | Dosya |
|---|---|---|---|
| 2026-10-15 | review | İlk frontend incelemesi | `2026-10-15_review_ilk-inceleme.md` |
