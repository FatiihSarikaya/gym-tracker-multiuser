'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { User, Phone, Mail, Calendar, CreditCard, Package, Loader2 } from 'lucide-react'
import { apiService, CreateMemberDto, PackageDef } from '@/services/api'

interface NewMemberFormProps {
  onSubmit: (memberData: CreateMemberDto) => void
  onCancel: () => void
}

export default function NewMemberForm({ onSubmit, onCancel }: NewMemberFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    membershipType: '',
    totalLessons: 0,
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<PackageDef[]>([])

  useEffect(() => {
    apiService.getPackages().then(setPackages).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const memberData: CreateMemberDto = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        membershipType: formData.membershipType,
        // @ts-ignore - DTO'ya genişletme: backend totalLessons destekliyor
        totalLessons: Number(formData.totalLessons) || 0,
        // @ts-ignore - DTO'ya genişletme: backend packageName destekliyor
        packageName: formData.membershipType,
        isActive: true
      }
      
      await onSubmit(memberData)
    } catch (error) {
      console.error('Error creating member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Kişisel Bilgiler
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soyad <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                Telefon
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                E-posta <span className="text-red-600 ml-1">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Doğum Tarihi
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Membership Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Üyelik Bilgileri
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ders Paketi <span className="text-red-600">*</span>
              </label>
              <select
                name="membershipType"
                value={formData.membershipType}
                onChange={(e) => {
                  const name = e.target.value
                  const pkg = packages.find(p => p.name === name)
                  setFormData(prev => ({ ...prev, membershipType: name, totalLessons: pkg?.lessonCount || 0 }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                {packages.map(p => (
                  <option key={p.name} value={p.name}>{p.name} - {p.lessonCount} ders - ₺{p.price}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Toplam Ders Sayısı
              </label>
              <input
                type="number"
                name="totalLessons"
                value={formData.totalLessons}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                placeholder="paket seçiniz"
                min={0}
              />
            </div>
            
            {/* Aktiflik seçimi kaldırıldı: yeni üye varsayılan aktif */}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-6"
        >
          İptal
        </Button>
        <Button
          type="submit"
          className="px-6"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Ekleniyor...
            </>
          ) : (
            'Üye Ekle'
          )}
        </Button>
      </div>
    </form>
  )
}
