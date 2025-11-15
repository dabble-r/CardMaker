'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { templatesAPI, cardsAPI } from '@/lib/api-client';
import { calculateOffensiveStats, calculatePitchingStats, offensiveStatDefinitions, pitchingStatDefinitions, type OffensiveStats, type PitchingStats } from '@/lib/stats-calculator';
import CardPreview from '@/components/CardPreview';

type PlayerType = 'position' | 'pitcher';

export default function BuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loadAuth, logout } = useAuthStore();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [playerType, setPlayerType] = useState<PlayerType>('position');
  const [offensiveStats, setOffensiveStats] = useState<Partial<OffensiveStats>>({});
  const [pitchingStats, setPitchingStats] = useState<Partial<PitchingStats>>({});
  const [selectedStats, setSelectedStats] = useState<Set<string>>(new Set());
  const [cardData, setCardData] = useState({
    player: {
      name: '',
      team: '',
      position: '',
      jerseyNumber: '',
      year: new Date().getFullYear(),
      throws: '' as 'left' | 'right' | '',
    },
    stats: {} as Record<string, number | string>,
    imageUrl: '',
    customFields: {
      careerHighlights: '',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'select'>('info');

  useEffect(() => {
    loadAuth();
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, loadAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTemplates();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId && templates.length > 0) {
      setSelectedTemplate(templateId);
    } else if (templates.length > 0 && !selectedTemplate) {
      // Auto-select Donruss template if available, otherwise first template
      const donrussTemplate = templates.find(t => t.id?.includes('donruss') || t.name?.toLowerCase().includes('donruss'));
      if (donrussTemplate) {
        setSelectedTemplate(donrussTemplate.id);
      } else if (templates.length > 0) {
        setSelectedTemplate(templates[0].id);
      }
    }
  }, [templates, searchParams, selectedTemplate]);

  const loadTemplates = async () => {
    try {
      const response = await templatesAPI.getAll();
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats based on player type
  const calculatedStats = playerType === 'position'
    ? calculateOffensiveStats(offensiveStats)
    : calculatePitchingStats(pitchingStats);

  // Get all available stats for selection
  const availableStats = playerType === 'position'
    ? Object.keys(offensiveStatDefinitions)
    : Object.keys(pitchingStatDefinitions);

  const toggleStatSelection = (statKey: string) => {
    setSelectedStats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(statKey)) {
        newSet.delete(statKey);
      } else {
        // Limit to 10 stats
        if (newSet.size < 10) {
          newSet.add(statKey);
        } else {
          alert('Maximum of 10 stats can be selected for the card.');
        }
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    if (!cardData.player.name) {
      alert('Please enter a player name');
      return;
    }

    setSaving(true);
    try {
      const selectedStatsData = Object.fromEntries(
        Array.from(selectedStats).map((statKey) => [
          statKey,
          calculatedStats[statKey as keyof typeof calculatedStats],
        ]).filter(([_, value]) => value !== undefined && value !== null && value !== ''),
      );

      const response = await cardsAPI.create({
        templateId: selectedTemplate,
        cardDataJson: {
          player: {
            ...cardData.player,
            jerseyNumber: cardData.player.jerseyNumber
              ? parseInt(String(cardData.player.jerseyNumber)) || undefined
              : undefined,
            throws: cardData.player.throws || undefined,
          },
          stats: selectedStatsData,
          imageUrl: cardData.imageUrl,
          customFields: cardData.customFields,
        },
      });

      console.log('Card saved:', response.data);
      router.push(`/cards/${response.data.id}`);
    } catch (error: any) {
      console.error('Failed to save card:', error);
      alert(`Failed to save card: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Card</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Form */}
            <div className="space-y-6">
              {/* Template Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Template</h2>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('info')}
                      className={`py-4 px-6 text-sm font-medium ${
                        activeTab === 'info'
                          ? 'border-b-2 border-indigo-500 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Player Info
                    </button>
                    <button
                      onClick={() => setActiveTab('stats')}
                      className={`py-4 px-6 text-sm font-medium ${
                        activeTab === 'stats'
                          ? 'border-b-2 border-indigo-500 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Statistics
                    </button>
                    <button
                      onClick={() => setActiveTab('select')}
                      className={`py-4 px-6 text-sm font-medium ${
                        activeTab === 'select'
                          ? 'border-b-2 border-indigo-500 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Select Stats
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {/* Player Info Tab */}
                  {activeTab === 'info' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Player Name *
                        </label>
                        <input
                          type="text"
                          value={cardData.player.name}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              player: { ...cardData.player, name: e.target.value },
                            })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Enter player name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Team
                        </label>
                        <input
                          type="text"
                          value={cardData.player.team}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              player: { ...cardData.player, team: e.target.value },
                            })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Enter team name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position
                        </label>
                        <input
                          type="text"
                          value={cardData.player.position}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              player: { ...cardData.player, position: e.target.value },
                            })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="e.g., 1B, 2B, SS, 3B, OF, C, P"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jersey Number
                        </label>
                        <input
                          type="number"
                          value={cardData.player.jerseyNumber}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              player: { ...cardData.player, jerseyNumber: e.target.value },
                            })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Enter jersey number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={cardData.player.year}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              player: { ...cardData.player, year: parseInt(e.target.value) || new Date().getFullYear() },
                            })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Enter year"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Throws
                        </label>
                        <select
                          value={cardData.player.throws}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              player: { ...cardData.player, throws: e.target.value as 'left' | 'right' | '' },
                            })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="">Select...</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={cardData.imageUrl}
                          onChange={(e) =>
                            setCardData({ ...cardData, imageUrl: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Enter image URL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Career Highlights
                          <span className="ml-2 text-xs text-gray-500">
                            ({cardData.customFields?.careerHighlights?.length || 0}/140 characters)
                          </span>
                        </label>
                        <textarea
                          value={cardData.customFields?.careerHighlights || ''}
                          onChange={(e) => {
                            const text = e.target.value;
                            if (text.length <= 140) {
                              setCardData({
                                ...cardData,
                                customFields: {
                                  ...cardData.customFields,
                                  careerHighlights: text,
                                },
                              });
                            }
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Enter career highlights (max 140 characters)"
                          rows={3}
                          maxLength={140}
                        />
                        {cardData.customFields?.careerHighlights && cardData.customFields.careerHighlights.length >= 130 && (
                          <p className="mt-1 text-xs text-amber-600">
                            {140 - (cardData.customFields.careerHighlights.length)} characters remaining
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Statistics Tab */}
                  {activeTab === 'stats' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Player Type
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="position"
                              checked={playerType === 'position'}
                              onChange={(e) => setPlayerType(e.target.value as PlayerType)}
                              className="mr-2"
                            />
                            Position Player
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="pitcher"
                              checked={playerType === 'pitcher'}
                              onChange={(e) => setPlayerType(e.target.value as PlayerType)}
                              className="mr-2"
                            />
                            Pitcher
                          </label>
                        </div>
                      </div>

                      {playerType === 'position' ? (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Offensive Statistics</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(offensiveStatDefinitions).map(([key, def]) => {
                              if (def.category === 'calculated') return null;
                              return (
                                <div key={key}>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {def.label}
                                  </label>
                                  <input
                                    type="number"
                                    value={offensiveStats[key as keyof OffensiveStats] || ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                      setOffensiveStats({ ...offensiveStats, [key]: value });
                                    }}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    placeholder="0"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Pitching Statistics</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(pitchingStatDefinitions).map(([key, def]) => {
                              if (def.category === 'calculated') return null;
                              return (
                                <div key={key}>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {def.label}
                                  </label>
                                  <input
                                    type="number"
                                    step={key === 'inningsPitched' ? '0.1' : '1'}
                                    value={pitchingStats[key as keyof PitchingStats] || ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                      setPitchingStats({ ...pitchingStats, [key]: value });
                                    }}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    placeholder="0"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Display Calculated Stats */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-md font-semibold mb-2">Calculated Statistics</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(calculatedStats).map(([key, value]) => {
                            if (value === undefined || value === null) return null;
                            const def = playerType === 'position'
                              ? offensiveStatDefinitions[key as keyof typeof offensiveStatDefinitions]
                              : pitchingStatDefinitions[key as keyof typeof pitchingStatDefinitions];
                            if (!def || def.category !== 'calculated') return null;
                            return (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600">{def.label}:</span>
                                <span className="font-medium">{typeof value === 'number' ? value.toFixed(3) : value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Select Stats Tab */}
                  {activeTab === 'select' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Choose which statistics will appear on your card. Selected stats are highlighted. Maximum 10 stats allowed.
                        {selectedStats.size > 0 && (
                          <span className="ml-2 font-medium text-indigo-600">
                            ({selectedStats.size}/10 selected)
                          </span>
                        )}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {availableStats.map((statKey) => {
                          const def = playerType === 'position'
                            ? offensiveStatDefinitions[statKey as keyof typeof offensiveStatDefinitions]
                            : pitchingStatDefinitions[statKey as keyof typeof pitchingStatDefinitions];
                          if (!def) return null;
                          const value = calculatedStats[statKey as keyof typeof calculatedStats];
                          const isSelected = selectedStats.has(statKey);
                          const hasValue = value !== undefined && value !== null && value !== '';

                          return (
                            <button
                              key={statKey}
                              onClick={() => toggleStatSelection(statKey)}
                              disabled={!hasValue}
                              className={`p-3 rounded-lg border-2 text-left transition ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : hasValue
                                  ? 'border-gray-200 hover:border-gray-300'
                                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{def.label}</span>
                                {isSelected && (
                                  <span className="text-indigo-600">✓</span>
                                )}
                              </div>
                              {hasValue && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {typeof value === 'number' ? value.toFixed(3) : value}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !selectedTemplate || !cardData.player.name}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Card'}
                </button>
              </div>
            </div>

            {/* Right Column: Preview */}
            <div className="bg-white rounded-lg shadow p-2">
              <h2 className="text-sm font-semibold mb-1 px-1">Preview</h2>
              <div className="border border-dashed border-gray-300 rounded p-2 bg-gray-50 overflow-auto">
                {selectedTemplate ? (
                  <CardPreview
                    template={templates.find((t) => t.id === selectedTemplate)}
                    cardData={{
                      player: {
                        ...cardData.player,
                        jerseyNumber: cardData.player.jerseyNumber
                          ? parseInt(String(cardData.player.jerseyNumber)) || undefined
                          : undefined,
                        throws: cardData.player.throws || undefined,
                      },
                      stats: Object.fromEntries(
                        Array.from(selectedStats).map((statKey) => [
                          statKey,
                          calculatedStats[statKey as keyof typeof calculatedStats],
                        ]).filter(([_, value]) => value !== undefined && value !== null && value !== ''),
                      ),
                      imageUrl: cardData.imageUrl,
                      customFields: cardData.customFields,
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <p>Select a template to see preview</p>
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

