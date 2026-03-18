import { Category } from '@shopping/models/category.model';
import { CategoryDto } from '@shopping/models/dtos/category.dto';

export function mapCategoryDtosToCategories(items: CategoryDto[] | undefined): Category[] {
  return sortBySequence(items).map(mapCategoryDtoToCategory);
}

function mapCategoryDtoToCategory(item: CategoryDto): Category {
  return {
    categories: mapCategoryDtosToCategories(item.categories),
    fullurl: normalizeUrl(item.fullurl),
    internalid: `${item.internalid ?? ''}`,
    level: `${item.level ?? ''}`,
    name: item.name ?? '',
    parentIdPath: item.parentIdPath ?? '',
    sequencenumber: item.sequencenumber !== undefined ? `${item.sequencenumber}` : undefined,
  };
}

function sortBySequence(items: CategoryDto[] | undefined): CategoryDto[] {
  return [...(items ?? [])].sort(
    (a, b) => toSequenceNumber(a.sequencenumber) - toSequenceNumber(b.sequencenumber),
  );
}

function toSequenceNumber(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return Number.MAX_SAFE_INTEGER;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function normalizeUrl(value: string | undefined): string {
  if (!value) return '';
  return value.startsWith('/') ? value : `/${value}`;
}

