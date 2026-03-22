import { Category } from '@shopping/models/category.model';

export function splitRoutePath(value: string | undefined): string[] {
  const path = (value ?? '').split('?')[0] ?? '';
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return [];

  return trimmed
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());
}

function startsWithSegments(source: string[], prefix: string[]): boolean {
  if (prefix.length > source.length) return false;

  for (let i = 0; i < prefix.length; i++) {
    if (source[i] !== prefix[i]) return false;
  }

  return true;
}

export function findBestCategoryPath(categories: Category[], routeSegments: string[]): Category[] {
  let bestPath: Category[] = [];
  let bestDepth = 0;

  const visit = (category: Category, path: Category[]) => {
    const categorySegments = splitRoutePath(category.fullurl);
    if (categorySegments.length && startsWithSegments(routeSegments, categorySegments)) {
      if (categorySegments.length > bestDepth) {
        bestDepth = categorySegments.length;
        bestPath = path;
      }
    }

    for (const child of category.categories ?? []) {
      visit(child, [...path, child]);
    }
  };

  for (const root of categories) {
    visit(root, [root]);
  }

  return bestPath;
}

