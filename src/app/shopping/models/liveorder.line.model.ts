import { LineItem } from "./liveorder.line.item.model";

export interface LiveOrderLine {
  internalid: string;
  quantity: number;
  rate: number;
  rate_formatted: string;
  amount: number;
  tax_rate1: string;
  tax_type1: string;
  tax_rate2: any;
  tax_type2: any;
  tax1_amount: any;
  tax1_amount_formatted: string;
  discount: number;
  promotion_discount: string;
  total: number;
  item: LineItem;
  itemtype: string;
  options: any[];
  free_gift: boolean;
  fulfillmentChoice: string;
  amount_formatted: string;
  tax_amount_formatted: string;
  discount_formatted: string;
  total_formatted: string;
}