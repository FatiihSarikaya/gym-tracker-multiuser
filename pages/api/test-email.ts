import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    // Environment variables kontrolü
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS
    const contactEmail = process.env.CONTACT_EMAIL

    console.log('🔍 Environment Variables Check:')
    console.log('EMAIL_USER:', emailUser ? '✅ Set' : '❌ Missing')
    console.log('EMAIL_PASS:', emailPass ? '✅ Set' : '❌ Missing')
    console.log('CONTACT_EMAIL:', contactEmail ? '✅ Set' : '❌ Missing')

    if (!emailUser || !emailPass) {
      return res.status(400).json({ 
        success: false,
        message: 'Email configuration missing',
        details: {
          EMAIL_USER: emailUser ? 'OK' : 'MISSING',
          EMAIL_PASS: emailPass ? 'OK' : 'MISSING'
        }
      })
    }

    // Email transporter test
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })

    console.log('📧 Testing email connection...')

    // Connection test
    await transporter.verify()
    console.log('✅ SMTP connection successful')

    // Test email gönder
    const testEmail = {
      from: emailUser,
      to: contactEmail || emailUser,
      subject: '🧪 Gym Tracker Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2>🎉 Email Sistemi Çalışıyor!</h2>
          <p>Bu test email'i Gym Tracker sisteminden gönderilmiştir.</p>
          <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
          <p><strong>Gönderen:</strong> ${emailUser}</p>
          <p><strong>Alıcı:</strong> ${contactEmail || emailUser}</p>
          <hr>
          <p style="color: green;">✅ Email sistemi başarıyla çalışıyor!</p>
        </div>
      `,
      text: `
Test Email - Gym Tracker

Email sistemi başarıyla çalışıyor!
Tarih: ${new Date().toLocaleString('tr-TR')}
Gönderen: ${emailUser}
Alıcı: ${contactEmail || emailUser}
      `
    }

    await transporter.sendMail(testEmail)
    console.log('✅ Test email sent successfully')

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully!',
      details: {
        from: emailUser,
        to: contactEmail || emailUser,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Email test failed:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
}
