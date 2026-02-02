export interface Category {
  id: string;
  name: string;
  slug: string;
  url: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  url: string;
  productCount: number;
}
