'use client';
import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TypeSelector, DynamicForm } from '@/components/dynamic-form';
import { useDynamicForm } from '@/hooks/useDynamicProperties';
import { useLocationData } from '@/hooks/useLocationData';
import { CreateRealEstateData, MainType, SubType, FinalType, RealEstateData, Building, FinalCityType } from '@/lib/types';
import { RealEstateApi } from '@/api/realEstateApi';
import { buildingApi } from '@/api/buidlingApi';
import {
    Save, ArrowLeft, ArrowRight, CheckCircle, MapPin, Camera, FileText, Home, DollarSign,
    Loader2, Edit, Plus, Building2, AlertCircle, CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAYMENT_OPTIONS } from '@/components/ui/constants/formOptions';
import LocationPicker from '@/components/map/LocationPicker';
import ViewingTimeSelector from '@/components/forms/ViewingTimeSelector';
import ImageUploadModal from '@/components/dashboard/forms/EnhancedImageUpload';

// Types and Interfaces
interface FormStep {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
}

interface BasicFormData {
    title: string;
    description: string;
    price: string;
    finalCityId: string;
    location: string;
    viewTime: string;
    paymentMethod: string;
    coverImage: File | null;
    files: File[];
    existingCoverImage: string;
    existingFiles: string[];
}

interface ImageUploadState {
    coverImagePreview: string | null;
    additionalImagePreviews: string[];
    additionalFileTypes: string[];
    isUploading: boolean;
    isCoverImageUploading: boolean;
    uploadingImageIndexes: number[];
    coverImageProgress: number;
    additionalImageProgress: Record<number, number>;
}

