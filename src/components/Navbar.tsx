import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Navbar = () => {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        // Check initial session
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setIsProfileMenuOpen(false);
    };

    const navLinks = [
        { name: 'Find Groups', path: '/find-groups' },
        { name: 'Resources', path: '/resources' },
        { name: 'Schedule', path: '/schedule' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest to-neon flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                            S
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-forest to-neon dark:from-neon dark:to-forest">
                            StudySync AI
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-colors hover:text-forest dark:hover:text-neon ${isActive(link.path)
                                    ? 'text-forest dark:text-neon font-bold'
                                    : 'text-gray-600 dark:text-gray-300'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                            aria-label="Toggle Dark Mode"
                        >
                            {darkMode ? <Sun size={20} className="text-neon" /> : <Moon size={20} className="text-forest" />}
                        </button>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-transparent hover:border-forest transition-all">
                                        {user.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                <UserIcon size={20} />
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 animate-fade-in">
                                        <Link
                                            to="/profile-setup"
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            My Profile
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/signin"
                                className="px-4 py-2 rounded-lg bg-forest text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-200 dark:shadow-green-900/20 font-medium"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                        >
                            {darkMode ? <Sun size={20} className="text-neon" /> : <Moon size={20} className="text-forest" />}
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-600 dark:text-gray-300 hover:text-forest dark:hover:text-neon transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 animate-fade-in">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.path)
                                    ? 'bg-green-50 dark:bg-green-900/20 text-forest dark:text-neon'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-4">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            {user.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <UserIcon size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-gray-900 dark:text-white font-medium">{user.user_metadata?.full_name || 'User'}</span>
                                    </div>
                                    <Link
                                        to="/profile-setup"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block w-full text-center px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 mb-2"
                                    >
                                        Edit Profile
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="block w-full text-center px-4 py-3 rounded-lg bg-red-50 text-red-600 font-medium"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/signin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center px-4 py-3 rounded-lg bg-forest text-white hover:bg-green-700 transition-colors font-bold shadow-md"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
