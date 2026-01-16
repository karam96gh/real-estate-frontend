'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, Phone, Mail, MapPin, Eye, Check, X, Filter, Search } from 'lucide-react';
import { reservationsApi, Reservation } from '@/api/reservationsApi';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0
  });

  const { user, hasRole } = useAuth();

  useEffect(() => {
    if (!hasRole(['admin', 'company'])) {
      toast.error('غير مصرح لك بالوصول لهذه الصفحة');
      return;
    }
    loadReservations();
    loadStats();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm, statusFilter]);

  const loadReservations = async () => {
    try {
      const data = await reservationsApi.getCompanyReservations();
      // Ensure data is an array
      setReservations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'فشل في تحميل الحجوزات');
      setReservations([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await reservationsApi.getReservationStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('فشل في تحميل الإحصائيات:', error);
    }
  };

  const filterReservations = () => {
    // Ensure reservations is always an array
    let filtered = Array.isArray(reservations) ? reservations : [];

    if (searchTerm) {
      filtered = filtered.filter(reservation =>
        reservation.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }

    setFilteredReservations(filtered);
  };

  const updateReservationStatus = async (reservationId: number, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await reservationsApi.updateReservation(reservationId, { status });
      await loadReservations()
      // setSelectedReservation(updatedReservation);
      loadStats(); // Refresh stats
      toast.success(`تم ${status === 'confirmed' ? 'تأكيد' : status === 'cancelled' ? 'إلغاء' : 'إكمال'} الحجز بنجاح`);
    } catch (error: any) {
      toast.error(error.message || 'فشل في تحديث حالة الحجز');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!hasRole(['admin', 'company'])) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">غير مصرح</h1>
          <p className="text-gray-600">ليس لديك صلاحية للوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الحجوزات</h1>
            <p className="text-gray-600">متابعة وإدارة طلبات مشاهدة العقارات</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الحجوزات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">في الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مؤكدة</p>
                <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
              </div>
              <Check className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مكتملة</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ملغية</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <X className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث بالعقار، اسم العميل، أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">في الانتظار</option>
              <option value="confirmed">مؤكدة</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغية</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الحجوزات...</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد حجوزات مطابقة للبحث</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReservations.map((reservation) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedReservation(reservation);
                  setShowDetailsModal(true);
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {reservation.propertyTitle}
                        </h3>
                        <p className="text-blue-600 font-medium">
                          {reservation.propertyPrice.toLocaleString('ar-SA')} ر.ع
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusText(reservation.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{reservation.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{reservation.userPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(reservation.visitDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {reservation.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateReservationStatus(reservation.id, 'confirmed');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        تأكيد
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateReservationStatus(reservation.id, 'cancelled');
                        }}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        إلغاء
                      </button>
                    </div>
                  )}

                  {reservation.status === 'confirmed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateReservationStatus(reservation.id, 'completed');
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      إكمال
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reservation Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedReservation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">تفاصيل الحجز</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Property Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">معلومات العقار</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">{selectedReservation.propertyTitle}</h5>
                    <p className="text-blue-600 font-semibold text-lg">
                      {selectedReservation.propertyPrice.toLocaleString('ar-SA')} ر.ع
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">معلومات العميل</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{selectedReservation.userName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{selectedReservation.userEmail}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{selectedReservation.userPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Visit Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">تفاصيل الزيارة</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{formatDate(selectedReservation.visitDate)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 flex items-center justify-center">📝</span>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReservation.status)}`}>
                        {getStatusText(selectedReservation.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ID Image */}
                {selectedReservation.idImage && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">صورة الهوية الشخصية</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img
                        src={selectedReservation.idImage}
                        alt="صورة الهوية"
                        className="w-full max-w-md h-64 object-contain rounded-lg border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(selectedReservation.idImage, '_blank')}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">اضغط على الصورة لعرضها بحجم كامل</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedReservation.notes && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">ملاحظات العميل</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedReservation.notes}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedReservation.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        updateReservationStatus(selectedReservation.id, 'confirmed');
                      }}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      تأكيد الحجز
                    </button>
                    <button
                      onClick={() => {
                        updateReservationStatus(selectedReservation.id, 'cancelled');
                      }}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      إلغاء الحجز
                    </button>
                  </div>
                )}

                {selectedReservation.status === 'confirmed' && (
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => {
                        updateReservationStatus(selectedReservation.id, 'completed');
                      }}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      إكمال الزيارة
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
