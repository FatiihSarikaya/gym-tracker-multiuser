# 🏋️ Gym Tracker - Multi-User Gym Management System

Modern, kullanıcı dostu spor salonu yönetim sistemi. Next.js, MongoDB ve TypeScript ile geliştirilmiştir.

## ✨ Özellikler

### 👥 Çok Kullanıcılı Sistem
- Kullanıcı kaydı ve giriş sistemi (NextAuth.js)
- Her kullanıcının kendi verileri ayrı tutulur
- Güvenli oturum yönetimi

### 🏃‍♂️ Üye Yönetimi
- Üye ekleme/düzenleme/silme
- Aktif/pasif üye durumu
- Üye profilleri ve iletişim bilgileri

### 💳 Ödeme Takibi
- Üye ödemeleri izleme
- Ödeme durumları: Ödedi, Ödemedi, Gecikti
- Paket fiyatları ve ödeme tarihleri

### 📅 Ders Planlama
- Ders oluşturma ve düzenleme
- Üyeleri derslere atama
- Eğitmen ve saat planlaması

### 📊 Yoklama Sistemi
- Günlük yoklama alma
- Üye check-in/check-out
- Ders katılım takibi

### 📈 Dashboard ve Raporlama
- Aktif üye sayısı
- Günlük gelişler
- Bekleyen ödemeler
- Haftalık ders programı

## 🚀 Kurulum

### Gereksinimler
- Node.js 18.0 veya üzeri
- MongoDB
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın**
   ```bash
   git clone [repository-url]
   cd gym-tracker
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   # veya
   yarn install
   ```

3. **Environment dosyasını oluşturun**
   ```bash
   cp .env.example .env.local
   ```

4. **Environment değişkenlerini düzenleyin**
   ```
   NEXTAUTH_SECRET=your-secret-key-here
   MONGODB_URI=mongodb://localhost:27017/gym-tracker
   ```

5. **MongoDB'yi başlatın**
   ```bash
   # MongoDB'nin çalıştığından emin olun
   ```

6. **Geliştirme sunucusunu başlatın**
   ```bash
   npm run dev
   # veya
   yarn dev
   ```

7. **Tarayıcıda açın**
   ```
   http://localhost:3000
   ```

## 🔧 Teknolojiler

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes
- **Veritabanı**: MongoDB, Mongoose
- **Kimlik Doğrulama**: NextAuth.js
- **UI Kütüphanesi**: Tailwind CSS, Custom Components
- **Tarih İşlemleri**: Date-fns
- **Form Yönetimi**: React Hooks

## 📝 Environment Değişkenleri

```bash
# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/gym-tracker

# Development
NODE_ENV=development
```

## 🗂️ Proje Yapısı

```
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React bileşenleri
│   ├── lib/              # Yardımcı kütüphaneler
│   ├── models/           # MongoDB modelleri
│   ├── services/         # API servis katmanı
│   └── types/            # TypeScript type definitions
├── pages/
│   └── api/              # API endpoints
├── scripts/              # Veritabanı migration scripts
└── middleware.ts         # Auth middleware
```

## 🔐 Güvenlik

- Tüm API endpoints kimlik doğrulama gerektirir
- Kullanıcı verileri izole edilmiştir
- Şifreler bcrypt ile hashlenir
- JWT tabanlı oturum yönetimi

## 📱 Kullanım

1. **Kayıt/Giriş**: `/auth/signup` veya `/auth/signin`
2. **Dashboard**: Ana sayfa - genel istatistikler
3. **Üyeler**: Üye ekleme/düzenleme
4. **Ödemeler**: Ödeme durumu takibi
5. **Ders Planı**: Ders oluşturma ve atama
6. **Yoklama**: Günlük yoklama alma
7. **Haftalık Program**: Haftalık ders takvimi

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Herhangi bir sorunuz varsa lütfen issue açın.