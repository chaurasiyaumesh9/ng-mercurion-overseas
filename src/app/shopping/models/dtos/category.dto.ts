export interface CategoryDto {
  categories?: CategoryDto[];
  fullurl?: string;
  internalid?: string | number;
  level?: string | number;
  name?: string;
  parentIdPath?: string;
  sequencenumber?: string | number;
}
