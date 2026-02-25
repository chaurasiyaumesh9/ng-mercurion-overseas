export interface CategoryDto {
  id: string;
  name: string;
  primaryParent: string | null;
  urlFragment: string;
  thumbnail: string;
  featured: boolean;
}