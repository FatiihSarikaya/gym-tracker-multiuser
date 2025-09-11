const API_BASE_URL = '/api'

// API Response types
export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: string;
  membershipStartDate: string;
  membershipEndDate?: string;
  membershipType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  attendances?: Attendance[];
  payments?: Payment[];
}

export interface CreateMemberDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: string;
  membershipType: string;
  totalLessons?: number;
  isActive: boolean;
}

export interface UpdateMemberDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: string;
  membershipType: string;
  isActive: boolean;
  // optional counters/lessons
  totalLessons?: number;
  attendedCount?: number;
  extraCount?: number;
  remainingLessons?: number;
}

export interface Attendance {
  id: number;
  memberId: number;
  checkInTime: string;
  checkOutTime?: string;
  notes?: string;
  createdAt: string;
  member?: Member;
}

export interface CheckInDto {
  memberId: number;
  notes?: string;
}

export interface Payment {
  id: number;
  memberId: number;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  paymentDate: string;
  dueDate: string;
  status: string;
  transactionId?: string;
  notes?: string;
  createdAt: string;
  member?: Member;
}

export interface CreatePaymentDto {
  memberId: number;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  paymentDate: string;
  dueDate: string;
  status: string;
  transactionId?: string;
  notes?: string;
}

export interface Lesson {
  id: number;
  name: string;
  description?: string;
  instructor: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lessonAttendances?: LessonAttendance[];
}

export interface CreateLessonDto {
  name: string;
  description?: string;
  instructor: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  location: string;
  isActive: boolean;
}

export interface LessonAttendance {
  id: number;
  memberId: number;
  lessonId: number;
  lessonDate: string;
  attended: boolean;
  type: string;
  notes?: string;
  createdAt: string;
  member?: Member;
  lesson?: Lesson;
}

export interface CreateLessonAttendanceDto {
  memberId: number;
  lessonId: number;
  lessonDate: string;
  attended: boolean;
  notes?: string;
}

export interface PackageDef { name: string; lessonCount: number; price: number }
export interface MemberPackagePurchase { memberId: number; packageName: string }

export interface MemberLessonAssign {
  memberId: number
  lessonId: number
  daysOfWeek: string[]
  startDate: string
  endDate?: string
}

export interface MemberLesson {
  id: number
  memberId: number
  lessonId: number
  daysOfWeek: string[]
  startDate: string
  endDate?: string
}

export interface LessonAttendanceCreate {
  memberId: number
  lessonId: number
  date: string
  status: 'present' | 'absent' | 'extra'
  time?: string
}

export interface LessonAttendanceUpdate {
  status: 'present' | 'absent' | 'extra'
  time?: string
}

