export interface ItemoptionsDetail {
  fields: Field[];
}

export interface Field {
  internalid: string;
  label: string;
  type: string;
  values?: Value[];
}

export interface Value {
  label: string;
}