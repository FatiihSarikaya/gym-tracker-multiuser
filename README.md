# Gym Tracker - Spor Salonu Takip Sistemi

Modern ve kullanıcı dostu bir spor salonu yönetim sistemi. Next.js, React ve Tailwind CSS kullanılarak geliştirilmiştir.

## Özellikler

### 🏋️ Yoklama Sistemi
- Günlük yoklama takibi
- Geldi, gelmedi, ekstra geldi durumları
- Tarih bazlı filtreleme
- İstatistiksel raporlar

### 💰 Ödeme Takibi
- Üye ödemelerinin takibi
- Ödendi, bekliyor, gecikmiş durumları
- Finansal raporlar
- Ödeme geçmişi

### 📚 Ders Planlama (8-12 Ders)
- Üye bazlı ders planlaması
- İlerleme takibi
- Kalan ders sayısı
- Ders tamamlama oranları

### 📅 Haftalık Program
- Üyelerin haftalık programları
- Günlük ders planları
- Program ekleme/düzenleme
- Haftalık istatistikler

### 👥 Üye Yönetimi
- Aktif üyeler
- Dondurulmuş üyeler
- Ayrılmış üyeler
- Detaylı üye profilleri

### 📊 Üye Profilleri
- Kişisel bilgiler
- Paket bilgileri
- Ders ilerlemesi
- Yoklama geçmişi
- Ödeme geçmişi
- Telafi hakkı takibi

## Teknolojiler

- **Next.js 14** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **Lucide React** - İkonlar
- **Radix UI** - UI bileşenleri
- **date-fns** - Tarih işlemleri

## Kurulum

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd gym-tracker
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## Proje Yapısı

```
src/
├── app/                 # Next.js app router
│   ├── globals.css     # Global stiller
│   ├── layout.tsx      # Ana layout
│   └── page.tsx        # Ana sayfa
├── components/          # React bileşenleri
│   ├── ui/            # Temel UI bileşenleri
│   ├── Dashboard.tsx   # Ana dashboard
│   ├── AttendanceTracker.tsx
│   ├── PaymentTracker.tsx
│   ├── LessonPlanner.tsx
│   ├── WeeklySchedule.tsx
│   ├── MemberList.tsx
│   └── MemberProfile.tsx
└── lib/               # Utility fonksiyonları
    └── utils.ts
```

## Kullanım

### Dashboard
Ana sayfa genel istatistikleri ve hızlı işlemleri gösterir.

### Yoklama
- Günlük yoklama alma
- Durum filtreleme (Geldi/Gelmedi/Ekstra)
- Tarih bazlı görüntüleme

### Ödemeler
- Ödeme durumu takibi
- Finansal raporlar
- Ödeme geçmişi

### Ders Planı
- 8-12 ders planlaması
- İlerleme takibi
- Kalan ders sayısı

### Haftalık Program
- Üye programları
- Günlük ders planları
- Program yönetimi

### Üyeler
- Üye listesi
- Durum filtreleme
- Arama fonksiyonu
- Detaylı profiller

## Geliştirme

### Yeni Bileşen Ekleme
1. `src/components/` klasöründe yeni bileşen oluşturun
2. TypeScript tip tanımlarını ekleyin
3. Tailwind CSS ile stillendirin
4. Ana dashboard'a entegre edin

### Veri Yönetimi
Şu anda mock veriler kullanılmaktadır. Gerçek uygulama için:
- API entegrasyonu
- Veritabanı bağlantısı
- State management (Redux/Zustand)

## Lisans

MIT License

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun 