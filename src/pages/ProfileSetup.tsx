
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { User, BookOpen, MapPin, Globe, CheckCircle, Camera, Loader2 } from 'lucide-react';

const ProfileSetup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        avatar_url: '',
        usn: '',
        role: 'Student',
        branch: 'CSE',
        semester: '1',
        language: 'English',
        mother_tongue: 'Kannada',
        location: '',
        gender: 'Male',
        bio: ''
    });

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);

                // Fetch existing profile data
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setFormData({
                        full_name: profile.full_name || user.user_metadata?.full_name || '',
                        avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || '',
                        usn: profile.usn || '',
                        role: profile.role || 'Student',
                        branch: profile.branch || 'CSE',
                        semester: profile.semester || '1',
                        language: profile.language || 'English',
                        mother_tongue: profile.mother_tongue || 'Kannada',
                        location: profile.location || '',
                        gender: profile.gender || 'Male',
                        bio: profile.bio || ''
                    });
                } else {
                    setFormData(prev => ({
                        ...prev,
                        full_name: user.user_metadata?.full_name || '',
                        avatar_url: user.user_metadata?.avatar_url || '',
                    }));
                }
            } else {
                navigate('/signin');
            }
        };
        getUser();
    }, [navigate]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            setUploading(true);

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Update auth metadata (optional, but good for quick access)
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    ...formData,
                    onboarded: true
                }
            });

            if (authError) throw authError;

            // Save to the 'profiles' table
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...formData,
                    updated_at: new Date().toISOString(),
                });

            if (profileError) throw profileError;

            navigate('/profile');
        } catch (error: any) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-grow bg-gray-50 dark:bg-dark-bg py-12 px-4 transition-colors duration-300">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in">
                <div className="bg-forest p-6 text-white text-center">
                    <h1 className="text-2xl font-bold">Complete Your Profile</h1>
                    <p className="opacity-90 mt-2">Let others know a bit about you!</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex justify-center -mt-16 mb-6 relative group">
                        <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-700 p-1 shadow-lg relative overflow-hidden">
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-4xl">
                                    🎓
                                </div>
                            )}

                            <label
                                htmlFor="avatar-upload"
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                            >
                                {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" size={24} />}
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest outline-none dark:text-white"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">USN</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="usn"
                                    value={formData.usn}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest outline-none dark:text-white"
                                    placeholder="1MV22CS001"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest outline-none dark:text-white"
                            >
                                <option value="Student">Student</option>
                                <option value="Teacher">Teacher</option>
                                <option value="Mentor">Mentor</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest outline-none dark:text-white appearance-none"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch / Department</label>
                            <div className="relative">
                                <BookOpen className="absolute left-3 top-3 text-gray-400" size={18} />
                                <select
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest outline-none dark:text-white"
                                >
                                    <option value="CSE">Computer Science (CSE)</option>
                                    <option value="ISE">Information Science (ISE)</option>
                                    <option value="ECE">Electronics (ECE)</option>
                                    <option value="ME">Mechanical (ME)</option>
                                    <option value="CV">Civil (CV)</option>
                                    <option value="AI">AI & ML</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Semester</label>
                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest outline-none dark:text-white"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                    <option key={sem} value={sem}>Semester {sem}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Language (for study)</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 text-gray-400" size={18} />
                                <select
                                    name="language"
                                    value={formData.language}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest outline-none dark:text-white appearance-none"
                                >
                                    <option value="English">English</option>
                                    <option value="Kannada">Kannada</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Tamil">Tamil</option>
                                    <option value="Telugu">Telugu</option>
                                    <option value="Malayalam">Malayalam</option>
                                    <option value="Marathi">Marathi</option>
                                    <option value="Bengali">Bengali</option>
                                    <option value="Punjabi">Punjabi</option>
                                    <option value="Gujarati">Gujarati</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mother Tongue</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <select
                                    name="mother_tongue"
                                    value={formData.mother_tongue}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest outline-none dark:text-white appearance-none"
                                >
                                    <option value="Kannada">Kannada</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Tamil">Tamil</option>
                                    <option value="Telugu">Telugu</option>
                                    <option value="Malayalam">Malayalam</option>
                                    <option value="Marathi">Marathi</option>
                                    <option value="Bengali">Bengali</option>
                                    <option value="Punjabi">Punjabi</option>
                                    <option value="Gujarati">Gujarati</option>
                                    <option value="Urdu">Urdu</option>
                                    <option value="Odia">Odia</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location (City)</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                                <select
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest outline-none dark:text-white appearance-none"
                                >
                                    <option value="">Select City</option>
                                    <option value="Bangalore">Bangalore</option>
                                    <option value="Mysore">Mysore</option>
                                    <option value="Mangalore">Mangalore</option>
                                    <option value="Hubli">Hubli</option>
                                    <option value="Belgaum">Belgaum</option>
                                    <option value="Davangere">Davangere</option>
                                    <option value="Shimoga">Shimoga</option>
                                    <option value="Tumkur">Tumkur</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest outline-none dark:text-white resize-none"
                            placeholder="Tell us a bit about your study goals..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-forest text-white rounded-lg hover:bg-green-700 transition-colors font-bold shadow-lg shadow-green-200 dark:shadow-green-900/20 flex items-center justify-center gap-2 transform active:scale-95 duration-200"
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <CheckCircle size={20} />
                                Save Profile
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;
