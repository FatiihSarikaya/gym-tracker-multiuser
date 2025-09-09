 'use client'

 import { useEffect, useMemo, useState } from 'react'
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
 import { Button } from '@/components/ui/button'
 import { Badge } from '@/components/ui/badge'
 import { Calendar, Clock, Users, Plus } from 'lucide-react'
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
         const members = await apiService.getMembers()
         const perMember = await Promise.all(
           members.map(async (m: any) => {
             try {
               const [pkgs, assigns] = await Promise.all([
                 apiService.getMemberPackages(m.id) as Promise<any[]>,
                 apiService.getMemberLessonsByMember(m.id) as Promise<any[]>
               ])
               const pkgName = pkgs && pkgs.length > 0 ? `${pkgs[0].packageName}` : '-'
               const detailed = await Promise.all(
                 (assigns || []).map(async (a: any) => {
                   const l = await apiService.getLesson(a.lessonId)
                   return {
                     date: a.startDate,
                     time: l?.startTime || '',
                     member: `${m.firstName} ${m.lastName}`,
                     type: l?.name || '-'
                   }
                 })
               )
               // filter to next 7 days
               return detailed.filter(s => s.date && weekRange.includes(s.date))
             } catch {
               return []
             }
           })
         )
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
                  <p className="text-2xl font-bold text-blue-600">{(sessionsByDay[dateISO] || []).length}</p>
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
                <Badge variant="info">{(sessionsByDay[dateISO] || []).length} ders</Badge>
              </CardTitle>
              <CardDescription>Günlük program detayları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(sessionsByDay[dateISO] || []).map((session, sessionIndex) => (
                  <div
                    key={sessionIndex}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{session.member}</p>
                        <p className="text-sm text-gray-500">{session.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{session.time}</p>
                      <Badge variant="outline" className="text-xs">
                        {session.type}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(sessionsByDay[dateISO] || []).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Bu gün için program yok</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 