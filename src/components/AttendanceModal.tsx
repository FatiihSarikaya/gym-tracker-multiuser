'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, User, Phone, Package } from 'lucide-react'

interface Member {
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
  
  // Bugünün üyeleri (örnek veri)
  const todayMembers: Member[] = [
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      phone: '0532 123 45 67',
      package: 'Aylık Paket',
      lessonTime: '09:00',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Fatma Demir',
      phone: '0533 234 56 78',
      package: 'Haftalık Paket',
      lessonTime: '10:30',
      status: 'pending'
    },
    {
      id: 3,
      name: 'Mehmet Kaya',
      phone: '0534 345 67 89',
      package: 'Yıllık Paket',
      lessonTime: '14:00',
      status: 'pending'
    },
    {
      id: 4,
      name: 'Ayşe Özkan',
      phone: '0535 456 78 90',
      package: 'Aylık Paket',
      lessonTime: '16:30',
      status: 'pending'
    },
    {
      id: 5,
      name: 'Ali Veli',
      phone: '0536 567 89 01',
      package: 'Kişisel Antrenör',
      lessonTime: '18:00',
      status: 'pending'
    }
  ]

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
        <h3 className="text-lg font-semibold text-gray-900">Bugünün Üyeleri</h3>
        
        {todayMembers.map((member) => (
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
        ))}
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
