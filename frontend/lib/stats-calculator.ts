// Baseball statistics calculator

export interface OffensiveStats {
  // Basic stats
  atBats?: number;
  hits?: number;
  runs?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  runsBattedIn?: number;
  stolenBases?: number;
  walks?: number;
  strikeouts?: number;
  hitByPitch?: number;
  sacrificeFlies?: number;
  plateAppearances?: number;

  // Calculated stats
  battingAverage?: number;
  onBasePercentage?: number;
  sluggingPercentage?: number;
  onBasePlusSlugging?: number;
  totalBases?: number;
}

export interface PitchingStats {
  // Basic stats
  wins?: number;
  losses?: number;
  games?: number;
  gamesStarted?: number;
  completeGames?: number;
  shutouts?: number;
  saves?: number;
  inningsPitched?: number; // as decimal (e.g., 6.2 for 6.2 innings)
  hits?: number;
  runs?: number;
  earnedRuns?: number;
  walks?: number;
  strikeouts?: number;
  homeRuns?: number;
  hitBatters?: number;
  wildPitches?: number;

  // Calculated stats
  era?: number; // Earned Run Average
  whip?: number; // Walks + Hits per Inning Pitched
  strikeoutsPer9?: number;
  walksPer9?: number;
  hitsPer9?: number;
  winPercentage?: number;
}

export function calculateOffensiveStats(stats: Partial<OffensiveStats>): OffensiveStats {
  const calculated: OffensiveStats = { ...stats };

  // Calculate Batting Average (AVG)
  if (calculated.atBats && calculated.atBats > 0 && calculated.hits !== undefined) {
    calculated.battingAverage = Number((calculated.hits / calculated.atBats).toFixed(3));
  }

  // Calculate Total Bases
  if (calculated.hits !== undefined) {
    const doubles = calculated.doubles || 0;
    const triples = calculated.triples || 0;
    const homeRuns = calculated.homeRuns || 0;
    const singles = calculated.hits - doubles - triples - homeRuns;
    calculated.totalBases = singles + doubles * 2 + triples * 3 + homeRuns * 4;
  }

  // Calculate Slugging Percentage (SLG)
  if (calculated.atBats && calculated.atBats > 0 && calculated.totalBases !== undefined) {
    calculated.sluggingPercentage = Number((calculated.totalBases / calculated.atBats).toFixed(3));
  }

  // Calculate On-Base Percentage (OBP)
  if (calculated.plateAppearances && calculated.plateAppearances > 0) {
    const numerator =
      (calculated.hits || 0) + (calculated.walks || 0) + (calculated.hitByPitch || 0);
    calculated.onBasePercentage = Number((numerator / calculated.plateAppearances).toFixed(3));
  } else if (calculated.atBats && calculated.atBats > 0) {
    // Fallback calculation using at-bats
    const numerator =
      (calculated.hits || 0) + (calculated.walks || 0) + (calculated.hitByPitch || 0);
    const denominator = calculated.atBats + (calculated.walks || 0) + (calculated.hitByPitch || 0) + (calculated.sacrificeFlies || 0);
    if (denominator > 0) {
      calculated.onBasePercentage = Number((numerator / denominator).toFixed(3));
    }
  }

  // Calculate On-Base Plus Slugging (OPS)
  if (calculated.onBasePercentage !== undefined && calculated.sluggingPercentage !== undefined) {
    calculated.onBasePlusSlugging = Number((calculated.onBasePercentage + calculated.sluggingPercentage).toFixed(3));
  }

  return calculated;
}

export function calculatePitchingStats(stats: Partial<PitchingStats>): PitchingStats {
  const calculated: PitchingStats = { ...stats };

  // Calculate Earned Run Average (ERA)
  if (calculated.inningsPitched && calculated.inningsPitched > 0 && calculated.earnedRuns !== undefined) {
    calculated.era = Number(((calculated.earnedRuns * 9) / calculated.inningsPitched).toFixed(2));
  }

  // Calculate WHIP (Walks + Hits per Inning Pitched)
  if (calculated.inningsPitched && calculated.inningsPitched > 0) {
    const walks = calculated.walks || 0;
    const hits = calculated.hits || 0;
    calculated.whip = Number(((walks + hits) / calculated.inningsPitched).toFixed(2));
  }

  // Calculate Strikeouts per 9 innings
  if (calculated.inningsPitched && calculated.inningsPitched > 0 && calculated.strikeouts !== undefined) {
    calculated.strikeoutsPer9 = Number(((calculated.strikeouts * 9) / calculated.inningsPitched).toFixed(2));
  }

  // Calculate Walks per 9 innings
  if (calculated.inningsPitched && calculated.inningsPitched > 0 && calculated.walks !== undefined) {
    calculated.walksPer9 = Number(((calculated.walks * 9) / calculated.inningsPitched).toFixed(2));
  }

  // Calculate Hits per 9 innings
  if (calculated.inningsPitched && calculated.inningsPitched > 0 && calculated.hits !== undefined) {
    calculated.hitsPer9 = Number(((calculated.hits * 9) / calculated.inningsPitched).toFixed(2));
  }

  // Calculate Win Percentage
  if (calculated.wins !== undefined && calculated.losses !== undefined) {
    const totalGames = calculated.wins + calculated.losses;
    if (totalGames > 0) {
      calculated.winPercentage = Number((calculated.wins / totalGames).toFixed(3));
    }
  }

  return calculated;
}

