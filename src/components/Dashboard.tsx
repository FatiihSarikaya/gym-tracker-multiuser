'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  Filter,
  LogOut,
  User
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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const { push } = useToast()
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [isLessonPlanModalOpen, setIsLessonPlanModalOpen] = useState(false)
  
  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    activeMembers: 0,
    todayAttendance: 0,
    pendingPayments: 0,
    weeklyLessons: 0,
    loading: true
  })

  // Load dashboard stats
  const loadDashboardStats = async () => {
    try {
      setDashboardStats(prev => ({ ...prev, loading: true }))
      
      // 1. Aktif Üyeler
      const members = await apiService.getMembers()
      const activeMembers = members.filter((m: any) => m.isActive).length
      
      // 2. Bugün Gelenler (today's attendance)
      const today = new Date().toISOString().split('T')[0]
      let todayAttendance = 0
      try {
        const todayAttendances = await apiService.getAttendancesByDate(today)
        todayAttendance = todayAttendances.length
      } catch (error) {
        console.error('Error loading today attendances:', error)
      }
      
      // 3. Bekleyen Ödemeler (same logic as PaymentTracker)
      let pendingPayments = 0
      try {
        // Get all active members and their payment status (same as PaymentTracker)
        const activeMembers = members.filter((m: any) => m.isActive)
        const payments = await apiService.getPayments()
        const packages = await apiService.getPackages()
        
        // Create a name->price mapping for packages
        const nameToPrice = packages.reduce((acc: any, pkg: any) => {
          acc[pkg.name] = pkg.price
          return acc
        }, {})

        // Calculate payment status for each active member
        const memberPayments = []
        for (const member of activeMembers) {
          let pkgName = member.membershipType || '-'
          let pkgPrice = 0

          // Get member's package info
          try {
            const memberPackages = await apiService.getMemberPackages(member.id) as any[]
            if (memberPackages && memberPackages.length > 0) {
              const activePackage = memberPackages.find((pkg: any) => pkg.isActive) || 
                                   memberPackages.sort((a: any, b: any) => new Date(b.purchasedAt || 0).getTime() - new Date(a.purchasedAt || 0).getTime())[0]
              
              if (activePackage) {
                pkgName = activePackage.packageName || member.membershipType || '-'
                pkgPrice = nameToPrice[pkgName] || Number(activePackage.price) || 0
              }
            }
          } catch (error) {
            console.log(`Error fetching packages for member ${member.id}:`, error)
          }

          // Global package price check
          if (nameToPrice[pkgName] !== undefined) {
            pkgPrice = nameToPrice[pkgName]
          }

          // Get this member's payment info
          const memberPayment = payments.find((p: any) => p.memberId === member.id)
          
          // Determine payment status
          let status: 'paid' | 'pending' | 'overdue' = 'pending'
          if (memberPayment) {
            status = memberPayment.status as 'paid' | 'pending' | 'overdue'
          }

          memberPayments.push({ status })
        }

        // Count pending and overdue payments
        pendingPayments = memberPayments.filter((mp: any) => 
          mp.status === 'pending' || mp.status === 'overdue'
        ).length
      } catch (error) {
        console.error('Error loading payments for pending count:', error)
      }
      
      // 4. Bu Hafta Dersler (same logic as WeeklySchedule - updated)
      let weeklyLessons = 0
      try {
        // Get the current week range (same as WeeklySchedule)
        const selectedWeek = new Date().toISOString().split('T')[0]
        const start = new Date(selectedWeek)
        const end = new Date(start)
        end.setDate(start.getDate() + 7)
        const weekRange: string[] = []
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          weekRange.push(new Date(d).toISOString().split('T')[0])
        }

        // Haftalık program için: hem atanmış dersler hem de yeni oluşturulan dersler
        const members = await apiService.getMembers()
        
        // 1. Member-lesson assignments'tan gelen veriler
        const assignmentSessions = await Promise.all(
          members.map(async (m: any) => {
            try {
              const assigns = await apiService.getMemberLessonsByMember(m.id) as any[]
              const detailed = await Promise.all(
                (assigns || []).map(async (a: any) => {
                  const l = await apiService.getLesson(a.lessonId)
                  return {
                    date: a.startDate,
                    time: l?.startTime || '',
                    member: `${m.firstName} ${m.lastName}`,
                    type: l?.name || '-',
                    source: 'assignment'
                  }
                })
              )
              return detailed.filter(s => s.date && weekRange.includes(s.date))
            } catch {
              return []
            }
          })
        )
        
        // 2. Yeni oluşturulan lesson'lar (lessonDate field'ı olan)
        const weekLessons = await Promise.all(
          weekRange.map(async (date) => {
            try {
              const lessons = await apiService.getLessonsByDate(date) as any[]
              const lessonSessions = await Promise.all(
                lessons.map(async (lesson: any) => {
                  // Bu lesson'a atanmış üyeleri bul (MemberLesson'dan)
                  try {
                    const memberLessons = await apiService.getMemberLessonsByLessonAndDate(lesson.id, date) as any[]
                    return memberLessons.map((ml: any) => {
                      const member = members.find((m: any) => m.id === ml.memberId)
                      return {
                        date,
                        time: lesson.startTime || '',
                        member: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
                        type: lesson.name || '-',
                        source: 'lesson'
                      }
                    })
                  } catch {
                    return []
                  }
                })
              )
              return ([] as any[]).concat(...lessonSessions)
            } catch {
              return []
            }
          })
        )
        
        // Tüm session'ları birleştir
        const allSessions = [
          ...([] as any[]).concat(...assignmentSessions),
          ...([] as any[]).concat(...weekLessons)
        ]
        
        // Duplicate'leri temizle (aynı member+date+time kombinasyonu)
        const uniqueSessions = allSessions.filter((session, index, arr) => {
          return index === arr.findIndex(s => 
            s.member === session.member && 
            s.date === session.date && 
            s.time === session.time
          )
        })
        
        weeklyLessons = uniqueSessions.length
      } catch (error) {
        console.error('Error loading weekly lessons:', error)
      }
      
      setDashboardStats({
        activeMembers,
        todayAttendance,
        pendingPayments,
        weeklyLessons,
        loading: false
      })
      
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      setDashboardStats(prev => ({ ...prev, loading: false }))
    }
  }

  // Load stats when component mounts or when switching to dashboard tab
  useEffect(() => {
    if (status === 'authenticated' && activeTab === 'dashboard') {
      loadDashboardStats()
    }
  }, [status, activeTab])

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const handleNewMemberSubmit = async (memberData: CreateMemberDto) => {
    try {
      // API'ye yeni üye ekleme isteği gönder
      const newMember = await apiService.createMember(memberData)
      push({ variant: 'success', title: 'Başarılı', message: 'Yeni üye eklendi.' })
      setIsNewMemberModalOpen(false)
      
      // Üye listesini yenilemek için sayfayı yenile (opsiyonel)
      // window.location.reload()
      
    } catch (error: any) {
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating member:', error)
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
          name: error?.name
        })
      }
      push({ variant: 'error', title: 'Hata', message: `Üye eklenemedi: ${error?.message || 'Bilinmeyen hata'}` })
    }
  }

  const handleNewMemberCancel = () => {
    setIsNewMemberModalOpen(false)
  }

  const testBackendConnection = async () => {
    const isConnected = await testApiConnection()
    if (isConnected) {
      push({ variant: 'success', message: 'Backend bağlantısı başarılı' })
    } else {
      push({ variant: 'error', message: 'Backend bağlantısı başarısız. Sunucuyu kontrol edin.' })
    }
  }

  const handleAttendanceSubmit = async (attendanceData: any) => {
    try {
      for (const attendance of attendanceData) {
        const { memberId, status } = attendance
        
        if (status === 'present') {
          // Üye geldi - check-in yap (ders sayısını düşür)
          await apiService.checkIn({ memberId })
        }
        // 'absent' durumunda hiçbir şey yapmıyoruz
      }
      
      push({ variant: 'success', title: 'Başarılı', message: 'Yoklama başarıyla kaydedildi!' })
      setIsAttendanceModalOpen(false)
      
      // Dashboard stats'ları yenile
      if (activeTab === 'dashboard') {
        loadDashboardStats()
      }
      
    } catch (error: any) {
      console.error('Error processing attendance:', error)
      push({ variant: 'error', title: 'Hata', message: `Yoklama kaydedilemedi: ${error?.message || 'Bilinmeyen hata'}` })
    }
  }

  const handleAttendanceCancel = () => {
    setIsAttendanceModalOpen(false)
  }

  const stats = [
    {
      title: 'Aktif Üyeler',
      value: dashboardStats.loading ? '...' : dashboardStats.activeMembers.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Bugün Gelenler',
      value: dashboardStats.loading ? '...' : dashboardStats.todayAttendance.toString(),
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    {
      title: 'Bekleyen Ödemeler',
      value: dashboardStats.loading ? '...' : dashboardStats.pendingPayments.toString(),
      icon: CreditCard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Bu Hafta Dersler',
      value: dashboardStats.loading ? '...' : dashboardStats.weeklyLessons.toString(),
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
                onClick={() => setActiveTab(tab.id)}
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
              <h1 className="text-3xl font-bold text-gray-900">
                {session?.user?.businessName || 'Gym Tracker'}
              </h1>
              <p className="text-gray-600">
                {session?.user?.businessType === 'gym' && 'Spor Salonu'}
                {session?.user?.businessType === 'yoga_studio' && 'Yoga Stüdyosu'}
                {session?.user?.businessType === 'pilates_studio' && 'Pilates Stüdyosu'}
                {session?.user?.businessType === 'fitness_center' && 'Fitness Merkezi'}
                {session?.user?.businessType === 'sports_club' && 'Spor Kulübü'}
                {!session?.user?.businessType && 'Spor Salonu'} Yönetim Sistemi
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{session?.user?.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={testBackendConnection}>
                Test API
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış
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