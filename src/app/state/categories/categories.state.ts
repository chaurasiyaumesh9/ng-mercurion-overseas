import { Category } from '@shopping/models/category.model';

export interface CategoriesState {
  categories: Category[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}