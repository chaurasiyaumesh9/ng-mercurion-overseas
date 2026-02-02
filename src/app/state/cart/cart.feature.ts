import { createFeature, createReducer, emptyProps, on } from '@ngrx/store';
import { createActionGroup, props } from '@ngrx/store';

export interface CartItem {
  productId: string;
  qty: number;
}

export interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: []
};

export const cartActions = createActionGroup({
  source: 'Cart',
  events: {
    'Add Item': props<{ productId: string }>(),
    'Remove Item': props<{ productId: string }>(),
    'Clear Cart': emptyProps()
  }
});


export const cartFeature = createFeature({
  name: 'cart',
  reducer: createReducer(
    initialState,
    on(cartActions.addItem, (state, { productId }) => ({
      ...state,
      items: [...state.items, { productId, qty: 1 }]
    })),
    on(cartActions.removeItem, (state, { productId }) => ({
      ...state,
      items: state.items.filter(i => i.productId !== productId)
    })),
    on(cartActions.clearCart, () => initialState)
  )
});
