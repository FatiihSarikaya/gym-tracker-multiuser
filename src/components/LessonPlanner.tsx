'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import LessonPlanModal from '@/components/LessonPlanModal'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, Plus, BookOpen, CheckCircle } from 'lucide-react'
import { apiService } from '@/services/api'

export default function LessonPlanner() {
  const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0])
  const [showNewLessonModal, setShowNewLessonModal] = useState(false)
  const [showCancelLessonModal, setShowCancelLessonModal] = useState(false)
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([])
  const [selectedCancelId, setSelectedCancelId] = useState<number | null>(null)

  const getTodayLocalISO = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().split('T')[0]
  }

  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const members = await apiService.getMembers()
        const enriched = await Promise.all(
          members.map(async (m: any) => {
            try {
              const [pkgs, attends, assigns] = await Promise.all([
                apiService.getMemberPackages(m.id) as Promise<any[]>,
                apiService.getLessonAttendancesByMember(m.id) as Promise<any[]>,
                apiService.getMemberLessonsByMember(m.id) as Promise<any[]>
              ])
              const totalLessons = m.totalLessons ?? 0
              const remainingFromMember = (m.remainingLessons !== undefined && m.remainingLessons !== null) ? Number(m.remainingLessons) : undefined
              const completedFromAttendances = attends.filter((a: any) => a.attended).length
              const remainingLessons = Math.max(
                remainingFromMember !== undefined ? remainingFromMember : (totalLessons - completedFromAttendances),
                0
              )
              const completedLessons = Math.max(totalLessons - remainingLessons, 0)
              const pkgName = pkgs && pkgs.length > 0 ? `${pkgs[0].packageName} (${pkgs[0].lessonCount})` : '-'
              let nextLesson = '-'
              let time = ''
              if (assigns && assigns.length > 0) {
                const today = selectedWeek
                const takenSet = new Set((attends || []).map((a: any) => `${a.lessonId}-${a.lessonDate}`))
                const withTimes = await Promise.all(
                  assigns.map(async (a: any) => {
                    const l = await apiService.getLesson(a.lessonId)
                    return { ...a, startTime: l?.startTime || '' }
                  })
                )
                const upcoming = withTimes
                  .filter((a: any) => (a.startDate && a.startDate >= today) && !takenSet.has(`${a.lessonId}-${a.startDate}`))
                  .sort((a: any, b: any) => {
                    if (a.startDate === b.startDate) return (a.startTime || '').localeCompare(b.startTime || '')
                    return a.startDate.localeCompare(b.startDate)
                  })
                if (upcoming.length > 0) {
                  nextLesson = upcoming[0].startDate
                  time = upcoming[0].startTime
                } else {
                  nextLesson = 'Ders atanmadı'
                }
              } else {
                nextLesson = 'Ders atanmadı'
              }
              return {
                id: m.id,
                memberName: `${m.firstName} ${m.lastName}`,
                package: pkgName,
                totalLessons,
                completedLessons,
                remainingLessons,
                nextLesson,
                time,
              }
            } catch {
              return null
            }
          })
        )
        setItems(enriched.filter(Boolean) as any[])
      } catch (e) {
        console.error('LessonPlanner load failed', e)
      }
    }
    load()
  }, [selectedWeek])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Tamamlandı</Badge>
      case 'scheduled':
        return <Badge variant="info">Planlandı</Badge>
      case 'pending':
        return <Badge variant="warning">Bekliyor</Badge>
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>
    }
  }

  const getProgressColor = (completed: number, total: number) => {
    const percentage = (completed / total) * 100
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const stats = {
    total: items.length,
    completed: 0,
    scheduled: 0,
    pending: 0,
    totalLessons: items.reduce((sum, l) => sum + l.totalLessons, 0),
    completedLessons: items.reduce((sum, l) => sum + l.completedLessons, 0)
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a: any, b: any) => {
      if ((a.nextLesson || '') === (b.nextLesson || '')) {
        return (a.time || '').localeCompare(b.time || '')
      }
      return (a.nextLesson || '').localeCompare(b.nextLesson || '')
    })
  }, [items])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ders Planlama</h2>
          <p className="text-gray-600">8-12 ders planlaması ve takibi</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => setShowNewLessonModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Ders
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                // Load upcoming lessons (from today)
                const all = await apiService.getLessons()
                const today = getTodayLocalISO()
                const upcoming = (all as any[])
                  .filter(l => (l.lessonDate || '') >= today)
                  .sort((a: any, b: any) => {
                    if ((a.lessonDate || '') === (b.lessonDate || '')) {
                      return (a.startTime || '').localeCompare(b.startTime || '')
                    }
                    return (a.lessonDate || '').localeCompare(b.lessonDate || '')
                  })
                setUpcomingLessons(upcoming)
                setSelectedCancelId(null)
                setShowCancelLessonModal(true)
              } catch (e) {
                console.error(e)
              }
            }}
          >
            Ders İptal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
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
                <p className="text-sm font-medium text-gray-600">Planlanan</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
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
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Genel İlerleme</CardTitle>
          <CardDescription>Toplam ders tamamlama oranı</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Genel İlerleme</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.completedLessons} / {stats.totalLessons} ders
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${getProgressColor(stats.completedLessons, stats.totalLessons)}`}
                style={{ width: `${(stats.completedLessons / stats.totalLessons) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              %{Math.round((stats.completedLessons / stats.totalLessons) * 100)} tamamlandı
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lesson List */}
      <Card>
        <CardHeader>
          <CardTitle>Üye Listesi</CardTitle>
          <CardDescription>Üye ders planları ve ilerlemeleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedItems.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-blue-100">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{lesson.memberName}</h3>
                    <p className="text-sm text-gray-500">{lesson.package}</p>
                    {lesson.remainingLessons === 1 && (
                      <p className="text-xs font-semibold text-red-600">Dersleri bitmek üzere!</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {lesson.completedLessons}/{lesson.totalLessons} ders
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${getProgressColor(lesson.completedLessons, lesson.totalLessons)}`}
                          style={{ width: `${(lesson.completedLessons / lesson.totalLessons) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Sonraki: {lesson.nextLesson}
                    </p>
                    <p className="text-sm text-gray-500">{lesson.time}</p>
                    <p className="text-xs text-gray-400">
                      {lesson.remainingLessons} ders kaldı
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* New Lesson Modal */}
      <Modal isOpen={showNewLessonModal} onClose={() => setShowNewLessonModal(false)} title="Yeni Ders Planla">
        <LessonPlanModal onClose={() => setShowNewLessonModal(false)} />
      </Modal>

      <Modal isOpen={showCancelLessonModal} onClose={() => setShowCancelLessonModal(false)} title="Ders İptal">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Bugünden itibaren planlanan dersler:</p>
          {upcomingLessons.length === 0 ? (
            <div className="text-gray-500">İptal edilecek ders bulunamadı.</div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {upcomingLessons.map((l: any) => (
                <label key={l.id} className={`flex items-center justify-between p-2 border rounded cursor-pointer ${selectedCancelId === l.id ? 'bg-red-50 border-red-300' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="cancelLesson" checked={selectedCancelId === l.id} onChange={() => setSelectedCancelId(l.id)} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{l.name}</div>
                      <div className="text-xs text-gray-500">{l.lessonDate} • {l.startTime}-{l.endTime} • {l.instructor}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCancelLessonModal(false)}>Kapat</Button>
            <Button
              variant="destructive"
              disabled={!selectedCancelId}
              onClick={async () => {
                if (!selectedCancelId) return
                try {
                  await apiService.deleteLesson(selectedCancelId)
                  setUpcomingLessons(prev => prev.filter(l => l.id !== selectedCancelId))
                  setSelectedCancelId(null)
                  alert('Ders iptal edildi')
                } catch (e) {
                  console.error(e)
                  alert('Ders iptalinde hata')
                }
              }}
            >
              Seçili Dersi İptal Et
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 