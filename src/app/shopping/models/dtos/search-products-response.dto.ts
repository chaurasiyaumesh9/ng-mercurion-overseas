import { SearchFacet } from "./search-facet.dto";
import { SearchProductItem } from "./search-product-item.dto";

export interface SearchProductsResponse {
  total: number;
  page: number;
  pageSize: number;
  items: SearchProductItem[];
  facets: SearchFacet[];
}