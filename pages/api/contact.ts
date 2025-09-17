import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

interface ContactRequest {
  name: string
  surname: string
  phone: string
  message?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { name, surname, phone, message }: ContactRequest = req.body

  // Validasyon
  if (!name || !surname || !phone) {
    return res.status(400).json({ 
      message: 'Ad, soyad ve telefon bilgisi gereklidir' 
    })
  }

  try {
    // Email transporter oluştur (Gmail kullanımı için)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER, // Gmail adresiniz
        pass: process.env.EMAIL_PASS, // Gmail app password
      },
    })

    // Email içeriği
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-row { display: flex; margin-bottom: 15px; }
        .label { font-weight: bold; min-width: 100px; color: #555; }
        .value { color: #333; }
        .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .highlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏋️ Gym Tracker</h1>
            <p>Yeni İletişim Talebi</p>
        </div>
        
        <div class="content">
            <h2 class="highlight">İletişim Bilgileri</h2>
            
            <div class="info-row">
                <div class="label">👤 Ad Soyad:</div>
                <div class="value">${name} ${surname}</div>
            </div>
            
            <div class="info-row">
                <div class="label">📞 Telefon:</div>
                <div class="value"><strong style="color: #667eea; font-size: 16px;">${phone}</strong></div>
            </div>
            
            <div class="info-row">
                <div class="label">📧 İletişim:</div>
                <div class="value">☝️ Müşteriyle iletişim için yukarıdaki telefon numarasını kullanın</div>
            </div>
            
            <div class="info-row">
                <div class="label">📅 Tarih:</div>
                <div class="value">${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</div>
            </div>
            
            ${message ? `
            <div class="message-box">
                <h3 style="margin-top: 0; color: #667eea;">💬 Mesaj:</h3>
                <p style="margin-bottom: 0;">${message}</p>
            </div>
            ` : ''}
            
            <div class="footer">
                <p>Bu mesaj Gym Tracker iletişim formundan gönderilmiştir.</p>
                <p><strong>⚡ Hemen dönüş yaparak müşteri memnuniyetini sağlayın!</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
    `

    // Email gönder
    await transporter.sendMail({
      from: `"Gym Tracker İletişim" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL || 'canfatih445@gmail.com',
      subject: `🏋️ Gym Tracker - Yeni İletişim Talebi: ${name} ${surname}`,
      // Reply-To header'ı ekliyoruz - böylece cevap verirken müşterinin numarasına gidecek
      replyTo: `"${name} ${surname}" <noreply@gymtracker.com>`,
      html: emailContent,
      // Text versiyonu da ekleyelim
      text: `
Gym Tracker - Yeni İletişim Talebi

👤 Ad Soyad: ${name} ${surname}
📞 Telefon: ${phone}
📧 Müşteriyle iletişim için telefon kullanın: ${phone}
📅 Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}

${message ? `💬 Mesaj: ${message}` : ''}

📝 Bu mesaj Gym Tracker iletişim formundan gönderilmiştir.
🔔 Müşteriyle iletişim için yukarıdaki telefon numarasını kullanın.
      `
    })

    // Başarılı response
    return res.status(200).json({ 
      message: 'İletişim formu başarıyla gönderildi',
      success: true 
    })

  } catch (error) {
    console.error('Email gönderme hatası:', error)
    
    // Hata durumunda fallback - veritabanına kaydet
    // TODO: İsterseniz burada veritabanına da kaydedebiliriz
    
    return res.status(500).json({ 
      message: 'Email gönderilirken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : 'Server error'
    })
  }
}
