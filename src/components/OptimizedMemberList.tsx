'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Users } from 'lucide-react'

interface Member {
  id: number
  firstName: string
  lastName: string
  phoneNumber?: string
  email: string
  isActive: boolean
  membershipType?: string
}

interface OptimizedMemberListProps {
  onMemberSelect?: (member: Member) => void
  showSearch?: boolean
  showFilters?: boolean
  pageSize?: number
}

export default function OptimizedMemberList({ 
  onMemberSelect, 
  showSearch = true, 
  showFilters = true,
  pageSize = 50 
}: OptimizedMemberListProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Debounced search to prevent excessive API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load members with pagination and caching
  const loadMembers = useCallback(async (page: number = 1, search: string = '', filter: string = 'active') => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search,
        filter
      })

      const response = await fetch(`/api/Members/optimized?${params}`)
      if (!response.ok) throw new Error('Failed to load members')
      
      const data = await response.json()
      
      if (page === 1) {
        setMembers(data.members)
      } else {
        // Append for pagination
        setMembers(prev => [...prev, ...data.members])
      }
      
      setTotalCount(data.total)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  // Load initial data
  useEffect(() => {
    loadMembers(1, debouncedSearchTerm, filterActive)
    setCurrentPage(1)
  }, [debouncedSearchTerm, filterActive, loadMembers])

  // Filtered and sorted members (client-side for immediate feedback)
  const displayMembers = useMemo(() => {
    let filtered = members

    // Apply real-time search filter
    if (searchTerm && searchTerm !== debouncedSearchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(member => 
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(term) ||
        member.email.toLowerCase().includes(term) ||
        member.phoneNumber?.includes(term)
      )
    }

    return filtered
  }, [members, searchTerm, debouncedSearchTerm])

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    const nextPage = currentPage + 1
    loadMembers(nextPage, debouncedSearchTerm, filterActive)
    setCurrentPage(nextPage)
  }, [currentPage, debouncedSearchTerm, filterActive, loadMembers])

  // Check if more data available
  const hasMore = members.length < totalCount

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {showSearch && (
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Üye ara (isim, email, telefon)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
              
              {showFilters && (
                <div className="flex gap-2">
                  <Button
                    variant={filterActive === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterActive('all')}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Tümü ({totalCount})
                  </Button>
                  <Button
                    variant={filterActive === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterActive('active')}
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Aktif
                  </Button>
                  <Button
                    variant={filterActive === 'inactive' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterActive('inactive')}
                  >
                    Pasif
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayMembers.map((member) => (
          <Card 
            key={member.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              onMemberSelect ? 'hover:bg-gray-50' : ''
            }`}
            onClick={() => onMemberSelect?.(member)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">
                  {member.firstName} {member.lastName}
                </h3>
                <Badge variant={member.isActive ? 'default' : 'secondary'}>
                  {member.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                {member.phoneNumber && (
                  <p>📞 {member.phoneNumber}</p>
                )}
                <p>📧 {member.email}</p>
                {member.membershipType && (
                  <p>🏷️ {member.membershipType}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Üyeler yükleniyor...</p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="text-center">
          <Button onClick={loadMore} variant="outline">
            Daha Fazla Yükle ({members.length}/{totalCount})
          </Button>
        </div>
      )}

      {/* No Results */}
      {!loading && displayMembers.length === 0 && (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600">
            {searchTerm ? 'Arama kriterlerine uygun üye bulunamadı' : 'Henüz üye bulunmuyor'}
          </p>
        </div>
      )}
    </div>
  )
}
