export interface Category {
  id: string;
  name: string;
  slug: string;
  url: string;
  thumbnail: string;
  featured: boolean;
  subCategories: Category[];
}