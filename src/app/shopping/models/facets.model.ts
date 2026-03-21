import { ItemModel } from "./item.model";

export interface FacetValue {
  label?: string;
  id?: string;
  url: string;
}

export interface Facet {
  id: string;
  url?: string;
  max?: number;
  min?: number;
  ranges?: number[];
  values: FacetValue[];
}

export interface ItemsResponse {
  items: ItemModel[];
  facets: Facet[];
  total: number;
  page: number;
  recordsPerPage: number;
}