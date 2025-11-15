export interface PlayerInfo {
  name: string;
  team?: string;
  position?: string;
  jerseyNumber?: number;
  year?: number;
  throws?: 'left' | 'right';
}

export interface Statistics {
  [key: string]: number | string;
}

export interface CardData {
  player: PlayerInfo;
  stats?: Statistics;
  imageUrl?: string;
  customFields?: {
    [key: string]: string | number;
  };
}

