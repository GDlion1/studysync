import React, { useState, useEffect } from 'react';
import { vtuBranches, vtuSemesters, vtuSubjects } from '../data/vtuData';
import { supabase } from '../lib/supabaseClient';
import { FileText, Download, Upload, Trash2, Loader2, BookOpen } from 'lucide-react';

interface Resource {
    id: string;
    title: string;
    file_path: string;
    file_type: string;
    file_size: number;
    created_at: string;
    uploaded_by: string;
}

const Resources = () => {
    const [selectedBranch, setSelectedBranch] = useState('CSE');
    const [selectedSem, setSelectedSem] = useState(3);
    const [subjects, setSubjects] = useState<{ code: string; name: string }[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<{ code: string; name: string } | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Fetch user
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    // Update subjects when branch/sem changes
    useEffect(() => {
        const branchData = vtuSubjects[selectedBranch];
        if (branchData) {
            setSubjects(branchData[selectedSem] || []);
        } else {
            setSubjects([]);
        }
        setSelectedSubject(null);
        setResources([]);
    }, [selectedBranch, selectedSem]);

    // Fetch resources when a subject is selected
    useEffect(() => {
        if (selectedSubject) {
            fetchResources(selectedSubject.code);
        }
    }, [selectedSubject]);

    const fetchResources = async (subjectCode: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .eq('subject_code', subjectCode)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setResources(data || []);
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedSubject || !user || !event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedSubject.code}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
        const filePath = fileName;

        setUploading(true);

        try {
            // 1. Upload file to storage
            const { error: uploadError } = await supabase.storage
                .from('study_materials')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Add metadata to database
            const { error: dbError } = await supabase
                .from('resources')
                .insert({
                    title: file.name,
                    subject_code: selectedSubject.code,
                    subject_name: selectedSubject.name,
                    branch: selectedBranch,
                    semester: selectedSem,
                    file_path: filePath,
                    file_type: fileExt,
                    file_size: file.size,
                    uploaded_by: user.id
                });

            if (dbError) throw dbError;

            // Refresh list
            fetchResources(selectedSubject.code);
        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (filePath: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('study_materials')
                .createSignedUrl(filePath, 3600); // 1 hour expiry

            if (error) throw error;

            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error: any) {
            console.error('Error downloading file:', error);
            alert('Download failed: ' + error.message);
        }
    };

    const handleDelete = async (resourceId: string, filePath: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const { error: storageError } = await supabase.storage
                .from('study_materials')
                .remove([filePath]);

            if (storageError) throw storageError;

            const { error: dbError } = await supabase
                .from('resources')
                .delete()
                .eq('id', resourceId);

            if (dbError) throw dbError;

            if (selectedSubject) fetchResources(selectedSubject.code);
        } catch (error: any) {
            console.error('Error deleting file:', error);
            alert('Delete failed: ' + error.message);
        }
    }

    return (
        <div className="flex-grow bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-dark dark:text-white mb-8">
                    Study Resources
                </h1>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-dark dark:text-white focus:ring-2 focus:ring-forest focus:border-forest outline-none transition-all"
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
                                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-dark dark:text-white focus:ring-2 focus:ring-forest focus:border-forest outline-none transition-all"
                            >
                                {vtuSemesters.map(sem => (
                                    <option key={sem} value={sem}>{sem} Semester</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Subject List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subjects</h2>
                        {subjects.length > 0 ? (
                            subjects.map((subject) => (
                                <button
                                    key={subject.code}
                                    onClick={() => setSelectedSubject(subject)}
                                    className={`w-full text-left p-4 rounded-xl transition-all border ${selectedSubject?.code === subject.code
                                        ? 'bg-white dark:bg-gray-800 border-forest shadow-md ring-1 ring-forest'
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <div className="font-bold text-gray-900 dark:text-white">{subject.code}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subject.name}</div>
                                </button>
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-8 bg-white dark:bg-gray-800 rounded-xl">
                                No subjects found.
                            </div>
                        )}
                    </div>

                    {/* Resources Area */}
                    <div className="lg:col-span-2">
                        {selectedSubject ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[500px] flex flex-col">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSubject.name}</h2>
                                        <p className="text-sm text-gray-500">{selectedSubject.code}</p>
                                    </div>

                                    {user && (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="resource-upload"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                            <label
                                                htmlFor="resource-upload"
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors ${uploading
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-forest text-white hover:bg-green-700 shadow-lg shadow-green-100 dark:shadow-green-900/20'
                                                    }`}
                                            >
                                                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                                                {uploading ? 'Uploading...' : 'Upload File'}
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-grow space-y-3">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-40">
                                            <Loader2 className="animate-spin text-forest" size={32} />
                                        </div>
                                    ) : resources.length > 0 ? (
                                        resources.map((resource) => (
                                            <div key={resource.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                                        <FileText size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{resource.title}</h3>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            <span>{(resource.file_size / 1024).toFixed(1)} KB</span>
                                                            <span>•</span>
                                                            <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                                                            {resource.file_type && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="uppercase">{resource.file_type}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDownload(resource.file_path)}
                                                        className="p-2 text-gray-500 hover:text-forest hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download size={20} />
                                                    </button>
                                                    {user && user.id === resource.uploaded_by && (
                                                        <button
                                                            onClick={() => handleDelete(resource.id, resource.file_path)}
                                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                                            <BookOpen className="mx-auto mb-4 opacity-20" size={64} />
                                            <p className="text-lg">No resources properly uploaded yet.</p>
                                            <p className="text-sm opacity-75">Be the first to contribute!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center h-full flex flex-col justify-center items-center text-gray-500 dark:text-gray-400">
                                <BookOpen className="mb-6 opacity-20" size={80} />
                                <h3 className="text-xl font-bold mb-2">Select a Subject</h3>
                                <p>Choose a subject from the list to view or upload study materials.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Resources;
