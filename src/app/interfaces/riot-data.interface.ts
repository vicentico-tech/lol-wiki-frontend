export interface ChampionData {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  tags: string[];
  partype: string;
  info: { difficulty: number };
  image: { full: string; sprite: string; group: string; x: number; y: number; w: number; h: number };
}

export interface ItemData {
  name: string;
  description: string;
  plaintext: string;
  image: { full: string };
}

export interface ItemDetailData {
  id: string;
  name: string;
  description: string;
  plaintext?: string;
  tags: string[];
  depth?: number;
  maps?: Record<string, boolean>;
  inStore?: boolean;
  requiredAlly?: string;
  gold: { total: number; sell: number; purchasable: boolean };
  stats: Record<string, number>;
  from?: string[];
  into?: string[];
  image: { full: string };
}

export interface ChampionDetailData {
  id: string;
  name: string;
  title: string;
  tags: string[];
  partype: string;
  info: { difficulty: number };
  stats: Record<string, number>;
  passive: { name: string; description: string; image: { full: string } };
  spells: Array<{
    name: string;
    description: string;
    costBurn: string;
    cooldownBurn: string;
    image: { full: string };
  }>;
}

export interface ParsedItem {
  id: string;
  name: string;
  plaintext: string;
  iconUrl: string;
  tags: string[];
  price: number;
  rarity: 'basic' | 'epic' | 'legendary';
  isFinal: boolean;
}

export interface Filters {
  q: string;
  cat: string;                                    // 'all' o un tag como 'Damage', 'Health'...
  tier: 'all' | 'basic' | 'epic' | 'legendary';
  price: 'all' | 'lt1000' | '1000-2500' | '2500-3500' | 'gt3500';
  sort: 'price-asc' | 'price-desc' | 'az' | 'za';
  onlyFinal: boolean;
}


