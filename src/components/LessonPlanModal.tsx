 'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, User, Trash2, Edit2, Plus, Users, UserPlus, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import { apiService } from '@/services/api'
import { useToast } from './ui/toast'

interface Lesson {
  id: number
  date: string // yyyy-mm-dd
  time: string // hh:mm
  type: 'pakete-dahil' | 'ekstra'
}

interface Member {
  id: number
  name: string
  lessons: Lesson[]
  totalLessons?: number
  attendedCount?: number
  remainingLessons?: number
  membershipType?: string
}

interface LessonPlanModalProps { onClose: () => void }

export default function LessonPlanModal({ onClose }: LessonPlanModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [assignDate, setAssignDate] = useState<string>('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [newLesson, setNewLesson] = useState({ date: '', time: '', type: 'pakete-dahil' as 'pakete-dahil' | 'ekstra' })
  const [editLessonId, setEditLessonId] = useState<number | null>(null)
  const [editLesson, setEditLesson] = useState({ date: '', time: '', type: 'pakete-dahil' as 'pakete-dahil' | 'ekstra' })
  const [instructor, setInstructor] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const { push } = useToast()
  const timeOptions = Array.from({ length: 24 * 12 }, (_, i) => {
    const totalMinutes = i * 5
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
    const mm = String(totalMinutes % 60).padStart(2, '0')
    return `${hh}:${mm}`
  })
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

  const selectedMember = selectedMemberId ? members.find(m => m.id === selectedMemberId) : undefined
  const selectedLesson = selectedLessonId ? lessons.find(l => l.id === selectedLessonId) : null

  useEffect(() => {
    const load = async () => {
      try {
        const [ms, ls] = await Promise.all([
          apiService.getMembers() as any,
          apiService.getLessons() as any
        ])
        
        // Sadece aktif üyeleri filtrele
        const activeMembers = ms.filter((m: any) => m.isActive)
        setMembers(activeMembers.map((m: any) => ({ 
          id: m.id, 
          name: `${m.firstName} ${m.lastName}`, 
          lessons: [],
          totalLessons: m.totalLessons || 0,
          attendedCount: m.attendedCount || 0,
          remainingLessons: m.remainingLessons || 0
        })))
        // Ders Seç bölümünde sadece her ders türünden 1 örnek göster
        const uniqueByName = Object.values(
          (ls || []).reduce((acc: Record<string, any>, cur: any) => {
            if (!acc[cur.name]) acc[cur.name] = cur
            return acc
          }, {})
        ) as any[]
        setLessons(uniqueByName)
        if (activeMembers.length > 0) setSelectedMemberId(activeMembers[0].id)
      } catch (e) {
        console.error('Load data failed:', e)
      }
    }
    load()
  }, [])

  // Prefill editable fields when lesson changes
  useEffect(() => {
    if (selectedLesson) {
      setInstructor(selectedLesson.instructor || '')
      setStartTime(selectedLesson.startTime || '')
      setEndTime(selectedLesson.endTime || '')
    } else {
      setInstructor('')
      setStartTime('')
      setEndTime('')
    }
  }, [selectedLessonId])

  const toggleMember = (id: number) => {
    const member = members.find(m => m.id === id)
    const isPackageFinished = (member?.totalLessons || 0) === (member?.attendedCount || 0) && (member?.totalLessons || 0) > 0
    
    if (isPackageFinished) {
      return // Don't allow selection if package is finished
    }
    
    setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleAssignMembers = async () => {
    if (!selectedLessonId || selectedMemberIds.length === 0 || !assignDate) return
    
    // Check for members with finished packages and try to activate waiting packages
    const membersToProcess = []
    for (const memberId of selectedMemberIds) {
      const member = members.find(m => m.id === memberId)
      const isPackageFinished = (member?.totalLessons || 0) === (member?.attendedCount || 0) && (member?.totalLessons || 0) > 0
      
      if (isPackageFinished) {
        // Try to activate waiting package by calling the API
        try {
          const response = await fetch(`/api/MemberPackages/activate-waiting/${memberId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          
          if (response.ok) {
            // Package was activated, refresh member data
            const updatedMembers = await apiService.getMembers()
            setMembers(updatedMembers.map((m: any) => ({ 
              id: m.id, 
              name: `${m.firstName} ${m.lastName}`, 
              lessons: [],
              totalLessons: m.totalLessons || 0,
              attendedCount: m.attendedCount || 0,
              remainingLessons: m.remainingLessons || 0,
              membershipType: m.membershipType || ''
            })))
            membersToProcess.push(memberId)
          } else {
            console.log(`No waiting package found for member ${memberId}`)
          }
        } catch (error) {
          console.error('Error activating waiting package:', error)
        }
      } else {
        membersToProcess.push(memberId)
      }
    }
    
    if (membersToProcess.length === 0) {
      push({ variant: 'error', message: 'Seçilen üyelerin ders hakkı bitmiş ve bekleyen paket yok' })
      setSelectedMemberIds([])
      return
    }
    
    let usedLessonId = selectedLessonId
    // Eğer kullanıcı eğitmen/saat girmişse yeni tarihli ders oluştur
    try {
      if (instructor || startTime || endTime) {
        const base = lessons.find(l => l.id === selectedLessonId)
        const created = await apiService.createLesson({
          name: base?.name,
          description: base?.description || '',
          instructor: instructor || base?.instructor,
          dayOfWeek: base?.dayOfWeek,
          startTime: startTime || base?.startTime,
          endTime: endTime || base?.endTime,
          maxCapacity: base?.maxCapacity || 0,
          location: base?.location || '',
          isActive: true,
          lessonDate: assignDate,
        } as any)
        usedLessonId = created.id
      }
      const daysOfWeek = String((lessons.find(l => l.id === usedLessonId) || lessons.find(l => l.id === selectedLessonId))?.dayOfWeek || '').split(/\s+/).filter(Boolean)
      for (const memberId of membersToProcess) {
        try {
          await apiService.assignMemberToLesson({ memberId, lessonId: usedLessonId, daysOfWeek, startDate: assignDate })
        } catch (e) {
          console.error('assign failed', e)
        }
      }
      setSelectedMemberIds([])
      push({ variant: 'success', message: 'Ders oluşturuldu ve üyeler atandı' })
    } catch (e) {
      console.error(e)
      push({ variant: 'error', message: 'İşlem başarısız' })
    }
  }

  const handleAddLesson = () => {
    if (!newLesson.date || !newLesson.time) return
    setMembers(prev => prev.map(m => m.id === selectedMemberId ? {
      ...m,
      lessons: [
        ...m.lessons,
        { id: Date.now(), date: newLesson.date, time: newLesson.time, type: newLesson.type }
      ]
    } : m))
    setNewLesson({ date: '', time: '', type: 'pakete-dahil' })
  }

  const handleDeleteLesson = (lessonId: number) => {
    setMembers(prev => prev.map(m => m.id === selectedMemberId ? {
      ...m,
      lessons: m.lessons.filter(l => l.id !== lessonId)
    } : m))
  }

  const handleEditLesson = (lesson: Lesson) => {
    setEditLessonId(lesson.id)
    setEditLesson({ date: lesson.date, time: lesson.time, type: lesson.type })
  }

  const handleSaveEditLesson = () => {
    if (!editLesson.date || !editLesson.time || editLessonId === null) return
    setMembers(prev => prev.map(m => m.id === selectedMemberId ? {
      ...m,
      lessons: m.lessons.map(l => l.id === editLessonId ? { ...l, ...editLesson } : l)
    } : m))
    setEditLessonId(null)
    setEditLesson({ date: '', time: '', type: 'pakete-dahil' })
  }

  return (
    <div className="space-y-6">
      {/* Ders seçimi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ders Seç</label>
          <select
            className="w-full px-3 py-2 border border-blue-200 bg-white/60 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md font-medium"
            value={selectedLessonId ?? ''}
            onChange={e => setSelectedLessonId(Number(e.target.value))}
          >
            <option value="" disabled>Bir ders seçin</option>
            {lessons.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
          <input type="date" className="w-full px-3 py-2 border border-blue-200 bg-white/60 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md font-medium" value={assignDate} onChange={e => setAssignDate(e.target.value)} />
        </div>
      </div>
      {selectedLesson && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Ders Bilgileri (Düzenle)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eğitmen</label>
                <input className="w-full px-3 py-2 border rounded" value={instructor} onChange={e => setInstructor(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Saati</label>
                <div className="flex gap-2">
                  <select className="w-1/2 px-3 py-2 border rounded" value={startTime.split(':')[0] || ''} onChange={e => setStartTime(`${e.target.value}:${startTime.split(':')[1] || '00'}`)}>
                    <option value="" disabled>SS</option>
                    {hours.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <select className="w-1/2 px-3 py-2 border rounded" value={startTime.split(':')[1] || ''} onChange={e => setStartTime(`${startTime.split(':')[0] || '00'}:${e.target.value}`)}>
                    <option value="" disabled>DD</option>
                    {minutes.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Saati</label>
                <div className="flex gap-2">
                  <select className="w-1/2 px-3 py-2 border rounded" value={endTime.split(':')[0] || ''} onChange={e => setEndTime(`${e.target.value}:${endTime.split(':')[1] || '00'}`)}>
                    <option value="" disabled>SS</option>
                    {hours.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <select className="w-1/2 px-3 py-2 border rounded" value={endTime.split(':')[1] || ''} onChange={e => setEndTime(`${endTime.split(':')[0] || '00'}:${e.target.value}`)}>
                    <option value="" disabled>DD</option>
                    {minutes.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={async () => {
                    if (!selectedLesson) return
                    try {
                      await apiService.updateLesson(selectedLesson.id, { instructor, startTime, endTime } as any)
                      alert('Ders bilgileri güncellendi')
                    } catch (e) {
                      console.error(e)
                      alert('Güncelleme başarısız')
                    }
                  }}
                >
                  Ders Bilgilerini Güncelle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Üye ekle */}
      <Card className="border border-blue-200/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg mr-3">
                <UserPlus className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Derse Üye Ekle
              </h3>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="w-4 h-4 mr-1" />
              {selectedMemberIds.length} seçildi
            </div>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-auto bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-xl p-4 border border-blue-100/50">
            {members.map(m => {
              const isPackageFinished = (m.totalLessons || 0) === (m.attendedCount || 0) && (m.totalLessons || 0) > 0
              const isSelected = selectedMemberIds.includes(m.id)
              
              return (
                <label 
                  key={m.id} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer group ${
                    isPackageFinished 
                      ? 'opacity-50 bg-red-50/50 border border-red-200/50' 
                      : isSelected
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-300/50 shadow-md transform scale-[1.02]'
                        : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-blue-50/50 hover:border-blue-300/50 hover:shadow-md hover:scale-[1.01]'
                  }`}
                >
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggleMember(m.id)}
                      disabled={isPackageFinished}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500' 
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}>
                      {isSelected && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        isPackageFinished 
                          ? 'text-red-600' 
                          : isSelected
                            ? 'text-blue-700'
                            : 'text-gray-700'
                      }`}>
                        {m.name}
                      </span>
                      {isPackageFinished && (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">Ders Hakkı Bitti</span>
                        </div>
                      )}
                    </div>
                    {m.membershipType && (
                      <span className="text-sm text-gray-500 bg-gray-100/80 px-2 py-1 rounded-lg mt-1 inline-block">
                        {m.membershipType}
                      </span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedMemberIds.length > 0 && (
                <span className="text-blue-600 font-medium">
                  {selectedMemberIds.length} üye seçildi
                </span>
              )}
            </div>
            <Button 
              onClick={handleAssignMembers} 
              disabled={!selectedLesson || !assignDate || selectedMemberIds.length === 0}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Üyeleri Ata ({selectedMemberIds.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kapat */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>Kapat</Button>
      </div>
    </div>
  )
}