// Main Component
function RealEstatePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const propertyId = searchParams.get('id');
    const buildingId = searchParams.get('buildingId');
    const isEditMode = !!propertyId;
    const isBuildingMode = !!buildingId;

    // State Management
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [selectedFinalTypeId, setSelectedFinalTypeId] = useState<number | null>(null);
    const [selectedTypePath, setSelectedTypePath] = useState<{
        mainType: MainType;
        subType: SubType;
        finalType: FinalType;
    } | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [isLoadingBuilding, setIsLoadingBuilding] = useState(isBuildingMode);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [property, setProperty] = useState<RealEstateData | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data
    const [basicFormData, setBasicFormData] = useState<BasicFormData>({
        title: '',
        description: '',
        price: '',
        finalCityId: '',
        location: '',
        viewTime: '',
        paymentMethod: '',
        coverImage: null,
        files: [],
        existingCoverImage: '',
        existingFiles: []
    });

    // Image Upload State
    const [imageUploadState, setImageUploadState] = useState<ImageUploadState>({
        coverImagePreview: null,
        additionalImagePreviews: [],
        additionalFileTypes: [],
        isUploading: false,
        isCoverImageUploading: false,
        uploadingImageIndexes: [],
        coverImageProgress: 0,
        additionalImageProgress: {}
    });

    // Hooks
    const {
        formData: dynamicFormData,
        groupedProperties,
        errors: dynamicErrors,
        loading: dynamicLoading,
        updateField: updateDynamicField,
        validate: validateDynamic,
        setFormData: setDynamicFormData
    } = useDynamicForm(selectedFinalTypeId);

    const {
        cities,
        neighborhoods,
        finalCities,
        selectedCityId,
        selectedNeighborhoodId,
        setSelectedCityId,
        setSelectedNeighborhoodId,
        loading: locationLoading
    } = useLocationData();

    // Constants
    const steps: FormStep[] = useMemo(() => [
        {
            id: 1,
            title: 'نوع العقار',
            description: isEditMode ? 'تعديل نوع العقار' : 'اختر نوع العقار المناسب',
            icon: <Home className="w-5 h-5" />
        },
        {
            id: 2,
            title: 'المعلومات الأساسية',
            description: 'العنوان والوصف والسعر',
            icon: <FileText className="w-5 h-5" />
        },
        {
            id: 3,
            title: 'الموقع',
            description: 'تفاصيل موقع العقار',
            icon: <MapPin className="w-5 h-5" />
        },
        {
            id: 4,
            title: 'الخصائص التفصيلية',
            description: 'خصائص العقار المحددة',
            icon: <DollarSign className="w-5 h-5" />
        },
        {
            id: 5,
            title: 'الصور والملفات',
            description: 'صور العقار والمستندات',
            icon: <Camera className="w-5 h-5" />
        }
    ], [isEditMode]);

    // Utility Functions
    const updateBasicField = useCallback((field: keyof BasicFormData, value: any) => {
        setBasicFormData(prev => ({ ...prev, [field]: value }));
        setErrors([]);
    }, []);

    const updateImageUploadState = useCallback((updates: Partial<ImageUploadState>) => {
        setImageUploadState(prev => ({ ...prev, ...updates }));
    }, []);

    const isStepCompleted = useCallback((stepId: number): boolean => {
        if (completedSteps.has(stepId)) return true;

        switch (stepId) {
            case 1:
                return selectedFinalTypeId !== null;
            case 2:
                return !!(
                    basicFormData.title.trim() &&
                    basicFormData.description.trim() &&
                    basicFormData.price &&
                    !isNaN(Number(basicFormData.price)) &&
                    basicFormData.paymentMethod.trim()
                );
            case 3:
                return !!(
                    selectedCityId &&
                    selectedNeighborhoodId &&
                    basicFormData.finalCityId &&
                    basicFormData.location.trim()
                );
            case 4:
                return currentStep >= 4;
            case 5:
                return !!(
                    (basicFormData.coverImage || basicFormData.existingCoverImage || imageUploadState.coverImagePreview) &&
                    basicFormData.viewTime && basicFormData.viewTime.trim()
                );
            default:
                return false;
        }
    }, [basicFormData, selectedFinalTypeId, selectedCityId, selectedNeighborhoodId, imageUploadState.coverImagePreview, currentStep, completedSteps]);

    const markStepCompleted = useCallback((stepId: number) => {
        if (isStepCompleted(stepId)) {
            setCompletedSteps(prev => new Set([...prev, stepId]));
        }
    }, [isStepCompleted]);

    const getLocationCoordinates = useCallback(() => {
        if (basicFormData.location) {
            const coords = basicFormData.location.split(',');
            return {
                lat: parseFloat(coords[0]) || 23.5880,
                lng: parseFloat(coords[1]) || 58.3829
            };
        }

        if (basicFormData.finalCityId) {
            const selectedFinalCity = finalCities.find(c => c.id === Number(basicFormData.finalCityId));
            if (selectedFinalCity && 'location' in selectedFinalCity && selectedFinalCity.location && typeof selectedFinalCity.location === 'string') {
                const coords = selectedFinalCity.location.split(',');
                return {
                    lat: parseFloat(coords[0]) || 23.5880,
                    lng: parseFloat(coords[1]) || 58.3829
                };
            }
        }

        return { lat: 23.5880, lng: 58.3829 };
    }, [basicFormData.location, basicFormData.finalCityId, finalCities]);

    // Event Handlers
    const handleFinalTypeSelect = useCallback((finalTypeId: number, path: { mainType: MainType; subType: SubType; finalType: FinalType }) => {
        setSelectedFinalTypeId(finalTypeId);
        setSelectedTypePath(path);
        markStepCompleted(1);
        if (!isEditMode) {
            setCurrentStep(2);
        }
    }, [isEditMode, markStepCompleted]);

    // Single image upload handler
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    updateImageUploadState({ coverImagePreview: event.target.result as string });
                }
            };
            reader.readAsDataURL(file);
            updateBasicField('coverImage', file);
        }
    }, [updateBasicField, updateImageUploadState]);

    // Single additional file upload handler
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const newPreviews = [...imageUploadState.additionalImagePreviews];
                const newFileTypes = [...imageUploadState.additionalFileTypes];
                const newFiles = [...basicFormData.files];

                newPreviews[index] = event.target.result as string;
                newFileTypes[index] = file.type;
                newFiles[index] = file;

                updateImageUploadState({
                    additionalImagePreviews: newPreviews,
                    additionalFileTypes: newFileTypes
                });
                updateBasicField('files', newFiles);
            }
        };
        reader.readAsDataURL(file);
    }, [imageUploadState, basicFormData.files, updateBasicField, updateImageUploadState]);

    // Multiple files upload handler - NEW
    const handleMultipleFileUpload = useCallback((files: FileList) => {
        const filesArray = Array.from(files);
        let currentCoverImage = imageUploadState.coverImagePreview;
        let currentCoverFile = basicFormData.coverImage;

        const newPreviews = [...imageUploadState.additionalImagePreviews];
        const newFileTypes = [...imageUploadState.additionalFileTypes];
        const newFiles = [...basicFormData.files];

        let fileIndex = 0;

        filesArray.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const previewUrl = event.target.result as string;

                    if (!currentCoverImage && index === 0) {
                        // First file becomes cover image if no cover exists
                        updateImageUploadState({ coverImagePreview: previewUrl });
                        updateBasicField('coverImage', file);
                        currentCoverImage = previewUrl;
                        currentCoverFile = file;
                    } else {
                        // Find next available slot for additional images
                        let targetIndex = fileIndex;
                        while (newPreviews[targetIndex] && targetIndex < 30) {
                            targetIndex++;
                        }

                        if (targetIndex < 30) {
                            newPreviews[targetIndex] = previewUrl;
                            newFileTypes[targetIndex] = file.type;
                            newFiles[targetIndex] = file;
                            fileIndex = targetIndex + 1;
                        }
                    }

                    // Update state after processing all files
                    if (index === filesArray.length - 1) {
                        updateImageUploadState({
                            additionalImagePreviews: newPreviews,
                            additionalFileTypes: newFileTypes
                        });
                        updateBasicField('files', newFiles);
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    }, [imageUploadState, basicFormData, updateBasicField, updateImageUploadState]);

    const handleDeleteAdditionalImage = useCallback((index: number) => {
        const newPreviews = [...imageUploadState.additionalImagePreviews];
        const newFiles = [...basicFormData.files];
        const newTypes = [...imageUploadState.additionalFileTypes];

        // Remove the item at the specific index
        newPreviews[index] = '';
        newFiles[index] = undefined as any;
        newTypes[index] = '';

        // Clean up the arrays by filtering out empty/undefined values
        const cleanPreviews = newPreviews.filter(preview => preview);
        const cleanFiles = newFiles.filter(file => file);
        const cleanTypes = newTypes.filter(type => type);

        // Resize arrays to maintain 30 slots
        while (cleanPreviews.length < 30) cleanPreviews.push('');
        while (cleanFiles.length < 30) cleanFiles.push(undefined as any);
        while (cleanTypes.length < 30) cleanTypes.push('');

        updateImageUploadState({
            additionalImagePreviews: cleanPreviews,
            additionalFileTypes: cleanTypes
        });
        updateBasicField('files', cleanFiles.filter(file => file));
    }, [imageUploadState, basicFormData.files, updateBasicField, updateImageUploadState]);

    const handleDeleteCoverImage = useCallback(() => {
        updateImageUploadState({ coverImagePreview: null });
        updateBasicField('coverImage', null);
        updateBasicField('existingCoverImage', '');
    }, [updateBasicField, updateImageUploadState]);

    // Validation
    const validateCurrentStep = useCallback((): { isValid: boolean; errors: string[] } => {
        const newErrors: string[] = [];

        switch (currentStep) {
            case 1:
                if (!selectedFinalTypeId) {
                    newErrors.push('يرجى اختيار نوع العقار');
                }
                break;

            case 2:
                if (!basicFormData.title.trim()) newErrors.push('عنوان العقار مطلوب');
                if (!basicFormData.description.trim()) newErrors.push('وصف العقار مطلوب');
                if (!basicFormData.price || isNaN(Number(basicFormData.price))) newErrors.push('سعر صحيح مطلوب');
                if (!basicFormData.paymentMethod.trim()) newErrors.push('طريقة الدفع مطلوبة');
                break;

            case 3:
                if (!selectedCityId) newErrors.push('المحافظة مطلوبة');
                if (!selectedNeighborhoodId) newErrors.push('المدينة مطلوب');
                if (!basicFormData.finalCityId) newErrors.push('المنطقة مطلوبة');
                if (!basicFormData.location.trim()) newErrors.push('الموقع على الخريطة مطلوب');
                break;

            case 4:
                if (Object.keys(groupedProperties).length > 0 && !validateDynamic()) {
                    newErrors.push(...dynamicErrors);
                }
                break;

            case 5:
                if (!basicFormData.coverImage && !basicFormData.existingCoverImage && !imageUploadState.coverImagePreview) {
                    newErrors.push('صورة الغلاف مطلوبة');
                }
                if (!basicFormData.viewTime || !basicFormData.viewTime.trim()) {
                    newErrors.push('وقت المعاينة مطلوب');
                }
                break;
        }

        return { isValid: newErrors.length === 0, errors: newErrors };
    }, [
        currentStep, basicFormData, selectedFinalTypeId, selectedCityId, selectedNeighborhoodId,
        imageUploadState.coverImagePreview, groupedProperties, validateDynamic, dynamicErrors
    ]);

    // Navigation Functions
    const nextStep = useCallback(() => {
        const validation = validateCurrentStep();
        if (validation.isValid && currentStep < steps.length) {
            markStepCompleted(currentStep);
            setCurrentStep(currentStep + 1);
        } else {
            setErrors(validation.errors);
        }
    }, [validateCurrentStep, currentStep, steps.length, markStepCompleted]);

    const prevStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    const navigateToStep = useCallback((stepId: number) => {
        if (completedSteps.has(stepId) || stepId <= currentStep || stepId === currentStep + 1) {
            setCurrentStep(stepId);
        }
    }, [completedSteps, currentStep]);

    // Submit Handler
    const handleSubmit = useCallback(async () => {
        const validation = validateCurrentStep();
        if (!validation.isValid || !selectedTypePath) {
            setErrors(validation.errors);
            return;
        }

        if (!selectedCityId || !selectedNeighborhoodId) {
            toast.error('يرجى اختيار المحافظة والمدينة');
            return;
        }

        setIsSubmitting(true);

        try {
            const processedDynamicData: { [key: string]: any } = {};
            Object.entries(dynamicFormData).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    processedDynamicData[key] = value.join(',');
                } else {
                    processedDynamicData[key] = value;
                }
            });

            // Filter out undefined files
            const validFiles = basicFormData.files.filter(file => file instanceof File);

            if (isEditMode && property) {
                const updateData: Partial<any> = {
                    title: basicFormData.title,
                    description: basicFormData.description,
                    price: Number(basicFormData.price),
                    paymentMethod: basicFormData.paymentMethod,
                    location: basicFormData.location,
                    viewTime: basicFormData.viewTime,
                    dynamicProperties: processedDynamicData,
                    cityId: selectedCityId,
                    neighborhoodId: selectedNeighborhoodId,
                    finalCityId: Number(basicFormData.finalCityId)
                };

                if (selectedBuilding) {
                    updateData.buildingItemId = selectedBuilding.id;
                }

                if (basicFormData.coverImage) {
                    updateData.coverImage = basicFormData.coverImage;
                }
                if (validFiles.length > 0) {
                    updateData.files = validFiles;
                }

                if (selectedTypePath) {
                    updateData.mainCategoryId = selectedTypePath.mainType.id;
                    updateData.subCategoryId = selectedTypePath.subType.id;
                    updateData.finalTypeId = selectedTypePath.finalType.id;
                }

                await RealEstateApi.update(property.id, updateData);
                toast.success('تم تحديث العقار بنجاح!');
            } else {
                const createData: CreateRealEstateData = {
                    title: basicFormData.title,
                    description: basicFormData.description,
                    price: Number(basicFormData.price),
                    mainCategoryId: selectedTypePath.mainType.id,
                    subCategoryId: selectedTypePath.subType.id,
                    finalTypeId: selectedTypePath.finalType.id,
                    paymentMethod: basicFormData.paymentMethod,
                    location: basicFormData.location,
                    viewTime: basicFormData.viewTime,
                    coverImage: basicFormData.coverImage,
                    files: validFiles,
                    dynamicProperties: processedDynamicData,
                    cityId: selectedCityId!,
                    neighborhoodId: selectedNeighborhoodId!,
                    finalCityId: Number(basicFormData.finalCityId),
                    // Default advertiser values (can be overridden by backend)
                    advertiserType: "user",
                    advertiserName: "مستخدم",
                    advertiserPhone: "",
                    advertiserWhatsapp: "",
                    ...(selectedBuilding && {
                        buildingItemId: selectedBuilding.id,
                    })
                };

                await RealEstateApi.create(createData);
                toast.success('تم إنشاء العقار بنجاح!');
            }

            router.push('/dashboard');
        } catch (error) {
            console.error('Error saving real estate:', error);
            toast.error(isEditMode ? 'حدث خطأ في تحديث العقار' : 'حدث خطأ في إنشاء العقار');
        } finally {
            setIsSubmitting(false);
        }
    }, [
        validateCurrentStep, selectedTypePath, selectedCityId, selectedNeighborhoodId,
        basicFormData, dynamicFormData, isEditMode, property, selectedBuilding, router
    ]);

    // Effects
    useEffect(() => {
        const loadBuilding = async () => {
            if (!buildingId) {
                setIsLoadingBuilding(false);
                return;
            }

            try {
                setIsLoadingBuilding(true);
                const buildingData = await buildingApi.fetchBuildingById(buildingId);
                setSelectedBuilding(buildingData);

                if (buildingData.location) {
                    updateBasicField('location', buildingData.location);
                }
                if ((buildingData as any).cityId) {
                    setSelectedCityId((buildingData as any).cityId);
                }
                if ((buildingData as any).neighborhoodId) {
                    setSelectedNeighborhoodId((buildingData as any).neighborhoodId);
                }
                if ((buildingData as any).finalCityId) {
                    updateBasicField('finalCityId', (buildingData as any).finalCityId.toString());
                }
                if (!basicFormData.title) {
                    updateBasicField('title', `عقار في ${buildingData.title}`);
                }
            } catch (error) {
                console.error('Error loading building:', error);
                toast.error('حدث خطأ في تحميل بيانات المبنى');
                router.push('/dashboard');
            } finally {
                setIsLoadingBuilding(false);
            }
        };

        loadBuilding();
    }, [buildingId, router, setSelectedCityId, setSelectedNeighborhoodId, updateBasicField, basicFormData.title]);

    useEffect(() => {
        const loadProperty = async () => {
            if (!isEditMode || !propertyId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const propertyData = await RealEstateApi.fetchRealEstateById(Number(propertyId));
                setProperty(propertyData);

                let parsedViewTime = '';
                if (propertyData.viewTime) {
                    try {
                        const parsed = JSON.parse(propertyData.viewTime);
                        if (typeof parsed === 'string') {
                            parsedViewTime = parsed;
                        } else if (Array.isArray(parsed) && parsed.length > 0) {
                            parsedViewTime = typeof parsed[0] === 'string' ? parsed[0] : JSON.stringify(parsed[0]);
                        } else {
                            parsedViewTime = JSON.stringify(parsed);
                        }
                    } catch {
                        parsedViewTime = propertyData.viewTime;
                    }
                }

                setBasicFormData({
                    title: propertyData.title || '',
                    description: propertyData.description || '',
                    price: propertyData.price?.toString() || '',
                    finalCityId: propertyData.finalCityId?.toString() || '',
                    location: propertyData.location || '',
                    viewTime: parsedViewTime,
                    paymentMethod: propertyData.paymentMethod || '',
                    coverImage: null,
                    files: [],
                    existingCoverImage: propertyData.coverImage || '',
                    existingFiles: propertyData.files || []
                });

                if (propertyData.coverImage) {
                    updateImageUploadState({ coverImagePreview: `${propertyData.coverImage}` });
                }

                if (propertyData.files && propertyData.files.length > 0) {
                    const imagePreviews = new Array(30).fill('');
                    const fileTypes = new Array(30).fill('');

                    propertyData.files.forEach((file: string, index: number) => {
                        if (index < 30) {
                            imagePreviews[index] = `${file}`;
                            fileTypes[index] = 'image/jpeg';
                        }
                    });

                    updateImageUploadState({
                        additionalImagePreviews: imagePreviews,
                        additionalFileTypes: fileTypes
                    });
                }

                if (propertyData.cityId) setSelectedCityId(propertyData.cityId);
                if (propertyData.neighborhoodId) setSelectedNeighborhoodId(propertyData.neighborhoodId);
                if (propertyData.finalTypeId) setSelectedFinalTypeId(propertyData.finalTypeId);

                if (propertyData.buildingItemId) {
                    try {
                        const buildingData = await buildingApi.fetchBuildingById(propertyData.buildingItemId);
                        setSelectedBuilding(buildingData);
                    } catch (error) {
                        console.warn('Could not load building data for property');
                    }
                }
            } catch (error) {
                console.error('Error loading property:', error);
                toast.error('حدث خطأ في تحميل بيانات العقار');
                router.push('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        loadProperty();
    }, [isEditMode, propertyId, router, setSelectedCityId, setSelectedNeighborhoodId, updateImageUploadState]);

    useEffect(() => {
        if (isEditMode && property && selectedFinalTypeId && !dynamicLoading && groupedProperties) {
            if (property.properties) {
                const dynamicData: { [key: string]: any } = {};
                Object.entries(property.properties).forEach(([key, propValue]) => {
                    if (propValue && typeof propValue === 'object' && 'value' in propValue && 'property' in propValue) {
                        const propertyDef = propValue.property;
                        const value = propValue.value;

                        if (propertyDef.dataType === 'MULTIPLE_CHOICE' && typeof value === 'string') {
                            const arrayValue = value.split(',').map((item: string) => item.trim()).filter((item: string) => item);
                            dynamicData[key] = arrayValue;
                        } else {
                            dynamicData[key] = value;
                        }
                    }
                });
                setDynamicFormData(dynamicData);
            }

            setTimeout(() => {
                setCompletedSteps(new Set([1, 2, 3, 4, 5]));
            }, 100);
        }
    }, [property, selectedFinalTypeId, dynamicLoading, groupedProperties, setDynamicFormData, isEditMode]);

    useEffect(() => {
        if (basicFormData.finalCityId) {
            const selectedFinalCity = finalCities.find(c => c.id === Number(basicFormData.finalCityId));
            if (selectedFinalCity && 'location' in selectedFinalCity && selectedFinalCity.location && typeof selectedFinalCity.location === 'string') {
                // Always update location when finalCity changes
                updateBasicField('location', selectedFinalCity.location);
            } else if (!basicFormData.location) {
                updateBasicField('location', '23.5880,58.3829');
            }
        }
    }, [basicFormData.finalCityId, finalCities, updateBasicField]);

    useEffect(() => {
        if (!isEditMode && !isLoadingBuilding && !basicFormData.location && finalCities.length > 0) {
            updateBasicField('location', '23.5880,58.3829');
        }
    }, [finalCities, isEditMode, isLoadingBuilding, basicFormData.location, updateBasicField]);

    // Loading State
    if (isLoading || isLoadingBuilding) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {isLoadingBuilding ? 'جاري تحميل بيانات المبنى' : 'جاري تحميل بيانات العقار'}
                    </h2>
                    <p className="text-gray-600">يرجى الانتظار...</p>
                </div>
            </div>
        );
    }

    // Step Content Renderer
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        {selectedBuilding && (
                            <Card className="bg-green-50 border-green-200">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-green-900">
                                                إضافة عقار إلى: {selectedBuilding.title}
                                            </h3>
                                            <p className="text-sm text-green-700">
                                                الحالة: {selectedBuilding.status} • الموقع: {selectedBuilding.location}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {isEditMode && property && (
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Edit className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-blue-900">
                                                النوع الحالي: {property.finalTypeName}
                                            </h3>
                                            <p className="text-sm text-blue-700">
                                                يمكنك تغيير نوع العقار أو الاحتفاظ بالنوع الحالي
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <TypeSelector
                            onFinalTypeSelect={handleFinalTypeSelect}
                            initialFinalTypeId={selectedFinalTypeId}
                            className="min-h-[400px]"
                        />
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    المعلومات الأساسية
                                    {selectedBuilding && (
                                        <Badge variant="secondary" className="mr-auto">
                                            مبنى: {selectedBuilding.title}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title">عنوان العقار *</Label>
                                    <Input
                                        id="title"
                                        value={basicFormData.title}
                                        onChange={(e) => updateBasicField('title', e.target.value)}
                                        placeholder={selectedBuilding ?
                                            `أدخل عنوان العقار في ${selectedBuilding.title}` :
                                            "أدخل عنوان مميز للعقار"
                                        }
                                        className="mt-1"
                                        maxLength={100}
                                    />
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-gray-500">الحد الأقصى 100 حرف</span>
                                        <span className={`${basicFormData.title.length > 90 ? 'text-amber-600' : ''} ${basicFormData.title.length >= 100 ? 'text-red-500' : ''}`}>
                                            {basicFormData.title.length}/100
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="description">وصف العقار *</Label>
                                    <Textarea
                                        id="description"
                                        value={basicFormData.description}
                                        onChange={(e) => updateBasicField('description', e.target.value)}
                                        placeholder={selectedBuilding ?
                                            `اكتب وصفاً تفصيلياً للعقار في مبنى ${selectedBuilding.title}` :
                                            "اكتب وصفاً تفصيلياً للعقار"
                                        }
                                        className="mt-1 min-h-[100px]"
                                        maxLength={1000}
                                    />
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-gray-500">الحد الأقصى 1000 حرف</span>
                                        <span className={`${basicFormData.description.length > 900 ? 'text-amber-600' : ''} ${basicFormData.description.length >= 1000 ? 'text-red-500' : ''}`}>
                                            {basicFormData.description.length}/1000
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="price">السعر (ريال عماني) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={basicFormData.price}
                                        onChange={(e) => updateBasicField('price', e.target.value)}
                                        placeholder="0"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
                                    <Select
                                        value={basicFormData.paymentMethod}
                                        onValueChange={(value) => updateBasicField('paymentMethod', value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="اختر طريقة الدفع" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-green-500" />
                                    تفاصيل الموقع
                                    {selectedBuilding && (
                                        <Badge variant="secondary" className="mr-auto">
                                            مرتبط بمبنى: {selectedBuilding.title}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city">المحافظة *</Label>
                                        <select
                                            id="city"
                                            value={selectedCityId || ''}
                                            onChange={(e) => setSelectedCityId(Number(e.target.value) || null)}
                                            className="w-full mt-1 p-2 border rounded-md"
                                            disabled={locationLoading}
                                        >
                                            <option value="">اختر المحافظة</option>
                                            {cities.map(city => (
                                                <option key={city.id} value={city.id}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="neighborhood">المدينة *</Label>
                                        <select
                                            id="neighborhood"
                                            value={selectedNeighborhoodId || ''}
                                            onChange={(e) => setSelectedNeighborhoodId(Number(e.target.value) || null)}
                                            className="w-full mt-1 p-2 border rounded-md"
                                            disabled={!selectedCityId || locationLoading}
                                        >
                                            <option value="">اختر المدينة</option>
                                            {neighborhoods.map(neighborhood => (
                                                <option key={neighborhood.id} value={neighborhood.id}>
                                                    {neighborhood.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="finalCity">المنطقة *</Label>
                                    <select
                                        id="finalCity"
                                        value={basicFormData.finalCityId}
                                        onChange={(e) => updateBasicField('finalCityId', e.target.value)}
                                        className="w-full mt-1 p-2 border rounded-md"
                                        disabled={!selectedNeighborhoodId || locationLoading}
                                    >
                                        <option value="">اختر المنطقة</option>
                                        {finalCities.map(finalCity => (
                                            <option key={finalCity.id} value={finalCity.id}>
                                                {finalCity.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="location">تحديد الموقع على الخريطة *</Label>
                                    <div className="mt-1">
                                        <LocationPicker
                                            key={`location-picker-${basicFormData.finalCityId}-${basicFormData.location}`}
                                            initialLatitude={getLocationCoordinates().lat}
                                            initialLongitude={getLocationCoordinates().lng}
                                            onLocationSelect={(latitude, longitude) => {
                                                updateBasicField('location', `${latitude},${longitude}`);
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        انقر على الخريطة لتحديد الموقع أو اسحب العلامة لتغيير الموقع
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 4:
                if (dynamicLoading) {
                    return (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">جاري تحميل الخصائص...</p>
                        </div>
                    );
                }

                return (
                    <div className="space-y-6">
                        {selectedTypePath && (
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Home className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-blue-900">
                                                {selectedTypePath.mainType.name} - {selectedTypePath.subType.name} - {selectedTypePath.finalType.name}
                                            </h3>
                                            <p className="text-sm text-blue-700">
                                                املأ الخصائص المطلوبة لهذا النوع من الإعلانات
                                                {selectedBuilding && ` في مبنى ${selectedBuilding.title}`}
                                            </p>
                                        </div>
                                        {selectedBuilding && (
                                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                                                مبنى
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <DynamicForm
                            groupedProperties={groupedProperties}
                            formData={dynamicFormData}
                            onChange={updateDynamicField}
                            errors={dynamicErrors}
                        />
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-purple-500" />
                                    الصور والملفات
                                    {selectedBuilding && (
                                        <Badge variant="secondary" className="mr-auto">
                                            {selectedBuilding.title}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <ImageUploadModal
                                    additionalImagePreviews={imageUploadState.additionalImagePreviews}
                                    additionalFileTypes={imageUploadState.additionalFileTypes}
                                    handleFileUpload={handleFileUpload}
                                    coverImagePreview={imageUploadState.coverImagePreview}
                                    handleImageUpload={handleImageUpload}
                                    handleMultipleFileUpload={handleMultipleFileUpload}
                                    isUploading={imageUploadState.isUploading}
                                    handleDeleteImage={handleDeleteAdditionalImage}
                                    handleDeleteCoverImage={handleDeleteCoverImage}
                                    isCoverImageUploading={imageUploadState.isCoverImageUploading}
                                    isAdditionalImageUploading={imageUploadState.uploadingImageIndexes}
                                    coverImageProgress={imageUploadState.coverImageProgress}
                                    additionalImageProgress={imageUploadState.additionalImageProgress}
                                />

                                <div className="mt-6">
                                    <ViewingTimeSelector
                                        value={basicFormData.viewTime}
                                        onChange={(viewingTimes) => updateBasicField('viewTime', viewingTimes)}
                                        label="أوقات المعاينة *"
                                    />
                                    {selectedBuilding && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            تأكد من تنسيق أوقات المعاينة مع إدارة المبنى
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    // Main Render
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (selectedBuilding) {
                                    router.push(`/dashboard`);
                                } else {
                                    router.back();
                                }
                            }}
                            className="flex items-center gap-2"
                        >
                            <ArrowRight className="w-4 h-4" />
                            العودة
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isEditMode ? 'تعديل العقار' :
                                    selectedBuilding ? `إضافة عقار إلى ${selectedBuilding.title}` :
                                        'إضافة عقار جديد'}
                            </h1>
                            <p className="text-gray-600">
                                {isEditMode
                                    ? 'قم بتعديل تفاصيل العقار'
                                    : selectedBuilding
                                        ? `أدخل تفاصيل العقار لإضافته إلى مبنى ${selectedBuilding.title}`
                                        : 'أدخل تفاصيل العقار لإضافته للمنصة'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`
                                                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer
                                                ${currentStep === step.id
                                                    ? 'border-blue-500 bg-blue-500 text-white'
                                                    : isStepCompleted(step.id)
                                                        ? 'border-green-500 bg-green-500 text-white'
                                                        : 'border-gray-300 bg-white text-gray-500'
                                                }
                                            `}
                                            onClick={() => navigateToStep(step.id)}
                                        >
                                            {isStepCompleted(step.id) ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                step.icon
                                            )}
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className="text-xs font-medium text-gray-900">
                                                {step.title}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-16 h-0.5 mx-4 mb-8 ${isStepCompleted(step.id) ? 'bg-green-500' : 'bg-gray-300'
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step Content */}
                <div className="mb-8">
                    {renderStepContent()}
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                    <Card className="mb-6 border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    يرجى تصحيح الأخطاء التالية:
                                </h4>
                                {errors.map((error, index) => (
                                    <p key={index} className="text-sm text-red-600 flex items-center gap-2">
                                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                                        {error}
                                    </p>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center bg-white rounded-lg p-6 shadow-sm">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2"
                    >
                        <ArrowRight className="w-4 h-4" />
                        السابق
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            الخطوة {currentStep} من {steps.length}
                        </span>
                        {isEditMode && (
                            <Badge variant="secondary" className="text-xs">
                                وضع التعديل
                            </Badge>
                        )}
                        {selectedBuilding && (
                            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                                مرتبط بمبنى
                            </Badge>
                        )}
                    </div>

                    {currentStep < steps.length ? (
                        <Button
                            onClick={nextStep}
                            className="flex items-center gap-2"
                            disabled={dynamicLoading}
                        >
                            التالي
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || dynamicLoading}
                            className="flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {isEditMode ? 'جاري التحديث...' : 'جاري الحفظ...'}
                                </>
                            ) : (
                                <>
                                    {isEditMode ? (
                                        <>
                                            <Save className="w-4 h-4" />
                                            حفظ التغييرات
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            {selectedBuilding ? `حفظ العقار في ${selectedBuilding.title}` : 'حفظ العقار'}
                                        </>
                                    )}
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Loading Overlay for Dynamic Content */}
                {dynamicLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 flex items-center gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <span className="text-gray-700">جاري تحميل الخصائص...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Main component with Suspense wrapper
export default function RealEstatePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        جاري تحميل الصفحة...
                    </h2>
                    <p className="text-gray-600">يرجى الانتظار...</p>
                </div>
            </div>
        }>
            <RealEstatePageContent />
        </Suspense>
    );
}