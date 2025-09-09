'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, DollarSign, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react'
import { apiService, type Payment, type Member } from '@/services/api'

export default function PaymentTracker() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [payments, setPayments] = useState<Array<{
    id: number
    memberName: string
    phone: string
    package: string
    packagePrice: number
    dueDate: string
    status: string
    paidDate: string | null
    paymentMethod: string | null
  }>>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [data, allPackages] = await Promise.all([
          apiService.getPayments(),
          apiService.getPackages() as Promise<any[]>
        ])
        const nameToPrice: Record<string, number> = {}
        ;(allPackages || []).forEach((pkg: any) => {
          if (pkg?.name) nameToPrice[pkg.name] = Number(pkg.price) || 0
        })
        const mapped = await Promise.all(
          (data || []).map(async (p: Payment) => {
            let member: Member | undefined = p.member
            try {
              if (!member) member = await apiService.getMember(p.memberId)
            } catch {}
            // derive package name if available via latest member package
            let pkgName = '-'
            let pkgPrice = p.amount
            try {
              const pkgs = await apiService.getMemberPackages(p.memberId) as any[]
              if (pkgs && pkgs.length > 0) {
                const latest = [...pkgs].sort((a, b) => new Date(b.purchasedAt || 0).getTime() - new Date(a.purchasedAt || 0).getTime())[0]
                pkgName = latest?.packageName || '-'
                // Prefer global Packages price by name
                if (nameToPrice[pkgName] !== undefined) {
                  pkgPrice = nameToPrice[pkgName]
                } else {
                  pkgPrice = Number(latest?.price) || pkgPrice
                }
              }
            } catch {}
            if ((!pkgName || pkgName === '-') && member?.membershipType) {
              pkgName = member.membershipType
              if (nameToPrice[pkgName] !== undefined) pkgPrice = nameToPrice[pkgName]
            }
            return {
              id: p.id,
              memberName: member ? `${member.firstName} ${member.lastName}` : `Üye #${p.memberId}`,
              phone: member?.phoneNumber || '-',
              package: pkgName,
              packagePrice: pkgPrice,
              dueDate: p.dueDate,
              status: p.status,
              paidDate: (p as any).paidDate || null,
              paymentMethod: p.paymentMethod || null,
            }
          })
        )
        setPayments(mapped)
      } catch (e) {
        console.error('Ödemeler yüklenemedi', e)
        setPayments([])
      }
    }
    load()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Ödendi</Badge>
      case 'pending':
        return <Badge variant="warning">Bekliyor</Badge>
      case 'overdue':
        return <Badge variant="destructive">Gecikmiş</Badge>
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>
    }
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

  const filteredPayments = payments.filter(payment => {
    if (filterStatus === 'all') return true
    return payment.status === filterStatus
  })

  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'pending').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
    totalAmount: payments.reduce((sum, p) => sum + p.packagePrice, 0),
    paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.packagePrice, 0),
    pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.packagePrice, 0)
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
          <CardTitle>Ödeme Listesi</CardTitle>
          <CardDescription>Tüm üye ödemeleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(payment.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">{payment.memberName}</h3>
                    <p className="text-sm text-gray-500">{payment.phone}</p>
                    <p className="text-xs text-gray-400">{payment.package}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-gray-900">Paket Fiyatı: ₺{payment.packagePrice.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Vade: {payment.dueDate}</p>
                    {payment.paidDate && (
                      <p className="text-xs text-green-600">Ödendi: {payment.paidDate}</p>
                    )}
                  </div>
                  {getStatusBadge(payment.status)}
                  <Button variant="outline" size="sm">
                    {payment.status === 'paid' ? 'Detay' : 'Öde'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 