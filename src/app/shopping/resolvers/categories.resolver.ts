import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Category } from '@shopping/models/category.model';
import { CategoryService } from '@shopping/services/categories.api';

export const categoriesResolver: ResolveFn<Category[]> = () => {
    const categoryService = inject(CategoryService);
    return categoryService.getCategories();
};
