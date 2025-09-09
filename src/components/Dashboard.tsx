'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import AttendanceTracker from '@/components/AttendanceTracker'
import PaymentTracker from '@/components/PaymentTracker'
import LessonPlanner from '@/components/LessonPlanner'
import WeeklySchedule from '@/components/WeeklySchedule'
import MemberProfile from '@/components/MemberProfile'
import MemberList from '@/components/MemberList'
import Modal from '@/components/ui/modal'
import NewMemberForm from '@/components/NewMemberForm'
import AttendanceModal from '@/components/AttendanceModal'
import LessonPlanModal from '@/components/LessonPlanModal'
import { apiService, CreateMemberDto, testApiConnection } from '@/services/api'
import { useToast } from '@/components/ui/toast'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { push } = useToast()
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [isLessonPlanModalOpen, setIsLessonPlanModalOpen] = useState(false)

  const handleNewMemberSubmit = async (memberData: CreateMemberDto) => {
    try {
      console.log('New member data:', memberData)
      console.log('API URL:', 'http://localhost:5000/api/Members')
      
      // API'ye yeni üye ekleme isteği gönder
      const newMember = await apiService.createMember(memberData)
      
      console.log('Member created successfully:', newMember)
      push({ variant: 'success', title: 'Başarılı', message: 'Yeni üye eklendi.' })
      setIsNewMemberModalOpen(false)
      
      // Üye listesini yenilemek için sayfayı yenile (opsiyonel)
      // window.location.reload()
      
    } catch (error: any) {
      console.error('Error creating member:', error)
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      })
      push({ variant: 'error', title: 'Hata', message: `Üye eklenemedi: ${error?.message || 'Bilinmeyen hata'}` })
    }
  }

  const handleNewMemberCancel = () => {
    setIsNewMemberModalOpen(false)
  }

  const testBackendConnection = async () => {
    console.log('Testing backend connection...')
    const isConnected = await testApiConnection()
    if (isConnected) {
      push({ variant: 'success', message: 'Backend bağlantısı başarılı' })
    } else {
      push({ variant: 'error', message: 'Backend bağlantısı başarısız. Sunucuyu kontrol edin.' })
    }
  }

  const handleAttendanceSubmit = (attendanceData: any) => {
    console.log('Attendance data:', attendanceData)
    // Burada API çağrısı yapılacak
    alert('Yoklama başarıyla kaydedildi!')
    setIsAttendanceModalOpen(false)
  }

  const handleAttendanceCancel = () => {
    setIsAttendanceModalOpen(false)
  }

  const stats = [
    {
      title: 'Aktif Üyeler',
      value: '156',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Bugün Gelenler',
      value: '23',
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    {
      title: 'Bekleyen Ödemeler',
      value: '8',
      icon: CreditCard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Bu Hafta Dersler',
      value: '45',
      icon: Calendar,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    }
  ]

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Users },
    { id: 'attendance', label: 'Yoklama', icon: CheckCircle },
    { id: 'payments', label: 'Ödemeler', icon: CreditCard },
    { id: 'lessons', label: 'Ders Planı', icon: Calendar },
    { id: 'schedule', label: 'Haftalık Program', icon: Clock },
    { id: 'members', label: 'Üyeler', icon: Users }
  ]

  const renderContent = () => {
    console.log('Active tab:', activeTab)
    switch (activeTab) {
      case 'attendance':
        return <AttendanceTracker />
      case 'payments':
        return <PaymentTracker />
      case 'lessons':
        return <LessonPlanner />
      case 'schedule':
        return <WeeklySchedule />
      case 'members':
        return <MemberList />
      default:
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className=" lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hızlı İşlemler</CardTitle>
                  <CardDescription>Günlük işlemlerinizi hızlıca yapın</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button className="w-full" variant="outline" onClick={() => setActiveTab('members')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Üye
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => setActiveTab('attendance')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Yoklama Al
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => setActiveTab('payments')}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Ödeme Al
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => setActiveTab('lessons')}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Ders Planla
                    </Button>
                  </div>
                </CardContent>
              </Card>

              
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  console.log('Button clicked:', tab.id)
                  setActiveTab(tab.id)
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gym Tracker</h1>
              <p className="text-gray-600">Spor Salonu Yönetim Sistemi</p>
            </div>
            <div className="flex items-center space-x-4">
              
                             <Button variant="outline" size="sm" onClick={testBackendConnection}>
                 Test API
               </Button>
               
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <Modal
        isOpen={isNewMemberModalOpen}
        onClose={() => setIsNewMemberModalOpen(false)}
        title="Yeni Üye Ekle"
      >
        <NewMemberForm onSubmit={handleNewMemberSubmit} onCancel={handleNewMemberCancel} />
      </Modal>

      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Yoklama Al"
      >
        <AttendanceModal onSubmit={handleAttendanceSubmit} onCancel={handleAttendanceCancel} />
      </Modal>

      <Modal
        isOpen={isLessonPlanModalOpen}
        onClose={() => setIsLessonPlanModalOpen(false)}
        title="Ders Planla"
      >
        <LessonPlanModal onClose={() => setIsLessonPlanModalOpen(false)} />
      </Modal>
    </div>
  )
} 