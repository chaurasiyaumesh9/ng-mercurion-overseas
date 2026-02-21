import { Routes } from '@angular/router';
import { categoriesResolver } from './core/resolvers/categories.resolver';
import { CategoryService } from '@core/services/category.service';

export const routes: Routes = [
	{
		path: '',
		loadChildren: () => import('./core/layout/layout.routes').then(m => m.LAYOUT_ROUTES),
        providers: [CategoryService],
        resolve: {
            categories: categoriesResolver
        },
	}
];

