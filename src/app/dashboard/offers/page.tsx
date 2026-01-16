'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Calendar, Clock, User, Phone, Mail, MapPin, Eye, Check, X, Filter, Search } from 'lucide-react';
import { offersApi, Offer } from '@/api/offersApi';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'>('all');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    cancelled: 0
  });

  const { user, hasRole } = useAuth();

  useEffect(() => {
    if (!hasRole(['admin', 'company'])) {
      toast.error('غير مصرح لك بالوصول لهذه الصفحة');
      return;
    }
    loadOffers();
    loadStats();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [offers, searchTerm, statusFilter]);

  const loadOffers = async () => {
    try {
      const data = await offersApi.getCompanyOffers();
      setOffers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'فشل في تحميل العروض');
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await offersApi.getOfferStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('فشل في تحميل الإحصائيات:', error);
    }
  };

  const filterOffers = () => {
    let filtered = Array.isArray(offers) ? offers : [];

    if (searchTerm) {
      filtered = filtered.filter(offer =>
        offer.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter);
    }

    setFilteredOffers(filtered);
  };

  const updateOfferStatus = async (offerId: number, status: 'accepted' | 'rejected' | 'cancelled') => {
    try {
      await offersApi.updateOffer(offerId, { status });
      await loadOffers();
      loadStats();
      toast.success(`تم ${status === 'accepted' ? 'قبول' : status === 'rejected' ? 'رفض' : 'إلغاء'} العرض بنجاح`);
    } catch (error: any) {
      toast.error(error.message || 'فشل في تحديث حالة العرض');
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
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة العروض</h1>
            <p className="text-gray-600">متابعة وإدارة عروض الشراء على العقارات</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي العروض</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-600" />
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
                <p className="text-sm text-gray-600">مقبولة</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مرفوضة</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <X className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ملغية</p>
                <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
              </div>
              <X className="w-8 h-8 text-gray-600" />
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
              placeholder="بحث عن العروض..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">في الانتظار</option>
              <option value="accepted">مقبولة</option>
              <option value="rejected">مرفوضة</option>
              <option value="cancelled">ملغية</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل العروض...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد عروض</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' ? 'لا توجد عروض تطابق البحث' : 'لم يتم تقديم أي عروض بعد'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العقار</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر الأصلي</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العرض المقدم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الزيارة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOffers.map((offer) => (
                  <motion.tr
                    key={offer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{offer.propertyTitle}</div>
                        <div className="text-sm text-gray-500">#{offer.propertyId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{offer.userName}</div>
                        <div className="text-sm text-gray-500">{offer.userPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-blue-600 font-semibold">
                        {offer.propertyPrice.toLocaleString('ar-SA')} ر.ع
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-green-600 font-bold">
                        {offer.offerAmount.toLocaleString('ar-SA')} ر.ع
                      </div>
                      {offer.offerAmount !== offer.propertyPrice && (
                        <div className="text-xs text-gray-500">
                          {offer.offerAmount > offer.propertyPrice ? '+' : ''}
                          {((offer.offerAmount - offer.propertyPrice) / offer.propertyPrice * 100).toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(offer.visitDate)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" />
                        {offer.visitTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${offersApi.getStatusColor(offer.status)}`}>
                        {offersApi.getStatusText(offer.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOffer(offer);
                            setShowDetailsModal(true);
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          عرض
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Offer Details Modal */}
      {showDetailsModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">تفاصيل العرض</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Property & Offer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">معلومات العقار</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="font-medium text-gray-900">{selectedOffer.propertyTitle}</p>
                    <p className="text-blue-600 font-semibold">
                      السعر الأصلي: {selectedOffer.propertyPrice.toLocaleString('ar-SA')} ر.ع
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">العرض المقدم</h4>
                  <div className="bg-green-50 rounded-lg p-4 space-y-2">
                    <p className="text-green-600 font-bold text-xl">
                      {selectedOffer.offerAmount.toLocaleString('ar-SA')} ر.ع
                    </p>
                    {selectedOffer.offerAmount !== selectedOffer.propertyPrice && (
                      <p className="text-sm text-gray-600">
                        {selectedOffer.offerAmount > selectedOffer.propertyPrice ? 'أعلى' : 'أقل'} من السعر بـ{' '}
                        {Math.abs(((selectedOffer.offerAmount - selectedOffer.propertyPrice) / selectedOffer.propertyPrice * 100)).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">معلومات العميل</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">{selectedOffer.userName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{selectedOffer.userPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{selectedOffer.userEmail}</span>
                  </div>
                </div>
              </div>

              {/* Visit Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">تفاصيل الزيارة المقترحة</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>{formatDate(selectedOffer.visitDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span>{selectedOffer.visitTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center">📝</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${offersApi.getStatusColor(selectedOffer.status)}`}>
                      {offersApi.getStatusText(selectedOffer.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ID Image */}
              {selectedOffer.idImage && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">صورة الهوية الشخصية</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <img
                      src={selectedOffer.idImage}
                      alt="صورة الهوية"
                      className="w-full max-w-md h-64 object-contain rounded-lg border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(selectedOffer.idImage, '_blank')}
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">اضغط على الصورة لعرضها بحجم كامل</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOffer.notes && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">ملاحظات العميل</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedOffer.notes}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedOffer.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      updateOfferStatus(selectedOffer.id, 'accepted');
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    قبول العرض
                  </button>
                  <button
                    onClick={() => {
                      updateOfferStatus(selectedOffer.id, 'rejected');
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    رفض العرض
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
