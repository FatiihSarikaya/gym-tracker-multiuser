# 📧 Email Kurulum Rehberi

## Gmail ile Email Gönderimi Kurulumu

### 1. Gmail App Password Oluşturma

1. **Google hesabınıza gidin**: https://myaccount.google.com/
2. **Güvenlik** sekmesine tıklayın
3. **2-Step Verification** aktif olmalı (eğer değilse aktif edin)
4. **App passwords** bölümüne gidin
5. **Select app**: Mail
6. **Select device**: Other (custom name)
7. **Name**: "Gym Tracker"
8. **Generate** butonuna tıklayın
9. **16 karakterlik şifreyi** kopyalayın

### 2. Environment Variables

`.env.local` dosyanıza şu değişkenleri ekleyin:

```bash
# Email Configuration
EMAIL_USER=sizin-gmail@gmail.com
EMAIL_PASS=abcd-efgh-ijkl-mnop  # 16 karakterlik app password
CONTACT_EMAIL=iletisim@firmaniz.com  # Mesajların geleceği email
```

### 3. Test Etme

1. Login sayfasına gidin
2. "Bizimle İletişime Geçin" butonuna tıklayın
3. Formu doldurup gönderin
4. Email'inizde mesajı kontrol edin

## 🎨 Email Template Özellikleri

### Modern HTML Tasarım
- ✅ Responsive tasarım
- ✅ Gradient renkler
- ✅ Emoji kullanımı
- ✅ Profesyonel görünüm

### İçerik
- 👤 Ad Soyad
- 📞 Telefon bilgisi
- 📅 Tarih/saat
- 💬 Mesaj (opsiyonel)
- 🏋️ Gym Tracker branding

## 🔧 Diğer Email Sağlayıcıları

### Outlook/Hotmail
```javascript
host: 'smtp-mail.outlook.com',
port: 587,
```

### Yahoo
```javascript
host: 'smtp.mail.yahoo.com',
port: 587,
```

### Custom SMTP
```javascript
host: 'mail.yourcompany.com',
port: 587,
auth: {
  user: 'no-reply@yourcompany.com',
  pass: 'your-password'
}
```

## 📊 Email Analitik (Gelecek Özellik)

- Email açılma oranları
- Tıklama istatistikleri
- Response süreleri
- Müşteri conversion oranları

## 🔒 Güvenlik Notları

- ❌ Asla şifreleri kod'da saklamayın
- ✅ Environment variables kullanın
- ✅ App password kullanın (normal şifre değil)
- ✅ 2FA aktif olsun
- ✅ Regular olarak app password'leri yenileyin

## 🚨 Troubleshooting

### "Authentication failed" hatası
- App password doğru mu kontrol edin
- 2FA aktif mi kontrol edin
- Gmail'de "Less secure app access" kapalı olmalı

### "Connection timeout" hatası
- Internet bağlantınızı kontrol edin
- Firewall ayarlarını kontrol edin
- SMTP portlarının açık olduğunu kontrol edin

### Email gönderilmiyor
- CONTACT_EMAIL doğru mu kontrol edin
- Spam klasörünü kontrol edin
- Gmail gönderim limitlerini kontrol edin (günlük 500)
