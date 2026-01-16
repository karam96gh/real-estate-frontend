import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, MapPin, Heart, User, Settings, LogOut, LogIn, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<any>(null);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const { user, isLoggedIn, logout, canAccessDashboard } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Load favorite count from localStorage
    useEffect(() => {
        const loadFavoriteCount = () => {
            const stored = localStorage.getItem('favorites');
            const parsedFavorites = stored ? JSON.parse(stored) : [];
            setFavoriteCount(parsedFavorites.length);
        };

        loadFavoriteCount();

        window.addEventListener('storage', loadFavoriteCount);

        return () => {
            window.removeEventListener('storage', loadFavoriteCount);
        };
    }, []);

    const navigationItems = [
        {
            name: 'الرئيسية',
            path: '/'
        },
        {
            name: 'الإعلانات',
            path: '/properties',
            dropdownItems: [
                { name: 'جميع الإعلانات', path: '/properties' },
                { name: 'الفلل', path: '/properties' },
                { name: 'الشقق', path: '/properties' },
                { name: 'الأراضي', path: '/properties' }
            ]
        },
        {
            name: 'من نحن',
            path: '/'
        },
        {
            name: 'اتصل بنا',
            path: '/'
        }
    ];

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
    };

    return (
        <>
            {/* Top Bar */}
            <div className={`hidden md:block transition-all duration-300 ${isScrolled ? 'h-0 opacity-0' : 'h-10 opacity-100'
                }`}>
                <div className="bg-gray-900 text-white">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center justify-between h-10">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>مسقط، عمان</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed w-full z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white shadow-lg py-4'
                    : 'bg-transparent py-6'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`text-2xl font-bold transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'
                                    }`}
                            >
                                عقارات عمان
                            </motion.div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8 space-x-reverse">
                            {navigationItems.map((item) => (
                                <div
                                    key={item.name}
                                    className="relative"
                                    onMouseEnter={() => setActiveDropdown(item.name)}
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    <motion.div
                                        className="flex items-center gap-1 cursor-pointer"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Link
                                            href={item.path}
                                            className={`${isScrolled ? 'text-gray-800' : 'text-white'
                                                } hover:text-blue-500 transition-colors font-medium`}
                                        >
                                            {item.name}
                                        </Link>
                                        {item.dropdownItems && (
                                            <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''
                                                } ${isScrolled ? 'text-gray-800' : 'text-white'
                                                }`} />
                                        )}
                                    </motion.div>

                                    {/* Dropdown Menu */}
                                    {item.dropdownItems && (
                                        <AnimatePresence>
                                            {activeDropdown === item.name && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-gray-100"
                                                >
                                                    {item.dropdownItems.map((dropdownItem) => (
                                                        <Link
                                                            key={dropdownItem.name}
                                                            href={dropdownItem.path}
                                                            className="block px-4 py-2 text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                        >
                                                            {dropdownItem.name}
                                                        </Link>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            {/* Favorites Button */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative"
                            >
                                <Link href="/favorites" className="flex items-center">
                                    <Heart
                                        className={`w-6 h-6 ${isScrolled ? 'text-gray-800' : 'text-white'} hover:text-red-500 transition-colors`}
                                    />
                                    {/* Favorites Count Badge */}
                                    {favoriteCount > 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 font-medium"
                                        >
                                            {favoriteCount}
                                        </motion.div>
                                    )}
                                </Link>
                            </motion.div>

                            {/* User Menu or Auth Buttons */}
                            {isLoggedIn ? (
                                <div className="relative">
                                    {/* User Menu Trigger */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${isScrolled
                                            ? 'text-gray-800 hover:bg-gray-100'
                                            : 'text-white hover:bg-white/10'}`}
                                    >
                                        <User className="w-5 h-5" />
                                        <span className="hidden md:block font-medium">{user?.fullName}</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                    </motion.button>

                                    {/* User Dropdown Menu */}
                                    <AnimatePresence>
                                        {showUserMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg py-2 border border-gray-100"
                                            >
                                                {/* User Info */}
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <p className="font-medium text-gray-900">{user?.fullName}</p>
                                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                                    <div className="mt-1">
                                                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${user?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                                user?.role === 'company' ? 'bg-blue-100 text-blue-800' :
                                                                    user?.role === 'user_vip' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {user?.role === 'admin' ? 'مدير' :
                                                                user?.role === 'company' ? 'شركة' :
                                                                    user?.role === 'user_vip' ? 'مستخدم VIP' : 'مستخدم'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="py-1">
                                                    {canAccessDashboard() && (
                                                        <Link
                                                            href="/dashboard"
                                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                            onClick={() => setShowUserMenu(false)}
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                            لوحة التحكم
                                                        </Link>
                                                    )}

                                                    <Link
                                                        href="/my-reservations"
                                                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                        onClick={() => setShowUserMenu(false)}
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                        حجوزاتي
                                                    </Link>

                                                    <Link
                                                        href="/my-offers"
                                                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                                                        onClick={() => setShowUserMenu(false)}
                                                    >
                                                        <DollarSign className="w-4 h-4" />
                                                        عروضي
                                                    </Link>

                                                    <Link
                                                        href="/profile"
                                                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                        onClick={() => setShowUserMenu(false)}
                                                    >
                                                        <User className="w-4 h-4" />
                                                        الملف الشخصي
                                                    </Link>

                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        تسجيل الخروج
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {/* Login Button */}
                                    <Link href="/auth/login">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium ${isScrolled
                                                ? 'text-gray-800 hover:bg-gray-100'
                                                : 'text-white hover:bg-white/10'}`}
                                        >
                                            <LogIn className="w-4 h-4" />
                                            <span className="hidden sm:block">تسجيل الدخول</span>
                                        </motion.button>
                                    </Link>

                                    {/* Start Now Button */}
                                    <Link href="/auth/register">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 font-medium"
                                        >
                                            ابدأ الآن
                                        </motion.button>
                                    </Link>
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg border border-gray-200 bg-white/10 backdrop-blur-sm"
                            >
                                {isMobileMenuOpen ? (
                                    <X className={`w-6 h-6 ${isScrolled ? 'text-gray-900' : 'text-white'}`} />
                                ) : (
                                    <Menu className={`w-6 h-6 ${isScrolled ? 'text-gray-900' : 'text-white'}`} />
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-gray-100 mt-4"
                        >
                            <div className="max-w-7xl mx-auto px-4 py-4">
                                {/* User Info - Mobile */}
                                {isLoggedIn && (
                                    <div className="py-3 border-b border-gray-100 mb-4">
                                        <p className="font-medium text-gray-900">{user?.fullName}</p>
                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                        <div className="mt-2 flex gap-2">
                                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${user?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    user?.role === 'company' ? 'bg-blue-100 text-blue-800' :
                                                        user?.role === 'user_vip' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user?.role === 'admin' ? 'مدير' :
                                                    user?.role === 'company' ? 'شركة' :
                                                        user?.role === 'user_vip' ? 'مستخدم VIP' : 'مستخدم'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Dashboard Link - Mobile */}
                                {isLoggedIn && canAccessDashboard() && (
                                    <div className="py-2">
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors font-medium"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <Settings className="w-5 h-5" />
                                            لوحة التحكم
                                        </Link>
                                    </div>
                                )}

                                {/* My Reservations Mobile Link */}
                                <div className="py-2">
                                    <Link
                                        href="/my-reservations"
                                        className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors font-medium"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Calendar className="w-5 h-5" />
                                        حجوزاتي
                                    </Link>
                                </div>

                                {/* My Offers Mobile Link */}
                                <div className="py-2">
                                    <Link
                                        href="/my-offers"
                                        className="flex items-center gap-3 text-green-600 hover:text-green-700 transition-colors font-medium"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <DollarSign className="w-5 h-5" />
                                        عروضي
                                    </Link>
                                </div>

                                {/* Favorites Mobile Link */}
                                <div className="py-2">
                                    <Link
                                        href="/favorites"
                                        className="flex items-center justify-between text-gray-900 hover:text-red-500 transition-colors font-medium"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <span>المفضلة</span>
                                        <div className="relative">
                                            <Heart className="w-5 h-5" />
                                            {favoriteCount > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 font-medium">
                                                    {favoriteCount}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </div>

                                {/* Regular Nav Items */}
                                {navigationItems.map((item) => (
                                    <div key={item.name} className="py-2">
                                        <Link
                                            href={item.path}
                                            className="block text-gray-900 hover:text-blue-600 transition-colors font-medium"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {item.name}
                                        </Link>
                                        {item.dropdownItems && (
                                            <div className="pr-4 mt-2 space-y-2">
                                                {item.dropdownItems.map((dropdownItem) => (
                                                    <Link
                                                        key={dropdownItem.name}
                                                        href={dropdownItem.path}
                                                        className="block text-gray-600 hover:text-blue-600 transition-colors"
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                    >
                                                        {dropdownItem.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Auth Buttons - Mobile */}
                                {!isLoggedIn && (
                                    <div className="mt-4 space-y-2">
                                        <Link href="/auth/login">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <LogIn className="w-4 h-4" />
                                                تسجيل الدخول
                                            </motion.button>
                                        </Link>
                                        <Link href="/auth/register">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 font-medium"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                ابدأ الآن
                                            </motion.button>
                                        </Link>
                                    </div>
                                )}

                                {/* Logout Button - Mobile */}
                                {isLoggedIn && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                handleLogout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl transition-colors font-medium"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            تسجيل الخروج
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </>
    );
}
