import { FacetConfig } from "./facet.model";

export interface Category {
  id: string;
  name: string;
  slug: string;
  url: string;
  image?: string;
  tagline?: string;
  subCategories: SubCategory[];
  facets?: FacetConfig[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  url: string;
  image?: string;
  tagline?: string;
  productCount: number;
  facets?: FacetConfig[];
}
