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
      const response = await exportAPI.exportCard(cardId, format);
      
      // Check if response is a blob (binary file from local mode)
      if (response.data instanceof Blob) {
        // Check if it's actually an error response (error responses might be JSON in blob format)
        if (response.headers['content-type']?.includes('application/json')) {
          // Error response, parse it
          const text = await response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Export failed');
        }
        
        const url = window.URL.createObjectURL(response.data);
        const contentDisposition = response.headers['content-disposition'];
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `card-${cardId}.${format}`
          : `card-${cardId}.${format}`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON response with URL (S3 mode)
        const url = response.data.url;
        const filename = response.data.filename || `card-${cardId}.${format}`;

        if (url.startsWith('data:')) {
          // Create a download link for data URLs
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Open S3 URL in new tab
          window.open(url, '_blank');
        }
      }
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      if (error.response) {
        // Try to parse error response (could be Blob or JSON)
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            console.log('Error response text:', text);
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorData.error || `Export failed (${error.response.status})`;
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorMessage = `Export failed with status ${error.response.status}`;
          }
        } else if (typeof error.response.data === 'object') {
          errorMessage = error.response.data?.message || error.response.data?.error || `Export failed (${error.response.status})`;
        } else {
          errorMessage = `Export failed with status ${error.response.status}`;
        }
      } else {
        errorMessage = error.message || 'Unknown error';
      }
      alert('Export failed: ' + errorMessage);
      console.error('Export error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
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

