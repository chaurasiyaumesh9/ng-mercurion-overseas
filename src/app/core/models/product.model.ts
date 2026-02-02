import { Breadcrumb } from "./breadcrumb.model";
import { Review } from "./review.model";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  rating: number;
  reviews: Review[];
  inStock: boolean;
  featured?: boolean;
  tags?: string[];
  
  // NEW: Nested category structure
  category: {
    id: string;
    name: string;
    slug: string;
  };
  
  subCategory: {
    id: string;
    name: string;
    slug: string;
  };
  
  url: string;
  breadcrumbs: Breadcrumb[];
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
}