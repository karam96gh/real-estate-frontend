"use client";

import { useState, useEffect } from "react";
import { Building2, Home, Loader2, Plus, Calendar, Users, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMainType } from "@/lib/hooks/useMainType";
import { useAuth } from "@/hooks/useAuth";
import Tabs from "./Tabs";
import MainTypeTable from "./tables/MainTypeTable";
import SubTypeTable from "./tables/SubTypeTable";
import FinalTypeTable from "./tables/FinalTypeTable";
import CityTable from "./tables/CityTable";
import NeighborhoodTable from "./tables/NeighborhoodTable";
import EstateTable from "./tables/EstateTable";
import BuildingTable from "./tables/BuildingTable";
import FloatingAddButton from "./FloatingAddButton";
import FinalCityTable from "./tables/FinalCitiesTable";

// Import new components
import ReservationsPage from "@/app/dashboard/reservations/page";
import OffersPage from "@/app/dashboard/offers/page";
import UsersManagementPage from "@/app/dashboard/users/page";
import { useMyRealEstate } from "@/lib/hooks/useMyRealEstate";

export default function DashboardComponent() {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "mainType" | "subType" | "finalType" | "city" | "neighborhood" | "estate" | "map" | "finalCity" | "reservations" | "offers" | "users" | "analytics"
  >(user?.role == "admin" ? "users" : "estate");

  const router = useRouter();
  const { mainTypes, isLoading: isLoadingMainTypes, refetch: refetchMain } = useMainType();
  const { realEstateData, isLoading: isLoadingEstate } = useMyRealEstate();


  // Redirect if user doesn't have dashboard access
  useEffect(() => {
    if (!hasRole(['admin', 'company'])) {
      router.push('/');
      return;
    }

    // Set default tab based on role
    if (user?.role === 'company') {
      setActiveTab('estate');
    } else if (user?.role === 'admin') {
      setActiveTab('analytics');
    }
  }, [user, hasRole, router]);

  const isLoading = isLoadingMainTypes || isLoadingEstate;

  // Check access rights
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
    <div className="relative min-h-screen bg-gray-100 text-gray-800" dir="rtl">
      {/* Sidebar Navigation */}
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="p-6 md:p-8 md:mr-64 transition-all">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Only show FloatingAddButton for certain tabs */}
          {['mainType', 'subType', 'finalType', 'city', 'neighborhood', 'estate', 'map', 'finalCity'].includes(activeTab) && (
            <FloatingAddButton activeTab={activeTab} />
          )}

          {/* Main Data Table Section */}
          <div className="w-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              {/* Data Content */}
              <div className="max-h-[90vh] overflow-y-auto">
                {/* Analytics Tab */}

                {/* Reservations Tab */}
                {activeTab === "reservations" && <ReservationsPage />}

                {/* Offers Tab */}
                {activeTab === "offers" && <OffersPage />}

                {/* Users Management Tab (Admin only) */}
                {activeTab === "users" && hasRole('admin') && <UsersManagementPage />}

                {/* Original tabs */}
                {activeTab === "mainType" && hasRole('admin') && (
                  <MainTypeTable mainTypes={mainTypes} isLoading={isLoadingMainTypes} onRefetch={refetchMain} />
                )}

                {activeTab === "map" && (
                  <div className="w-full">
                    <BuildingTable />
                  </div>
                )}

                {activeTab === "subType" && hasRole('admin') && (
                  <SubTypeTable mainTypes={mainTypes} isLoading={isLoadingMainTypes} onRefetch={refetchMain} />
                )}

                {activeTab === "finalType" && hasRole('admin') && <FinalTypeTable />}

                {activeTab === "city" && hasRole('admin') && <CityTable />}

                {activeTab === "neighborhood" && hasRole('admin') && <NeighborhoodTable />}

                {activeTab === "finalCity" && hasRole('admin') && <FinalCityTable />}

                {activeTab === "estate" && (
                  <EstateTable mainTypes={mainTypes} realEstateData={realEstateData} isLoading={isLoadingEstate} />
                )}

                {/* Empty States */}
                {!isLoading && activeTab === "mainType" && hasRole('admin') && (!mainTypes || mainTypes.length === 0) && (
                  <EmptyState
                    icon={<Building2 className="mx-auto h-12 w-12 text-gray-400" />}
                    title="لا توجد تصنيفات رئيسية"
                    description="ابدأ بإضافة تصنيف رئيسي جديد"
                    buttonText="إضافة تصنيف رئيسي"
                  />
                )}

                {!isLoading && activeTab === "estate" && (!realEstateData || realEstateData.length === 0) && (
                  <EmptyState
                    icon={<Home className="mx-auto h-12 w-12 text-gray-400" />}
                    title="لا توجد عقارات"
                    description="ابدأ بإضافة عقار جديد"
                    buttonText="إضافة عقار"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, buttonText }: { icon: React.ReactNode; title: string; description: string; buttonText: string }) {
  return (
    <div className="text-center py-8">
      {icon}
      <h3 className="mt-2 text-md font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

    </div>
  );
}
