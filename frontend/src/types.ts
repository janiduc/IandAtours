export interface Tour {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  region: string;
  duration_days: number;
  price_usd: number;
  price_lkr: number;
  highlights: string[];
  image_url: string;
  featured: boolean;
}

export interface Vehicle {
  id: number;
  name: string;
  category: string;
  seats: number;
  air_conditioned: boolean;
  description: string;
  image_url: string;
}
