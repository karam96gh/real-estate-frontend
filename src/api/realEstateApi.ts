import { RealEstateData, CreateRealEstateData, RealEstateFilters } from "@/lib/types";
import apiClient from ".";

export const RealEstateApi = {
    /**
     * جلب جميع الإعلانات
     */
    fetchAll: async (filters?: Partial<RealEstateFilters>): Promise<RealEstateData[]> => {
        try {
            const params = new URLSearchParams();
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value && value !== '') {
                        params.append(key, value);
                    }
                });
            }

            const response = await apiClient.get<RealEstateData[]>(`/api/realestate?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch real estate data:", error);
            throw error;
        }
    },

    /**
     * جلب عقاراتي
     */
    fetchMyRealEstate: async (): Promise<RealEstateData[]> => {
        try {
            const response = await apiClient.get<RealEstateData[]>('/api/realestate/my-properties');
            return response.data;
        } catch (error) {
            return [] as RealEstateData[]; // رجوع فارغ إذا حدث خطأ
            console.error("Failed to fetch my real estate:", error);
            throw error;
        }
    },

    /**
     * جلب عقار واحد بالتفصيل
     */
    fetchById: async (id: number): Promise<RealEstateData> => {
        try {
            const response = await apiClient.get<RealEstateData>(`/api/realestate/${id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch real estate by ID:", error);
            throw error;
        }
    },

    /**
     * إنشاء عقار جديد مع الخصائص الديناميكية
     */
    create: async (data: CreateRealEstateData): Promise<RealEstateData> => {
        try {
            const formData = new FormData();

            // إضافة البيانات الأساسية
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('price', data.price.toString());
            formData.append('mainCategoryId', data.mainCategoryId.toString());
            formData.append('subCategoryId', data.subCategoryId.toString());
            formData.append('finalTypeId', data.finalTypeId.toString());
            formData.append('cityId', data.cityId.toString());
            formData.append('neighborhoodId', data.neighborhoodId.toString());
            formData.append('finalCityId', data.finalCityId.toString());
            formData.append('location', data.location);
            formData.append('viewTime', data.viewTime);
            formData.append('paymentMethod', data.paymentMethod);
            if (data.buildingItemId) {
                formData.append('buildingId', data.buildingItemId);
            }

            if (data.dynamicProperties) {
                // Separate FILE properties from regular properties
                Object.entries(data.dynamicProperties).forEach(([key, value]) => {
                    // Check if the value is a File object
                    if (value instanceof File) {
                        // FILE properties - send as separate fields
                        formData.append(key, value);
                    } else {
                        // Regular properties - send under properties object
                        formData.append(`properties[${key}]`, String(value));
                    }
                });
            }


            // إضافة الملفات
            if (data.coverImage) {
                formData.append('coverImage', data.coverImage);
            }

            data.files.forEach((file, index) => {
                formData.append(`files`, file);
            });

            const response = await apiClient.post<RealEstateData>('/api/realestate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            console.error("Failed to create real estate:", error);
            throw error;
        }
    },

    /**
     * تحديث عقار موجود
     */
    update: async (id: number, data: Partial<CreateRealEstateData>): Promise<RealEstateData> => {
        try {
            const formData = new FormData();

            // إضافة البيانات الأساسية
            if (data.title) formData.append('title', data.title);
            if (data.description) formData.append('description', data.description);
            if (data.price) formData.append('price', data.price.toString());
            if (data.mainCategoryId) formData.append('mainCategoryId', data.mainCategoryId.toString());
            if (data.subCategoryId) formData.append('subCategoryId', data.subCategoryId.toString());
            if (data.finalTypeId) formData.append('finalTypeId', data.finalTypeId.toString());
            if (data.cityId) formData.append('cityId', data.cityId.toString());
            if (data.neighborhoodId) formData.append('neighborhoodId', data.neighborhoodId.toString());
            if (data.finalCityId) formData.append('finalCityId', data.finalCityId.toString());
            if (data.location) formData.append('location', data.location);
            if (data.viewTime) formData.append('viewTime', data.viewTime);
            if (data.buildingItemId) formData.append('buildingItemId', data.buildingItemId);

            // إضافة الخصائص الديناميكية
            if (data.dynamicProperties) {
                // Separate FILE properties from regular properties
                Object.entries(data.dynamicProperties).forEach(([key, value]) => {
                    // Check if the value is a File object
                    if (value instanceof File) {
                        // FILE properties - send as separate fields
                        formData.append(key, value);
                    } else {
                        // Regular properties - send under properties object
                        formData.append(`properties[${key}]`, String(value));
                    }
                });
            }

            // إضافة الملفات الجديدة
            if (data.coverImage) {
                formData.append('coverImage', data.coverImage);
            }

            if (data.files) {
                data.files.forEach((file) => {
                    formData.append(`files`, file);
                });
            }

            const response = await apiClient.put<RealEstateData>(`/api/realestate/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            console.error("Failed to update real estate:", error);
            throw error;
        }
    },

    /**
     * حذف عقار
     */
    delete: async (id: number): Promise<void> => {
        try {
            await apiClient.delete(`/api/realestate/${id}`);
        } catch (error) {
            console.error("Failed to delete real estate:", error);
            throw error;
        }
    },

    /**
     * البحث في الإعلانات
     */
    search: async (query: string, filters?: Partial<RealEstateFilters>): Promise<RealEstateData[]> => {
        try {
            const params = new URLSearchParams();
            params.append('q', query);

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value && value !== '') {
                        params.append(key, value);
                    }
                });
            }

            const response = await apiClient.get<RealEstateData[]>(`/api/realestate/search?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error("Failed to search real estate:", error);
            throw error;
        }
    },

    /**
     * جلب الإعلانات المفضلة
     */
    fetchFavorites: async (): Promise<RealEstateData[]> => {
        try {
            const response = await apiClient.get<RealEstateData[]>('/api/realestate/favorites');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch favorites:", error);
            throw error;
        }
    },

    /**
     * إضافة/إزالة من المفضلة
     */
    toggleFavorite: async (id: number): Promise<{ isFavorite: boolean }> => {
        try {
            const response = await apiClient.post<{ isFavorite: boolean }>(`/api/realestate/${id}/favorite`);
            return response.data;
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            throw error;
        }
    },

    /**
     * جلب الإعلانات حسب النوع النهائي
     */
    fetchByFinalType: async (finalTypeId: number): Promise<RealEstateData[]> => {
        try {
            const response = await apiClient.get<RealEstateData[]>(`/api/realestate/final-type/${finalTypeId}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch real estate by final type:", error);
            throw error;
        }
    },

    /**
     * جلب الإعلانات حسب المدينة
     */
    fetchByCity: async (cityId: number): Promise<RealEstateData[]> => {
        try {
            const response = await apiClient.get<RealEstateData[]>(`/api/realestate/city/${cityId}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch real estate by city:", error);
            throw error;
        }
    },

    /**
     * جلب إحصائيات الإعلانات
     */
    fetchStats: async (): Promise<{
        total: number;
        forSale: number;
        forRent: number;
        cities: number;
        averagePrice: number;
    }> => {
        try {
            const response = await apiClient.get('/api/realestate/stats');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch real estate stats:", error);
            throw error;
        }
    },

    // ===== الدوال القديمة للتوافق مع النظام الحالي =====

    /**
     * @deprecated استخدم fetchAll بدلاً من ذلك
     */
    fetchRealEstate: async (forMe: boolean = false): Promise<RealEstateData[]> => {
        try {

            const response = await apiClient.get<RealEstateData[]>(
                forMe ? "/api/realestate/my-properties" : "/api/realestate"
            );
            return response.data;
        } catch (error) {
            console.error("Failed to fetch real estate:", error);
            throw error;
        }
    },

    /**
     * @deprecated استخدم create بدلاً من ذلك
     */
    addRealEstate: async (estate: FormData) => {
        try {
            const response = await apiClient.post('api/realestate', estate, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            console.error("Failed to add real estate:", error);
            throw error;
        }
    },

    /**
     * @deprecated استخدم update بدلاً من ذلك
     */
    updateRealEstate: async (id: number, estate: any) => {
        try {
            const {
                cityName,
                neighborhoodName,
                mainCategoryName,
                subCategoryName,
                finalTypeName,
                finalCityName,
                createdAt,
                ...cleanedEstate
            } = estate;

            const response = await apiClient.put(`api/realestate/${id}`, cleanedEstate);
            return response.data;
        } catch (error) {
            console.error("Failed to update real estate:", error);
            throw error;
        }
    },

    /**
     * @deprecated استخدم fetchById بدلاً من ذلك
     */
    fetchRealEstateById: async (id: number): Promise<RealEstateData> => {
        try {
            const response = await apiClient.get<RealEstateData>(`api/realestate/${id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch real estate by ID:", error);
            throw error;
        }
    },

    /**
     * جلب الإعلانات المشابهة
     */
    fetchSimilarRealEstate: async (id: number): Promise<RealEstateData[]> => {
        try {
            const response = await apiClient.get<{ similarProperties: RealEstateData[] }>(`/api/realestate/similar/${id}`);
            return response.data.similarProperties;
        } catch (error) {
            console.error("Failed to fetch similar real estate:", error);
            return [];
        }
    },

    /**
     * جلب الإعلانات حسب عنصر المبنى
     */
    fetchRealEstateByBuildingItemId: async (buildingItemId: string): Promise<RealEstateData[]> => {
        try {
            const response = await apiClient.get<{ realEstates: RealEstateData[] }>(`api/buildings/${buildingItemId}`);
            return response.data.realEstates;
        } catch (error) {
            console.error("Failed to fetch real estate by building item ID:", error);
            throw error;
        }
    },

    /**
     * @deprecated استخدم delete بدلاً من ذلك
     */
    deleteRealEstate: async (id: number) => {
        try {
            const response = await apiClient.delete(`api/realestate/${id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to delete real estate:", error);
            throw error;
        }
    },

    /**
     * فلترة الإعلانات حسب النوع
     */
    fetchFilter: async (mainTypeName: string, subTypeName?: string, finalTypeName?: string) => {
        try {
            const response = await apiClient.post(`api/realestate/filter`, {
                main: mainTypeName,
                sub: subTypeName,
                finall: finalTypeName,
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch filter:", error);
            throw error;
        }
    },
};
