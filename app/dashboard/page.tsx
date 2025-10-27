'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Library {
  key: string;
  type: string;
  title: string;
  viewMode?: 'artist' | 'album';
  originalTitle?: string;
}

interface MediaItem {
  ratingKey: string;
  title: string;
  year?: number;
  thumb?: string;
  type?: string;
  [key: string]: any;
}

interface Collection {
  ratingKey: string;
  key: string;
  title: string;
  childCount?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuth();
    fetchLibraries();
  }, []);

  useEffect(() => {
    if (selectedLibrary) {
      if (selectedCollection) {
        fetchCollectionItems(selectedCollection);
      } else {
        fetchMediaItems();
      }
      fetchCollections();
    }
  }, [selectedLibrary, selectedCollection]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await response.json();

      if (!data.authenticated) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchLibraries = async () => {
    try {
      const response = await fetch('/api/libraries', { credentials: 'include' });
      const data = await response.json();
      const rawLibraries = data.libraries || [];

      // Duplicate artist-type libraries to show both artist and album views
      const expandedLibraries: Library[] = [];
      rawLibraries.forEach((library: Library) => {
        if (library.type === 'artist') {
          // Add original artist view
          expandedLibraries.push({
            ...library,
            viewMode: 'artist',
            originalTitle: library.title,
          });

          // Add album/book view
          const albumLabel = library.title.toLowerCase().includes('audiobook')
            ? 'Books'
            : 'Albums';
          expandedLibraries.push({
            ...library,
            title: `${library.title} (${albumLabel})`,
            viewMode: 'album',
            originalTitle: library.title,
          });
        } else {
          expandedLibraries.push(library);
        }
      });

      setLibraries(expandedLibraries);
    } catch (error) {
      console.error('Error fetching libraries:', error);
    }
  };

  const fetchMediaItems = async () => {
    if (!selectedLibrary) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        sectionKey: selectedLibrary.key,
      });

      if (selectedLibrary.viewMode) {
        params.append('viewMode', selectedLibrary.viewMode);
      }

      const response = await fetch(`/api/media?${params.toString()}`, { credentials: 'include' });
      const data = await response.json();
      setMediaItems(data.items || []);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    if (!selectedLibrary) return;

    try {
      const response = await fetch(
        `/api/collections?sectionKey=${selectedLibrary.key}&type=collections`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setCollections(data.items || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchCollectionItems = async (collectionKey: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/media?collectionKey=${encodeURIComponent(collectionKey)}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setMediaItems(data.items || []);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error fetching collection items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  };

  const toggleItem = (key: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const toggleAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.ratingKey)));
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to export');
      return;
    }

    setExporting(true);
    try {
      const itemsToExport = mediaItems.filter(item =>
        selectedItems.has(item.ratingKey)
      );

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: itemsToExport,
          format,
          libraryType: selectedLibrary?.viewMode === 'album' ? 'album' : selectedLibrary?.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plex-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const filteredItems = mediaItems.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && libraries.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PlExport</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {user.username}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors px-3 py-1.5 hover:bg-gray-100 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Library Selector */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-indigo-500/10 p-6 mb-6 border border-gray-200/50">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Select Library</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {libraries.map(library => (
              <button
                key={`${library.key}-${library.viewMode || 'default'}`}
                onClick={() => {
                  setSelectedLibrary(library);
                  setSelectedCollection('');
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedLibrary?.key === library.key && selectedLibrary?.viewMode === library.viewMode
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md shadow-indigo-500/20'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="font-medium text-gray-900">{library.title}</div>
                <div className="text-xs text-gray-500 mt-1 capitalize">
                  {library.type}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedLibrary && (
          <>
            {/* Collection Filter */}
            {collections.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-indigo-500/10 p-6 mb-6 border border-gray-200/50">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Filter by Collection
                  </h2>
                </div>
                <select
                  value={selectedCollection}
                  onChange={e => setSelectedCollection(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
                >
                  <option value="">All Items</option>
                  {collections.map(collection => (
                    <option key={collection.ratingKey} value={collection.key}>
                      {collection.title} ({collection.childCount || 0})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Controls */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-indigo-500/10 p-6 mb-6 border border-gray-200/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleAll}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors shadow-sm hover:shadow-md"
                  >
                    {selectedItems.size === filteredItems.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-600 font-medium">
                    {selectedItems.size} of {filteredItems.length} selected
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={exporting || selectedItems.size === 0}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl disabled:shadow-none transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    disabled={exporting || selectedItems.size === 0}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl disabled:shadow-none transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    Export JSON
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search media..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Media Grid */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-indigo-500/10 p-6 border border-gray-200/50">
              {loading ? (
                <div className="text-center py-12">
                  <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600 font-medium">Loading media...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 font-medium">No items found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredItems.map(item => (
                    <div
                      key={item.ratingKey}
                      onClick={() => toggleItem(item.ratingKey)}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedItems.has(item.ratingKey)
                          ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md shadow-indigo-500/20'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 hover:shadow-md'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.ratingKey)}
                        onChange={() => {}}
                        className="mr-4 h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedLibrary?.viewMode === 'album' && item.parentTitle && (
                            <>{item.parentTitle} • </>
                          )}
                          {item.year && `${item.year} • `}
                          {item.type && item.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
