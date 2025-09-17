'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Modal from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Dumbbell, Star, Users, TrendingUp, Mail, Phone, User, CheckCircle } from 'lucide-react'

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
        }, 2000)
      } else {
        throw new Error('İletişim formu gönderilemedi')
      }
    } catch (error) {
      push({
        variant: 'error',
        title: 'Hata',
        message: 'İletişim formu gönderilemedi. Lütfen tekrar deneyin.'
      })
    } finally {
      setContactLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
          {/* Floating Shapes Animation */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                  <Dumbbell size={48} className="text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-extrabold text-white mb-2">
                Gym Tracker
              </h1>
              <p className="text-xl text-blue-100 mb-4">
                Spor Salonu Yönetim Sistemi
              </p>
              <p className="text-sm text-blue-200">
                Profesyonel spor salonu işletmeciliği için modern çözüm
              </p>
            </div>

            {/* Login Card */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl text-gray-800">Giriş Yapın</CardTitle>
                <CardDescription className="text-gray-600">
                  Hesabınıza erişim sağlayın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-gray-700 font-medium">E-posta</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ornek@email.com"
                        className="mt-1 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="password" className="text-gray-700 font-medium">Şifre</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="mt-1 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                    disabled={isLoading}
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
                </form>

                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-gray-500 font-medium">
                        Hesabınız yok mu?
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={() => setShowContactModal(true)}
                      className="w-full h-12 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Bizimle İletişime Geçin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <Users className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-white text-sm font-medium">Üye Yönetimi</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <TrendingUp className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-white text-sm font-medium">Analitik Raporlar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Bizimle İletişime Geçin"
      >
        <div className="p-6">
          {contactSuccess ? (
            <div className="text-center">
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
                  <Label htmlFor="name" className="text-gray-700 font-medium">Ad</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    placeholder="Adınız"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="surname" className="text-gray-700 font-medium">Soyad</Label>
                  <Input
                    id="surname"
                    type="text"
                    required
                    value={contactForm.surname}
                    onChange={(e) => setContactForm({...contactForm, surname: e.target.value})}
                    placeholder="Soyadınız"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-gray-700 font-medium">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                  placeholder="0500 000 00 00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-gray-700 font-medium">Mesaj (İsteğe Bağlı)</Label>
                <textarea
                  id="message"
                  rows={3}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
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
        </div>
      </Modal>

    </>
  )
}
