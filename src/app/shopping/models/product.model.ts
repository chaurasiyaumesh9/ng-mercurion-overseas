export interface Product {
  id: string;
  sku: string;
  urlcomponent: string;
  name: string;
  price: number;
  description: string;
  image: string;
  categoryIds: string[];
  inStock: boolean;
  quantityAvailable: number;
  brand: string;
    color: string;
    gender: string;
    material: string;
    style: string;  
}
