 'use client'

 import { useEffect, useMemo, useState } from 'react'
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
 import { Button } from '@/components/ui/button'
 import { Badge } from '@/components/ui/badge'
 import { Calendar, Clock, Users, Plus, CheckCircle } from 'lucide-react'
 import { apiService } from '@/services/api'

 export default function WeeklySchedule() {
   const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0])
   const [sessionsByDay, setSessionsByDay] = useState<Record<string, { time: string; member: string; type: string }[]>>({})
   const [totals, setTotals] = useState({ members: 0, sessions: 0 })

   const dayName = (dateISO: string) => {
     const d = new Date(dateISO)
     const names = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
     return names[d.getDay()]
   }

   // Ders ve saatin geçmiş olup olmadığını kontrol et
   const isLessonPast = (dateISO: string, time: string) => {
     const now = new Date()
     const lessonDate = new Date(dateISO)
     
     // Eğer tarih bugünden önceyse kesinlikle geçmiş
     if (lessonDate.toDateString() !== now.toDateString()) {
       return lessonDate < now
     }
     
     // Aynı günse saati kontrol et
     const [hours, minutes] = time.split(':').map(Number)
     const lessonTime = new Date(lessonDate)
     lessonTime.setHours(hours, minutes, 0, 0)
     
     return lessonTime < now
   }

   const weekRange = useMemo(() => {
     const start = new Date(selectedWeek)
     const end = new Date(start)
     end.setDate(start.getDate() + 7)
     const days: string[] = []
     for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
       days.push(new Date(d).toISOString().split('T')[0])
     }
     return days
   }, [selectedWeek])

   useEffect(() => {
     const load = async () => {
       try {
         // Haftalık program için: hem atanmış dersler hem de yeni oluşturulan dersler
         const members = await apiService.getMembers()
         
         // 1. Member-lesson assignments'tan gelen veriler
         const assignmentSessions = await Promise.all(
           members.map(async (m: any) => {
             try {
               const assigns = await apiService.getMemberLessonsByMember(m.id) as any[]
               const detailed = await Promise.all(
                 (assigns || []).map(async (a: any) => {
                   const l = await apiService.getLesson(a.lessonId)
                   return {
                     date: a.startDate,
                     time: l?.startTime || '',
                     member: `${m.firstName} ${m.lastName}`,
                     type: l?.name || '-',
                     source: 'assignment'
                   }
                 })
               )
               return detailed.filter(s => s.date && weekRange.includes(s.date))
             } catch {
               return []
             }
           })
         )
         
         // 2. Yeni oluşturulan lesson'lar (lessonDate field'ı olan)
         const weekLessons = await Promise.all(
           weekRange.map(async (date) => {
             try {
               const lessons = await apiService.getLessonsByDate(date) as any[]
               const lessonSessions = await Promise.all(
                 lessons.map(async (lesson: any) => {
                   // Bu lesson'a atanmış üyeleri bul (MemberLesson'dan)
                   try {
                     const memberLessons = await apiService.getMemberLessonsByLessonAndDate(lesson.id, date) as any[]
                     return memberLessons.map((ml: any) => {
                       const member = members.find((m: any) => m.id === ml.memberId)
                       return {
                         date,
                         time: lesson.startTime || '',
                         member: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
                         type: lesson.name || '-',
                         source: 'lesson'
                       }
                     })
                   } catch {
                     return []
                   }
                 })
               )
               return ([] as any[]).concat(...lessonSessions)
             } catch {
               return []
             }
           })
         )
         
         // Tüm session'ları birleştir
         const allSessions = [
           ...([] as any[]).concat(...assignmentSessions),
           ...([] as any[]).concat(...weekLessons)
         ]
         
         // Duplicate'leri temizle (aynı member+date+time kombinasyonu)
         const uniqueSessions = allSessions.filter((session, index, arr) => {
           return index === arr.findIndex(s => 
             s.member === session.member && 
             s.date === session.date && 
             s.time === session.time
           )
         })
         
         const perMember = [uniqueSessions]
         const flat = ([] as any[]).concat(...perMember as any)
         const grouped: Record<string, { time: string; member: string; type: string }[]> = {}
         for (const s of flat) {
           if (!grouped[s.date]) grouped[s.date] = []
           grouped[s.date].push({ time: s.time, member: s.member, type: s.type })
         }
         // sort sessions by time within each day
         Object.values(grouped).forEach(list => list.sort((a, b) => (a.time || '').localeCompare(b.time || '')))
         setSessionsByDay(grouped)
         setTotals({ members: new Set(flat.map(f => f.member)).size, sessions: flat.length })
       } catch (e) {
         console.error('WeeklySchedule load failed', e)
         setSessionsByDay({})
         setTotals({ members: 0, sessions: 0 })
       }
     }
     load()
   }, [weekRange])

   const averagePerDay = Math.round((totals.sessions || 0) / 7)

   return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Haftalık Program</h2>
          <p className="text-gray-600">Üyelerin haftalık ders programları</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Üye</p>
                <p className="text-2xl font-bold text-gray-900">{totals.members}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Ders</p>
                <p className="text-2xl font-bold text-green-600">{totals.sessions}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ortalama/Gün</p>
                <p className="text-2xl font-bold text-purple-600">{averagePerDay}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Haftalık Genel Bakış</CardTitle>
          <CardDescription>Günlük üye sayıları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {weekRange.map((dateISO) => (
              <div key={dateISO} className="text-center">
                <div className="p-4 border rounded-lg hover:bg-gray-50">
                  <h3 className="font-medium text-gray-900">{dayName(dateISO)}</h3>
                  {(() => {
                    const sessions = (sessionsByDay[dateISO] || [])
                    const hourCount = new Set(sessions.map(s => (s.time || '').slice(0,5))).size
                    return <p className="text-2xl font-bold text-blue-600">{hourCount}</p>
                  })()}
                  <p className="text-xs text-gray-500">ders</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {weekRange.map((dateISO) => (
          <Card key={dateISO}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{dayName(dateISO)} - {dateISO}</span>
                {(() => {
                  const sessions = (sessionsByDay[dateISO] || [])
                  const hourCount = new Set(sessions.map(s => (s.time || '').slice(0,5))).size
                  return <Badge variant="info">{hourCount} ders</Badge>
                })()}
              </CardTitle>
              <CardDescription>Günlük program detayları</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const sessions = (sessionsByDay[dateISO] || [])
                if (sessions.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>Bu gün için program yok</p>
                    </div>
                  )
                }
                const byHour: Record<string, { time: string; member: string; type: string }[]> = {}
                sessions.forEach(s => {
                  const hour = (s.time || '').slice(0,5)
                  if (!byHour[hour]) byHour[hour] = []
                  byHour[hour].push(s)
                })
                const hours = Object.keys(byHour).sort()
                return (
                  <div className="space-y-3">
                    {hours.map((h) => {
                      const isPast = isLessonPast(dateISO, h)
                      return (
                        <details key={h} className="border rounded-lg">
                          <summary className="flex items-center justify-between p-3 cursor-pointer select-none">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-full ${isPast ? 'bg-green-100' : 'bg-blue-100'}`}>
                                {isPast ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <span className={`font-medium ${isPast ? 'text-green-900' : 'text-gray-900'}`}>
                                {h}
                                {isPast && <span className="ml-2 text-green-600">✓</span>}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">{byHour[h].length} üye</Badge>
                          </summary>
                          <div className="divide-y">
                            {byHour[h].map((s, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3">
                                <div>
                                  <p className="font-medium text-gray-900">{s.member}</p>
                                  <p className="text-sm text-gray-500">{s.type}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">{s.type}</Badge>
                              </div>
                            ))}
                          </div>
                        </details>
                      )
                    })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 