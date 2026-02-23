export interface SearchProductsResponse {
  total: number;
  page: number;
  pageSize: number;
  items: SearchProductItem[];
  facets: SearchFacet[];
}

export interface SearchProductItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryIds: string[];
  price: number;
  quantityAvailable: number;
  imageUrl: string;
  lastModifiedDate: string;
}

export interface SearchFacet {
  field: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
}
