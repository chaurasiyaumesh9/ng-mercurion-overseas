export interface PayloadLiveOrderLine {
  item: Item;
  quantity: number;
  internalid?: string;
  options: Option[];
  location: string;
  fulfillmentChoice: string;
  freeGift: boolean;
}

export interface Item {
  internalid: number | string;
  type: string;
}

export interface Option {
  cartOptionId: string;
  itemOptionId: string;
  label: string;
  type: string;
}
