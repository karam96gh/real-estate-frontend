"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin,
    BedDouble,
    Bath,
    Maximize2,
    ArrowRight,
    Home,
    Info,
    Star,
    Clock,
    CheckCircle,
    X,
    Share2,
    Heart,
    Phone,
    MessageCircle,
    Eye,
    Calendar,
    Camera,
    Shield,
    Award,
    Bookmark,
    Download,
    ExternalLink,
    ChevronRight,
    Building2,
    Car,
    Wifi,
    Zap,
    Droplets,
    TreePine,
    Bed,
    Users,
    Calculator,
    Navigation,
    Filter,
    FileText,
    Image as ImageIcon,
    Video,
    File,
    ChevronDown,
    ChevronUp,
    KeyRound,
    HandCoins,
    DollarSign,
    ClipboardList,
    Handshake,
    PiggyBank,
    User
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { RealEstateApi } from "@/api/realEstateApi";
import Image from "next/image";
import { RealEstateData } from "@/lib/types";
import PropertyGallery from "@/components/properties/PropertyGallery";
import RealEstateCard from "@/components/widgets/PropertyGrid/PropertyCard";
import MapboxViewer from "@/components/map/MapboxViewer";
import PropertyActionButtons from "@/components/properties/PropertyActionButtons";
import { PropertyReservationModal } from "@/components/properties/PropertyReservation";
import { PropertyOfferModal } from "@/components/properties/PropertyOffer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PropertyDetails() {
    const [property, setProperty] = useState<RealEstateData | null>(null);
    const [similarProperties, setSimilarProperties] = useState<RealEstateData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const params = useParams();
    const router = useRouter();

    useEffect(() => {
        const fetchPropertyDetails = async () => {
            try {
                setIsLoading(true);
                const propertyId = params?.id;
                if (!propertyId) {
                    throw new Error("Property ID not found");
                }

                const data = await RealEstateApi.fetchById(Number(propertyId));
                const propertyWithFiles = {
                    ...data,
                    files: data.files || [`${data.coverImage}`],
                };
                setProperty(propertyWithFiles);

                try {
                    const similarData = await RealEstateApi.fetchSimilarRealEstate(Number(propertyId));
                    const similarPropertiesArray = Array.isArray(similarData)
                        ? similarData
                        : similarData
                            ? [similarData]
                            : [];
                    const filteredSimilarProperties = similarPropertiesArray.filter(
                        (similarProp) => similarProp.id !== Number(propertyId)
                    );
                    setSimilarProperties(filteredSimilarProperties);
                } catch (similarError) {
                    console.error("Failed to fetch similar properties:", similarError);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch property details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPropertyDetails();
    }, [params?.id]);

    // Helper functions
    const getPropertyValue = (key: string) => {
        return property?.properties?.[key]?.value;
    };

    // File type detection and icon mapping
    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return ImageIcon;
            case 'mp4':
            case 'avi':
            case 'mov':
            case 'wmv':
                return Video;
            case 'pdf':
                return FileText;
            default:
                return File;
        }
    };

    const openFile = (fileUrl: string) => {
        window.open(fileUrl, '_blank');
    };

    const renderPropertyValue = (key: string, propertyInfo?: any) => {
        const value = getPropertyValue(key);
        if (value === null || value === undefined || value === "") return null;

        const dataType = propertyInfo?.property?.dataType?.toUpperCase();
        const unit = propertyInfo?.property?.unit;

        switch (dataType) {
            case "FILE":
                // Handle file properties - show clickable file links
                if (typeof value === "string") {
                    const files = value.split(",").map(f => f.trim()).filter(f => f);
                    if (files.length === 0) return null;

                    return (
                        <div className="flex flex-wrap gap-2">
                            {files.map((fileUrl: string, index: number) => {
                                const fileName = fileUrl.split('/').pop() || `ملف ${index + 1}`;
                                const FileIcon = getFileIcon(fileName);
                                return (
                                    <Button
                                        key={`${key}-file-${index}`}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openFile(fileUrl)}
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300"
                                    >
                                        <FileIcon className="w-4 h-4" />
                                        {fileName}
                                        <ExternalLink className="w-3 h-3" />
                                    </Button>
                                );
                            })}
                        </div>
                    );
                }
                return null;

            case "MULTIPLE_CHOICE":
                if (typeof value === "string" && value.includes(",")) {
                    return (
                        <div className="flex flex-wrap gap-2">
                            {value.split(",").map((item: string, index: number) => (
                                <Badge
                                    key={`${key}-choice-${index}`}
                                    variant="secondary"
                                    className="bg-blue-50 text-blue-700 border border-blue-200"
                                >
                                    {item.trim()}
                                </Badge>
                            ))}
                        </div>
                    );
                }
                return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">{value}</Badge>;

            case "SINGLE_CHOICE":
                return <Badge variant="outline" className="text-blue-700 border-blue-200">{value}</Badge>;

            case "NUMBER":
                const numValue = typeof value === "string" ? parseFloat(value) : value;
                if (isNaN(numValue)) return value;
                const formattedNumber = numValue.toLocaleString("ar-OM");
                return (
                    <span className="font-semibold text-gray-900">
                        {formattedNumber}
                        {unit ? ` ${unit}` : ""}
                    </span>
                );

            case "BOOLEAN":
                return value ? (
                    <span className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" /> نعم
                    </span>
                ) : (
                    <span className="flex items-center gap-2 text-red-600">
                        <X className="w-4 h-4" /> لا
                    </span>
                );

            case "DATE":
                try {
                    const date = new Date(value);
                    if (isNaN(date.getTime())) return value;
                    return date.toLocaleDateString("en-US");
                } catch {
                    return value;
                }

            default:
                if (typeof value === "string" && value.length > 150) {
                    return (
                        <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800 font-medium">
                                {value.substring(0, 150)}... <span className="text-sm">(انقر للمزيد)</span>
                            </summary>
                            <div className="mt-3 p-3 bg-gray-50 rounded-md text-gray-700 leading-relaxed">
                                {value}
                            </div>
                        </details>
                    );
                }
                return <span className="text-gray-900">{value}</span>;
        }
    };

    // Get key metrics for quick overview
    const getKeyMetrics = () => {
        const metrics = [];
        const roomsCount = getPropertyValue("rooms_count");
        const bathroomsCount = getPropertyValue("bathrooms_count");
        const totalArea = getPropertyValue("total_area");

        if (roomsCount && property?.subCategoryName !== "أرض" && property?.finalTypeName !== "أرض") {
            metrics.push({ icon: BedDouble, label: `${roomsCount} غرف`, color: "text-blue-600" });
        }
        if (bathroomsCount && property?.subCategoryName !== "أرض" && property?.finalTypeName !== "أرض") {
            metrics.push({ icon: Bath, label: `${bathroomsCount} حمامات`, color: "text-green-600" });
        }
        if (totalArea) {
            const area = typeof totalArea === "string" ? parseFloat(totalArea) : totalArea;
            const unit = property?.properties?.["total_area"]?.property?.unit || "م²";
            metrics.push({ icon: Maximize2, label: `${area.toLocaleString("ar-OM")} ${unit}`, color: "text-purple-600" });
        }

        return metrics;
    };

    const getPropertiesByGroup = () => {
        if (!property?.properties) return {};
        const grouped: { [key: string]: Array<{ key: string; value: any; property: any }> } = {};

        // Track displayed properties to avoid duplication
        const displayedProperties = new Set(['rooms_count', 'bathrooms_count', 'total_area']);

        Object.entries(property.properties).forEach(([key, propData]) => {
            // Skip if already displayed in key metrics
            if (displayedProperties.has(key)) return;

            const groupName = propData.property?.groupName || "خصائص إضافية";
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            const value = propData.value;
            if (value !== null && value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0)) {
                grouped[groupName].push({
                    key,
                    value,
                    property: propData.property,
                });
            }
        });

        // Remove empty groups
        Object.keys(grouped).forEach((groupName) => {
            if (grouped[groupName].length === 0) {
                delete grouped[groupName];
            }
        });

        return grouped;
    };

    const toggleGroup = (groupName: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupName)) {
            newExpanded.delete(groupName);
        } else {
            newExpanded.add(groupName);
        }
        setExpandedGroups(newExpanded);
    };

    const openReservationModal = () => setIsReservationModalOpen(true);
    const closeReservationModal = () => setIsReservationModalOpen(false);
    const openOfferModal = () => setIsOfferModalOpen(true);
    const closeOfferModal = () => setIsOfferModalOpen(false);
    const openFeedbackModal = () => setIsFeedbackModalOpen(true);
    const closeFeedbackModal = () => setIsFeedbackModalOpen(false);

    // Determine if this is a rental property
    const isRental = property?.mainCategoryName === "إيجار";

    // Note: Add these properties to RealEstateData interface if not exist:
    // advertiserName?: string;
    // advertiserType?: 'owner' | 'company';
    // advertiserPhone?: string;
    // advertiserWhatsapp?: string;
    // reviewsCount?: number;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                    <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">خطأ</h2>
                    <p className="text-gray-600 mb-6">{error || "لم يتم العثور على العقار"}</p>
                    <Button onClick={() => router.push("/")} className="bg-blue-500 hover:bg-blue-600">
                        العودة للرئيسية
                    </Button>
                </div>
            </div>
        );
    }

    const keyMetrics = getKeyMetrics();

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0 }}
                className="relative"
            >
                <PropertyGallery
                    property={{
                        title: property.title,
                        files: property.files,
                    }}
                />
                <div className="absolute top-4 left-4 z-10">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsSaved(!isSaved)}
                            className={`rounded-full backdrop-blur-sm ${isSaved ? "text-red-500 border-red-500 bg-white/90" : "bg-white/90"}`}
                        >
                            <Heart className={`w-5 h-5 ${isSaved ? "fill-red-500" : ""}`} />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full backdrop-blur-sm bg-white/90">
                            <Share2 className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </motion.div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Property Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"
                >
                    <div className="lg:col-span-2">
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                            {property.title}
                        </h1>

                        <div className="flex items-center gap-2 text-gray-600 mb-6">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">
                                {property.cityName} • {property.neighborhoodName} • {property.finalCityName}
                            </span>
                        </div>

                        {/* Key Metrics */}
                        {keyMetrics.length > 0 && (
                            <div className="flex flex-wrap gap-4 mb-6">
                                {keyMetrics.map((metric, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                                        <metric.icon className={`w-5 h-5 ${metric.color}`} />
                                        <span className="font-medium text-gray-900">{metric.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="default" className="bg-blue-500 text-white">
                                {property.mainCategoryName}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100">
                                {property.subCategoryName}
                            </Badge>
                            <Badge variant="outline">
                                {property.finalTypeName}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <div className="text-right bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                            <span className="text-sm text-green-700 font-medium block mb-2">السعر</span>
                            <div className="text-3xl lg:text-4xl font-bold text-green-700">
                                {property.price.toLocaleString("ar-OM")} ر.ع
                            </div>
                            {property.mainCategoryName === "إيجار" && (
                                <span className="text-sm text-green-600 font-medium">شهرياً</span>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir="rtl">
                            <TabsList className="grid grid-cols-4 gap-2 bg-white p-2 rounded-xl shadow-sm border">
                                <TabsTrigger value="overview" className="rounded-lg font-medium">
                                    نظرة عامة
                                </TabsTrigger>
                                <TabsTrigger value="details" className="rounded-lg font-medium">
                                    التفاصيل
                                </TabsTrigger>
                                <TabsTrigger value="location" className="rounded-lg font-medium">
                                    الموقع
                                </TabsTrigger>
                                <TabsTrigger value="similar" className="rounded-lg font-medium">
                                    مشابه
                                </TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="space-y-6">
                                {property.description && (
                                    <Card className="shadow-sm border-0 shadow-md">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Info className="w-5 h-5 text-blue-500" />
                                                وصف العقار
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-700 leading-relaxed text-base">
                                                {property.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {property.viewTime && (
                                    <Card className="shadow-sm border-0 shadow-md">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center gap-3 text-lg">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-5 h-5 text-amber-500" />
                                                    <Calendar className="w-5 h-5 text-green-500" />
                                                    <Eye className="w-5 h-5 text-blue-500" />
                                                </div>
                                                مواعيد المعاينة
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200 mb-4">
                                                {property.viewTime.replace(/"/g, '').split('.').map((time, index) => (
                                                    <p key={index} className="text-gray-700 leading-relaxed font-medium">
                                                        {time.trim()}
                                                    </p>
                                                ))}
                                            </div>
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={openReservationModal}
                                                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-md"
                                                >
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    حجز معاينة
                                                </Button>
                                                <Button
                                                    onClick={openOfferModal}
                                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-md"
                                                >
                                                    <DollarSign className="w-4 h-4 mr-2" />
                                                    تقديم عرض
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Details Tab */}
                            <TabsContent value="details" className="space-y-4">
                                {(() => {
                                    const groupedProperties = getPropertiesByGroup();
                                    return Object.entries(groupedProperties).map(([groupName, props]) => (
                                        <Card key={groupName} className="shadow-sm border-0 shadow-md overflow-hidden">
                                            <CardHeader
                                                className="pb-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => toggleGroup(groupName)}
                                            >
                                                <CardTitle className="flex items-center justify-between text-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Filter className="w-5 h-5 text-indigo-500" />
                                                        {groupName}
                                                        <Badge variant="secondary" className="text-xs">
                                                            {props.length}
                                                        </Badge>
                                                    </div>
                                                    {expandedGroups.has(groupName) ?
                                                        <ChevronUp className="w-5 h-5 text-gray-400" /> :
                                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                                    }
                                                </CardTitle>
                                            </CardHeader>
                                            <AnimatePresence>
                                                {expandedGroups.has(groupName) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <CardContent className="pt-0" dir="rtl">
                                                            <div className="space-y-4">
                                                                {props.map(({ key, value, property }) => (
                                                                    <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-2 p-4 bg-gray-50 rounded-lg">
                                                                        <span className="text-gray-600 font-medium">
                                                                            {property?.propertyName || key}
                                                                        </span>
                                                                        <div className="text-right">
                                                                            {renderPropertyValue(key, { property })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Card>
                                    ));
                                })()}
                            </TabsContent>

                            {/* Location Tab */}
                            <TabsContent value="location">
                                <Card className="shadow-sm border-0 shadow-md">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <MapPin className="w-5 h-5 text-red-500" />
                                            الموقع على الخريطة
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {property.location && (
                                            <div className="rounded-lg overflow-hidden">
                                                <MapboxViewer
                                                    latitude={parseFloat(property.location.split(",")[0])}
                                                    longitude={parseFloat(property.location.split(",")[1])}
                                                    cityName={property.cityName}
                                                    neighborhoodName={property.neighborhoodName}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Similar Properties Tab */}
                            <TabsContent value="similar">
                                <Card className="shadow-sm border-0 shadow-md">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Home className="w-5 h-5 text-green-500" />
                                            عقارات مشابهة
                                            {similarProperties.length > 0 && (
                                                <Badge variant="secondary">
                                                    {similarProperties.length}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {similarProperties.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {similarProperties.map((similarProperty) => (
                                                    <RealEstateCard
                                                        key={similarProperty.id}
                                                        item={similarProperty}
                                                        mainType={{ id: property.mainCategoryId, name: property.mainCategoryName }}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-500 text-lg">لا توجد عقارات مشابهة حالياً</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </motion.div>

                    {/* Right Column: Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="space-y-6"
                    >
                        {/* Advertiser Contact Card */}
                        <Card className="shadow-md border-0 bg-gradient-to-br from-white to-gray-50">
                            <CardContent className="p-6">
                                {/* Advertiser Info */}
                                <div className="text-center mb-6">
                                    {/* Logo/Avatar */}
                                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                        {property.advertiserType === 'company' ? (
                                            <Building2 className="w-10 h-10" />
                                        ) : (
                                            <User className="w-10 h-10" />
                                        )}
                                    </div>

                                    {/* Advertiser Name */}
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        {property.companyFullName || "المعلن"}
                                    </h3>


                                </div>

                                {/* Contact Methods */}
                                <div className="space-y-3">
                                    {/* Phone Call */}
                                    {/* <a
                                        href={`tel:${property.companyPhone || '96812345678'}`}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
                                    >
                                        <Phone className="w-5 h-5" />
                                        <div className="text-center">
                                            <div className="font-bold">اتصال مباشر</div>
                                            <div className="text-sm opacity-90">{property.companyPhone || '+968 1234 5678'}</div>
                                        </div>
                                    </a> */}

                                    {/* WhatsApp */}
                                    {/* <a
                                        href={`https://wa.me/${(property.advertiserWhatsapp || '96812345678').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن العقار: ${property.title}\n\nرابط العقار: ${window.location.href}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        <div className="text-center">
                                            <div className="font-bold">واتساب</div>
                                            <div className="text-sm opacity-90">محادثة فورية</div>
                                        </div>
                                    </a> */}

                                    {/* Action Buttons */}
                                    <div className="border-t pt-4 mt-4 space-y-2">
                                        <Button
                                            onClick={openReservationModal}
                                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-md"
                                        >
                                            <Calendar className="w-4 h-4 mr-2" />
                                            حجز معاينة
                                        </Button>
                                        <Button
                                            onClick={openOfferModal}
                                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-md"
                                        >
                                            <DollarSign className="w-4 h-4 mr-2" />
                                            تقديم عرض
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Info Card */}
                        <Card className="shadow-sm border-0 shadow-md">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Building2 className="w-5 h-5 text-purple-500" />
                                    معلومات سريعة
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 flex items-center gap-2">
                                            <ClipboardList className="w-4 h-4" />
                                            نوع الإعلان
                                        </span>
                                        <Badge variant="default" className="bg-blue-500">
                                            {property.mainCategoryName}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 flex items-center gap-2">
                                            <Home className="w-4 h-4" />
                                            الفئة
                                        </span>
                                        <span className="font-medium">{property.subCategoryName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 flex items-center gap-2">
                                            <Building2 className="w-4 h-4" />
                                            النوع
                                        </span>
                                        <span className="font-medium">{property.finalTypeName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 flex items-center gap-2">
                                            <PiggyBank className="w-4 h-4" />
                                            طريقة الدفع
                                        </span>
                                        <span className="font-medium">{property.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            تاريخ النشر
                                        </span>
                                        <span className="font-medium">
                                            {new Date(property.createdAt).toLocaleDateString("en-US")}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </motion.div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {property && (
                    <>
                        <PropertyReservationModal
                            propertyId={property.id}
                            isOpen={isReservationModalOpen}
                            onClose={closeReservationModal}
                        />
                        <PropertyOfferModal
                            propertyId={property.id}
                            propertyPrice={property.price}
                            isOpen={isOfferModalOpen}
                            onClose={closeOfferModal}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
