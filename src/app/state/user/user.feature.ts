import { createFeature, createReducer, emptyProps, on } from '@ngrx/store';
import { createActionGroup, props } from '@ngrx/store';

export interface UserState {
  name: string | null;
  email: string | null;
}

const initialState: UserState = {
  name: null,
  email: null
};

export const userActions = createActionGroup({
  source: 'User',
  events: {
    'Set Profile': props<{ name: string; email: string }>(),
    'Clear Profile': emptyProps()
  }
});


export const userFeature = createFeature({
  name: 'user',
  reducer: createReducer(
    initialState,
    on(userActions.setProfile, (_, profile) => profile),
    on(userActions.clearProfile, () => initialState)
  )
});