// Stat definitions for display
export const offensiveStatDefinitions = {
  atBats: { label: 'At Bats', abbrev: 'AB', category: 'basic' },
  hits: { label: 'Hits', abbrev: 'H', category: 'basic' },
  runs: { label: 'Runs', abbrev: 'R', category: 'basic' },
  doubles: { label: 'Doubles', abbrev: '2B', category: 'basic' },
  triples: { label: 'Triples', abbrev: '3B', category: 'basic' },
  homeRuns: { label: 'Home Runs', abbrev: 'HR', category: 'basic' },
  runsBattedIn: { label: 'RBI', abbrev: 'RBI', category: 'basic' },
  stolenBases: { label: 'Stolen Bases', abbrev: 'SB', category: 'basic' },
  walks: { label: 'Walks', abbrev: 'BB', category: 'basic' },
  strikeouts: { label: 'Strikeouts', abbrev: 'SO', category: 'basic' },
  battingAverage: { label: 'Batting Average', abbrev: 'AVG', category: 'calculated' },
  onBasePercentage: { label: 'On-Base %', abbrev: 'OBP', category: 'calculated' },
  sluggingPercentage: { label: 'Slugging %', abbrev: 'SLG', category: 'calculated' },
  onBasePlusSlugging: { label: 'OPS', abbrev: 'OPS', category: 'calculated' },
  totalBases: { label: 'Total Bases', abbrev: 'TB', category: 'calculated' },
};

export const pitchingStatDefinitions = {
  wins: { label: 'Wins', abbrev: 'W', category: 'basic' },
  losses: { label: 'Losses', abbrev: 'L', category: 'basic' },
  games: { label: 'Games', abbrev: 'G', category: 'basic' },
  gamesStarted: { label: 'Games Started', abbrev: 'GS', category: 'basic' },
  completeGames: { label: 'Complete Games', abbrev: 'CG', category: 'basic' },
  shutouts: { label: 'Shutouts', abbrev: 'SHO', category: 'basic' },
  saves: { label: 'Saves', abbrev: 'SV', category: 'basic' },
  inningsPitched: { label: 'Innings Pitched', abbrev: 'IP', category: 'basic' },
  hits: { label: 'Hits Allowed', abbrev: 'H', category: 'basic' },
  runs: { label: 'Runs Allowed', abbrev: 'R', category: 'basic' },
  earnedRuns: { label: 'Earned Runs', abbrev: 'ER', category: 'basic' },
  walks: { label: 'Walks', abbrev: 'BB', category: 'basic' },
  strikeouts: { label: 'Strikeouts', abbrev: 'SO', category: 'basic' },
  homeRuns: { label: 'Home Runs Allowed', abbrev: 'HR', category: 'basic' },
  era: { label: 'ERA', abbrev: 'ERA', category: 'calculated' },
  whip: { label: 'WHIP', abbrev: 'WHIP', category: 'calculated' },
  strikeoutsPer9: { label: 'K/9', abbrev: 'K/9', category: 'calculated' },
  walksPer9: { label: 'BB/9', abbrev: 'BB/9', category: 'calculated' },
  hitsPer9: { label: 'H/9', abbrev: 'H/9', category: 'calculated' },
  winPercentage: { label: 'Win %', abbrev: 'W%', category: 'calculated' },
};

// Combined mapping of stat keys to abbreviations for easy lookup
export const statAbbreviations: Record<string, string> = {
  // Offensive stats
  ...Object.fromEntries(
    Object.entries(offensiveStatDefinitions).map(([key, def]) => [key, def.abbrev])
  ),
  // Pitching stats
  ...Object.fromEntries(
    Object.entries(pitchingStatDefinitions).map(([key, def]) => [key, def.abbrev])
  ),
  // Additional common variations
  'runsBattedIn': 'RBI',
  'runsbattedin': 'RBI',
  'RunsBattedIn': 'RBI',
  'homeRuns': 'HR',
  'HomeRuns': 'HR',
  'homeruns': 'HR',
  'atBats': 'AB',
  'AtBats': 'AB',
  'atbats': 'AB',
  'battingAverage': 'AVG',
  'BattingAverage': 'AVG',
  'onBasePercentage': 'OBP',
  'OnBasePercentage': 'OBP',
  'sluggingPercentage': 'SLG',
  'SluggingPercentage': 'SLG',
  'onBasePlusSlugging': 'OPS',
  'OnBasePlusSlugging': 'OPS',
  'stolenBases': 'SB',
  'StolenBases': 'SB',
  'stolenbases': 'SB',
  'totalBases': 'TB',
  'TotalBases': 'TB',
  'gamesStarted': 'GS',
  'GamesStarted': 'GS',
  'completeGames': 'CG',
  'CompleteGames': 'CG',
  'inningsPitched': 'IP',
  'InningsPitched': 'IP',
  'earnedRuns': 'ER',
  'EarnedRuns': 'ER',
  'strikeoutsPer9': 'K/9',
  'StrikeoutsPer9': 'K/9',
  'walksPer9': 'BB/9',
  'WalksPer9': 'BB/9',
  'hitsPer9': 'H/9',
  'HitsPer9': 'H/9',
  'winPercentage': 'W%',
  'WinPercentage': 'W%',
};

// Helper function to get abbreviation for a stat key
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

