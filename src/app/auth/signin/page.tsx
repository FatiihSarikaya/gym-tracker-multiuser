'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Dumbbell, Star, Users, TrendingUp, Mail, Phone, User, CheckCircle, Zap, Shield, Clock, Award, Calendar } from 'lucide-react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    surname: '',
    phone: '',
    message: ''
  })
  const [contactLoading, setContactLoading] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)
  const router = useRouter()
  const { push } = useToast()

  // Gym background images - rotates randomly
  const gymImages = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', // Modern gym
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', // Weight training
    'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', // Fitness equipment
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'  // Athletic gym
  ]
  
  const selectedImage = gymImages[Math.floor(Math.random() * gymImages.length)]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        push({
          variant: 'error',
          title: 'Giriş Hatası',
          message: 'Email veya şifre hatalı.'
        })
      } else {
        push({
          variant: 'success',
          title: 'Başarılı',
          message: 'Giriş yapıldı.'
        })
        router.push('/')
      }
    } catch (error) {
      push({
        variant: 'error',
        title: 'Hata',
        message: 'Bir hata oluştu.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      })

      if (response.ok) {
        setContactSuccess(true)
        setContactForm({ name: '', surname: '', phone: '', message: '' })
        setTimeout(() => {
          setShowContactModal(false)
          setContactSuccess(false)
        }, 3000)
      } else {
        const error = await response.json()
        push({
          variant: 'error',
          title: 'Hata',
          message: error.message || 'Mesaj gönderilemedi'
        })
      }
    } catch (error) {
      push({
        variant: 'error',
        title: 'Hata',
        message: 'Bağlantı hatası'
      })
    } finally {
      setContactLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
          animation-delay: 3s;
        }
      `}</style>

      <div className="min-h-screen relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          {/* Gym Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
            style={{
              backgroundImage: `url('${selectedImage}')`
            }}
          ></div>
          
          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-blue-900/50 to-purple-900/60"></div>
          
          {/* Floating Shapes Animation */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-4000"></div>
          </div>
          
          {/* Gym Equipment Silhouettes */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 animate-float">
              <Dumbbell size={40} className="text-white" />
            </div>
            <div className="absolute top-40 right-32 animate-float-delayed">
              <TrendingUp size={35} className="text-white" />
            </div>
            <div className="absolute bottom-32 left-40 animate-float">
              <Users size={45} className="text-white" />
            </div>
            <div className="absolute bottom-20 right-20 animate-float-delayed">
              <Star size={30} className="text-white" />
            </div>
            <div className="absolute top-1/2 left-10 animate-float">
              <Award size={25} className="text-white" />
            </div>
            <div className="absolute top-1/3 left-1/2 animate-float-delayed">
              <Zap size={28} className="text-white" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Left Side - Login Form */}
              <div className="max-w-md w-full mx-auto lg:mx-0">
                {/* Glassmorphism Card */}
                <div className="backdrop-blur-xl bg-white/15 rounded-2xl shadow-2xl border border-white/30 p-8 hover:bg-white/20 transition-all duration-300">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                      <Dumbbell className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Hoş Geldiniz
                    </h2>
                    <p className="text-white/80">
                      Gym Tracker hesabınızla giriş yapın
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="text-white/90 font-medium">
                        Email Adresi
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        className="mt-2 w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="text-white/90 font-medium">
                        Şifre
                      </label>
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        className="mt-2 w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        placeholder="••••••••"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Giriş yapılıyor...
                        </div>
                      ) : (
                        'Giriş Yap'
                      )}
                    </Button>

                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/20" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-transparent text-white/70">veya</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => setShowContactModal(true)}
                        className="w-full h-12 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        <Mail className="w-5 h-5 mr-2" />
                        Bizimle İletişime Geçin
                      </Button>
                    </div>

                    <div className="text-center">
                      <p className="text-white/70 text-sm">
                        Hesabınız yok mu?{' '}
                        <Link href="/auth/signup" className="text-blue-300 hover:text-blue-200 font-medium transition-colors">
                          Kayıt olun
                        </Link>
                      </p>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Side - Features */}
              <div className="text-white lg:pl-8">
                <div className="max-w-lg backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Gym Tracker
                    </span>
                    <br />
                    ile Salonunuzu Yönetin
                  </h1>
                  
                  <p className="text-xl text-white/80 mb-8 leading-relaxed">
                    Modern spor salonu yönetim sistemi ile üyelerinizi, ödemelerinizi ve ders programlarınızı kolayca takip edin.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">Üye Yönetimi</h3>
                        <p className="text-white/70 text-sm">Üyelerinizi kolayca kaydedin ve takip edin</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">Ödeme Takibi</h3>
                        <p className="text-white/70 text-sm">Ödemeleri ve gecikmeleri anlık görün</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">Ders Planı</h3>
                        <p className="text-white/70 text-sm">Haftalık programları düzenleyin</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">Güvenli</h3>
                        <p className="text-white/70 text-sm">Verileriniz güvende ve korunur</p>
                      </div>
                    </div>
                  </div>

                 
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false)
          setContactSuccess(false)
          setContactForm({ name: '', surname: '', phone: '', message: '' })
        }}
        title="Bizimle İletişime Geçin"
      >
        {contactSuccess ? (
          <div className="text-center py-8">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mesajınız Gönderildi!</h3>
            <p className="text-gray-600">En kısa sürede size dönüş yapacağız.</p>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-gray-700 font-medium">Ad</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactForm({...contactForm, name: e.target.value})}
                  placeholder="Adınız"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="surname" className="text-gray-700 font-medium">Soyad</label>
                <input
                  id="surname"
                  type="text"
                  required
                  value={contactForm.surname}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactForm({...contactForm, surname: e.target.value})}
                  placeholder="Soyadınız"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="text-gray-700 font-medium">Telefon</label>
              <input
                id="phone"
                type="tel"
                required
                value={contactForm.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactForm({...contactForm, phone: e.target.value})}
                placeholder="0500 000 00 00"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="message" className="text-gray-700 font-medium">Mesaj (İsteğe Bağlı)</label>
              <textarea
                id="message"
                rows={3}
                value={contactForm.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContactForm({...contactForm, message: e.target.value})}
                placeholder="Detayları buraya yazabilirsiniz..."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowContactModal(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={contactLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
              >
                {contactLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gönderiliyor...
                  </div>
                ) : (
                  'Gönder'
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
