
import { Breadcrumb } from "@core/models/breadcrumb.model";
import { Review } from "./review.model";
import { ProductFacetValues } from "@entities/catalog/facet.model";
import { Category, SubCategory } from "@entities/catalog/category.model";

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
  facets?: ProductFacetValues;
  category: Category;
  subCategory: SubCategory;
  url: string;
  breadcrumbs: Breadcrumb[];
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
}