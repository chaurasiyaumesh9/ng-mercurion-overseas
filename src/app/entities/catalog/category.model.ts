export interface Category {
  id: string;
  name: string;
  slug: string;
  url: string;
  thumbnail?: string;
  tagline?: string;
  featured: boolean;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  url: string;
  thumbnail?: string;
  tagline?: string;
}
