// src/api/reservationsApi.ts - نظام إدارة الحجوزات
import apiClient from ".";

export interface Reservation {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyPrice: number;
  propertyImage?: string;
  userId: number;
  userName: string;
  userPhone: string;
  userEmail: string;
  companyId?: number;
  companyName?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  visitDate: string;
  // visitTime: string;
  notes?: string;
  idImage?: string; // صورة الهوية الشخصية
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationRequest {
  propertyId: number;
  visitDate: string;
  visitTime: string;
  notes?: string;
  idImage?: File; // صورة الهوية الشخصية
}

export interface UpdateReservationRequest {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  visitDate?: string;
  visitTime?: string;
  notes?: string;
}

export interface ReservationStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
}

export interface ReservationsResponse {
  success: boolean;
  data: {
    stats: ReservationStats;
    reservations: Reservation[];
  }
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const reservationsApi = {
  // إنشاء حجز جديد
  createReservation: async (reservationData: CreateReservationRequest): Promise<Reservation> => {
    try {
      // إنشاء FormData لإرسال الملفات
      const formData = new FormData();
      formData.append('propertyId', reservationData.propertyId.toString());
      formData.append('visitDate', reservationData.visitDate);
      formData.append('visitTime', reservationData.visitTime);

      if (reservationData.notes) {
        formData.append('notes', reservationData.notes);
      }

      if (reservationData.idImage) {
        formData.append('idImage', reservationData.idImage);
      }

      const response = await apiClient.post<Reservation>('/api/reservations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في إنشاء الحجز');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // الحصول على جميع الحجوزات (للأدمن والشركات)
  getAllReservations: async (params?: {
    status?: string;
    propertyId?: number;
    userId?: number;
    page?: number;
    limit?: number;
  }): Promise<ReservationsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.propertyId) queryParams.append('propertyId', params.propertyId.toString());
      if (params?.userId) queryParams.append('userId', params.userId.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await apiClient.get<ReservationsResponse>(`/api/reservations?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'غير مصرح لك بالوصول لهذه البيانات');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // الحصول على حجوزات المستخدم الحالي
  getUserReservations: async (): Promise<Reservation[]> => {
    try {
      const response = await apiClient.get<ReservationsResponse>('/api/reservations/user');
      // Return the reservations array from the response
      return response.data.data.reservations || [];
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في جلب الحجوزات');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // الحصول على حجوزات الشركة (للشركات والأدمن)
  getCompanyReservations: async (): Promise<Reservation[]> => {
    try {
      // For companies, we'll use the same endpoint but filter by company
      // The backend should handle the filtering based on the user's role
      const response = await apiClient.get<ReservationsResponse>('/api/reservations', {
        params: {
          // Add company filter if needed
          companyOnly: true
        }
      });

      // Return the reservations array from the response
      return response.data.data.reservations || [];
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في جلب حجوزات الشركة');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // تحديث حالة الحجز
  updateReservation: async (reservationId: number, updateData: UpdateReservationRequest): Promise<Reservation> => {
    try {
      const response = await apiClient.put<Reservation>(`/api/reservations/${reservationId}`, updateData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في تحديث الحجز');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // حذف حجز
  deleteReservation: async (reservationId: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/reservations/${reservationId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في حذف الحجز');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // الحصول على إحصائيات الحجوزات
  getReservationStats: async (): Promise<ReservationStats> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: ReservationStats }>('/api/reservations/stats');
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في جلب الإحصائيات');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // الحصول على حجز واحد بالمعرف
  getReservationById: async (reservationId: number): Promise<Reservation> => {
    try {
      const response = await apiClient.get<Reservation>(`/api/reservations/${reservationId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'الحجز غير موجود');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // التحقق من صلاحيات المستخدم للحجز
  canManageReservation: (reservation: Reservation, userRole: string, userId: number): boolean => {
    // الأدمن يمكنه إدارة جميع الحجوزات
    if (userRole === 'admin') return true;

    // الشركة يمكنها إدارة حجوزات عقاراتها
    if (userRole === 'company' && reservation.companyId === userId) return true;

    // المستخدم يمكنه إدارة حجوزاته الخاصة
    if (reservation.userId === userId) return true;

    return false;
  },

  // التحقق من صحة تاريخ الزيارة
  validateVisitDate: (visitDate: string): boolean => {
    const selectedDate = new Date(visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate >= today;
  },

  // تنسيق تاريخ الزيارة للعرض
  formatVisitDate: (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // تنسيق وقت الزيارة للعرض
  formatVisitTime: (time: string): string => {
    return time;
  },

  // الحصول على حالة الحجز باللغة العربية
  getStatusText: (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'في الانتظار',
      'confirmed': 'مؤكد',
      'cancelled': 'ملغي',
      'completed': 'مكتمل'
    };
    return statusMap[status] || status;
  },

  // الحصول على لون الحالة
  getStatusColor: (status: string): string => {
    const colorMap: { [key: string]: string } = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'confirmed': 'text-green-600 bg-green-100',
      'cancelled': 'text-red-600 bg-red-100',
      'completed': 'text-blue-600 bg-blue-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  }
};
