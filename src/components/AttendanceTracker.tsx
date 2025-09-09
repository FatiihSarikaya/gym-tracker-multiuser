'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Search, Filter, Plus, Users, Calendar, BookOpen } from 'lucide-react'
import { apiService } from '@/services/api'
import type { LessonAttendance } from '@/services/api'
import Modal from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'

interface Lesson {
  id: number
  name: string
  instructor: string
  dayOfWeek: string
  startTime: string
  endTime: string
  location: string
}

interface MemberLesson {
  id: number
  memberId: number
  lessonId: number
  daysOfWeek: string[]
  startDate: string
  endDate?: string
}

interface Member {
  id: number
  firstName: string
  lastName: string
  phoneNumber?: string
  email: string
  remainingLessons: number
}

interface AttendanceRecord {
  memberId: number
  member: Member
  status: 'present' | 'absent' | 'extra' | 'pending'
  time?: string
  lessonId?: number
  lesson?: Lesson
}

export default function AttendanceTracker() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterStatus, setFilterStatus] = useState('all')
  const [showNewAttendanceModal, setShowNewAttendanceModal] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [memberLessons, setMemberLessons] = useState<MemberLesson[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [allMembers, setAllMembers] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [allAttendances, setAllAttendances] = useState<AttendanceRecord[]>([])
  const [selectedLessonFilter, setSelectedLessonFilter] = useState<string | 'all'>('all')
  const [scheduledMembers, setScheduledMembers] = useState<AttendanceRecord[]>([])
  const { push } = useToast()

  // Load lessons for selected date
  useEffect(() => {
    loadLessonsForDate(selectedDate)
    loadAllAttendancesForDate(selectedDate)
    loadScheduledMembersForDate(selectedDate)
    // Tarih değiştiğinde seçili dersi sıfırla
    setSelectedLesson(null)
    setAttendanceRecords([])
    setMemberLessons([])
  }, [selectedDate])

  // Load member lessons when lesson is selected
  useEffect(() => {
    if (selectedLesson) {
      loadMemberLessons(selectedLesson.id)
    }
  }, [selectedLesson, selectedDate])

  const loadLessonsForDate = async (date: string) => {
    try {
      const data = await apiService.getLessonsByDate(date)
      setLessons(data)
    } catch (error) {
      console.error('Error loading lessons for date:', error)
    }
  }

  const loadAllMembers = async () => {
    try {
      const data = await apiService.getMembers()
      // Zaten atanmış üyeleri filtrele
      const assignedMemberIds = attendanceRecords.map(record => record.memberId)
      const availableMembers = data.filter(member => !assignedMemberIds.includes(member.id))
      setAllMembers(availableMembers)
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const loadAllAttendancesForDate = async (date: string) => {
    try {
      setLoading(true)
      const attendances = await apiService.getLessonAttendancesByDate(date)
      
      // Load member and lesson details for each attendance
      const attendancesWithDetails = await Promise.all(
        attendances.map(async (attendance: LessonAttendance) => {
          try {
            const [member, lesson] = await Promise.all([
              apiService.getMember(attendance.memberId) as any,
              apiService.getLesson(attendance.lessonId) as any
            ])
            
            let status: 'present' | 'absent' | 'extra' | 'pending' = attendance.attended
              ? (attendance.type === 'ekstra' ? 'extra' : 'present')
              : 'absent'
            
            return {
              memberId: attendance.memberId,
              member,
              status,
              time: attendance.notes || undefined,
              lesson: lesson,
              lessonId: attendance.lessonId
            }
          } catch (error) {
            console.error(`Error loading details for attendance ${attendance.id}:`, error)
            return null
          }
        })
      )
      
      const validAttendances = attendancesWithDetails.filter((attendance): attendance is NonNullable<typeof attendance> => attendance !== null)
      // Deduplicate by memberId+lessonId for the date, prefer 'extra' over 'present'
      const unique = Object.values(validAttendances.reduce((acc: Record<string, AttendanceRecord>, cur) => {
        const key = `${cur.memberId}-${cur.lessonId}`
        const existing = acc[key]
        if (!existing) {
          acc[key] = cur
        } else {
          // If one of them is 'extra', keep that
          if (existing.status !== 'extra' && cur.status === 'extra') acc[key] = cur
        }
        return acc
      }, {} as Record<string, AttendanceRecord>)) as AttendanceRecord[]
      setAllAttendances(unique)
    } catch (error) {
      console.error('Error loading all attendances:', error)
      setAllAttendances([])
    } finally {
      setLoading(false)
    }
  }

  // Load all scheduled members across lessons for the given date
  const loadScheduledMembersForDate = async (date: string) => {
    try {
      setLoading(true)
      const dayLessons = await apiService.getLessonsByDate(date)
      const allAssignments = await Promise.all(
        (dayLessons || []).map(async (l: Lesson) => {
          try {
            const assigns = await apiService.getMemberLessonsByLessonAndDate(l.id, date) as any[]
            const detailed = await Promise.all(assigns.map(async a => {
              try {
                const member = await apiService.getMember(a.memberId) as any
                const rec: AttendanceRecord = { memberId: a.memberId, member, status: 'pending', lessonId: l.id, lesson: l }
                return rec
              } catch {
                return null
              }
            }))
            return detailed.filter(Boolean)
          } catch {
            return [] as any[]
          }
        })
      )
      const flat = ([] as AttendanceRecord[]).concat(...allAssignments as any)
      // dedupe by memberId+lessonId
      const unique = Object.values(flat.reduce((acc: Record<string, AttendanceRecord>, cur) => {
        const key = `${cur.memberId}-${cur.lessonId}`
        if (!acc[key]) acc[key] = cur
        return acc
      }, {})) as AttendanceRecord[]
      setScheduledMembers(unique)
    } catch (e) {
      console.error('Error loading scheduled members:', e)
      setScheduledMembers([])
    } finally {
      setLoading(false)
    }
  }

  const loadMemberLessons = async (lessonId: number) => {
    try {
      setLoading(true)
      const data = await apiService.getMemberLessonsByLessonAndDate(lessonId, selectedDate) as MemberLesson[]
      setMemberLessons(data)
      
      // Load existing attendance records for this lesson and date
      const existingAttendances = await apiService.getLessonAttendancesByLessonAndDate(lessonId, selectedDate)
      
      // Load member details for each assignment
      const membersWithDetails = await Promise.all(
        data.map(async (ml: MemberLesson) => {
          try {
            const member = await apiService.getMember(ml.memberId) as any
            
            // Check if there's an existing attendance record for this member
            const existingAttendance = existingAttendances.find(att => att.memberId === ml.memberId)
            
            let status: 'present' | 'absent' | 'extra' | 'pending' = 'pending'
            if (existingAttendance) {
              if (existingAttendance.attended) {
                status = existingAttendance.type === 'ekstra' ? 'extra' : 'present'
              } else {
                status = 'absent'
              }
            }
            
            return {
              memberId: ml.memberId,
              member,
              status,
              time: existingAttendance?.notes || undefined
            }
          } catch (error) {
            console.error(`Error loading member ${ml.memberId}:`, error)
            return null
          }
        })
      )
      
      // Duplicate üyeleri filtrele (aynı memberId'ye sahip olanları)
      const validMembers = membersWithDetails.filter((member): member is NonNullable<typeof member> => member !== null) as AttendanceRecord[]
      const uniqueMembers = validMembers.reduce((acc: AttendanceRecord[], current: AttendanceRecord) => {
        const exists = acc.find(item => item.memberId === current.memberId)
        if (!exists) {
          acc.push(current)
        }
        return acc
      }, [])
      
      setAttendanceRecords(uniqueMembers)
    } catch (error) {
      console.error('Error loading member lessons:', error)
      // Hata durumunda boş liste set et
      setAttendanceRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson)
  }

  const handleAttendanceChange = (memberId: number, status: 'present' | 'absent' | 'extra') => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.memberId === memberId 
          ? { ...record, status, time: status === 'present' ? new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : undefined }
          : record
      )
    )
  }

  const handleAddMemberToLesson = async () => {
    if (!selectedLesson || selectedMembers.length === 0) return

    try {
      setLoading(true)
      const successCount = []
      const errorCount = []
      
      // Seçilen üyeleri derse ata
      for (const memberId of selectedMembers) {
        try {
          await apiService.assignMemberToLesson({
            memberId,
            lessonId: selectedLesson.id,
            daysOfWeek: [selectedLesson.dayOfWeek],
            startDate: selectedDate
          })
          successCount.push(memberId)
        } catch (error) {
          console.error(`Error adding member ${memberId}:`, error)
          errorCount.push({ memberId, error: error instanceof Error ? error.message : String(error) })
        }
      }
      
      // Üye listesini yenile
      await loadMemberLessons(selectedLesson.id)
      
      // Sonuç mesajı göster
      if (successCount.length > 0 && errorCount.length === 0) {
        push({ variant: 'success', message: `${successCount.length} üye eklendi` })
      } else if (successCount.length > 0 && errorCount.length > 0) {
        push({ variant: 'warning', message: `${successCount.length} üye eklendi, ${errorCount.length} eklenemedi` })
      } else {
        push({ variant: 'warning', message: 'Üye eklenemedi. Belki zaten atanmış olabilir.' })
      }
      
      setShowAddMemberModal(false)
      setSelectedMembers([])
    } catch (error) {
      console.error('Error adding members to lesson:', error)
      push({ variant: 'error', message: 'Üye eklenemedi: ' + (error instanceof Error ? error.message : String(error)) })
    } finally {
      setLoading(false)
    }
  }

  const handleMemberSelect = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSaveAttendance = async () => {
    if (!selectedLesson) return

    try {
      setLoading(true)
      
      // Get existing attendance records for this lesson and date
      const existingAttendances = await apiService.getLessonAttendancesByLessonAndDate(selectedLesson.id, selectedDate)
      
      // Save or update attendance records
      for (const record of attendanceRecords) {
        const existingAttendance = existingAttendances.find(att => att.memberId === record.memberId)
        
        if (existingAttendance) {
          // Update existing record
          await apiService.updateLessonAttendance(existingAttendance.id, {
            memberId: record.memberId,
            lessonId: selectedLesson.id,
            lessonDate: selectedDate,
            attended: record.status === 'present' || record.status === 'extra',
            type: record.status === 'extra' ? 'ekstra' : 'pakete-dahil',
            notes: record.time || ''
          } as any)
        } else {
          // Create new record
          await apiService.createLessonAttendance({
            memberId: record.memberId,
            lessonId: selectedLesson.id,
            lessonDate: selectedDate,
            attended: record.status === 'present' || record.status === 'extra',
            type: record.status === 'extra' ? 'ekstra' : 'pakete-dahil',
            notes: record.time || ''
          } as any)
        }
      }
      
      setShowNewAttendanceModal(false)
      setSelectedLesson(null)
      setAttendanceRecords([])
      setMemberLessons([])
      
      // Refresh all attendances for the date
      await loadAllAttendancesForDate(selectedDate)
      // Drop planned-only list so UI reflects saved statuses immediately
      setScheduledMembers([])
    } catch (error) {
      console.error('Error saving attendance:', error)
      push({ variant: 'error', message: 'Yoklama kaydedilemedi' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="success">Geldi</Badge>
      case 'absent':
        return <Badge variant="destructive">Gelmedi</Badge>
      case 'extra':
        return <Badge variant="info">Ekstra</Badge>
      default:
        return <Badge variant="secondary">Yoklama Alınmadı</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'extra':
        return <Clock className="w-5 h-5 text-blue-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  // Merge scheduled members with saved attendances for the date.
  // Saved attendances override scheduled (pending) statuses.
  const mergedRecords: AttendanceRecord[] = (() => {
    if (selectedLesson) return attendanceRecords
    const map = new Map<string, AttendanceRecord>()
    for (const rec of scheduledMembers) {
      const key = `${rec.memberId}-${rec.lessonId || '0'}`
      map.set(key, rec)
    }
    for (const rec of allAttendances) {
      const key = `${rec.memberId}-${rec.lessonId || '0'}`
      map.set(key, rec) // override with actual attendance (present/absent/extra)
    }
    // if there are no scheduled members, fall back to all attendances
    if (map.size === 0) {
      for (const rec of allAttendances) {
        const key = `${rec.memberId}-${rec.lessonId || '0'}`
        map.set(key, rec)
      }
    }
    return Array.from(map.values())
  })()

  const filteredMembers = mergedRecords.filter(record => {
    // Status filter
    if (filterStatus !== 'all' && record.status !== filterStatus) return false
    
    // Lesson filter by lesson name (only when showing all attendances)
    if (!selectedLesson && selectedLessonFilter !== 'all') {
      const name = record.lesson?.name || ''
      if (name !== selectedLessonFilter) return false
    }
    
    return true
  })

  const stats = {
    total: mergedRecords.length,
    present: mergedRecords.filter(r => r.status === 'present').length,
    absent: mergedRecords.filter(r => r.status === 'absent').length,
    extra: mergedRecords.filter(r => r.status === 'extra').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Yoklama Takibi</h2>
          <p className="text-gray-600">Günlük yoklama ve üye takibi</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={() => {
            setShowNewAttendanceModal(true)
            setSelectedLesson(null)
            setAttendanceRecords([])
            setMemberLessons([])
            loadLessonsForDate(selectedDate)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Yoklama
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Üye</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gelenler</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
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
                <p className="text-sm font-medium text-gray-600">Gelmeyenler</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ekstra</p>
                <p className="text-2xl font-bold text-blue-600">{stats.extra}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
          <CardDescription>Yoklama durumuna ve derse göre filtreleme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Filters */}
            <div className="flex items-center space-x-4">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                Tümü ({stats.total})
              </Button>
              <Button
                variant={filterStatus === 'present' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('present')}
              >
                Gelenler ({stats.present})
              </Button>
              <Button
                variant={filterStatus === 'absent' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('absent')}
              >
                Gelmeyenler ({stats.absent})
              </Button>
              <Button
                variant={filterStatus === 'extra' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('extra')}
              >
                Ekstra ({stats.extra})
              </Button>
            </div>
            
            {/* Lesson Filter (only when showing all attendances). Show unique lesson names once. */}
            {!selectedLesson && (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Ders Filtresi:</span>
                <Button
                  variant={selectedLessonFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedLessonFilter('all')}
                >
                  Tüm Dersler
                </Button>
                {Array.from(new Set(lessons.map(l => l.name))).map((lessonName) => (
                  <Button
                    key={lessonName}
                    variant={selectedLessonFilter === lessonName ? 'default' : 'outline'}
                    onClick={() => setSelectedLessonFilter(lessonName)}
                  >
                    {lessonName}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Member List */}
      <Card>
        <CardHeader>
          <CardTitle>Üye Listesi</CardTitle>
          <CardDescription>
            {selectedLesson ? `${selectedLesson.name} dersi için yoklama durumları` : `${selectedDate} tarihi için tüm derslerin yoklama durumları`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Yükleniyor...</div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedLesson ? 'Bu ders için atanmış üye bulunamadı' : 'Bu tarih için yoklama kaydı bulunamadı'}
            </div>
          ) : (
          <div className="space-y-4">
              {filteredMembers.map((record) => (
              <div
                  key={`${record.memberId}-${record.lessonId || 'no-lesson'}`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                    {getStatusIcon(record.status)}
                  <div>
                      <h3 className="font-medium text-gray-900">
                        {record.member.firstName} {record.member.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{record.member.phoneNumber || 'Telefon yok'}</p>
                      <p className="text-xs text-gray-400">
                        {record.member.remainingLessons} ders kaldı
                      </p>
                      {!selectedLesson && record.lesson && (
                        <p className="text-xs text-blue-600 font-medium">
                          {record.lesson.name} - {record.lesson.startTime}
                        </p>
                      )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {record.time && (
                    <span className="text-sm text-gray-500">{record.time}</span>
                  )}
                  {getStatusBadge(record.status)}
                </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Attendance Modal */}
      <Modal
        isOpen={showNewAttendanceModal}
        onClose={() => setShowNewAttendanceModal(false)}
        title="Yeni Yoklama"
      >
        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lesson Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ders Seçimi
            </label>
            {lessons.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Henüz ders bulunmuyor
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedLesson?.id === lesson.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleLessonSelect(lesson)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{lesson.name}</h3>
                        <p className="text-sm text-gray-500">
                          {lesson.instructor} • {lesson.startTime}-{lesson.endTime}
                        </p>
                        <p className="text-xs text-gray-400">
                          {lesson.dayOfWeek} • {lesson.location}
                        </p>
                      </div>
                      <BookOpen className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Lesson Members */}
          {selectedLesson && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedLesson.name} Dersi - Katılacak Üyeler
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddMemberModal(true)
                    loadAllMembers()
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Derse Üye Ekle
                </Button>
              </div>
              {loading ? (
                <div className="text-center py-4 text-gray-500">
                  Üyeler yükleniyor...
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Bu ders için atanmış üye bulunamadı
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {attendanceRecords.map((record) => (
                    <div
                      key={record.memberId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {record.member.firstName} {record.member.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">{record.member.phoneNumber || 'Telefon yok'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant={record.status === 'present' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAttendanceChange(record.memberId, 'present')}
                        >
                          Geldi
                        </Button>
                        <Button
                          variant={record.status === 'absent' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAttendanceChange(record.memberId, 'absent')}
                        >
                          Gelmedi
                        </Button>
                        <Button
                          variant={record.status === 'extra' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAttendanceChange(record.memberId, 'extra')}
                        >
                          Ekstra
                  </Button>
                </div>
              </div>
            ))}
          </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowNewAttendanceModal(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleSaveAttendance}
              disabled={!selectedLesson || attendanceRecords.length === 0 || loading}
            >
              {loading ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Derse Üye Ekle"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedLesson?.name} Dersi için Üye Seçimi
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Derse katılacak üyeleri seçin (çoklu seçim yapabilirsiniz)
            </p>
            
            {allMembers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Üye bulunamadı
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {allMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMembers.includes(member.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMemberSelect(member.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400">
                          {member.phoneNumber || 'Telefon yok'}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {selectedMembers.includes(member.id) && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMemberModal(false)
                setSelectedMembers([])
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleAddMemberToLesson}
              disabled={selectedMembers.length === 0 || loading}
            >
              {loading ? 'Ekleniyor...' : `${selectedMembers.length} Üyeyi Ekle`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 