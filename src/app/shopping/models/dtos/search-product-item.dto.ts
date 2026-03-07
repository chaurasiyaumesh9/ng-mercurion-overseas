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
  featured?: boolean;
  brand?: string;
  color?: string;
  gender?: string;
  material?: string;
  style?: string;
}