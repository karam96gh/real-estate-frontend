"use client";

import React, { useState } from "react";
import clsx from "clsx";
import {
  Building2,
  Layers,
  Grid3X3,
  MapPin,
  Landmark,
  Home,
  Menu,
  X,
  QrCode,
  Users,
  BarChart3,
  Calendar,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type DashboardTab =
  | "mainType"
  | "subType"
  | "finalType"
  | "city"
  | "neighborhood"
  | "estate"
  | "map"
  | "finalCity"
  | "reservations"
  | "offers"
  | "users"
  | "analytics";

type TabsProps = {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
};

interface TabConfig {
  key: DashboardTab;
  label: string;
  icon: React.ReactNode;
  allowedRoles: string[];
}

interface TabSection {
  title: string;
  tabs: DashboardTab[];
  requiredRole?: string;
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, hasRole } = useAuth();

  // تكوين التبويبات
  const tabsConfig: TabConfig[] = [
    {
      key: "estate",
      label: "الإعلانات",
      icon: <Home className="w-4 h-4" />,
      allowedRoles: ["company"]
    },
    {
      key: "reservations",
      label: "الحجوزات",
      icon: <Calendar className="w-4 h-4" />,
      allowedRoles: ["company"]
    },
    {
      key: "offers",
      label: "العروض",
      icon: <DollarSign className="w-4 h-4" />,
      allowedRoles: ["company"]
    },

    {
      key: "map",
      label: "إنشاء QR",
      icon: <QrCode className="w-4 h-4" />,
      allowedRoles: ["company"]
    },
    {
      key: "users",
      label: "المستخدمين",
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ["admin"]
    },
    {
      key: "mainType",
      label: "التصنيفات الرئيسية",
      icon: <Building2 className="w-4 h-4" />,
      allowedRoles: ["admin"]
    },
    {
      key: "subType",
      label: "التصنيفات الفرعية",
      icon: <Layers className="w-4 h-4" />,
      allowedRoles: ["admin"]
    },
    {
      key: "finalType",
      label: "النوع النهائي",
      icon: <Grid3X3 className="w-4 h-4" />,
      allowedRoles: ["admin"]
    },
    {
      key: "city",
      label: "المحافظات",
      icon: <MapPin className="w-4 h-4" />,
      allowedRoles: ["admin"]
    },
    {
      key: "neighborhood",
      label: "المدن",
      icon: <Landmark className="w-4 h-4" />,
      allowedRoles: ["admin"]
    },
    {
      key: "finalCity",
      label: "المناطق",
      icon: <Landmark className="w-4 h-4" />,
      allowedRoles: ["admin"]
    }
  ];

  // تجميع التبويبات في أقسام
  const sections: TabSection[] = [
    {
      title: "الإدارة الأساسية",
      tabs: ["estate", "reservations", "offers", "analytics", "map"]

    },
    {
      title: "إدارة النظام",
      tabs: ["users"],
      requiredRole: "admin"
    },
    {
      title: "البيانات الأساسية",
      tabs: ["mainType", "subType", "finalType", "city", "neighborhood", "finalCity"],
      requiredRole: "admin"
    }
  ];

  // فلترة التبويبات حسب الدور
  const getVisibleTabs = (tabKeys: DashboardTab[]) => {
    return tabKeys
      .map(key => tabsConfig.find(tab => tab.key === key))
      .filter((tab): tab is TabConfig =>
        tab !== undefined && tab.allowedRoles.some(role => hasRole(role as any))
      );
  };

  const handleTabClick = (tabKey: DashboardTab) => {
    setActiveTab(tabKey);
    setSidebarOpen(false);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير النظام';
      case 'company': return 'شركة';
      default: return 'مستخدم';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'company': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="فتح القائمة"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed top-0 right-0 h-full bg-white border-l border-gray-200 z-50 transition-transform duration-300 ease-out",
          "w-72 flex flex-col",
          {
            "translate-x-0": isSidebarOpen,
            "translate-x-full": !isSidebarOpen,
            "md:translate-x-0": true,
          }
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">لوحة التحكم</h2>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">{user.fullName}</p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="p-4 space-y-6">
            {sections.map((section) => {
              // فحص الصلاحية للقسم
              if (section.requiredRole && !hasRole(section.requiredRole as any)) {
                return null;
              }

              const visibleTabs = getVisibleTabs(section.tabs);

              if (visibleTabs.length === 0) {
                return null;
              }

              return (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {visibleTabs.map((tab) => (
                      <TabButton
                        key={tab.key}
                        label={tab.label}
                        icon={tab.icon}
                        isActive={activeTab === tab.key}
                        onClick={() => handleTabClick(tab.key)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
          <div className="text-xs text-gray-500 text-center">
            عقارات عمان © {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* Desktop Spacer */}
      <div className="hidden md:block w-72 flex-shrink-0" />
    </>
  );
}

/**
 * Tab Button Component
 */
function TabButton({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        "hover:bg-gray-50 hover:translate-x-1",
        isActive
          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
          : "text-gray-700 hover:text-gray-900"
      )}
    >
      <div className={clsx(
        "flex-shrink-0 transition-colors",
        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
      )}>
        {icon}
      </div>

      <span className="flex-1 text-right truncate">
        {label}
      </span>

      <ChevronRight className={clsx(
        "w-4 h-4 transition-all duration-200 flex-shrink-0",
        isActive
          ? "text-blue-500 transform rotate-90"
          : "text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5"
      )} />
    </button>
  );
}