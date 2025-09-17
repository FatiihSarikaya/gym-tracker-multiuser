'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, DollarSign, AlertCircle, CheckCircle, Clock, Plus, Edit3 } from 'lucide-react'
import { apiService, type Payment, type Member } from '@/services/api'
import { useToast } from '@/components/ui/toast'

interface MemberPaymentInfo {
  memberId: number
  memberName: string
  phone: string
  email: string
  package: string
  packagePrice: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  paidDate: string | null
  paymentId: number | null
}

export default function PaymentTracker() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [memberPayments, setMemberPayments] = useState<MemberPaymentInfo[]>([])
  const [loading, setLoading] = useState(false)
  const { push } = useToast()

  const loadMemberPayments = async () => {
    setLoading(true)
    try {
      // Tüm üyeleri ve paketleri al
      const [members, allPackages, payments] = await Promise.all([
        apiService.getMembers(),
        apiService.getPackages() as Promise<any[]>,
        apiService.getPayments()
      ])

      const nameToPrice: Record<string, number> = {}
      ;(allPackages || []).forEach((pkg: any) => {
        if (pkg?.name) nameToPrice[pkg.name] = Number(pkg.price) || 0
      })

      // Her üye için ödeme bilgisini oluştur (sadece aktif üyeler)
      const memberPaymentsList = await Promise.all(
        (members || []).filter((member: Member) => member.isActive).map(async (member: Member) => {
          let pkgName = member.membershipType || '-'
          let pkgPrice = 0

          // Üyenin paket bilgilerini al
          try {
            const memberPackages = await apiService.getMemberPackages(member.id) as any[]
            if (memberPackages && memberPackages.length > 0) {
              const activePackage = memberPackages.find(pkg => pkg.isActive) || 
                                   memberPackages.sort((a, b) => new Date(b.purchasedAt || 0).getTime() - new Date(a.purchasedAt || 0).getTime())[0]
              
              if (activePackage) {
                pkgName = activePackage.packageName || member.membershipType || '-'
                pkgPrice = nameToPrice[pkgName] || Number(activePackage.price) || 0
              }
            }
          } catch (error) {
            console.log(`Error fetching packages for member ${member.id}:`, error)
          }

          // Global paketlerden fiyat kontrolü
          if (nameToPrice[pkgName] !== undefined) {
            pkgPrice = nameToPrice[pkgName]
          }

          // Bu üyenin son ödeme bilgisini al
          const memberPayment = payments.find(p => p.memberId === member.id)
          
          // Ödeme durumunu belirle
          let status: 'paid' | 'pending' | 'overdue' = 'pending'
          let paidDate: string | null = null
          let paymentId: number | null = null

          if (memberPayment) {
            status = memberPayment.status as 'paid' | 'pending' | 'overdue'
            paidDate = memberPayment.paymentDate
            paymentId = memberPayment.id
          } else {
            // Eğer ödeme kaydı yoksa, varsayılan olarak beklemede
            status = 'pending'
          }

          return {
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            phone: member.phoneNumber || '-',
            email: member.email,
            package: pkgName,
            packagePrice: pkgPrice,
            status,
            dueDate: memberPayment?.dueDate || new Date().toISOString().split('T')[0],
            paidDate,
            paymentId
          }
        })
      )

      setMemberPayments(memberPaymentsList)
    } catch (error) {
      console.error('Üye ödemeleri yüklenemedi:', error)
      push({ variant: 'error', title: 'Hata', message: 'Ödeme verileri yüklenemedi' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMemberPayments()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const updatePaymentStatus = async (memberPayment: MemberPaymentInfo, newStatus: 'paid' | 'pending' | 'overdue') => {
    try {
      setLoading(true)
      
      const currentDate = new Date().toISOString().split('T')[0]
      
      if (memberPayment.paymentId) {
        // Mevcut ödeme kaydını güncelle
        await apiService.updatePayment(memberPayment.paymentId, {
          status: newStatus,
          paymentDate: newStatus === 'paid' ? currentDate : null
        })
      } else {
        // Yeni ödeme kaydı oluştur
        await apiService.createPayment({
          memberId: memberPayment.memberId,
          amount: memberPayment.packagePrice,
          paymentType: 'package',
          paymentMethod: 'cash',
          paymentDate: newStatus === 'paid' ? currentDate : currentDate,
          dueDate: memberPayment.dueDate,
          status: newStatus,
          notes: `${memberPayment.package} paketi`
        })
      }

      push({ 
        variant: 'success', 
        title: 'Başarılı', 
        message: `${memberPayment.memberName} için ödeme durumu güncellendi` 
      })
      
      // Listeyi yenile
      await loadMemberPayments()
    } catch (error) {
      console.error('Ödeme durumu güncellenemedi:', error)
      push({ 
        variant: 'error', 
        title: 'Hata', 
        message: 'Ödeme durumu güncellenemedi' 
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, memberPayment: MemberPaymentInfo) => {
    const handleStatusClick = (newStatus: 'paid' | 'pending' | 'overdue') => {
      if (newStatus !== status) {
        updatePaymentStatus(memberPayment, newStatus)
      }
    }

    return (
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant={status === 'paid' ? 'default' : 'outline'}
          onClick={() => handleStatusClick('paid')}
          className={status === 'paid' ? 'bg-green-600 hover:bg-green-700' : 'text-green-600 border-green-600 hover:bg-green-50'}
        >
          Ödedi
        </Button>
        <Button
          size="sm"
          variant={status === 'pending' ? 'default' : 'outline'}
          onClick={() => handleStatusClick('pending')}
          className={status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : 'text-yellow-600 border-yellow-600 hover:bg-yellow-50'}
        >
          Ödemedi
        </Button>
        <Button
          size="sm"
          variant={status === 'overdue' ? 'default' : 'outline'}
          onClick={() => handleStatusClick('overdue')}
          className={status === 'overdue' ? 'bg-red-600 hover:bg-red-700' : 'text-red-600 border-red-600 hover:bg-red-50'}
        >
          Gecikti
        </Button>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const filteredMemberPayments = memberPayments.filter(payment => {
    if (filterStatus === 'all') return true
    return payment.status === filterStatus
  })

  const stats = {
    total: memberPayments.length,
    paid: memberPayments.filter(p => p.status === 'paid').length,
    pending: memberPayments.filter(p => p.status === 'pending').length,
    overdue: memberPayments.filter(p => p.status === 'overdue').length,
    totalAmount: memberPayments.reduce((sum, p) => sum + p.packagePrice, 0),
    paidAmount: memberPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.packagePrice, 0),
    pendingAmount: memberPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.packagePrice, 0),
    overdueAmount: memberPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.packagePrice, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ödeme Takibi</h2>
          <p className="text-gray-600">Üye ödemeleri ve finansal takip</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Ödeme
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Ödeme</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <CreditCard className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ödenen</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
                <p className="text-sm text-gray-500">₺{stats.paidAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bekleyen</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-500">₺{stats.pendingAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gecikmiş</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-sm text-gray-500">₺{stats.overdueAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
          <CardDescription>Ödeme durumuna göre filtreleme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
            >
              Tümü ({stats.total})
            </Button>
            <Button
              variant={filterStatus === 'paid' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('paid')}
            >
              Ödenen ({stats.paid})
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('pending')}
            >
              Bekleyen ({stats.pending})
            </Button>
            <Button
              variant={filterStatus === 'overdue' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('overdue')}
            >
              Gecikmiş ({stats.overdue})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <CardTitle>Üye Ödeme Listesi</CardTitle>
          <CardDescription>Tüm üyeler ve ödeme durumları</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Yükleniyor...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMemberPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {filterStatus === 'all' ? 'Hiç üye bulunamadı' : `${filterStatus} durumunda üye bulunamadı`}
                </div>
              ) : (
                filteredMemberPayments.map((memberPayment) => (
                  <div
                    key={memberPayment.memberId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(memberPayment.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">{memberPayment.memberName}</h3>
                        <p className="text-sm text-gray-500">{memberPayment.phone}</p>
                        <p className="text-sm text-gray-500">{memberPayment.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {/* Paket Bilgisi */}
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{memberPayment.package}</p>
                        <p className="text-lg font-bold text-blue-600">₺{memberPayment.packagePrice.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Paket Fiyatı</p>
                      </div>
                      
                      {/* Ödeme Tarihi */}
                      <div className="text-center">
                        {memberPayment.status === 'paid' && memberPayment.paidDate ? (
                          <>
                            <p className="text-sm text-gray-500">Ödeme Tarihi</p>
                            <p className="font-medium text-green-600">{formatDate(memberPayment.paidDate)}</p>
                            <p className="text-xs text-green-500">✓ Ödendi</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-500">Ödeme Tarihi</p>
                            <p className="font-medium text-gray-400">-</p>
                            <p className="text-xs text-gray-400">Ödenmedi</p>
                          </>
                        )}
                      </div>
                      
                      {/* Durum Butonları */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">Ödeme Durumu</p>
                        {getStatusBadge(memberPayment.status, memberPayment)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 