import { useState, useEffect } from 'react';
import { vtuBranches, vtuSemesters, vtuSubjects } from '../data/vtuData';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Lock, MessageSquare, Plus, Globe, Languages } from 'lucide-react';

const FindGroups = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'universal' | 'private'>('universal');
    const [selectedBranch, setSelectedBranch] = useState('CSE');
    const [selectedSem, setSelectedSem] = useState(3);
    const [displaySubjects, setDisplaySubjects] = useState<{ code: string; name: string, spots: number }[]>([]);
    const [privateGroups, setPrivateGroups] = useState<any[]>([]);

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [joinedGroups, setJoinedGroups] = useState<string[]>([]);
    const [requestedGroups, setRequestedGroups] = useState<string[]>([]);
    const [joining, setJoining] = useState<string | null>(null);

    // Fetch User and Memberships
    useEffect(() => {
        const fetchUserAndGroups = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch Profile
                const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(prof);

                // Fetch Memberships
                const { data: memberships } = await supabase
                    .from('study_group_members')
                    .select('group_id')
                    .eq('user_id', user.id);

                if (memberships) {
                    setJoinedGroups(memberships.map(m => m.group_id));
                }

                // Fetch Requests
                const { data: reqs } = await supabase
                    .from('group_requests')
                    .select('group_id')
                    .eq('user_id', user.id)
                    .eq('status', 'pending');

                if (reqs) {
                    setRequestedGroups(reqs.map(r => r.group_id));
                }
            }
        };
        fetchUserAndGroups();
    }, []);

    useEffect(() => {
        if (view === 'universal') {
            const branchData = vtuSubjects[selectedBranch];
            if (branchData) {
                const semSubjects = branchData[selectedSem] || [];
                const subjectsWithSpots = semSubjects.map(sub => ({
                    ...sub,
                    spots: Math.floor(Math.random() * 5) + 1
                }));
                setDisplaySubjects(subjectsWithSpots);
            } else {
                setDisplaySubjects([]);
            }
        } else {
            fetchPrivateGroups();
        }
    }, [selectedBranch, selectedSem, view]);

    const fetchPrivateGroups = async () => {
        const { data } = await supabase
            .from('groups')
            .select('*, profiles(full_name, avatar_url, mother_tongue)')
            .eq('type', 'private');

        if (data) {
            // Sort by mother tongue match
            const sorted = [...data].sort((a, b) => {
                if (profile?.mother_tongue) {
                    const matchA = a.mother_tongue === profile.mother_tongue ? 1 : 0;
                    const matchB = b.mother_tongue === profile.mother_tongue ? 1 : 0;
                    return matchB - matchA;
                }
                return 0;
            });
            setPrivateGroups(sorted);
        }
    };

    const handleJoinUniversal = async (subject: { code: string; name: string }) => {
        if (!user) {
            navigate('/signin');
            return;
        }

        setJoining(subject.code);

        try {
            // 1. Ensure the universal group exists in 'groups' table
            let { data: group } = await supabase
                .from('groups')
                .select('id')
                .eq('subject_code', subject.code)
                .eq('type', 'universal')
                .single();

            if (!group) {
                const { data: newGroup, error: createError } = await supabase
                    .from('groups')
                    .insert({
                        name: subject.name,
                        subject_code: subject.code,
                        type: 'universal',
                        description: `Official doubt solving group for ${subject.name}`
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                group = newGroup;
            }

            if (group) {
                // 2. Add member
                const { error } = await supabase
                    .from('study_group_members')
                    .insert({
                        group_id: group.id,
                        user_id: user.id
                    });

                if (error && !error.message.includes('unique')) throw error;

                setJoinedGroups(prev => [...prev, group.id]);
                navigate(`/chat/${group.id}`);
            }
        } catch (error: any) {
            console.error('Error joining group:', error);
            alert('Failed to join group: ' + error.message);
        } finally {
            setJoining(null);
        }
    };

    const handleRequestPrivate = async (groupId: string) => {
        if (!user) {
            navigate('/signin');
            return;
        }

        setJoining(groupId);

        try {
            const { error } = await supabase
                .from('group_requests')
                .insert({
                    group_id: groupId,
                    user_id: user.id,
                    status: 'pending'
                });

            if (error) throw error;

            setRequestedGroups(prev => [...prev, groupId]);
        } catch (error: any) {
            console.error('Error requesting access:', error);
            alert('Failed to request access: ' + error.message);
        } finally {
            setJoining(null);
        }
    };

    return (
        <div className="flex-grow bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-dark dark:text-white">
                            Study Communities
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Connect with peers who share your goals and language.</p>
                    </div>

                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => setView('universal')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'universal' ? 'bg-forest text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            <Globe size={18} /> Universal Doubt Groups
                        </button>
                        <button
                            onClick={() => setView('private')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'private' ? 'bg-forest text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            <Lock size={18} /> Private Study Circles
                        </button>
                    </div>
                </div>

                {/* Filters (Only for Universal) */}
                {view === 'universal' && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
                        <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">Select Your Semester</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-dark dark:text-white focus:ring-2 focus:ring-forest outline-none transition-all"
                                >
                                    {vtuBranches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.name} ({branch.id})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
                                <select
                                    value={selectedSem}
                                    onChange={(e) => setSelectedSem(Number(e.target.value))}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-dark dark:text-white focus:ring-2 focus:ring-forest outline-none transition-all"
                                >
                                    {vtuSemesters.map(sem => (
                                        <option key={sem} value={sem}>{sem} Semester</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Header for Private Groups */}
                {view === 'private' && (
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2 text-forest dark:text-neon">
                            <Languages size={20} />
                            <span className="font-medium">Showing groups matching {profile?.mother_tongue || 'your language'}</span>
                        </div>
                        <button
                            onClick={() => navigate('/create-group')}
                            className="bg-forest text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-200 dark:shadow-none"
                        >
                            <Plus size={18} /> Create Your Own Group
                        </button>
                    </div>
                )}

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {view === 'universal' ? (
                        displaySubjects.map((subject, i) => {
                            const isProcessing = joining === subject.code;

                            return (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-forest/10 dark:bg-forest/20 text-forest dark:text-neon px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Universal Doubt Solver</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-dark dark:text-gray-100 mb-2 truncate">{subject.code}: {subject.name}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2">
                                        Open community for {subject.name} doubt solving, resource sharing and peer support.
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map((a) => (
                                                <div key={a} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800" />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => handleJoinUniversal(subject)}
                                            disabled={isProcessing}
                                            className="bg-forest text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <>Enter Group <MessageSquare size={16} /></>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        privateGroups.length > 0 ? (
                            privateGroups.map((group, i) => {
                                const isJoined = joinedGroups.includes(group.id);
                                const isRequested = requestedGroups.includes(group.id);
                                const isProcessing = joining === group.id;
                                const isMatch = group.mother_tongue === profile?.mother_tongue;

                                return (
                                    <div key={i} className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border ${isMatch ? 'border-forest ring-1 ring-forest/20' : 'border-gray-100 dark:border-gray-700'} hover:shadow-xl transition-all`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isMatch ? 'bg-forest text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                                {group.mother_tongue} Circle
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-dark dark:text-gray-100 mb-1">{group.name}</h3>
                                        <p className="text-gray-400 text-xs mb-3 flex items-center gap-1">Led by <span className="text-forest font-medium">{group.profiles?.full_name}</span></p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2">
                                            {group.description || "A cozy quiet study space for focused learning."}
                                        </p>
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-gray-400" />
                                                <span className="text-xs font-bold text-gray-400">Private</span>
                                            </div>
                                            <button
                                                onClick={() => !isJoined && !isRequested && handleRequestPrivate(group.id)}
                                                disabled={isJoined || isRequested || isProcessing}
                                                className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isJoined ? 'bg-forest/10 text-forest cursor-default' :
                                                    isRequested ? 'bg-amber-50 text-amber-600 cursor-default border border-amber-200' :
                                                        'bg-dark text-white hover:bg-black transform active:scale-95 shadow-lg shadow-gray-200'
                                                    }`}
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> :
                                                    isJoined ? 'Joined ✔' :
                                                        isRequested ? 'Pending...' :
                                                            'Request Access'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <Users className="mx-auto text-gray-300 mb-4" size={48} />
                                <h3 className="text-xl font-bold text-dark dark:text-white mb-2">No Private Circles Yet</h3>
                                <p className="text-gray-500 mb-6">Be the first to start a cozy study space for your language!</p>
                                <button
                                    onClick={() => navigate('/create-group')}
                                    className="bg-forest text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-green-200 flex items-center gap-2 mx-auto"
                                >
                                    <Plus size={20} /> Create Group
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default FindGroups;
