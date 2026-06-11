import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../lib/api';

const SignIn = () => {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [usn, setUsn] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            const url = isSignUp 
                ? `${API_URL}/api/auth/signup` 
                : `${API_URL}/api/auth/login`;

            const payload = isSignUp 
                ? { email, password, full_name: fullName, usn }
                : { email, password };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Save the JWT token and user details to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ id: data._id, email: data.email, ...data.profile }));

            // Redirect on success
            navigate('/find-groups'); 
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-grow flex bg-gray-50 dark:bg-dark-bg py-12 px-4 transition-colors duration-300">
            <div className="max-w-md w-full m-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-forest to-neon text-white font-bold text-xl mb-4">
                        S
                    </div>
                    <h2 className="text-3xl font-bold text-dark dark:text-white">
                        {isSignUp ? 'Create an Account' : 'Welcome dude!'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {isSignUp ? 'Sign up to start learning' : 'Sign in to continue your learning journey'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {isSignUp && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest focus:ring-2 focus:ring-forest/20 dark:text-white outline-none transition-all"
                                    placeholder="John Doe"
                                    required={isSignUp}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">USN (Optional)</label>
                                <input
                                    type="text"
                                    value={usn}
                                    onChange={(e) => setUsn(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest focus:ring-2 focus:ring-forest/20 dark:text-white outline-none transition-all"
                                    placeholder="1RV21CS000"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest focus:ring-2 focus:ring-forest/20 dark:text-white outline-none transition-all"
                            placeholder="you@university.edu"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-forest focus:ring-2 focus:ring-forest/20 dark:text-white outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-forest text-white rounded-lg hover:bg-green-700 transition-colors font-bold shadow-lg shadow-green-200 dark:shadow-green-900/20 transform active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {isSignUp ? "Already have an account? " : "Don't have an account? "}
                    <button 
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                        className="text-forest dark:text-neon font-medium hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                        {isSignUp ? 'Sign in instead' : 'Sign up for free'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignIn;
