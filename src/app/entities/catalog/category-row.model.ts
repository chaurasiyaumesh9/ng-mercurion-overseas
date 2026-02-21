export interface CategoryRow {
  id: string;
  name: string;
  primaryParent: string | null;
  urlFragment: string;
  imageUrl?: string;
}