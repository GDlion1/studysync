import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Phone,
    Video,
    MoreVertical,
    Send,
    Mic,
    Paperclip,
    Smile,
    ChevronLeft,
    Users,
    Circle,
    User,
    X,
    Plus
} from 'lucide-react';

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
    const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            if (groupId && currentUser) {
                // Fetch group details
                const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single();
                if (!group) return;
                setGroupInfo(group);

                // Fetch members
                const { data: mems } = await supabase.from('study_group_members').select('*, profiles(*)').eq('group_id', groupId);
                setMembers(mems || []);

                // Fetch real-time messages
                const { data: initialMessages } = await supabase
                    .from('chat_messages')
                    .select('*, profiles(full_name, avatar_url)')
                    .eq('group_id', groupId)
                    .order('created_at', { ascending: true });

                setMessages(initialMessages || []);

                // Check if current user is creator
                if (group.creator_id === currentUser.id) {
                    setIsCreator(true);
                    fetchRequests(groupId);
                }

                // Subscribe to new messages
                const channel = supabase
                    .channel(`group-${groupId}`)
                    // @ts-ignore
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'chat_messages',
                        filter: `group_id=eq.${groupId}`
                    },
                        async (payload: any) => {
                            const { data: msgWithProfile } = await supabase
                                .from('chat_messages')
                                .select('*, profiles(full_name, avatar_url)')
                                .eq('id', payload.new.id)
                                .single();

                            setMessages(prev => [...prev, msgWithProfile]);
                        })
                    // Add subscription for requests if creator
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'group_requests',
                        filter: `group_id=eq.${groupId}`
                    }, () => {
                        if (group.creator_id === currentUser.id) fetchRequests(groupId);
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        };
        init();
    }, [groupId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !groupId) return;

        const { error } = await supabase
            .from('chat_messages')
            .insert({
                group_id: groupId,
                sender_id: user!.id,
                content: newMessage,
                message_type: 'text'
            });

        if (!error) setNewMessage('');
    };

    const fetchRequests = async (id: string) => {
        const { data } = await supabase
            .from('group_requests')
            .select('*, profiles(*)')
            .eq('group_id', id)
            .eq('status', 'pending');
        setRequests(data || []);
    };

    const handleRequest = async (requestId: string, userId: string, status: 'approved' | 'rejected') => {
        try {
            const { error: updateError } = await supabase
                .from('group_requests')
                .update({ status })
                .eq('id', requestId);

            if (updateError) throw updateError;

            if (status === 'approved') {
                const { error: joinError } = await supabase
                    .from('study_group_members')
                    .insert({ group_id: groupId, user_id: userId });

                if (joinError) throw joinError;

                // Refresh members
                const { data: mems } = await supabase.from('study_group_members').select('*, profiles(*)').eq('group_id', groupId);
                setMembers(mems || []);
            }

            setRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error: any) {
            alert(error.message);
        }
    };

    const toggleCall = () => {
        setIsCalling(!isCalling);
    };

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
                                </div>
                            ))}
                        </div>
                    ) : (
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
                    {messages.map((msg, i) => {
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
                                        <div className={`p-4 rounded-2xl shadow-sm ${isOwn ? 'bg-forest text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-800 text-dark dark:text-gray-100 rounded-tl-none'}`}>
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        </div>
                                        <p className={`text-[10px] text-gray-300 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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

                {/* Message Input */}
                <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <button type="button" className="p-2 text-gray-400 hover:text-forest transition-colors"><Paperclip size={20} /></button>
                            <button type="button" className="p-2 text-gray-400 hover:text-forest transition-colors"><Smile size={20} /></button>
                        </div>
                        <div className="flex-grow flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-1 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-forest/20 transition-all">
                            <input
                                type="text"
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
