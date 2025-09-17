 'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, User, Trash2, Edit2, Plus } from 'lucide-react'
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <input type="date" className="w-full px-3 py-2 border rounded" value={assignDate} onChange={e => setAssignDate(e.target.value)} />
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
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Derse Üye Ekle
          </h3>
          <div className="space-y-2 max-h-48 overflow-auto">
            {members.map(m => {
              const isPackageFinished = (m.totalLessons || 0) === (m.attendedCount || 0) && (m.totalLessons || 0) > 0
              return (
                <label key={m.id} className={`flex items-center gap-2 ${isPackageFinished ? 'opacity-50' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedMemberIds.includes(m.id)} 
                    onChange={() => toggleMember(m.id)}
                    disabled={isPackageFinished}
                  />
                  <span className={isPackageFinished ? 'text-red-600' : ''}>
                    {m.name} {m.membershipType && `(${m.membershipType})`}
                    {isPackageFinished && ' ⚠️ Ders hakkı bitti'}
                  </span>
                </label>
              )
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={handleAssignMembers} disabled={!selectedLesson || !assignDate || selectedMemberIds.length===0}>Üyeleri Ata</Button>
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
