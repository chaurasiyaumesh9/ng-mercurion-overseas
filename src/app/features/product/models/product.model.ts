/**
 * Product domain model
 * Simplified version aligned with search API response
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
  quantityAvailable: number;
}