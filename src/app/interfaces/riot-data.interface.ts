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

export type AbilityKey = 'P' | 'Q' | 'W' | 'E' | 'R' | 'S';

export interface AbilityRow {
  id: string;
  key: AbilityKey;
  name: string;
  owner: string;
  ownerId: string | null;
  icon: string;
  desc: string;
  cost: 'mana' | 'energy' | 'hp' | 'none' | 'other';
  range: 'self' | 'short' | 'mid' | 'long';
  cd: number;
  stats: { label: string; value: string }[];
}

export interface AbilityCatalog {
  version: string;
  spells: AbilityRow[];
  summoners: AbilityRow[];
}

export interface AbilityFilters {
  q: string;
  key: 'all' | 'P' | 'Q' | 'W' | 'E' | 'R';
  cost: 'all' | AbilityRow['cost'];
  range: 'all' | AbilityRow['range'];
  sort: 'champ' | 'az' | 'cd-asc' | 'cd-desc';
}

export interface Filters {
  q: string;
  cat: string;                                    // 'all' o un tag como 'Damage', 'Health'...
  tier: 'all' | 'basic' | 'epic' | 'legendary';
  price: 'all' | 'lt1000' | '1000-2500' | '2500-3500' | 'gt3500';
  sort: 'price-asc' | 'price-desc' | 'az' | 'za';
  onlyFinal: boolean;
}


