import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Lock, FileText, ChevronRight, Loader2, Languages, Laptop } from 'lucide-react';

const CreateGroup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        mother_tongue: 'English',
        subject_code: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.mother_tongue) {
                setFormData(prev => ({ ...prev, mother_tongue: parsedUser.mother_tongue }));
            }
        } else {
            navigate('/signin');
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_URL}/api/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    type: 'private',
                    creator_id: user.id || user._id, // Support whichever format we saved in localStorage
                    mother_tongue: formData.mother_tongue,
                    subject_code: formData.subject_code || ''
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to create group');
            }

            // Immediately navigate after creation
            navigate('/find-groups');
        } catch (error: any) {
            alert('Error creating group: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-grow bg-gray-50 dark:bg-dark-bg py-12 px-4 transition-colors duration-300">
            <div className="max-w-xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in">
                    <div className="bg-forest p-8 text-white relative h-40 flex flex-col justify-end">
                        <div className="absolute top-8 right-8 text-white/20">
                            <Users size={80} />
                        </div>
                        <h1 className="text-3xl font-bold">Start a New Circle</h1>
                        <p className="text-white/80 mt-1">Create a safe space for your study squad.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <Users size={16} className="text-forest" /> Group Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-transparent focus:border-forest outline-none transition-all dark:text-white focus:ring-2 focus:ring-forest/20"
                                    placeholder="e.g. Quiet Logic Solvers"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <FileText size={16} className="text-forest" /> Description
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-transparent focus:border-forest outline-none transition-all dark:text-white focus:ring-2 focus:ring-forest/20 resize-none"
                                    rows={3}
                                    placeholder="What's this group about? (introvert-friendly, deep focus, etc.)"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <Languages size={16} className="text-forest" /> Primary Language
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-transparent focus:border-forest outline-none transition-all dark:text-white focus:ring-2 focus:ring-forest/20 appearance-none"
                                        value={formData.mother_tongue}
                                        onChange={e => setFormData({ ...formData, mother_tongue: e.target.value })}
                                    >
                                        <option value="Kannada">Kannada</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Tamil">Tamil</option>
                                        <option value="Telugu">Telugu</option>
                                        <option value="Malayalam">Malayalam</option>
                                        <option value="Marathi">Marathi</option>
                                        <option value="English">English</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <Laptop size={16} className="text-forest" /> Subject (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-transparent focus:border-forest outline-none transition-all dark:text-white focus:ring-2 focus:ring-forest/20"
                                        placeholder="e.g. 21CS31"
                                        value={formData.subject_code}
                                        onChange={e => setFormData({ ...formData, subject_code: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-forest text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-green-200 dark:shadow-green-900/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : <>Create Group <ChevronRight size={20} /></>}
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1 italic">
                                <Lock size={12} /> Privacy: You will need to approve all join requests manually.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateGroup;
