import { CategoryRow } from "./category-row.model";

export interface CategoriesResponse {
  success: boolean;
  count: number;
  items: CategoryRow[];
}