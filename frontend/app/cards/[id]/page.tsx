'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { cardsAPI, exportAPI, templatesAPI } from '@/lib/api-client';
import CardPreview from '@/components/CardPreview';

export default function CardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;
  const { isAuthenticated, loadAuth, logout } = useAuthStore();
  const [card, setCard] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'pdf'>('png');

  useEffect(() => {
    loadAuth();
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, loadAuth]);

  useEffect(() => {
    if (isAuthenticated && cardId) {
      loadCard();
    }
  }, [isAuthenticated, cardId]);

  const loadCard = async () => {
    try {
      const response = await cardsAPI.getById(cardId);
      const cardData = response.data;
      setCard(cardData);
      
      // Use template from card response if available (it should include frontJson and backJson)
      if (cardData.template) {
        setTemplate(cardData.template);
      } else if (cardData.templateId) {
        // Fallback: load template separately if not included
        try {
          const templateResponse = await templatesAPI.getById(cardData.templateId);
          setTemplate(templateResponse.data);
        } catch (templateError) {
          console.error('Failed to load template:', templateError);
        }
      }
    } catch (error: any) {
      console.error('Failed to load card:', error);
      if (error.response?.status === 404) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'png' | 'jpeg' | 'pdf') => {
    if (!card) return;

    setExporting(true);
    setExportFormat(format);
    try {
      // Get auth token for the request
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        alert('You must be logged in to export cards');
        return;
      }

      // Create export URL with auth token
      // In Next.js, NEXT_PUBLIC_ env vars are embedded at build time
      // If not available, use the default backend URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Ensure we have a full absolute URL (not relative)
      // If apiUrl is empty or doesn't start with http, use default
      const baseUrl = apiUrl && apiUrl.startsWith('http') ? apiUrl : 'http://localhost:3001';
      const exportUrl = `${baseUrl}/export/card/${cardId}?format=${format}`;
      
      console.log('Export URL:', exportUrl, 'API URL env:', process.env.NEXT_PUBLIC_API_URL); // Debug log
      
      // Fetch the file with authentication
      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Check if response is OK
      if (!response.ok) {
        // Try to parse error message
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Export failed (${response.status})`);
        } else {
          throw new Error(`Export failed with status ${response.status}`);
        }
      }

      // Get filename from content-disposition header
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `card-${cardId}.${format}`
        : `card-${cardId}.${format}`;

      // Get blob from response
      const blob = await response.blob();

      // Try to use File System Access API for native file save dialog
      // This API is available in Chrome/Edge and requires HTTPS or localhost
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: format.toUpperCase() + ' file',
              accept: {
                [format === 'pdf' ? 'application/pdf' : `image/${format}`]: [`.${format}`],
              },
            }],
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return; // Successfully saved
        } catch (saveError: any) {
          // User cancelled the dialog or error occurred
          if (saveError.name !== 'AbortError') {
            console.error('File save error:', saveError);
            // Fall through to regular download
          } else {
            // User cancelled, just return
            return;
          }
        }
      }
      
      // Fallback: Use regular download (browser will prompt for save location)
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      // Don't show error if user cancelled the save dialog
      if (error?.name === 'AbortError') {
        return;
      }
      
      const errorMessage = error.message || 'Unknown error';
      alert('Export failed: ' + errorMessage);
      console.error('Export error details:', {
        message: error.message,
        stack: error.stack,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      await cardsAPI.delete(cardId);
      router.push('/');
    } catch (error: any) {
      alert('Failed to delete card: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Card not found</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-500">
            Go back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const playerData = card.cardDataJson?.player || {};
  const stats = card.cardDataJson?.stats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Baseball Card Creator
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-indigo-600 hover:text-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/builder"
                className="text-indigo-600 hover:text-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                Create Card
              </Link>
              <button
                onClick={logout}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {playerData.name || 'Untitled Card'}
                </h1>
                <p className="text-gray-600">
                  Template: {card.template?.name || 'Unknown'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('png')}
                  disabled={exporting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {exporting && exportFormat === 'png' ? 'Exporting...' : 'Export PNG'}
                </button>
                <button
                  onClick={() => handleExport('jpeg')}
                  disabled={exporting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {exporting && exportFormat === 'jpeg' ? 'Exporting...' : 'Export JPEG'}
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {exporting && exportFormat === 'pdf' ? 'Exporting...' : 'Export PDF'}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Card Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Player Name</label>
                    <p className="text-gray-900">{playerData.name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Team</label>
                    <p className="text-gray-900">{playerData.team || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Position</label>
                    <p className="text-gray-900">{playerData.position || 'Not set'}</p>
                  </div>
                  {playerData.jerseyNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Jersey Number</label>
                      <p className="text-gray-900">{playerData.jerseyNumber}</p>
                    </div>
                  )}
                  {playerData.year && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Year</label>
                      <p className="text-gray-900">{playerData.year}</p>
                    </div>
                  )}
                  {card.cardDataJson?.imageUrl && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Image</label>
                      <img
                        src={card.cardDataJson.imageUrl}
                        alt={playerData.name || 'Card image'}
                        className="mt-2 max-w-xs rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
                {Object.keys(stats).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-700 font-medium">{key}:</span>
                        <span className="text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No statistics added</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-3 px-2">Card Preview</h2>
              <div className="border border-dashed border-gray-300 rounded p-4 bg-gray-50">
                {template ? (
                  <CardPreview
                    template={template}
                    cardData={card.cardDataJson || {}}
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <p>Loading template...</p>
                    {card.cardDataJson?.imageUrl && (
                      <img
                        src={card.cardDataJson.imageUrl}
                        alt="Card preview"
                        className="mx-auto mt-4 max-w-sm rounded-lg shadow-md"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

