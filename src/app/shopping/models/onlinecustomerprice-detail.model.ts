export interface OnlinecustomerpriceDetail {
  onlinecustomerprice_formatted: string;
  onlinecustomerprice: number;
  priceschedule?: Priceschedule[];
}

export interface Priceschedule {
  maximumquantity?: number;
  minimumquantity: number;
  price: number;
  price_formatted: string;
}