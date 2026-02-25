import { SearchFacet } from '@shopping/models/dtos/search-facet.dto';
import { Product } from '@shopping/models/product.model';

export interface ProductListingState {
  products: Product[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacet[];
  error: string | null;
}
