import { createFeature, createReducer, on } from '@ngrx/store';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  userId: null
};

export const authActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login Success': props<{ userId: string }>(),
    'Logout': emptyProps()
  }
});

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialState,
    on(authActions.loginSuccess, (state, { userId }) => ({
      ...state,
      isLoggedIn: true,
      userId
    })),
    on(authActions.logout, () => initialState)
  )
});
