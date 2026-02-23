export interface Category {
  id: string;
  name: string;
  slug: string;
  url: string;
  image?: string;
  tagline?: string;
  featured: boolean;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  url: string;
  image?: string;
  tagline?: string;
}
