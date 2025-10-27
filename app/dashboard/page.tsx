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
      const response = await fetch('/api/auth/session');
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
      const response = await fetch('/api/libraries');
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

      const response = await fetch(`/api/media?${params.toString()}`);
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
        `/api/collections?sectionKey=${selectedLibrary.key}&type=collections`
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
        `/api/media?collectionKey=${encodeURIComponent(collectionKey)}`
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
    await fetch('/api/auth/logout', { method: 'POST' });
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">PlExport</h1>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-600">
                  {user.username}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Library Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Library</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {libraries.map(library => (
              <button
                key={library.key}
                onClick={() => {
                  setSelectedLibrary(library);
                  setSelectedCollection('');
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedLibrary?.key === library.key
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
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
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">
                  Filter by Collection
                </h2>
                <select
                  value={selectedCollection}
                  onChange={e => setSelectedCollection(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleAll}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                  >
                    {selectedItems.size === filteredItems.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} of {filteredItems.length} selected
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={exporting || selectedItems.size === 0}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    disabled={exporting || selectedItems.size === 0}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
                  >
                    Export JSON
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Media Grid */}
            <div className="bg-white rounded-lg shadow p-6">
              {loading ? (
                <div className="text-center py-12 text-gray-600">
                  Loading media...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  No items found
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredItems.map(item => (
                    <div
                      key={item.ratingKey}
                      onClick={() => toggleItem(item.ratingKey)}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedItems.has(item.ratingKey)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.ratingKey)}
                        onChange={() => {}}
                        className="mr-4 h-5 w-5 text-orange-500 rounded"
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
