# Plaka Peşinde

Türkiye'nin 81 ilini plaka kodları ve haritadaki konumlarıyla öğrenmek için hazırlanmış bir web oyunu.

Her il iki aşamadan oluşur: önce ekrandaki plakanın hangi ile ait olduğunu bulursun, ardından o ili Türkiye haritasında işaretlersin. İl adını yazmak yerine doğrudan haritadan seçmek de mümkündür.

## Oyun modları

- **Sıralı Tur:** Plakalar 01'den 81'e numara sırasıyla gelir.
- **Karışık Tur:** Plakalar her oyunda rastgele bir sırayla gelir.

Her modun ilerlemesi ayrı tutulur; bir moddaki oyun diğerini etkilemez.

## Süre ve ipuçları

Oyun süresi sunucuda tutulur: oyun başladığında ve bittiğinde zaman damgası sunucu tarafından kaydedilir, böylece sonuç istemci tarafında değiştirilemez. Kullanılan her ipucu final süreye ceza olarak eklenir:

| İpucu | Aşama | Ceza |
|---|---|---|
| Bir harf aç | İl adını bul | +5 sn |
| Bölgeyi göster | Haritada göster | +10 sn |
| Komşuları göster | Haritada göster | +15 sn |

81 il tamamlandığında konfetili bitiş ekranında oyun süresi, ipucu cezası ve final süre gösterilir.

## Özellikler

- E-posta ve şifreyle kayıt, giriş, e-posta doğrulama ve şifre sıfırlama
- Hesaba bağlı oyun ilerlemesi; farklı cihaz veya tarayıcıdan kaldığın yerden devam etme
- 81 il için plaka, bölge ve komşu il verileri
- Mobilde haritayı yakınlaştırma, sürükleme ve başlangıç görünümüne dönme
- İlk 10 il, bölge tamamlama ve ipucusuz seri gibi oyun içi kutlama bildirimleri
- Tamamlanan illeri gösteren ilerleme menüsü ve ilerlemeyi sıfırlama
- Profil sayfasında hesap bilgileri ve şifre değiştirme

## Sayfalar

| Yol | Açıklama |
|---|---|
| `/` | Başlangıç ekranı ve oyun modu seçimi |
| `/login` | Giriş |
| `/register` | Kayıt |
| `/forgot-password` | Şifre sıfırlama bağlantısı isteme |
| `/reset-password` | Yeni şifre belirleme |
| `/game/ordered-plate` | Sıralı Tur (giriş gerekli) |
| `/game/random-plate` | Karışık Tur (giriş gerekli) |
| `/profile` | Profil ve şifre değiştirme (giriş gerekli) |

API uç noktaları:

- `POST /api/game/start` — Oyun session'ı başlatır veya aktif olanı döndürür.
- `POST /api/game/finish` — Session'ı bitirir, süreyi ve ipucu cezasını hesaplayıp sonucu kaydeder.
- `GET /auth/callback` — Supabase e-posta bağlantıları (doğrulama, şifre sıfırlama) için oturum değişimi.

## Teknolojiler

- Next.js 16 (App Router, `proxy.ts`)
- React 19
- TypeScript
- Supabase (kimlik doğrulama ve PostgreSQL veritabanı)
- CSS Modules
- `canvas-confetti`

## Yerelde çalıştırma

Gereksinimler:

- Node.js 20 veya daha güncel bir sürüm
- Bir Supabase projesi

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Ortam değişkenlerini ayarla

Proje kök dizininde bir `.env.local` dosyası oluştur:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<proje-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

Değerler Supabase panelinde **Project Settings → API Keys** altında bulunur.

> `SUPABASE_SERVICE_ROLE_KEY` gizli bir anahtardır ve yalnızca sunucuda (`/api/game/*`) kullanılır. Başına `NEXT_PUBLIC_` ekleme ve paylaşma. `.env*` dosyaları `.gitignore` içindedir.

### 3. Veritabanı

Veritabanı şeması (tablolar, RLS policy'leri, trigger'lar ve yetkiler) `supabase/migrations/` klasöründe tutulur.

| Tablo | Kullanım |
|---|---|
| `profiles` | Kullanıcı adı; kayıt olunca `auth.users` üzerindeki trigger ile otomatik oluşturulur |
| `user_game_progress` | Kullanıcı ve oyun modu başına oyun ilerlemesi |
| `game_sessions` | Oyun başlangıç ve bitiş zamanları |
| `game_results` | Tamamlanan oyunların süre ve ipucu sonuçları (`final_time_ms` veritabanında hesaplanır) |
| `leaderboard_entries` | Skor tablosu için hazırlandı, henüz uygulamada kullanılmıyor |

`profiles` ve `user_game_progress` tablolarına kullanıcının kendi oturumuyla, `game_sessions` ve `game_results` tablolarına ise sunucudan gizli anahtarla erişilir. Tüm tablolarda RLS açıktır.

Supabase CLI projeye geliştirme bağımlılığı olarak eklidir (`npx supabase ...`). Şema komutları için [Docker Desktop](https://www.docker.com/products/docker-desktop/) gerekir.

```bash
# Supabase hesabına giriş ve projeyi bağlama (bir kez)
npx supabase login
npx supabase link

# Yeni bir şema değişikliği için migration dosyası oluşturma
npx supabase migration new <degisiklik-adi>

# Migration'ları canlı veritabanına uygulama
npx supabase db push --remote

# Şema değiştiyse TypeScript tiplerini yenileme
npm run db:types

# Dashboard'dan yapılmış değişiklikleri migration olarak geri çekme
npx supabase db pull --remote

# Yerel ve canlı migration geçmişini karşılaştırma
npx supabase migration list --remote
```

> Supabase CLI v3'te komutlar varsayılan olarak yerel Supabase'i (`supabase start`) hedefler; canlı proje için `--remote` gerekir.

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde açılır.

> **Windows notu:** PowerShell'de `npm.ps1 cannot be loaded because running scripts is disabled` hatası alırsan bir kez `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` çalıştır ya da komutları `npm.cmd` ile kullan.

## Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Kod kalitesi kontrolü
npm run lint

# Testler (Vitest); dosya değiştikçe tekrar çalıştırmak için: npm run test:watch
npm test

# Üretim derlemesi
npm run build

# Üretim sunucusunu çalıştırma
npm run start

# Veritabanı şemasından TypeScript tiplerini yeniden üretme (types/database.ts)
npm run db:types
```

`main`'e her push'ta ve açılan her PR'da GitHub Actions lint, test ve build'i çalıştırır (`.github/workflows/ci.yml`).

## Proje yapısı

```
app/                  Sayfalar, API route'ları ve layout'lar
  (protected)/        Giriş gerektiren sayfalar (oyun, profil)
  api/game/           Oyun başlatma ve bitirme uç noktaları
components/           Oyun, harita, profil ve ortak arayüz bileşenleri
data/provinces.ts     81 ilin plaka, bölge ve komşu bilgileri
lib/                  Supabase istemcileri, ilerleme ve süre hesaplama yardımcıları
types/game.ts         Oyun modu ve sonuç tipleri
proxy.ts              Supabase oturumunu yenileyen Next.js proxy'si
supabase/             Supabase CLI ayarları ve veritabanı migration'ları
```

## Yol haritası

- Yanlış veya ipucuyla bulunan iller için tekrar modu
- İl → plaka ve haritada gösterilen il → isim gibi ek soru türleri
- Kısa oyun turları
- Skor tablosu (`leaderboard_entries` tablosu hazır)
