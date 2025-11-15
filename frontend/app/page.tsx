'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { cardsAPI, templatesAPI } from '@/lib/api-client';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loadAuth, user, logout } = useAuthStore();
  const [cards, setCards] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, loadAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [cardsRes, templatesRes] = await Promise.all([
        cardsAPI.getAll(),
        templatesAPI.getAll(),
      ]);
      setCards(cardsRes.data.slice(0, 6));
      setTemplates(templatesRes.data.filter((t: any) => t.isDefault).slice(0, 3));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Baseball Card Creator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <Link
                href="/templates"
                className="text-indigo-600 hover:text-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                Templates
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Cards</h2>
            {cards.length === 0 ? (
              <p className="text-gray-500">No cards yet. Create your first card!</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => (
                  <Link
                    key={card.id}
                    href={`/cards/${card.id}`}
                    className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {card.cardDataJson?.player?.name || 'Untitled Card'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {card.template?.name || 'No template'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Templates</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/builder?template=${template.id}`}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition"
                >
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
