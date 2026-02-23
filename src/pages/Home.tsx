import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Home = () => {
    const [user, setUser] = useState<any>(null);
    const [greeting, setGreeting] = useState("🚀 Revolutionizing Student Collaboration");

    useEffect(() => {
        // Check current session
        const getUserAndProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('gender')
                    .eq('id', user.id)
                    .single();

                if (profile?.gender === 'Male') {
                    setGreeting("👑 What's up, King? Ready to grind?");
                } else if (profile?.gender === 'Female') {
                    setGreeting("✨ Hey Queen! Let's slay this study session!");
                } else {
                    setGreeting("🚀 Let's get this bread, fam!");
                }
            } else {
                setGreeting("🚀 Revolutionizing Student Collaboration");
            }
        };

        getUserAndProfile();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session) {
                setGreeting("🚀 Revolutionizing Student Collaboration");
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <div className="flex-grow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-forest dark:text-neon font-medium text-sm mb-6 border border-green-100 dark:border-green-800 animate-fade-in">
                        {greeting}
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-dark dark:text-white mb-6 tracking-tight">
                        Study Smarter, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-forest to-neon">
                            Together with AI
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Connect with peers, generate AI study guides, and master your subjects with the ultimate collaborative learning platform.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {!user && (
                            <Link
                                to="/signin"
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-forest text-white hover:bg-green-600 transition-all transform hover:scale-105 shadow-xl shadow-green-200 dark:shadow-green-900/20 font-semibold text-lg text-center"
                            >
                                Join for Free
                            </Link>
                        )}
                        <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-neon/50 hover:bg-green-50 dark:hover:bg-gray-700 transition-all font-semibold text-lg flex items-center justify-center gap-2">
                            <span className="text-xl text-forest dark:text-neon">▶</span> Watch Demo
                        </button>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    {[
                        {
                            title: "Smart Matching",
                            desc: "Find the perfect study partners based on your courses, schedule, and learning style.",
                            icon: "🎯",
                            color: "bg-green-50 dark:bg-green-900/20 text-forest dark:text-neon"
                        },
                        {
                            title: "AI Assistant",
                            desc: "Get instant answers, summary generation, and quiz creation for any topic.",
                            icon: "✨",
                            color: "bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400"
                        },
                        {
                            title: "Real-time Collab",
                            desc: "Shared whiteboards, notes, and video chat to make remote studying feel like being there.",
                            icon: "⚡",
                            color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        }
                    ].map((feature, idx) => (
                        <div key={idx} className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-neon/30 transition-all group">
                            <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
