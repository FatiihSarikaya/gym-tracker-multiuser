'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, Clock, Plus, Search, Filter, Phone, Mail, Loader2 } from 'lucide-react'
import { apiService, Member, CreateMemberDto, UpdateMemberDto } from '@/services/api'
import { useToast } from '@/components/ui/toast'
import NewMemberForm from './NewMemberForm'
import PackageManagementModal from './PackageManagementModal'
import Modal from './ui/modal'

export default function MemberList() {
  const { push } = useToast()
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [editing, setEditing] = useState(false)
  const [filterStart, setFilterStart] = useState<string>('')
  const [filterEnd, setFilterEnd] = useState<string>('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoStoredPath, setPhotoStoredPath] = useState<string | null>(null)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const API_BASE = (typeof process !== 'undefined' && (process as any).env && (process as any).env.NEXT_PUBLIC_API_BASE_URL) ? (process as any).env.NEXT_PUBLIC_API_BASE_URL as string : 'http://localhost:5000/api'
  const UPLOAD_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const data = await apiService.getMembers()
      setMembers(data)
      setError(null)
    } catch (err) {
      setError('Üyeler yüklenirken hata oluştu')
      console.error('Error loading members:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshSelectedMember = async () => {
    if (selectedMember) {
      await openDetails(selectedMember.id)
    }
  }

  const handleCreateMember = async (data: CreateMemberDto) => {
    try {
      await apiService.createMember(data)
      setShowNewForm(false)
      await loadMembers()
      push({ variant: 'success', message: 'Üye oluşturuldu' })
    } catch (e: any) {
      const detail = e?.detail || {}
      const msg = detail?.errors?.email || detail?.message || e?.message || 'Hata'
      push({ variant: 'error', message: `Üye oluşturulamadı: ${msg}` })
    }
  }

  const openDetails = async (id: number) => {
    try {
      const m = await apiService.getMember(id)
      // Stats should come from server counters (do not derive from historic attendances)
      const allAttendances = await apiService.getLessonAttendancesByMember(id)
      const totalLessons = (m as any).totalLessons ?? 0
      const attendedCount = (m as any).attendedCount ?? 0
      const extraCount = (m as any).extraCount ?? 0
      const remainingLessons = (m as any).remainingLessons ?? Math.max(totalLessons - attendedCount, 0)
      const absentCount = Math.max(totalLessons - attendedCount - remainingLessons, 0)
      ;(m as any)._stats = { attendedCount, extraCount, totalLessons, remainingLessons, absentCount }
      // history data (enrich lesson attendances for UI expectations)
      try {
        const pkgs = await apiService.getMemberPackages(id) as any[]
        const enrichedAttendances = await Promise.all(
          (allAttendances || []).map(async (a: any) => {
            try {
              const lesson = await apiService.getLesson(a.lessonId)
              return {
                ...a,
                checkInTime: a.lessonDate, // UI filters use 'checkInTime'
                lessonName: lesson?.name,
                status: a.attended ? (a.type === 'ekstra' ? 'Ekstra' : 'Geldi') : 'Gelmedi',
                packageName: a.packageName || '',
                packageId: a.packageId || null
              }
            } catch {
              return { 
                ...a, 
                checkInTime: a.lessonDate,
                packageName: a.packageName || '',
                packageId: a.packageId || null
              }
            }
          })
        )
        ;(m as any)._history = {
          packages: pkgs || [],
          attendances: enrichedAttendances
        }
      } catch {}
      setSelectedMember(m)
      try {
        const stored = ((m as any).photoUrl as string) || ''
        setPhotoStoredPath(stored || null)
        setPhotoPreview(stored ? `${UPLOAD_ORIGIN}${stored}` : null)
      } catch { setPhotoPreview(null); setPhotoStoredPath(null) }
      setEditing(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteMember(id)
      setSelectedMember(null)
      await loadMembers()
      push({ variant: 'success', message: 'Üye silindi' })
    } catch (e: any) {
      push({ variant: 'error', message: `Silme başarısız: ${e?.message || 'Hata'}` })
    }
  }

  const handleUpdate = async (id: number, payload: UpdateMemberDto) => {
    const clean: any = { ...payload }
    if ((clean as any).totalLessons !== undefined) clean.totalLessons = Number((clean as any).totalLessons) || 0
    if ((clean as any).attendedCount !== undefined) clean.attendedCount = Number((clean as any).attendedCount) || 0
    if ((clean as any).extraCount !== undefined) clean.extraCount = Number((clean as any).extraCount) || 0
    if ((clean as any).remainingLessons !== undefined) clean.remainingLessons = Number((clean as any).remainingLessons) || 0

    // Ensure: totalLessons = attendedCount + remainingLessons
    const total = (clean as any).totalLessons
    const attended = (clean as any).attendedCount
    const remaining = (clean as any).remainingLessons
    if (typeof total === 'number') {
      if (typeof remaining === 'number' && (clean as any).attendedCount === undefined) {
        (clean as any).attendedCount = Math.max(total - remaining, 0)
      } else if (typeof attended === 'number' && (clean as any).remainingLessons === undefined) {
        (clean as any).remainingLessons = Math.max(total - attended, 0)
      }
    }
    try {
      await apiService.updateMember(id, clean)
      setEditing(false)
      await openDetails(id)
      await loadMembers()
      push({ variant: 'success', message: 'Üye güncellendi' })
    } catch (e: any) {
      push({ variant: 'error', message: `Güncelleme başarısız: ${e?.message || 'Hata'}` })
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge variant="success">Aktif</Badge> : 
      <Badge variant="destructive">Pasif</Badge>
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <UserCheck className="w-5 h-5 text-green-600" /> : 
      <UserX className="w-5 h-5 text-red-600" />
  }

  const filteredMembers = members.filter(member => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && member.isActive) ||
      (filterStatus === 'inactive' && !member.isActive)
    const matchesSearch = `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.phoneNumber || '').includes(searchTerm) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: members.length,
    active: members.filter(m => m.isActive).length,
    inactive: members.filter(m => !m.isActive).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Üye Listesi</h2>
          <p className="text-gray-600">Tüm üyelerin detaylı bilgileri</p>
        </div>
        <Button type="button" onClick={() => { console.log('Yeni Üye button clicked'); setShowNewForm(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Üye
        </Button>
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
                <p className="text-sm font-medium text-gray-600">Aktif Üyeler</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pasif</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
          <CardDescription>Üye durumuna göre filtreleme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Üye ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                Tümü ({stats.total})
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
              >
                Aktif ({stats.active})
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
              >
                Pasif ({stats.inactive})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New member form */}
      <Modal isOpen={showNewForm} onClose={() => setShowNewForm(false)} title="Yeni Üye">
        <NewMemberForm onSubmit={handleCreateMember} onCancel={() => setShowNewForm(false)} />
      </Modal>

      {/* Member List */}
      <Card>
        <CardHeader>
          <CardTitle>Üye Detayları</CardTitle>
          <CardDescription>Tüm üyelerin detaylı bilgileri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
                <p className="mt-2 text-gray-500">Üyeler yükleniyor...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
                <Button onClick={loadMembers} className="mt-2">
                  Tekrar Dene
                </Button>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(member.isActive)}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {member.phoneNumber && (
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {member.phoneNumber}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {member.email}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Başlangıç: {new Date(member.membershipStartDate).toLocaleDateString('tr-TR')} | 
                        Üyelik: {member.membershipType}
                      </p>
                      {/* Check if member's package is finished */}
                      {((member as any).totalLessons || 0) === ((member as any).attendedCount || 0) && (member as any).totalLessons > 0 && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          ⚠️ Ders hakkı bitti
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{member.membershipType}</p>
                      <p className="text-sm text-gray-500">
                        {member.attendances?.length || 0} katılım kaydı
                      </p>
                    </div>
                    {getStatusBadge(member.isActive)}
                    <Button variant="outline" size="sm" onClick={() => openDetails(member.id)}>
                      Detay
                    </Button>
                  </div>
                </div>
              ))
            )}
            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Üye bulunamadı</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected member details */}
      {selectedMember && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedMember.firstName} {selectedMember.lastName}
            </CardTitle>
            <CardDescription>Üye detayları ve işlemler</CardDescription>
          </CardHeader>
          <CardContent>
            {!editing ? (
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{selectedMember.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telefon</p>
                      <p className="font-medium">{selectedMember.phoneNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Üyelik Tipi</p>
                      <Badge variant="info">{selectedMember.membershipType}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Başlangıç</p>
                      <p className="font-medium">{new Date(selectedMember.membershipStartDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Durum</p>
                      {getStatusBadge(selectedMember.isActive)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="text-xs text-blue-700">Toplam Ders</p>
                      <p className="text-xl font-semibold text-blue-900">{(selectedMember as any)._stats?.totalLessons ?? 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                      <p className="text-xs text-green-700">Geldiği</p>
                      <p className="text-xl font-semibold text-green-900">{(selectedMember as any)._stats?.attendedCount ?? 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-xs text-amber-700">Kalan</p>
                      <p className="text-xl font-semibold text-amber-900">{(selectedMember as any)._stats?.remainingLessons ?? 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                      <p className="text-xs text-red-700">Gelmedi</p>
                      <p className="text-xl font-semibold text-red-900">{(selectedMember as any)._stats?.absentCount ?? 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <p className="text-xs text-purple-700">Ekstra</p>
                      <p className="text-xl font-semibold text-purple-900">{(selectedMember as any)._stats?.extraCount ?? 0}</p>
                    </div>
                  </div>
                {/* History */}
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-gray-900">Üyelik Geçmişi</h4>
                  {/* Date range filter + exports */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-xs text-gray-500">Başlangıç</label>
                      <input type="date" className="border rounded px-2 py-1" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Bitiş</label>
                      <input type="date" className="border rounded px-2 py-1" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
                    </div>
                    <Button type="button" variant="outline" onClick={() => { setFilterStart(''); setFilterEnd('') }}>Temizle</Button>
                    <Button type="button" onClick={() => exportCsv((selectedMember as any)._history?.attendances || [], 'attendances.csv')}>Yoklamaları İndir (CSV)</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Paketler</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPackageModal(true)}
                          className="text-xs"
                        >
                          Düzenle
                        </Button>
                      </div>
                      <ul className="text-sm space-y-1 max-h-48 overflow-auto">
                        {applyDateFilter(((selectedMember as any)._history?.packages || []), 'purchasedAt', filterStart, filterEnd).length === 0 && (
                          <li className="text-gray-500">Kayıt yok</li>
                        )}
                        {applyDateFilter(((selectedMember as any)._history?.packages || []), 'purchasedAt', filterStart, filterEnd).map((p: any) => (
                          <li key={p.id} className="flex justify-between">
                            <span>{p.packageName} ({p.lessonCount})</span>
                            <span>{new Date(p.purchasedAt).toLocaleDateString('tr-TR')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border rounded p-3">
                      <p className="font-medium mb-2">Yoklama Günleri</p>
                      <ul className="text-sm space-y-1 max-h-48 overflow-auto">
                        {applyDateFilter(((selectedMember as any)._history?.attendances || []), 'checkInTime', filterStart, filterEnd).length === 0 && (
                          <li className="text-gray-500">Kayıt yok</li>
                        )}
                        {applyDateFilter(((selectedMember as any)._history?.attendances || []), 'checkInTime', filterStart, filterEnd).map((a: any) => (
                          <li key={a.id} className="flex justify-between">
                            <div className="flex-1">
                              <div>
                                {new Date(a.checkInTime).toLocaleDateString('tr-TR')} • {a.lessonName || '-'}
                              </div>
                              {a.packageName && (
                                <div className="text-xs text-blue-600">
                                  📦 {a.packageName}
                                </div>
                              )}
                            </div>
                            <span>
                              {a.status || (a.attended ? (a.type === 'ekstra' ? 'Ekstra' : 'Geldi') : 'Gelmedi')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="destructive" onClick={() => handleDelete(selectedMember.id)}>Sil</Button>
                    <Button variant="outline" onClick={() => setEditing(true)}>Düzenle</Button>
                  </div>
                </div>
                {/* Fotoğraf bölümü kaldırıldı */}
              </div>
            ) : (
              <InlineEditForm member={selectedMember} onCancel={() => setEditing(false)} onSave={handleUpdate} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Package Management Modal */}
      {selectedMember && (
        <PackageManagementModal
          isOpen={showPackageModal}
          onClose={() => setShowPackageModal(false)}
          memberId={selectedMember.id}
          memberName={`${selectedMember.firstName} ${selectedMember.lastName}`}
          onPackageUpdate={() => {
            refreshSelectedMember()
          }}
        />
      )}
    </div>
  )
} 

function InlineEditForm({ member, onCancel, onSave }: { member: Member; onCancel: () => void; onSave: (id: number, payload: UpdateMemberDto) => void }) {
  const [form, setForm] = useState<UpdateMemberDto>({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phoneNumber: member.phoneNumber,
    dateOfBirth: member.dateOfBirth,
    membershipType: member.membershipType,
    isActive: member.isActive,
    // counters from DB if available
    // @ts-ignore
    totalLessons: (member as any).totalLessons,
    // @ts-ignore
    attendedCount: (member as any).attendedCount,
    // @ts-ignore
    extraCount: (member as any).extraCount,
    // @ts-ignore
    remainingLessons: (member as any).remainingLessons,
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(member.id, form)
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Ad</label>
          <input className="border rounded px-3 py-2" placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Soyad</label>
          <input className="border rounded px-3 py-2" placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">E-posta</label>
          <input className="border rounded px-3 py-2" placeholder="ornek@eposta.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Telefon</label>
          <input className="border rounded px-3 py-2" placeholder="5xx xxx xx xx" value={form.phoneNumber || ''} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Doğum Tarihi</label>
          <input className="border rounded px-3 py-2" placeholder="YYYY-MM-DD" value={form.dateOfBirth || ''} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Üyelik Tipi</label>
          <input className="border rounded px-3 py-2 bg-gray-100 text-gray-600" value={form.membershipType} readOnly />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Toplam Ders</label>
          <input
            className="border rounded px-3 py-2"
            placeholder="ör. 12"
            value={(form as any).totalLessons || 0}
            onChange={(e) => {
              const newTotal = Number(e.target.value) || 0
              const attended = Number((form as any).attendedCount || 0)
              const newRemaining = Math.max(newTotal - attended, 0)
              // @ts-ignore
              setForm({ ...form, totalLessons: newTotal, remainingLessons: newRemaining })
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Geldiği Ders</label>
          <input
            className="border rounded px-3 py-2"
            placeholder="ör. 3"
            value={(form as any).attendedCount || 0}
            onChange={(e) => {
              const newAttended = Number(e.target.value) || 0
              const total = Number((form as any).totalLessons || 0)
              const newRemaining = Math.max(total - newAttended, 0)
              // @ts-ignore
              setForm({ ...form, attendedCount: newAttended, remainingLessons: newRemaining })
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Extra Ders</label>
          <input className="border rounded px-3 py-2" placeholder="ör. 1" value={(form as any).extraCount || 0} onChange={(e) => setForm({ ...form, // @ts-ignore
            extraCount: Number(e.target.value) || 0 })} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Kalan Ders</label>
          <input
            className="border rounded px-3 py-2"
            placeholder="ör. 9"
            value={(form as any).remainingLessons ?? Math.max(((form as any).totalLessons || 0) - ((form as any).attendedCount || 0), 0)}
            onChange={(e) => {
              const newRemaining = Number(e.target.value) || 0
              const total = Number((form as any).totalLessons || 0)
              const newAttended = Math.max(total - newRemaining, 0)
              // @ts-ignore
              setForm({ ...form, remainingLessons: newRemaining, attendedCount: newAttended })
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Durum</label>
          <select
            className="border rounded px-3 py-2"
            value={form.isActive ? 'true' : 'false'}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
          >
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
        <Button type="submit">Kaydet</Button>
      </div>
    </form>
  )
}

// Helpers
function toDateOnlyISO(d: any) {
  try { return new Date(d).toISOString().slice(0,10) } catch { return '' }
}

function applyDateFilter(list: any[], dateKey: string, startVal?: string, endVal?: string) {
  const s = startVal || ''
  const e = endVal || ''
  if (!s && !e) return list
  return list.filter((item: any) => {
    const ds = toDateOnlyISO(item[dateKey])
    if (s && ds < s) return false
    if (e && ds > e) return false
    return true
  })
}

function exportCsv(list: any[], filename: string) {
  if (!list || list.length === 0) return
  const keys = Array.from(new Set(list.flatMap(o => Object.keys(o))))
  const rows = [keys.join(',')].concat(
    list.map(o => keys.map(k => JSON.stringify(o[k] ?? '')).join(','))
  )
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}