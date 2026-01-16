'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, Clock, MapPin, Eye, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { offersApi, Offer } from '@/api/offersApi';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';
import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';

export default function MyOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      loadOffers();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  const loadOffers = async () => {
    try {
      const data = await offersApi.getUserOffers();
      setOffers(data);
    } catch (error: any) {
      toast.error(error.message || 'فشل في تحميل العروض');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const cancelOffer = async (offerId: number) => {
    try {
      await offersApi.updateOffer(offerId, { status: 'cancelled' });
      setOffers(prev => prev.map(o =>
        o.id === offerId ? { ...o, status: 'cancelled' } : o
      ));
      toast.success('تم إلغاء العرض بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'فشل في إلغاء العرض');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <DollarSign className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                تسجيل الدخول مطلوب
              </h1>
              <p className="text-gray-600 mb-6">
                يجب تسجيل الدخول لعرض عروضك
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/auth/login"
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/"
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  العودة للرئيسية
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/" className="hover:text-green-600">الرئيسية</Link>
              <ArrowRight className="w-4 h-4" />
              <span>عروضي</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">عروضي</h1>
                <p className="text-gray-600">تتبع حالة عروض الشراء المقدمة</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{offers.length}</p>
                  <p className="text-sm text-gray-600">إجمالي العروض</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{offers.filter(o => o.status === 'pending').length}</p>
                  <p className="text-sm text-gray-600">قيد الانتظار</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{offers.filter(o => o.status === 'accepted').length}</p>
                  <p className="text-sm text-gray-600">مقبولة</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{offers.filter(o => o.status === 'rejected').length}</p>
                  <p className="text-sm text-gray-600">مرفوضة</p>
                </div>
              </div>
            </div>
          </div>

          {/* Offers List */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحميل العروض...</p>
              </div>
            ) : offers.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد عروض</h3>
                <p className="text-gray-600 mb-6">لم تقم بتقديم أي عروض شراء بعد</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {offers.map((offer) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {offer.propertyTitle}
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                              <p className="text-blue-600 font-medium">
                                سعر العقار: {offer.propertyPrice.toLocaleString('ar-SA')} ر.ع
                              </p>
                              <p className="text-green-600 font-bold">
                                عرضك: {offer.offerAmount.toLocaleString('ar-SA')} ر.ع
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${offersApi.getStatusColor(offer.status)}`}>
                            {offersApi.getStatusText(offer.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تاريخ الزيارة: {formatDate(offer.visitDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>الوقت: {offer.visitTime}</span>
                          </div>

                          {offer.companyName && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{offer.companyName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOffer(offer);
                            setShowDetailsModal(true);
                          }}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          التفاصيل
                        </button>

                        {offer.status === 'pending' && (
                          <button
                            onClick={() => cancelOffer(offer.id)}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offer Details Modal */}
      {showDetailsModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
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
              {/* Property Info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">معلومات العقار</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">{selectedOffer.propertyTitle}</h5>
                  <p className="text-blue-600 font-semibold text-lg mb-2">
                    سعر العقار: {selectedOffer.propertyPrice.toLocaleString('ar-SA')} ر.ع
                  </p>
                  <p className="text-green-600 font-bold text-xl">
                    عرضك: {selectedOffer.offerAmount.toLocaleString('ar-SA')} ر.ع
                  </p>
                </div>
              </div>

              {/* Visit Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">تفاصيل الزيارة المقترحة</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{formatDate(selectedOffer.visitDate)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{selectedOffer.visitTime}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 flex items-center justify-center">📝</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${offersApi.getStatusColor(selectedOffer.status)}`}>
                      {offersApi.getStatusText(selectedOffer.status)}
                    </div>
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
                      className="w-full max-w-md h-64 object-contain rounded-lg border border-gray-300"
                    />
                  </div>
                </div>
              )}

              {/* Company Info */}
              {selectedOffer.companyName && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">معلومات الشركة</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{selectedOffer.companyName}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOffer.notes && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">ملاحظاتك</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedOffer.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
