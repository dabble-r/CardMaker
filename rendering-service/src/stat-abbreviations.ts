// Stat abbreviations mapping for rendering service
// This should match the frontend stat abbreviations

export const statAbbreviations: Record<string, string> = {
  // Offensive stats
  atBats: 'AB',
  hits: 'H',
  runs: 'R',
  doubles: '2B',
  triples: '3B',
  homeRuns: 'HR',
  runsBattedIn: 'RBI',
  stolenBases: 'SB',
  walks: 'BB',
  strikeouts: 'SO',
  battingAverage: 'AVG',
  onBasePercentage: 'OBP',
  sluggingPercentage: 'SLG',
  onBasePlusSlugging: 'OPS',
  totalBases: 'TB',
  hitByPitch: 'HBP',
  sacrificeFlies: 'SF',
  plateAppearances: 'PA',
  
  // Pitching stats
  wins: 'W',
  losses: 'L',
  games: 'G',
  gamesStarted: 'GS',
  completeGames: 'CG',
  shutouts: 'SHO',
  saves: 'SV',
  inningsPitched: 'IP',
  earnedRuns: 'ER',
  era: 'ERA',
  whip: 'WHIP',
  strikeoutsPer9: 'K/9',
  walksPer9: 'BB/9',
  hitsPer9: 'H/9',
  winPercentage: 'W%',
  hitBatters: 'HBP',
  wildPitches: 'WP',
  
  // Common variations (case-insensitive fallbacks)
  'runsbattedin': 'RBI',
  'RunsBattedIn': 'RBI',
  'homeruns': 'HR',
  'HomeRuns': 'HR',
  'atbats': 'AB',
  'AtBats': 'AB',
  'battingaverage': 'AVG',
  'BattingAverage': 'AVG',
  'onbasepercentage': 'OBP',
  'OnBasePercentage': 'OBP',
  'sluggingpercentage': 'SLG',
  'SluggingPercentage': 'SLG',
  'onbaseplusslugging': 'OPS',
  'OnBasePlusSlugging': 'OPS',
  'stolenbases': 'SB',
  'StolenBases': 'SB',
  'totalbases': 'TB',
  'TotalBases': 'TB',
  'gamesstarted': 'GS',
  'GamesStarted': 'GS',
  'completegames': 'CG',
  'CompleteGames': 'CG',
  'inningspitched': 'IP',
  'InningsPitched': 'IP',
  'earnedruns': 'ER',
  'EarnedRuns': 'ER',
  'strikeoutsper9': 'K/9',
  'StrikeoutsPer9': 'K/9',
  'walksper9': 'BB/9',
  'WalksPer9': 'BB/9',
  'hitsper9': 'H/9',
  'HitsPer9': 'H/9',
  'winpercentage': 'W%',
  'WinPercentage': 'W%',
};

export function getStatAbbreviation(statKey: string): string {
  // First try exact match
  if (statAbbreviations[statKey]) {
    return statAbbreviations[statKey];
  }
  
  // Try case-insensitive match
  const lowerKey = statKey.toLowerCase();
  for (const [key, abbrev] of Object.entries(statAbbreviations)) {
    if (key.toLowerCase() === lowerKey) {
      return abbrev;
    }
  }
  
  // If no match found, return the key as-is (might already be an abbreviation)
  return statKey;
}

