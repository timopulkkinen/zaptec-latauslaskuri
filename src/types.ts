import dayjs from "dayjs";

export type HourlyConsumption = {
  ts: dayjs.Dayjs;
  kwh: number;
}

export type HourlyPrice = {
  ts: dayjs.Dayjs;
  price: number;
}

// c / kWh
export const ELECTRICITY_TAX = 2.2253;
export const VAT = 1.24;
const enum Distributors {
  ELENIA = "ELENIA",
  FORTUM = "FORTUM",
  HERRFORS = "HERRFORS"
}

const TransferRates = {
  ELENIA: 0.0453,
}

