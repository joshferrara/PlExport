'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinId, setPinId] = useState<number | null>(null);
  const [authUrl, setAuthUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.push('/dashboard');
        }
      })
      .catch(() => {
        // Not authenticated, stay on login page
      });
  }, [router]);

  // Poll for authentication when we have a PIN
  useEffect(() => {
    if (!pinId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pinId }),
        });

        const data = await response.json();

        if (data.authorized) {
          clearInterval(interval);
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error checking PIN:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pinId, router]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/pin', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to request authentication');
      }

      const data = await response.json();
      setPinCode(data.code);
      setPinId(data.id);
      setAuthUrl(data.authUrl);

      // Open Plex auth in new window
      window.open(data.authUrl, '_blank', 'width=600,height=700');
    } catch (err) {
      setError('Failed to initiate login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PlExport</h1>
          <p className="text-gray-600">Export your Plex media collections</p>
        </div>

        {!pinCode ? (
          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </>
              ) : (
                'Sign in with Plex'
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="text-center text-sm text-gray-500">
              You&apos;ll be redirected to Plex to authorize this application
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Enter this code on Plex:
              </p>
              <p className="text-4xl font-mono font-bold text-orange-600 tracking-wider">
                {pinCode}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Waiting for authorization...</span>
            </div>

            <button
              onClick={() => window.open(authUrl, '_blank', 'width=600,height=700')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Reopen Plex Auth Window
            </button>

            <button
              onClick={() => {
                setPinCode('');
                setPinId(null);
                setAuthUrl('');
              }}
              className="w-full text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
