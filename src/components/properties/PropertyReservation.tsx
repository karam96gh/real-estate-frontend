import React, { useState } from 'react';
import { Calendar, X, MessageSquare } from 'lucide-react';
import { reservationsApi } from '@/api/reservationsApi';
import { toast } from 'react-toastify';

interface PropertyReservationModalProps {
    propertyId: number;
    isOpen: boolean;
    onClose: () => void;
}

export const PropertyReservationModal: React.FC<PropertyReservationModalProps> = ({
    propertyId,
    isOpen,
    onClose
}) => {
    const [visitDate, setVisitDate] = useState('');
    const [visitTime, setVisitTime] = useState('');
    const [notes, setNotes] = useState('');
    const [idImage, setIdImage] = useState<File | null>(null);
    const [idImagePreview, setIdImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // التحقق من صحة البيانات
        if (!visitDate || !visitTime) {
            toast.error('يرجى تحديد تاريخ ووقت الزيارة');
            return;
        }

        setIsSubmitting(true);

        try {
            await reservationsApi.createReservation({
                propertyId,
                visitDate,
                visitTime,
                notes: notes || undefined,
                idImage: idImage || undefined,
            });

            // Reset form and show success message
            setVisitDate('');
            setVisitTime('');
            setNotes('');
            setIdImage(null);
            setIdImagePreview(null);
            setIsSubmitted(true);
            toast.success('تم إنشاء الحجز بنجاح!');

            // Hide success message after 3 seconds
            setTimeout(() => {
                setIsSubmitted(false);
                onClose();
            }, 3000);
        } catch (error: any) {
            console.error('Error submitting reservation:', error);
            toast.error(error.message || 'حدث خطأ في إنشاء الحجز');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIdImage(file);

            // إنشاء معاينة للصورة
            const reader = new FileReader();
            reader.onloadend = () => {
                setIdImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-2xl z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Calendar className="w-6 h-6 text-blue-500" />
                        <span>حجز العقار</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="إغلاق"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {isSubmitted ? (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-xl flex items-center gap-4">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">تم استلام طلب الحجز بنجاح!</h3>
                                <p>سوف يتم الرد خلال 72 ساعة</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="p-4 bg-blue-50 rounded-xl mb-6">
                                <p className="text-gray-700">قم بتحديد تاريخ ووقت المعاينة المناسب لك. سيتواصل معك فريقنا في أقرب وقت لتأكيد الحجز.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label htmlFor="visitDate" className="block text-gray-700 mb-2 font-medium">تاريخ الزيارة <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            id="visitDate"
                                            value={visitDate}
                                            onChange={(e) => setVisitDate(e.target.value)}
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <label htmlFor="visitTime" className="block text-gray-700 mb-2 font-medium">وقت الزيارة <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="time"
                                            id="visitTime"
                                            value={visitTime}
                                            onChange={(e) => setVisitTime(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <label htmlFor="idImage" className="block text-gray-700 mb-2 font-medium">صورة الهوية الشخصية (الوجه الأمامي)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="idImage"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">صورة JPG أو PNG (اختياري)</p>

                                {idImagePreview && (
                                    <div className="mt-4 relative">
                                        <img
                                            src={idImagePreview}
                                            alt="معاينة الهوية"
                                            className="w-full max-w-sm h-48 object-cover rounded-lg border border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIdImage(null);
                                                setIdImagePreview(null);
                                            }}
                                            className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <label htmlFor="notes" className="block text-gray-700 mb-2 font-medium">ملاحظات إضافية</label>
                                <div className="relative">
                                    <div className="absolute top-3 right-3">
                                        <MessageSquare className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="أدخل ملاحظات إضافية..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center mt-8">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors w-full md:w-auto flex items-center justify-center gap-2 ${
                                        isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                                    }`}
                                >
                                    <Calendar className="w-5 h-5" />
                                    {isSubmitting ? 'جاري الإرسال...' : 'تأكيد الحجز'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};