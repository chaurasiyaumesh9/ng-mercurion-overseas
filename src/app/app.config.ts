import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideState, provideStore } from '@ngrx/store';
import { provideHttpClient } from '@angular/common/http';
import { categoriesReducer } from '@appState/categories/categories.reducer';
import { CategoriesEffects } from '@appState/categories/categories.effects';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { ProductListingEffects } from '@shopping/state/product-listing/product-listing.effects';
import { productListingReducer } from '@shopping/state/product-listing/product-listing.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),    
    provideStore({
      categories: categoriesReducer
    }),
    provideState('productListing', productListingReducer),
    provideEffects([CategoriesEffects, ProductListingEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode()
    })
  ]
};
