'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Phone, Mail, Calendar, Clock, BookOpen, CreditCard, MapPin, Edit } from 'lucide-react'

export default function MemberProfile() {
  const [activeTab, setActiveTab] = useState('overview')

  const member = {
    id: 1,
    name: 'Ahmet Yılmaz',
    phone: '0532 123 45 67',
    email: 'ahmet@email.com',
    address: 'İstanbul, Türkiye',
    status: 'active',
    package: 'Aylık Paket',
    startDate: '2024-01-01',
    endDate: '2024-02-01',
    remainingLessons: 8,
    totalLessons: 12,
    completedLessons: 4,
    makeUpLessons: 2,
    lastVisit: '2024-01-15',
    nextLesson: '2024-01-16',
    paymentStatus: 'paid',
    totalPaid: 500,
    nextPayment: '2024-02-01',
    nextPaymentAmount: 500
  }

  const attendanceHistory = [
    { date: '2024-01-15', status: 'present', time: '09:15' },
    { date: '2024-01-12', status: 'present', time: '10:30' },
    { date: '2024-01-10', status: 'absent', time: null },
    { date: '2024-01-08', status: 'present', time: '14:00' },
    { date: '2024-01-05', status: 'extra', time: '16:30' }
  ]

  const lessonHistory = [
    { date: '2024-01-15', lesson: 'Ders 4', status: 'completed', notes: 'İyi performans' },
    { date: '2024-01-12', lesson: 'Ders 3', status: 'completed', notes: 'Temel teknikler' },
    { date: '2024-01-10', lesson: 'Ders 3', status: 'cancelled', notes: 'Hasta olduğu için iptal' },
    { date: '2024-01-08', lesson: 'Ders 2', status: 'completed', notes: 'İlerleme kaydedildi' },
    { date: '2024-01-05', lesson: 'Ders 1', status: 'completed', notes: 'İlk ders' }
  ]

  const paymentHistory = [
    { date: '2024-01-01', amount: 500, status: 'paid', method: 'Nakit' },
    { date: '2023-12-01', amount: 500, status: 'paid', method: 'Kredi Kartı' },
    { date: '2023-11-01', amount: 500, status: 'paid', method: 'Banka Transferi' }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Aktif</Badge>
      case 'frozen':
        return <Badge variant="warning">Dondurulmuş</Badge>
      case 'left':
        return <Badge variant="destructive">Ayrılmış</Badge>
      case 'paid':
        return <Badge variant="success">Ödendi</Badge>
      case 'pending':
        return <Badge variant="warning">Bekliyor</Badge>
      case 'completed':
        return <Badge variant="success">Tamamlandı</Badge>
      case 'cancelled':
        return <Badge variant="destructive">İptal</Badge>
      case 'present':
        return <Badge variant="success">Geldi</Badge>
      case 'absent':
        return <Badge variant="destructive">Gelmedi</Badge>
      case 'extra':
        return <Badge variant="info">Ekstra</Badge>
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>
    }
  }

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: User },
    { id: 'attendance', label: 'Yoklama Geçmişi', icon: Calendar },
    { id: 'lessons', label: 'Ders Geçmişi', icon: BookOpen },
    { id: 'payments', label: 'Ödeme Geçmişi', icon: CreditCard }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'attendance':
        return (
          <div className="space-y-4">
            {attendanceHistory.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.date}</p>
                    {record.time && <p className="text-sm text-gray-500">{record.time}</p>}
                  </div>
                </div>
                {getStatusBadge(record.status)}
              </div>
            ))}
          </div>
        )
      case 'lessons':
        return (
          <div className="space-y-4">
            {lessonHistory.map((lesson, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-green-100">
                    <BookOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{lesson.lesson}</p>
                    <p className="text-sm text-gray-500">{lesson.date}</p>
                    <p className="text-xs text-gray-400">{lesson.notes}</p>
                  </div>
                </div>
                {getStatusBadge(lesson.status)}
              </div>
            ))}
          </div>
        )
      case 'payments':
        return (
          <div className="space-y-4">
            {paymentHistory.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-purple-100">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">₺{payment.amount}</p>
                    <p className="text-sm text-gray-500">{payment.date}</p>
                    <p className="text-xs text-gray-400">{payment.method}</p>
                  </div>
                </div>
                {getStatusBadge(payment.status)}
              </div>
            ))}
          </div>
        )
      default:
        return (
          <div className="space-y-6">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Kişisel Bilgiler</span>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Düzenle
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Ad Soyad:</span>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Telefon:</span>
                      <span className="font-medium">{member.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">E-posta:</span>
                      <span className="font-medium">{member.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Adres:</span>
                      <span className="font-medium">{member.address}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Durum:</span>
                      {getStatusBadge(member.status)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Paket:</span>
                      <span className="font-medium">{member.package}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Başlangıç:</span>
                      <span className="font-medium">{member.startDate}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Bitiş:</span>
                      <span className="font-medium">{member.endDate}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ders İlerlemesi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tamamlanan</span>
                      <span className="font-medium">{member.completedLessons}/{member.totalLessons}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(member.completedLessons / member.totalLessons) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {member.remainingLessons} ders kaldı
                    </p>
                    {member.makeUpLessons > 0 && (
                      <p className="text-sm text-blue-600">
                        {member.makeUpLessons} telafi hakkı
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Son Ziyaret</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{member.lastVisit}</p>
                    <p className="text-sm text-gray-500">Son ziyaret tarihi</p>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Sonraki ders:</p>
                      <p className="font-medium text-blue-600">{member.nextLesson}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ödeme Durumu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Durum:</span>
                      {getStatusBadge(member.paymentStatus)}
                    </div>
                    <p className="font-medium text-gray-900">₺{member.totalPaid}</p>
                    <p className="text-sm text-gray-500">Toplam ödenen</p>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Sonraki ödeme:</p>
                      <p className="font-medium text-orange-600">₺{member.nextPaymentAmount}</p>
                      <p className="text-xs text-gray-500">{member.nextPayment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Üye Profili</h2>
          <p className="text-gray-600">{member.name} - Detaylı bilgiler</p>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Profili Düzenle
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex space-x-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
} 