# Plaka Peşinde

Türkiye'nin 81 ilini plaka kodları ve haritadaki konumlarıyla öğrenmek için hazırlanmış küçük bir web oyunu.

Her tur iki aşamadan oluşur: önce plakanın hangi ile ait olduğunu bulursun, ardından o ili Türkiye haritasında işaretlersin.

## Özellikler

- 81 il için plaka, bölge ve komşu il verileri
- İsim bulma ve haritada konum gösterme olmak üzere iki aşamalı oyun akışı
- Aşamalı ipuçları: harf açma, bölge vurgulama ve komşu illeri gösterme
- Mobilde haritayı yakınlaştırma, sürükleme ve başlangıç görünümüne dönme
- Tarayıcıda saklanan oyun ilerlemesi; sayfa yenilense de kaldığın yerden devam etme
- İlk 10 il, bölge tamamlama ve ipucusuz seri gibi oyun içi kutlama bildirimleri
- Tamamlanan illeri gösteren ilerleme menüsü
- 81 il tamamlandığında konfetiyle bitiş ekranı

## Teknolojiler

- Next.js 16
- React 19
- TypeScript
- CSS Modules
- `canvas-confetti`

## Yerelde çalıştırma

Gereksinim: Node.js 20 veya daha güncel bir sürüm.

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde açılır.

## Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Kod kalitesi kontrolü
npm run lint

# Üretim derlemesi
npm run build

# Üretim sunucusunu çalıştırma
npm run start
```

## İlerleme kaydı

Oyun ilerlemesi tarayıcının `localStorage` alanında `platequest-progress` anahtarıyla saklanır. Bu nedenle aynı tarayıcıda sayfa yenilendiğinde veya ana sayfaya dönüldüğünde oyun devam eder.

“Baştan Başla” ya da “İlerlemeyi Sıfırla” seçeneği; tamamlanan illeri, ipucusuz seriyi ve mevcut oyun turunu temizler.

## Yol haritası

- Karışık plaka sıralaması ve kısa oyun turları
- Yanlış veya ipucuyla bulunan iller için tekrar modu
- İl → plaka ve haritada gösterilen il → isim gibi ek soru türleri
