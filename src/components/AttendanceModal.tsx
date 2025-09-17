'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, User, Phone, Package } from 'lucide-react'
import { apiService, type Member } from '@/services/api'

interface AttendanceMember {
  id: number
  name: string
  phone: string
  package: string
  lessonTime: string
  status: 'present' | 'absent' | 'pending'
}

interface AttendanceModalProps {
  onSubmit: (attendanceData: { memberId: number; status: 'present' | 'absent' }[]) => void
  onCancel: () => void
}

export default function AttendanceModal({ onSubmit, onCancel }: AttendanceModalProps) {
  const [attendance, setAttendance] = useState<{ [key: number]: 'present' | 'absent' }>({})
  const [todayMembers, setTodayMembers] = useState<AttendanceMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActiveMembers()
  }, [])

  const loadActiveMembers = async () => {
    try {
      setLoading(true)
      const members = await apiService.getMembers()
      
      // Sadece aktif üyeleri filtrele ve formatla
      const activeMembers = members
        .filter((member: Member) => member.isActive)
        .map((member: Member) => ({
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          phone: member.phoneNumber || '-',
          package: member.membershipType || '-',
          lessonTime: '09:00', // Default time, gerçek veriler için lesson API'den alınabilir
          status: 'pending' as const
        }))
      
      setTodayMembers(activeMembers)
    } catch (error) {
      console.error('Aktif üyeler yüklenemedi:', error)
      setTodayMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (memberId: number, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: status
    }))
  }

  const handleSubmit = () => {
    const attendanceData = Object.entries(attendance).map(([memberId, status]) => ({
      memberId: parseInt(memberId),
      status
    }))
    onSubmit(attendanceData)
  }

  const getStatusBadge = (memberId: number) => {
    const status = attendance[memberId]
    if (!status) return null
    
    if (status === 'present') {
      return <Badge variant="success" className="ml-2">Geldi</Badge>
    } else {
      return <Badge variant="destructive" className="ml-2">Gelmedi</Badge>
    }
  }

  const presentCount = Object.values(attendance).filter(status => status === 'present').length
  const absentCount = Object.values(attendance).filter(status => status === 'absent').length
  const totalCount = todayMembers.length

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
            <div className="text-sm text-gray-600">Toplam Üye</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <div className="text-sm text-gray-600">Gelenler</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <div className="text-sm text-gray-600">Gelmeyenler</div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Aktif Üyeler</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Üyeler yükleniyor...</div>
          </div>
        ) : todayMembers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Aktif üye bulunamadı</div>
          </div>
        ) : (
          todayMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        {getStatusBadge(member.id)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {member.phone}
                        </span>
                        <span className="flex items-center">
                          <Package className="w-3 h-3 mr-1" />
                          {member.package}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {member.lessonTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={attendance[member.id] === 'present' ? 'default' : 'outline'}
                    onClick={() => handleAttendanceChange(member.id, 'present')}
                    className="flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Geldi</span>
                  </Button>
                  
                  <Button
                    type="button"
                    size="sm"
                    variant={attendance[member.id] === 'absent' ? 'destructive' : 'outline'}
                    onClick={() => handleAttendanceChange(member.id, 'absent')}
                    className="flex items-center space-x-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Gelmedi</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-6"
        >
          İptal
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          className="px-6"
          disabled={Object.keys(attendance).length === 0}
        >
          Yoklamayı Kaydet
        </Button>
      </div>
    </div>
  )
}
