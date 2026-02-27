export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  description: string;
  image: string;
  categoryIds: string[];
  inStock: boolean;
  quantityAvailable: number;
  featured: boolean;
}
