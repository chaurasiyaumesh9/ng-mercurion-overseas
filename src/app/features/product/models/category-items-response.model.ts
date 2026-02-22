export interface CategoryItemsResponse {
  success: boolean;
  categoryId?: string;
  totalResults: number;
  items: CategoryItemRow[];
  pageIndex: number;
  pageSize: number;
}

export interface CategoryItemRow {
  id: string;
  sku: string;
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  quantityAvailable: string;
}