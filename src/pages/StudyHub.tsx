import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Phone, Video, MoreVertical, Send, Mic, Paperclip, Smile, ChevronLeft,
    Users, Circle, User, X, Plus, Settings, Trash2, Save, Info, Loader2,
    FileText, Target, Download, CheckCircle2, Clock, File, Image as ImageIcon
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StudyHub = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [groupInfo, setGroupInfo] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [isCreator, setIsCreator] = useState(false);
    const [activeTab, setActiveTab] = useState<'members' | 'requests' | 'settings' | 'goals' | 'resources'>('members');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [inviteUSN, setInviteUSN] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [goals, setGoals] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [newGoal, setNewGoal] = useState({ title: '', due_date: '', priority: 'medium' });
    const [isUploading, setIsUploading] = useState(false);
    
    // WebSockets references
    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Fetching
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/signin');
            return;
        }
        const currentUser = JSON.parse(storedUser);
        setUser(currentUser);

        const init = async () => {
            setIsLoading(true);
            try {
                // Fetch group info
                let res = await fetch(`${API_URL}/api/hub/${groupId}/details`);
                const group = await res.json();
                setGroupInfo(group);
                if(group){
                    setEditName(group.name);
                    setEditDescription(group.description || '');

                    if (group.admin_id === currentUser.id || group.creator_id === currentUser.id) {
                        setIsCreator(true);
                        fetchRequests(groupId!);
                    }
                }

                // Fetch Members
                res = await fetch(`${API_URL}/api/hub/${groupId}/members`);
                const membersData = await res.json();
                setMembers(Array.isArray(membersData) ? membersData : []);

                // Fetch Messages
                res = await fetch(`${API_URL}/api/hub/${groupId}/messages`);
                const msgData = await res.json();
                setMessages(Array.isArray(msgData) ? msgData : []);

                fetchGoals(groupId!);
                fetchResources(groupId!);

                // Connect to Socket.IO
                socketRef.current = io(API_URL);
                socketRef.current.emit('join_room', groupId);

                // Listen for real-time updates
                socketRef.current.on('receive_message', (data) => {
                    setMessages((prev) => [...prev, data.message]);
                });

                socketRef.current.on('refresh_goals', () => {
                    fetchGoals(groupId!);
                });

                socketRef.current.on('refresh_resources', () => {
                    fetchResources(groupId!);
                });

            } catch (err) {
                console.error("Failed to load hub data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (groupId) init();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [groupId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !groupId) return;

        try {
            const res = await fetch(`${API_URL}/api/hub/${groupId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender_id: user.id || user._id, content: newMessage, message_type: 'text' })
            });

            const data = await res.json();
            socketRef.current?.emit('send_message', { room: groupId, message: data });
            setNewMessage('');
        } catch (error: any) {
            alert('Failed to send: ' + error.message);
        }
    };

    const fetchRequests = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/api/hub/${id}/requests`);
            const requestsData = await res.json();
            setRequests(Array.isArray(requestsData) ? requestsData : []);
        } catch(e) {}
    };

    const handleRequest = async (_requestId: string, _userId: string, _status: 'approved' | 'rejected') => {
        alert("Requests logic can be added later in backend.");
    };

    const handleRemoveMember = async (userId: string) => {
        if (!window.confirm('Are you sure you want to remove this student?')) return;
        try {
            await fetch(`${API_URL}/api/hub/${groupId}/members/${userId}`, { method: 'DELETE' });
            setMembers(prev => prev.filter(m => m.user_id !== userId));
        } catch (error: any) { alert(error.message); }
    };

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await fetch(`${API_URL}/api/hub/${groupId}/details`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName, description: editDescription })
            });
            setGroupInfo((prev: any) => ({ ...prev, name: editName, description: editDescription }));
            alert('Circle details updated!');
        } catch (error: any) { alert(error.message); } finally { setIsSaving(false); }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteUSN.trim()) return;
        setIsInviting(true);
        try {
            const res = await fetch(`${API_URL}/api/hub/${groupId}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usn: inviteUSN.trim() })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            alert('Added to the circle!');
            const mRes = await fetch(`${API_URL}/api/hub/${groupId}/members`);
            setMembers(await mRes.json());
            setInviteUSN('');
        } catch (error: any) { alert(error.message); } finally { setIsInviting(false); }
    };

    const fetchGoals = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/api/hub/${id}/goals`);
            const goalsData = await res.json();
            setGoals(Array.isArray(goalsData) ? goalsData : []);
        }catch(e){}
    };

    const fetchResources = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/api/hub/${id}/resources`);
            const resData = await res.json();
            setResources(Array.isArray(resData) ? resData : []);
        }catch(e){}
    };

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.title || !user) return;
        
        await fetch(`${API_URL}/api/hub/${groupId}/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newGoal, created_by: user.id || user._id })
        });
        
        setNewGoal({ title: '', due_date: '', priority: 'medium' });
        socketRef.current?.emit('goal_updated', { room: groupId });
        fetchGoals(groupId!);
    };

    const handleUpdateGoalStatus = async (goalId: string, status: string) => {
        await fetch(`${API_URL}/api/hub/${groupId}/goals/${goalId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        socketRef.current?.emit('goal_updated', { room: groupId });
        fetchGoals(groupId!);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !groupId) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('uploader_id', user.id || user._id);

            const uploadRes = await fetch(`${API_URL}/api/hub/${groupId}/resources`, {
                method: 'POST',
                body: formData
            });
            
            const uploadedFile = await uploadRes.json();
            
            // Also send as chat message
            const msgRes = await fetch(`${API_URL}/api/hub/${groupId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: user.id || user._id, 
                    content: `Shared a file: ${file.name}`,
                    message_type: uploadedFile.file_type,
                    file_url: uploadedFile.file_url
                })
            });
            
            const data = await msgRes.json();
            socketRef.current?.emit('send_message', { room: groupId, message: data });
            socketRef.current?.emit('resource_uploaded', { room: groupId });
            
            fetchResources(groupId);
        } catch (error: any) { alert(error.message); } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const toggleCall = () => setIsCalling(!isCalling);

    return (
        <div className="flex-grow flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-dark-bg transition-colors relative overflow-hidden">
            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            {/* Sidebar (Members & Requests) */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 transform transition-transform duration-300 ease-in-out flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-dark dark:text-white">Circle Details</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-dark dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'members' ? 'bg-white dark:bg-gray-800 text-forest shadow-sm' : 'text-gray-400'}`}
                        >
                            <Users size={16} /> Members ({members.length})
                        </button>
                        {isCreator && (
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'requests' ? 'bg-white dark:bg-gray-800 text-forest shadow-sm' : 'text-gray-400'}`}
                            >
                                <Plus size={16} /> Requests {requests.length > 0 && <span className="w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full text-[10px]">{requests.length}</span>}
                            </button>
                        )}
                        {isCreator && (
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-gray-800 text-forest shadow-sm' : 'text-gray-400'}`}
                            >
                                <Settings size={16} /> Settings
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('goals')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'goals' ? 'bg-white dark:bg-gray-800 text-forest shadow-sm' : 'text-gray-400'}`}
                        >
                            <Target size={16} /> Goals
                        </button>
                        <button
                            onClick={() => setActiveTab('resources')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'resources' ? 'bg-white dark:bg-gray-800 text-forest shadow-sm' : 'text-gray-400'}`}
                        >
                            <FileText size={16} /> Files
                        </button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-4">
                    {activeTab === 'members' ? (
                        <div className="space-y-4">
                            {members.map((member, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
                                    <div className="relative">
                                        {member.profiles?.avatar_url ? (
                                            <img src={member.profiles.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-forest font-bold">
                                                {member.profiles?.full_name?.charAt(0)}
                                            </div>
                                        )}
                                        <Circle size={10} className="absolute bottom-0 right-0 text-green-500 fill-green-500 border-2 border-white dark:border-gray-800" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-bold text-dark dark:text-gray-100">{member.profiles?.full_name}</p>
                                        <p className="text-[10px] text-gray-400 capitalize">{member.role || 'Member'}</p>
                                    </div>
                                    {isCreator && member.user_id !== user?.id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.user_id); }}
                                            className="p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Remove member"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'requests' ? (
                        <div className="space-y-4">
                            {requests.length > 0 ? requests.map((req, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 space-y-3">
                                    <div className="flex items-center gap-3">
                                        {req.profiles?.avatar_url ? (
                                            <img src={req.profiles.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                <User size={20} />
                                            </div>
                                        )}
                                        <div className="flex-grow">
                                            <p className="text-sm font-bold text-dark dark:text-white">{req.profiles?.full_name}</p>
                                            <p className="text-[10px] text-gray-400 truncate">{req.profiles?.usn || 'Requester'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                                        <button
                                            onClick={() => handleRequest(req.id, req.user_id, 'approved')}
                                            className="flex-1 py-2 bg-forest text-white rounded-lg hover:bg-green-700"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleRequest(req.id, req.user_id, 'rejected')}
                                            className="flex-1 py-2 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12">
                                    <p className="text-xs text-gray-400 italic">No pending requests</p>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'goals' ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-dark dark:text-white uppercase tracking-wider underline decoration-forest decoration-2 underline-offset-4">Circle Goals</h3>
                                <span className="text-[10px] bg-forest/10 text-forest px-2 py-1 rounded-full font-bold">{goals.filter(g => g.status === 'completed').length}/{goals.length} Completed</span>
                            </div>

                            {isCreator && (
                                <form onSubmit={handleCreateGoal} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Add a new goal..."
                                        value={newGoal.title}
                                        onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-forest"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={newGoal.due_date}
                                            onChange={e => setNewGoal({ ...newGoal, due_date: e.target.value })}
                                            className="flex-grow bg-white dark:bg-gray-800 border-none rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-forest"
                                        />
                                        <button type="submit" className="bg-forest text-white p-2 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100">
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-3 pb-6">
                                {goals.length > 0 ? goals.map((goal, i) => (
                                    <div key={i} className="group p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:border-forest/50 transition-all cursor-pointer" onClick={() => handleUpdateGoalStatus(goal.id, goal.status === 'completed' ? 'pending' : 'completed')}>
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${goal.status === 'completed' ? 'bg-forest border-forest text-white' : 'border-gray-200 dark:border-gray-700'}`}>
                                                {goal.status === 'completed' && <CheckCircle2 size={14} />}
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className={`text-sm font-bold transition-all ${goal.status === 'completed' ? 'text-gray-400 line-through' : 'text-dark dark:text-gray-100'}`}>{goal.title}</h4>
                                                {goal.due_date && (
                                                    <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-1.5 font-medium">
                                                        <Clock size={10} /> Deadline: {new Date(goal.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                            <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${goal.priority === 'high' ? 'bg-red-100 text-red-600' : goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                                                {goal.priority}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 opacity-50">
                                        <Target size={32} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-xs text-gray-400">Set circle goals to track progress together!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'resources' ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-dark dark:text-white uppercase tracking-wider underline decoration-forest decoration-2 underline-offset-4">Shared Materials</h3>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-forest/10 text-forest rounded-lg hover:bg-forest/20 transition-all"
                                    title="Upload Material"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 pb-6">
                                {resources.length > 0 ? resources.map((res, i) => (
                                    <a
                                        key={i}
                                        href={res.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-forest/50 hover:shadow-md transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-forest group-hover:scale-110 transition-transform">
                                            {res.file_type === 'pdf' ? <FileText size={24} /> : res.file_type === 'image' ? <ImageIcon size={24} /> : <File size={24} />}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-sm font-bold text-dark dark:text-white truncate">{res.title}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Shared by {res.profiles?.full_name?.split(' ')[0] || 'Member'}</p>
                                        </div>
                                        <Download size={18} className="text-gray-300 group-hover:text-forest transition-colors" />
                                    </a>
                                )) : (
                                    <div className="text-center py-10 opacity-50">
                                        <FileText size={32} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-xs text-gray-400">Collaborate by sharing notes & links!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateGroup} className="space-y-6 animate-fade-in">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Info size={12} /> Circle Name
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-forest/20 text-sm text-dark dark:text-white"
                                    placeholder="Enter circle name..."
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Info size={12} /> Description
                                </label>
                                <textarea
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-forest/20 text-sm text-dark dark:text-white h-32 resize-none"
                                    placeholder="What is this circle about?"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-forest text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all disabled:opacity-50 shadow-lg shadow-green-100 dark:shadow-none"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Save Changes</>}
                            </button>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Plus size={12} /> Add Student by USN
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inviteUSN}
                                        onChange={e => setInviteUSN(e.target.value)}
                                        className="flex-grow bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-forest/20 text-sm text-dark dark:text-white"
                                        placeholder="Enter USN (e.g. 1RV21CS001)"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleInvite}
                                        disabled={isInviting || !inviteUSN.trim()}
                                        className="bg-dark text-white px-6 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isInviting ? <Loader2 className="animate-spin" size={20} /> : 'Add'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 italic">This will instantly add the student to your circle.</p>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-grow flex flex-col bg-white dark:bg-gray-900 relative">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/find-groups')} className="text-gray-500"><ChevronLeft /></button>
                        <div className="cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
                            <h3 className="text-lg font-bold text-dark dark:text-white">{groupInfo?.name || 'Study Circle'}</h3>
                            <p className="text-xs text-green-500 flex items-center gap-1"><Circle size={8} className="fill-green-500" /> {members.length} active now</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
                        >
                            <Users size={20} />
                        </button>
                        <button
                            onClick={toggleCall}
                            className={`p-2.5 rounded-full transition-all ${isCalling ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            <Phone size={20} />
                        </button>
                        <button className="p-2.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><Video size={20} /></button>
                        <button className="p-2.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><MoreVertical size={20} /></button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="text-sm font-medium">Loading conversation...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <Smile size={32} className="opacity-50" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold">No messages yet</p>
                                <p className="text-xs">Be the first to say hello!</p>
                            </div>
                        </div>
                    ) : (
                        messages.filter(msg => msg !== null).map((msg, i) => {
                            const isOwn = msg.sender_id === user?.id;
                            return (
                                <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                    <div className={`flex gap-3 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                        {!isOwn && (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden mt-auto">
                                                {msg.profiles?.avatar_url ? (
                                                    <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <User className="w-full h-full p-1 text-gray-400" />
                                                )}
                                            </div>
                                        )}
                                        <div>
                                            {!isOwn && <p className="text-[10px] text-gray-400 mb-1 ml-1">{msg.profiles?.full_name}</p>}
                                            <div className={`p-4 rounded-2xl shadow-sm space-y-3 ${isOwn ? 'bg-forest text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-800 text-dark dark:text-gray-100 rounded-tl-none'}`}>
                                                {msg.message_type === 'image' && (
                                                    <div className="rounded-lg overflow-hidden border border-white/10">
                                                        <img src={msg.file_url} className="max-w-full h-auto cursor-pointer hover:scale-105 transition-transform" alt="Shared" onClick={() => window.open(msg.file_url)} />
                                                    </div>
                                                )}
                                                {(msg.message_type === 'file' || msg.message_type === 'pdf') && (
                                                    <a
                                                        href={msg.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-3 p-3 rounded-xl border ${isOwn ? 'bg-white/10 border-white/20' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOwn ? 'bg-white/20' : 'bg-forest/10 text-forest'}`}>
                                                            {msg.message_type === 'pdf' ? <FileText size={20} /> : <File size={20} />}
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <p className="text-xs font-bold truncate">{msg.content.replace('Shared a file: ', '')}</p>
                                                            <p className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>Click to download</p>
                                                        </div>
                                                        <Download size={16} />
                                                    </a>
                                                )}
                                                {msg.message_type === 'text' && <p className="text-sm leading-relaxed">{msg.content}</p>}
                                            </div>
                                            <p className={`text-[10px] text-gray-300 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Voice Call Overlay (Simple Visualization) */}
                {isCalling && (
                    <div className="absolute inset-0 bg-forest/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white animate-fade-in">
                        <div className="w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
                            <Phone size={48} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Joining Voice Hub...</h2>
                        <p className="opacity-60 mb-12">Connecting with {groupInfo?.name} members</p>

                        <div className="flex gap-6">
                            <button className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"><Mic size={24} /></button>
                            <button onClick={toggleCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-xl"><Phone size={24} className="rotate-[135deg]" /></button>
                        </div>
                    </div>
                )}

                {/* Message Input Area */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl relative">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*,.pdf,.doc,.docx"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="p-3 text-gray-400 hover:text-forest transition-colors flex-shrink-0"
                        >
                            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
                        </button>
                        <div className="flex-grow min-w-0">
                            <textarea
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full bg-transparent py-3 outline-none dark:text-white text-sm"
                            />
                            <button type="button" className="text-gray-400 hover:text-forest"><Mic size={20} /></button>
                        </div>
                        <button
                            type="submit"
                            className="bg-forest text-white p-3.5 rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-green-200 dark:shadow-none"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudyHub;
