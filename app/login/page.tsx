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
    fetch('/api/auth/session', { credentials: 'include' })
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
          credentials: 'include',
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">PlExport</h1>
          <p className="text-gray-600">Export your Plex media collections</p>
        </div>

        {!pinCode ? (
          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              You&apos;ll be redirected to Plex to authorize this application
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 text-center shadow-inner">
              <p className="text-sm text-gray-600 mb-3">
                Enter this code on Plex:
              </p>
              <p className="text-5xl font-mono font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-wider drop-shadow-sm">
                {pinCode}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-gray-600 bg-gray-50 rounded-lg p-4">
              <svg
                className="animate-spin h-5 w-5 text-indigo-600"
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
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Reopen Plex Auth Window
            </button>

            <button
              onClick={() => {
                setPinCode('');
                setPinId(null);
                setAuthUrl('');
              }}
              className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