// API Service class
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Uploads removed (no photo management)

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log('Making API request to:', url);
    console.log('Request config:', config);

    try {
      const response = await fetch(url, config);
      console.log('Response received:', response.status, response.statusText);
      
      if (!response.ok) {
        const err = new Error(`HTTP error! status: ${response.status}`) as any
        try {
          const detail = await response.json()
          ;(err as any).detail = detail
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('api:error', { detail }))
          }
        } catch {}
        throw err
      }

      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Request URL:', url);
      console.error('Request config:', config);
      throw error;
    }
  }

  // Members API
  async getMembers(): Promise<Member[]> {
    return this.request<Member[]>('/Members');
  }

  async getMember(id: number): Promise<Member> {
    return this.request<Member>(`/Members/${id}`);
  }

  async createMember(member: CreateMemberDto): Promise<Member> {
    console.log('createMember called with:', member);
    const result = await this.request<Member>('/Members', {
      method: 'POST',
      body: JSON.stringify(member),
    });
    console.log('createMember result:', result);
    return result;
  }

  async updateMember(id: number, member: UpdateMemberDto): Promise<void> {
    return this.request<void>(`/Members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    });
  }

  async deleteMember(id: number): Promise<void> {
    return this.request<void>(`/Members/${id}`, {
      method: 'DELETE',
    });
  }

  // Attendance API
  async getAttendances(): Promise<Attendance[]> {
    return this.request<Attendance[]>('/Attendance');
  }

  async getAttendance(id: number): Promise<Attendance> {
    return this.request<Attendance>(`/Attendance/${id}`);
  }

  async getAttendancesByMember(memberId: number): Promise<Attendance[]> {
    return this.request<Attendance[]>(`/Attendance/member/${memberId}`);
  }

  async checkIn(checkInData: CheckInDto): Promise<Attendance> {
    return this.request<Attendance>('/Attendance/checkin', {
      method: 'POST',
      body: JSON.stringify(checkInData),
    });
  }

  async checkOut(id: number): Promise<void> {
    return this.request<void>(`/Attendance/${id}/checkout`, {
      method: 'PUT',
    });
  }

  async deleteAttendance(id: number): Promise<void> {
    return this.request<void>(`/Attendance/${id}`, {
      method: 'DELETE',
    });
  }

  // Payments API
  async getPayments(): Promise<Payment[]> {
    return this.request<Payment[]>('/Payments');
  }

  async getPayment(id: number): Promise<Payment> {
    return this.request<Payment>(`/Payments/${id}`);
  }

  async getPaymentsByMember(memberId: number): Promise<Payment[]> {
    return this.request<Payment[]>(`/Payments/member/${memberId}`);
  }

  async createPayment(payment: CreatePaymentDto): Promise<Payment> {
    return this.request<Payment>('/Payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async updatePayment(id: number, payment: any): Promise<void> {
    return this.request<void>(`/Payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payment),
    });
  }

  async deletePayment(id: number): Promise<void> {
    return this.request<void>(`/Payments/${id}`, {
      method: 'DELETE',
    });
  }

  // Lessons API
  async getLessons(): Promise<Lesson[]> {
    return this.request<Lesson[]>('/Lessons');
  }
  async getLessonsByDate(date: string): Promise<Lesson[]> {
    return this.request<Lesson[]>(`/Lessons/date/${date}`);
  }

  async getLesson(id: number): Promise<Lesson> {
    return this.request<Lesson>(`/Lessons/${id}`);
  }

  async createLesson(lesson: CreateLessonDto): Promise<Lesson> {
    return this.request<Lesson>('/Lessons', {
      method: 'POST',
      body: JSON.stringify(lesson),
    });
  }

  async updateLesson(id: number, lesson: any): Promise<void> {
    return this.request<void>(`/Lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lesson),
    });
  }

  async deleteLesson(id: number): Promise<void> {
    return this.request<void>(`/Lessons/${id}`, {
      method: 'DELETE',
    });
  }

  // Lesson Attendances API
  async getLessonAttendances(): Promise<LessonAttendance[]> {
    return this.request<LessonAttendance[]>('/LessonAttendances');
  }

  async getLessonAttendance(id: number): Promise<LessonAttendance> {
    return this.request<LessonAttendance>(`/LessonAttendances/${id}`);
  }

  async getLessonAttendancesByMember(memberId: number): Promise<LessonAttendance[]> {
    return this.request<LessonAttendance[]>(`/LessonAttendances/member/${memberId}`);
  }

  async getLessonAttendancesByLesson(lessonId: number): Promise<LessonAttendance[]> {
    return this.request<LessonAttendance[]>(`/LessonAttendances/lesson/${lessonId}`);
  }

  async getLessonAttendancesByLessonAndDate(lessonId: number, lessonDate: string): Promise<LessonAttendance[]> {
    return this.request<LessonAttendance[]>(`/LessonAttendances/lesson/${lessonId}/date/${lessonDate}`);
  }

  async getLessonAttendancesByDate(lessonDate: string): Promise<LessonAttendance[]> {
    return this.request<LessonAttendance[]>(`/LessonAttendances/date/${lessonDate}`)
  }

  async createLessonAttendance(lessonAttendance: CreateLessonAttendanceDto): Promise<LessonAttendance> {
    return this.request<LessonAttendance>('/LessonAttendances', {
      method: 'POST',
      body: JSON.stringify(lessonAttendance),
    });
  }

  async updateLessonAttendance(id: number, lessonAttendance: any): Promise<void> {
    return this.request<void>(`/LessonAttendances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lessonAttendance),
    });
  }

  async deleteLessonAttendance(id: number): Promise<void> {
    return this.request<void>(`/LessonAttendances/${id}`, {
      method: 'DELETE',
    });
  }

  // Member Lessons API
  async assignMemberToLesson(payload: MemberLessonAssign) {
    return this.request(`/MemberLessons/assign`, { method: 'POST', body: JSON.stringify(payload) })
  }
  async getMemberLessonsByLessonAndDate(lessonId: number, date: string) {
    return this.request(`/MemberLessons/lesson/${lessonId}/date/${date}`)
  }
  async getMemberLessonsByMember(memberId: number) {
    return this.request(`/MemberLessons/member/${memberId}`)
  }

  // Member Packages API
  async getMemberPackages(memberId: number) {
    return this.request(`/MemberPackages/member/${memberId}`)
  }

  async purchasePackage(memberId: number, packageName: string) {
    return this.request('/MemberPackages/purchase', {
      method: 'POST',
      body: JSON.stringify({ memberId, packageName })
    })
  }

  async deleteMemberPackage(packageId: number) {
    return this.request(`/MemberPackages/${packageId}`, {
      method: 'DELETE'
    })
  }

  // Packages API
  async getPackages(): Promise<PackageDef[]> {
    return this.request<PackageDef[]>(`/Packages`)
  }

}

// Export singleton instance
export const apiService = new ApiService(API_BASE_URL)

// Test function to check API connectivity
export const testApiConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/Members`)
    console.log('API Test Response:', response.status, response.statusText)
    return response.ok
  } catch (error) {
    console.error('API Test Error:', error)
    return false
  }
}
