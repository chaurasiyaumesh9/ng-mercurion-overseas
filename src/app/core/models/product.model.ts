import { Review } from './review.model';

export interface Product {
  id: string;

  name: string;
  slug: string;               // product URL slug

  categoryId: string;
  categorySlug: string;

  subCategoryId: string;
  subCategorySlug: string;

  price: number;
  originalPrice?: number;

  image: string;
  description: string;

  rating: number;
  reviews: Review[];

  inStock: boolean;
  featured?: boolean;

  tags?: string[];
}
