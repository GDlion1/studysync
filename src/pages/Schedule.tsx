import React, { useState, useEffect, useRef } from 'react';
import { vtuBranches, vtuSemesters, vtuSubjects } from '../data/vtuData';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
    Calendar as CalendarIcon,
    Plus,
    Clock,
    Coffee,
    MessageCircle,
    Lock,
    Loader2,
    Check,
    X,
    Bell,
    Play,
    Pause,
    RotateCcw,
    Zap,
    ExternalLink,
    Volume2
} from 'lucide-react';

const Schedule = () => {
    const navigate = useNavigate();
    const [selectedBranch, setSelectedBranch] = useState('CSE');
    const [selectedSem, setSelectedSem] = useState(3);
    const [sessions, setSessions] = useState<any[]>([]);
    const [suggestedSessions, setSuggestedSessions] = useState<any[]>([]);
    const [userGroups, setUserGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    // Pomodoro Timer State
    const [timerRunning, setTimerRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
    const timerRef = useRef<any>(null);

    // Modal & Toast State
    const [showModal, setShowModal] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [activeNotification, setActiveNotification] = useState<any>(null);
    const [newSession, setNewSession] = useState({
        title: '',
        group_id: '',
        date: '',
        start_time: '',
        end_time: '',
        session_type: 'discussion'
    });

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(prof);
                if (prof) {
                    setSelectedBranch(prof.branch || 'CSE');
                    setSelectedSem(prof.semester || 3);
                }
                fetchGroups(user.id);
                fetchSessions();
            }
        };
        init();

        // Simulate a "Lurker-Friendly" notification after 5 seconds
        const timer = setTimeout(() => {
            setActiveNotification({
                title: "Starting Soon!",
                message: "3 people are currently in the 'Quiet Focus' room. Care to join?",
                action: "Join Quietly"
            });
            setShowNotification(true);
        }, 5000);

        return () => {
            clearTimeout(timer);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Pomodoro Logic
    useEffect(() => {
        if (timerRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setTimerRunning(false);
                        const nextMode = timerMode === 'work' ? 'break' : 'work';
                        setTimerMode(nextMode);
                        return nextMode === 'work' ? 25 * 60 : 5 * 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [timerRunning, timerMode]);

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const toggleTimer = () => setTimerRunning(!timerRunning);
    const resetTimer = () => {
        setTimerRunning(false);
        setTimeLeft(timerMode === 'work' ? 25 * 60 : 5 * 60);
    };

    const fetchGroups = async (userId: string) => {
        const { data } = await supabase
            .from('study_group_members')
            .select('group_id, groups(id, name, type)')
            .eq('user_id', userId);
        if (data) {
            setUserGroups(data.map(d => d.groups));
        }
    };

    const fetchSessions = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('study_sessions')
            .select('*, groups(name, type, subject_code)')
            .order('start_time', { ascending: true });

        if (data) {
            const userBranchSubjects = vtuSubjects[selectedBranch]?.[selectedSem] || [];
            const userSubjectCodes = userBranchSubjects.map(s => s.code);

            // Filter your sessions vs suggestions
            const userSessions = data.filter(s => s.groups && userGroups.some(ug => ug.id === s.group_id));
            const suggestions = data.filter(s => !userSessions.includes(s) && (
                !s.group_id || userSubjectCodes.includes(s.groups?.subject_code)
            ));

            setSessions(userSessions);
            setSuggestedSessions(suggestions);
        }
        setLoading(false);
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const startStr = `${newSession.date}T${newSession.start_time}:00`;
            const endStr = `${newSession.date}T${newSession.end_time}:00`;

            const { error } = await supabase
                .from('study_sessions')
                .insert({
                    title: newSession.title,
                    group_id: newSession.group_id || null,
                    start_time: startStr,
                    end_time: endStr,
                    session_type: newSession.session_type,
                    created_by: user.id
                });

            if (error) throw error;

            setShowModal(false);
            fetchSessions();
        } catch (error: any) {
            alert('Error creating session: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timeStr: string) => {
        return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
            day: date.getDate()
        };
    };

    return (
        <div className="flex-grow bg-gray-50 dark:bg-dark-bg transition-colors duration-300 relative">
            {/* Real-time Notification Pop-up (Lurker Friendly) */}
            {showNotification && activeNotification && (
                <div className="fixed bottom-8 right-8 z-[100] animate-bounce-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-l-4 border-forest p-6 max-w-sm flex gap-4 ring-1 ring-black/5">
                        <div className="bg-forest/10 p-3 rounded-full h-fit">
                            <Zap className="text-forest" size={24} />
                        </div>
                        <div>
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-dark dark:text-white">{activeNotification.title}</h4>
                                <button onClick={() => setShowNotification(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{activeNotification.message}</p>
                            <button className="text-xs font-bold text-forest underline hover:text-green-700 transition-colors uppercase tracking-widest flex items-center gap-1">
                                {activeNotification.action} <ExternalLink size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-5xl font-black text-dark dark:text-white tracking-tighter flex items-center gap-4">
                            Schedules <span className="text-forest font-light">&</span> Focus
                        </h1>
                        <p className="text-gray-400 mt-2 font-medium">Sync your studies, master your time.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-1">
                            <button className="px-4 py-2 bg-forest/10 text-forest rounded-xl font-bold text-sm">Dashboard</button>
                            <button className="px-4 py-2 text-gray-400 hover:text-forest transition-colors font-bold text-sm">History</button>
                        </div>
                        <button className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-forest transition-all shadow-sm">
                            <Volume2 size={24} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Sessions & Suggestions */}
                    <div className="lg:col-span-8 space-y-12">

                        {/* Your Timeline */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl md:text-2xl font-black text-dark dark:text-white flex items-center gap-3">
                                    <Clock className="text-forest" /> Your Sessions
                                </h2>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="p-2 bg-forest text-white rounded-lg hover:rotate-90 transition-all shadow-lg"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            {loading && sessions.length === 0 ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="animate-spin text-forest" size={32} />
                                </div>
                            ) : sessions.length > 0 ? (
                                <div className="space-y-4">
                                    {sessions.slice(0, 3).map((session, i) => {
                                        const date = formatDate(session.start_time);
                                        const isQuiet = session.session_type === 'quiet_focus';

                                        return (
                                            <div key={i} className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 p-6 rounded-3xl bg-white dark:bg-gray-800 border-2 transition-all hover:scale-[1.01] ${isQuiet ? 'border-indigo-100 dark:border-indigo-900/30' : 'border-transparent shadow-sm'}`}>
                                                <div className="text-center min-w-[70px] p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600 w-full sm:w-auto">
                                                    <div className="text-[10px] font-black text-forest dark:text-neon tracking-widest mb-1">{date.month}</div>
                                                    <div className="text-2xl md:text-3xl font-black text-dark dark:text-white leading-none">{date.day}</div>
                                                </div>

                                                <div className="flex-grow w-full">
                                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                                        {isQuiet ? (
                                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
                                                                <Coffee size={12} /> Quiet Focus
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
                                                                <MessageCircle size={12} /> Live Discussion
                                                            </span>
                                                        )}
                                                        <span className="text-xs font-bold text-gray-300 dark:text-gray-600 px-2 border-l border-gray-100 dark:border-gray-700">
                                                            {session.groups?.name || 'Personal'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg md:text-xl font-bold text-dark dark:text-white mb-2">{session.title}</h3>
                                                    <div className="flex items-center gap-4 text-xs md:text-sm text-gray-400 font-medium">
                                                        <span className="flex items-center gap-1.5"><Clock size={16} /> {formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => session.group_id && navigate(`/chat/${session.group_id}`)}
                                                    className="w-full sm:w-auto px-8 py-4 text-sm font-black text-forest dark:text-neon bg-forest/5 dark:bg-forest/10 rounded-2xl hover:bg-forest hover:text-white transition-all transform active:scale-95 shadow-lg shadow-forest/10"
                                                >
                                                    Enter
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700">
                                    <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Bell className="text-gray-200 dark:text-gray-600" size={32} />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-dark dark:text-white mb-2">Nothing Planned?</h3>
                                    <p className="text-gray-400 mb-8 max-w-xs mx-auto text-sm">Click the plus icon to schedule your first session or explore suggestions.</p>
                                </div>
                            )}
                        </section>

                        {/* Automatic Recommendations */}
                        <section className="bg-forest/[0.03] dark:bg-forest/[0.05] p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-forest/5">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-dark dark:text-white flex items-center gap-3">
                                        <Zap className="text-yellow-500" /> Recommended
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">Based on {selectedBranch} S{selectedSem}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {suggestedSessions.length > 0 ? (
                                    suggestedSessions.slice(0, 4).map((session, i) => (
                                        <div key={i} className="bg-white dark:bg-gray-800/80 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-forest/20 group cursor-pointer">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-xl text-[10px] font-black text-gray-400 group-hover:bg-forest group-hover:text-white transition-colors">
                                                    {session.groups?.subject_code || 'GEN'}
                                                </div>
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map(j => (
                                                        <div key={j} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200" />
                                                    ))}
                                                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-forest text-[8px] flex items-center justify-center font-bold text-white">+5</div>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-dark dark:text-white mb-1 line-clamp-1">{session.title}</h4>
                                            <p className="text-xs text-gray-400 mb-4">{formatTime(session.start_time)} Today</p>
                                            <button className="w-full py-2.5 rounded-xl border border-forest/30 text-forest text-xs font-black hover:bg-forest hover:text-white transition-all">Join Signal</button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-8 text-center text-gray-400 text-sm italic">
                                        Searching for potential study matches...
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Pomodoro & Filters */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Focus Master 2000 (Pomodoro) */}
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                <RotateCcw size={180} />
                            </div>

                            <div className="relative z-10 text-center">
                                <div className="flex items-center justify-center gap-2 mb-8">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest ${timerMode === 'work' ? 'bg-white text-indigo-600' : 'bg-green-400 text-white'}`}>
                                        {timerMode === 'work' ? 'Stay Focused' : 'Break Time'}
                                    </span>
                                </div>

                                <div className="text-5xl md:text-7xl font-black mb-8 tracking-tighter drop-shadow-2xl">
                                    {formatTimer(timeLeft)}
                                </div>

                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={toggleTimer}
                                        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl"
                                    >
                                        {timerRunning ? <Pause size={24} /> : <Play size={24} className="translate-x-0.5" />}
                                    </button>
                                    <button
                                        onClick={resetTimer}
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Subject Filter (Quick View) */}
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg md:text-xl font-black text-dark dark:text-white mb-6">Course Context</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Branch</label>
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl outline-none font-bold text-dark dark:text-white border-none focus:ring-2 focus:ring-forest transition-all"
                                    >
                                        {vtuBranches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Semester</label>
                                    <select
                                        value={selectedSem}
                                        onChange={(e) => setSelectedSem(Number(e.target.value))}
                                        className="w-full bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl outline-none font-bold text-dark dark:text-white border-none focus:ring-2 focus:ring-forest transition-all"
                                    >
                                        {vtuSemesters.map(s => (
                                            <option key={s} value={s}>{s}th Semester</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[2.5rem] border border-amber-200 dark:border-amber-900/30">
                            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium italic">
                                "Small steps lead to big grades. Each 25-minute focus session is a win."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Session Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg max-h-[90vh] rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col transform transition-all">
                        {/* Modal Header */}
                        <div className="bg-forest p-6 md:p-10 text-white relative shrink-0">
                            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-20"><CalendarIcon size={80} /></div>
                            <h2 className="text-2xl md:text-3xl font-black mb-1 relative z-10">Sync Session</h2>
                            <p className="text-white/70 text-sm md:text-base font-medium relative z-10">Add a new beat to your academic rhythm.</p>
                        </div>

                        {/* Scrollable Form Body */}
                        <form onSubmit={handleCreateSession} className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="col-span-full">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Session Title</label>
                                    <input required className="w-full px-5 py-3 md:py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-forest dark:text-white font-bold" value={newSession.title} onChange={e => setNewSession({ ...newSession, title: e.target.value })} placeholder="e.g. Unit 4 Deep Dive" />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Linked Circle</label>
                                    <select className="w-full px-5 py-3 md:py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-forest dark:text-white font-bold appearance-none" value={newSession.group_id} onChange={e => setNewSession({ ...newSession, group_id: e.target.value })}>
                                        <option value="">Independent Study</option>
                                        {userGroups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Date</label>
                                    <input type="date" required className="w-full px-5 py-3 md:py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-forest dark:text-white font-bold" value={newSession.date} onChange={e => setNewSession({ ...newSession, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Intensity</label>
                                    <select className="w-full px-5 py-3 md:py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-forest dark:text-white font-bold appearance-none" value={newSession.session_type} onChange={e => setNewSession({ ...newSession, session_type: e.target.value })}>
                                        <option value="discussion">Discussion</option>
                                        <option value="quiet_focus">Deep Focus</option>
                                        <option value="mentorship">Mentorship</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Start</label>
                                    <input type="time" required className="w-full px-5 py-3 md:py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-forest dark:text-white font-bold" value={newSession.start_time} onChange={e => setNewSession({ ...newSession, start_time: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">End</label>
                                    <input type="time" required className="w-full px-5 py-3 md:py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none focus:ring-2 focus:ring-forest dark:text-white font-bold" value={newSession.end_time} onChange={e => setNewSession({ ...newSession, end_time: e.target.value })} />
                                </div>
                            </div>

                            {/* Action Buttons - Sticky-like at the bottom of the scroll view */}
                            <div className="flex gap-4 pt-4 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-grow py-4 md:py-5 bg-gray-100 dark:bg-gray-700 rounded-2xl md:rounded-3xl font-black text-gray-500 transition-all hover:bg-gray-200">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-[2] bg-forest text-white py-4 md:py-5 rounded-2xl md:rounded-3xl font-black shadow-xl shadow-green-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" size={24} /> : 'Sync Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Schedule;
