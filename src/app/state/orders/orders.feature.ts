import { createFeature, createReducer, on } from '@ngrx/store';
import { createActionGroup, props } from '@ngrx/store';

export interface Order {
  id: string;
  total: number;
  date: string;
}

export interface OrdersState {
  list: Order[];
}

const initialState: OrdersState = {
  list: []
};

export const ordersActions = createActionGroup({
  source: 'Orders',
  events: {
    'Add Order': props<{ order: Order }>()
  }
});

export const ordersFeature = createFeature({
  name: 'orders',
  reducer: createReducer(
    initialState,
    on(ordersActions.addOrder, (state, { order }) => ({
      ...state,
      list: [...state.list, order]
    }))
  )
});
