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
  brand: string;
    color: string;
    gender: string;
    material: string;
    style: string;  
}
