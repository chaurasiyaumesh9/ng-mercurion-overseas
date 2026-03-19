import { LiveOrderLine } from "./liveorder.line.model";
import { Options } from "./options.model";
import { Summary } from "./summary.model";
import { Touchpoints } from "./touchpoints.model";

export interface LiveOrderModel {
  lines: LiveOrderLine[];
  lines_sort: string[];
  latest_addition: string;
  promocodes: any[];
  ismultishipto: boolean;
  shipmethods: any[];
  shipmethod: any;
  addresses: any[];
  billaddress: any;
  shipaddress: string;
  paymentmethods: any[];
  isPaypalComplete: boolean;
  touchpoints: Touchpoints;
  agreetermcondition: boolean;
  summary: Summary;
  options: Options;
}