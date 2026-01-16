// src/api/offersApi.ts - نظام إدارة العروض
import apiClient from ".";

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Offer {
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
  status: OfferStatus;
  offerAmount: number;
  visitDate: string;
  visitTime: string;
  notes?: string;
  idImage?: string; // صورة الهوية الشخصية
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferRequest {
  propertyId: number;
  offerAmount: number;
  visitDate: string;
  visitTime: string;
  notes?: string;
  idImage?: File; // صورة الهوية الشخصية
}

export interface UpdateOfferRequest {
  status?: OfferStatus;
  offerAmount?: number;
  visitDate?: string;
  visitTime?: string;
  notes?: string;
}

export interface OfferStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
}

export interface OffersResponse {
  success: boolean;
  data: {
    stats: OfferStats;
    offers: Offer[];
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

export const offersApi = {
  // إنشاء عرض جديد
  createOffer: async (offerData: CreateOfferRequest): Promise<Offer> => {
    try {
      // إنشاء FormData لإرسال الملفات
      const formData = new FormData();
      formData.append('propertyId', offerData.propertyId.toString());
      formData.append('offerAmount', offerData.offerAmount.toString());
      formData.append('visitDate', offerData.visitDate);
      formData.append('visitTime', offerData.visitTime);

      if (offerData.notes) {
        formData.append('notes', offerData.notes);
      }

      if (offerData.idImage) {
        formData.append('idImage', offerData.idImage);
      }

      const response = await apiClient.post<Offer>('/api/offers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في إنشاء العرض');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // الحصول على جميع العروض (للأدمن والشركات)
  getAllOffers: async (params?: {
    status?: string;
    propertyId?: number;
    userId?: number;
    page?: number;
    limit?: number;
  }): Promise<OffersResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.propertyId) queryParams.append('propertyId', params.propertyId.toString());
      if (params?.userId) queryParams.append('userId', params.userId.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await apiClient.get<OffersResponse>(`/api/offers?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'غير مصرح لك بالوصول لهذه البيانات');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // الحصول على عروض المستخدم الحالي
  getUserOffers: async (): Promise<Offer[]> => {
    try {
      const response = await apiClient.get<OffersResponse>('/api/offers/user');
      // Return the offers array from the response
      return response.data.data.offers || [];
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في جلب العروض');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // الحصول على عروض الشركة (للشركات والأدمن)
  getCompanyOffers: async (): Promise<Offer[]> => {
    try {
      // For companies, we'll use the same endpoint but filter by company
      // The backend should handle the filtering based on the user's role
      const response = await apiClient.get<OffersResponse>('/api/offers', {
        params: {
          // Add company filter if needed
          companyOnly: true
        }
      });

      // Return the offers array from the response
      return response.data.data.offers || [];
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في جلب عروض الشركة');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // تحديث حالة العرض
  updateOffer: async (offerId: number, updateData: UpdateOfferRequest): Promise<Offer> => {
    try {
      const response = await apiClient.put<Offer>(`/api/offers/${offerId}`, updateData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في تحديث العرض');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // حذف عرض
  deleteOffer: async (offerId: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/offers/${offerId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في حذف العرض');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // الحصول على إحصائيات العروض
  getOfferStats: async (): Promise<OfferStats> => {
    try {
      const response = await apiClient.get<OfferStats>('/api/offers/stats');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'حدث خطأ في جلب الإحصائيات');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // الحصول على عرض واحد بالمعرف
  getOfferById: async (offerId: number): Promise<Offer> => {
    try {
      const response = await apiClient.get<Offer>(`/api/offers/${offerId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || 'العرض غير موجود');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم');
    }
  },

  // التحقق من صلاحيات المستخدم للعرض
  canManageOffer: (offer: Offer, userRole: string, userId: number): boolean => {
    // الأدمن يمكنه إدارة جميع العروض
    if (userRole === 'admin') return true;

    // الشركة يمكنها إدارة عروض عقاراتها
    if (userRole === 'company' && offer.companyId === userId) return true;

    // المستخدم يمكنه إدارة عروضه الخاصة
    if (offer.userId === userId) return true;

    return false;
  },

  // التحقق من صحة تاريخ الزيارة
  validateVisitDate: (visitDate: string): boolean => {
    const selectedDate = new Date(visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate >= today;
  },

  // التحقق من صحة مبلغ العرض
  validateOfferAmount: (offerAmount: number, propertyPrice: number): boolean => {
    return offerAmount > 0 && offerAmount <= propertyPrice * 2; // السماح بعرض حتى ضعف السعر
  },

  // تنسيق تاريخ الزيارة للعرض
  formatVisitDate: (date: string): string => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // تنسيق وقت الزيارة للعرض
  formatVisitTime: (time: string): string => {
    return time;
  },

  // تنسيق المبلغ
  formatAmount: (amount: number): string => {
    return amount.toLocaleString('ar-SA') + ' ر.ع';
  },

  // الحصول على حالة العرض باللغة العربية
  getStatusText: (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'accepted': 'مقبول',
      'rejected': 'مرفوض',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  },

  // الحصول على لون الحالة
  getStatusColor: (status: string): string => {
    const colorMap: { [key: string]: string } = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'accepted': 'text-green-600 bg-green-100',
      'rejected': 'text-red-600 bg-red-100',
      'cancelled': 'text-gray-600 bg-gray-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  }
};
