'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Package } from 'lucide-react'
import Modal from './ui/modal'
import { useToast } from '@/components/ui/toast'
import { apiService } from '@/services/api'

interface Package {
  id: number
  packageName: string
  lessonCount: number
  remainingLessons: number
  price: number
  purchasedAt: string
  isActive: boolean
}

interface AvailablePackage {
  name: string
  lessonCount: number
  price: number
}

interface PackageManagementModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: number
  memberName: string
  onPackageUpdate: () => void
}

export default function PackageManagementModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  onPackageUpdate
}: PackageManagementModalProps) {
  const [packages, setPackages] = useState<Package[]>([])
  const [availablePackages, setAvailablePackages] = useState<AvailablePackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const { push } = useToast()

  // Load packages and available packages when modal opens
  useEffect(() => {
    if (isOpen && memberId) {
      loadPackages()
      loadAvailablePackages()
    }
  }, [isOpen, memberId])

  const loadPackages = async () => {
    try {
      const data = await apiService.getMemberPackages(memberId)
      setPackages(data as unknown as Package[])
    } catch (error) {
      console.error('Error loading packages:', error)
      push({
        title: 'Hata',
        message: 'Paketler yüklenirken bir hata oluştu',
        variant: 'error'
      })
    }
  }

  const loadAvailablePackages = async () => {
    try {
      const data = await apiService.getPackages()
      setAvailablePackages(data as unknown as AvailablePackage[])
    } catch (error) {
      console.error('Error loading available packages:', error)
      push({
        title: 'Hata',
        message: 'Mevcut paketler yüklenirken bir hata oluştu',
        variant: 'error'
      })
    }
  }

  const handleAddPackage = async () => {
    if (!selectedPackage) {
      push({
        title: 'Uyarı',
        message: 'Lütfen bir paket seçin',
        variant: 'error'
      })
      return
    }

    setLoading(true)
    try {
      await apiService.purchasePackage(memberId, selectedPackage)
      push({
        title: 'Başarılı',
        message: 'Paket başarıyla eklendi',
        variant: 'success'
      })
      await loadPackages()
      onPackageUpdate()
      setSelectedPackage('')
    } catch (error) {
      console.error('Error adding package:', error)
      push({
        title: 'Hata',
        message: 'Paket eklenirken bir hata oluştu',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePackage = async (packageId: number) => {
    if (!confirm('Bu paketi silmek istediğinizden emin misiniz?')) {
      return
    }

    setDeletingId(packageId)
    try {
      await apiService.deleteMemberPackage(packageId)
      push({
        title: 'Başarılı',
        message: 'Paket başarıyla silindi',
        variant: 'success'
      })
      await loadPackages()
      onPackageUpdate()
    } catch (error) {
      console.error('Error deleting package:', error)
      push({
        title: 'Hata',
        message: 'Paket silinirken bir hata oluştu',
        variant: 'error'
      })
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price)
  }

  const handleClose = () => {
    onPackageUpdate() // Verileri yenile
    onClose() // Modal'ı kapat
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`${memberName} - Paket Yönetimi`}>
      <div className="space-y-6">
        {/* Add New Package */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Yeni Paket Ekle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <select
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-200 bg-white/60 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md font-medium"
              >
                <option value="">Paket seçiniz</option>
                {availablePackages.map((pkg) => (
                  <option key={pkg.name} value={pkg.name}>
                    {pkg.name} - {pkg.lessonCount} ders - {formatPrice(pkg.price)}
                  </option>
                ))}
              </select>
              <Button 
                onClick={handleAddPackage} 
                disabled={loading || !selectedPackage}
                className="px-6"
              >
                {loading ? 'Ekleniyor...' : 'Ekle'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Packages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Mevcut Paketler ({packages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {packages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Henüz paket bulunmuyor</p>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{pkg.packageName}</h4>
                        <Badge variant={pkg.remainingLessons > 0 ? 'default' : 'secondary'}>
                          {pkg.remainingLessons} / {pkg.lessonCount} ders
                        </Badge>
                        {pkg.isActive ? (
                          <Badge variant="success">Aktif</Badge>
                        ) : (
                          <Badge variant="outline">Bekliyor</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>Fiyat: {formatPrice(pkg.price)}</span>
                        <span className="mx-2">•</span>
                        <span>Satın Alma: {formatDate(pkg.purchasedAt)}</span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePackage(pkg.id)}
                      disabled={deletingId === pkg.id}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === pkg.id ? 'Siliniyor...' : 'Sil'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Kapat
          </Button>
        </div>
      </div>
    </Modal>
  )
}
