
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { User, BookOpen, MapPin, Globe, Edit3, LogOut, Hash } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const getProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    navigate('/signin');
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                }

                setProfile(data || {});
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, [navigate]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest"></div>
            </div>
        );
    }

    return (
        <div className="flex-grow bg-gray-50 dark:bg-dark-bg py-12 px-4 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in">

                    {/* Header / Cover */}
                    <div className="h-48 bg-gradient-to-r from-forest to-neon relative">
                        <div className="absolute top-4 right-4 flex gap-3">
                            <Link
                                to="/profile-setup"
                                className="px-4 py-2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                            >
                                <Edit3 size={18} /> Edit Profile
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 bg-red-500/20 backdrop-blur-md hover:bg-red-500/30 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                            >
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    </div>

                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-16 mb-6">
                            <div className="flex items-end">
                                <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-800 p-1.5 shadow-xl">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl text-gray-500">
                                            <User size={48} />
                                        </div>
                                    )}
                                </div>
                                <div className="ml-6 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile?.full_name || 'Student'}</h1>
                                    <p className="text-forest dark:text-neon font-medium">{profile?.role || 'Student'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Main Info */}
                            <div className="md:col-span-2 space-y-8">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">About Me</h2>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                        {profile?.bio || "No bio added yet. Click 'Edit Profile' to introduce yourself!"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                                <BookOpen size={20} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Branch & Semester</span>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {profile?.branch || 'N/A'} <span className="text-gray-400">•</span> Sem {profile?.semester || '?'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                                <Globe size={20} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Language</span>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {profile?.language || 'English'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                                <MapPin size={20} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</span>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {profile?.location || 'Not set'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                <Hash size={20} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">USN</span>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {profile?.usn || 'Not set'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Stats / Actions (Placeholder) */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Study Stats</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400 text-sm">Study Hours</span>
                                            <span className="font-bold text-forest dark:text-neon">12.5 hrs</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400 text-sm">Sessions</span>
                                            <span className="font-bold text-forest dark:text-neon">8</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                                            <div className="bg-forest dark:bg-neon h-2.5 rounded-full" style={{ width: '45%' }}></div>
                                        </div>
                                        <p className="text-xs text-center text-gray-500 mt-2">Level 3 Scholar</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
