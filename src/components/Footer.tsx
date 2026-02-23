import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    © 2026 StudySync AI. All rights reserved.
                </p>
                <div className="flex space-x-6">
                    <a href="#" className="text-gray-400 hover:text-forest dark:hover:text-neon transition-colors">Privacy</a>
                    <a href="#" className="text-gray-400 hover:text-forest dark:hover:text-neon transition-colors">Terms</a>
                    <a href="#" className="text-gray-400 hover:text-forest dark:hover:text-neon transition-colors">Contact</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
