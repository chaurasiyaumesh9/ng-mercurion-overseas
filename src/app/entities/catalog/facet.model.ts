export type FacetType = 'multi-select' | 'single-select' | 'range';

export interface FacetConfig {
  key: string;
  label: string;
  type: FacetType;

  // optional — because only range needs it
  config?: {
    min?: number;
    max?: number;
    step?: number;
    currency?: string;
  };
}

export type FacetValue = string | number | boolean;

export type ProductFacetValues = Record<string, FacetValue>;
