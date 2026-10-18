# digitestCRM — Web arayüzü

digitestCRM'in React ile yazılmış arayüzü. Müşterileri, aktiviteleri, notları ve fiyat tekliflerini buradan yönetiyoruz. Sağ altta da bir yapay zekâ asistanı var.

Backend ayrı bir repoda (ASP.NET Core 8). Bu proje tek başına çalışmıyor, arkada API'nin ayakta olması gerekiyor.

## Neler var

- **Genel bakış:** müşteri sayısı, açık aktiviteler, açıktaki teklif tutarı, kazanılan tutar. Altında yaklaşan aktiviteler ve son teklifler.
- **Müşteriler:** arama, durum filtresi ve sunucu taraflı sayfalama. Bir müşteriye tıklayınca kartı açılıyor aktiviteleri, notları ve teklifleri orada.
- **Teklifler:** kalem kalem teklif hazırlama (miktar, birim fiyat, iskont, KDV), durum takibi (taslak → gönderildi → kabul/red), yazdırma / PDF.
- **Raporlar:** müşteri dağılımı, duruma göre teklif tutarları, son 6 ayın teklif grafiği, en yüksek tutarlı müşterilerin grafiği mecvut
- **Asistan:** "A kişisi için yarın 14:00'te toplantı ekle" gibi istekleri anlıyor. Kayıt değiştirecekse önce bir onay kartı gösteriyor, onaylamazsan hiçbir şey yapmıyor.

## Kullandıklarım

React 18, TypeScript, Vite 5, react-router-dom 6. İkonlar için lucide-react, tarih seçici için react-datepicker (+ date-fns), grafikler için recharts lib.


## Çalıştırma

Node 18+ lazım

```bash
npm install
npm run dev
```

`http://localhost:5173` adresinde açılıyor.

Derlemek için:

```bash
npm run build     #  tsc ile tip kontrolü
npm run preview   # derlenmiş hâli yerelde denemek
```

## Yayın

Frontend Vercel'de, backend Railway'de. 