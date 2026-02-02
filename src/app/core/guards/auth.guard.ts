import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { authFeature } from '../../state/auth/auth.feature';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const isLoggedIn = store.selectSignal(authFeature.selectIsLoggedIn);
  return isLoggedIn();
};
