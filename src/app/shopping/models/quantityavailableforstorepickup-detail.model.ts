export interface QuantityavailableforstorepickupDetail {
  locations: Location[];
}

export interface Location {
  internalid: number;
  qtyavailableforstorepickup: number;
}