import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import FindGroups from './pages/FindGroups';
import Resources from './pages/Resources';
import Schedule from './pages/Schedule';
import SignIn from './pages/SignIn';
import ProfileSetup from './pages/ProfileSetup';
import Profile from './pages/Profile';
import CreateGroup from './pages/CreateGroup';
import StudyHub from './pages/StudyHub';

const App = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <Router>
            <div className={`min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/find-groups" element={<FindGroups />} />
                    <Route path="/create-group" element={<CreateGroup />} />
                    <Route path="/chat/:groupId" element={<StudyHub />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
                <Footer />
            </div>
        </Router>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
        console.error('Missing VITE_GOOGLE_CLIENT_ID. Create a .env file with a valid Google OAuth client ID and restart the dev server.');
    }

    root.render(
        <GoogleOAuthProvider clientId={googleClientId ?? ''}>
            <App />
        </GoogleOAuthProvider>
    );
}
