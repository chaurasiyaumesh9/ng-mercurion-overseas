import { resolveMediaUrl } from '@core/resolvers/media.resolver';
import { Category } from '@shopping/models/category.model';
import { CategoryDto } from '@shopping/models/dtos/category.dto';

export function buildCategoryHierarchy(dtos: CategoryDto[]): Category[] {
  const map = new Map<string, Category>();

  dtos.forEach((dto) => {
    map.set(dto.id, {
      id: dto.id,
      featured: dto.featured,
      name: dto.name,
      slug: dto.urlFragment,
      url: `/${dto.urlFragment}`,
      thumbnail: resolveMediaUrl(dto.thumbnail),
      subCategories: [],
    });
  });

  const roots: Category[] = [];

  dtos.forEach((dto) => {
    const current = map.get(dto.id)!;

    if (dto.primaryParent && map.has(dto.primaryParent)) {
      map.get(dto.primaryParent)!.subCategories.push(current);
    } else {
      roots.push(current);
    }
  });

  return roots;
}
