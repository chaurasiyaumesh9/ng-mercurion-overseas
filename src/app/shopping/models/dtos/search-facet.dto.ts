export interface SearchFacet {
  id?: string;
  url?: string;
  values?: SearchFacetValue[];
}

export interface SearchFacetValue {
  url?: string;
  label?: string;
  count?: number;
}
