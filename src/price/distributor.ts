import dayjs from "dayjs";
import fs from "fs";
import path from "path";

const __dirname = new URL('.', import.meta.url).pathname;
export enum PricingModel {
  STANDARD,
  NIGHT_TIME_REDUCED,
  SEASONAL_REDUCED
}

export class Distributor {
  STANDARD: { REDUCED_RATE: number; STANDARD_RATE: number; };
  NIGHT_TIME_REDUCED: { REDUCED_RATE: number; STANDARD_RATE: number; };
  SEASONAL_REDUCED: { REDUCED_RATE: number; STANDARD_RATE: number; };

  constructor(operatorName: string) {
    const rates = JSON.parse(fs.readFileSync(path.resolve(path.join(__dirname, `./transfer_rates.json`)), 'utf-8'))[operatorName.toUpperCase()];
    this.STANDARD = rates.STANDARD;
    this.NIGHT_TIME_REDUCED = rates.NIGHT_TIME_REDUCED;
    this.SEASONAL_REDUCED = rates.SEASONAL_REDUCED;
  }

  isNightTime(timestamp: dayjs.Dayjs): boolean {
    const hour = timestamp.hour();
    return hour >= 22 || hour < 7;
  }

  isWinterWorkingDay(timestamp: dayjs.Dayjs): boolean {
    const month = timestamp.month() + 1; // dayjs months are 0-indexed
    const day = timestamp.day();
    const hour = timestamp.hour();
    return (month >= 11 || month <= 3) && (day >= 1 && day <= 5) && (hour >= 7 && hour < 22);
  }

  getRate(timestamp: dayjs.Dayjs, pricingModel: PricingModel): number {
    const modelRates = this[PricingModel[pricingModel]];
    switch (pricingModel) {
      case PricingModel.STANDARD:
        return modelRates.STANDARD_RATE;
      case PricingModel.NIGHT_TIME_REDUCED:
        if (this.isNightTime(timestamp)) {
          return modelRates.REDUCED_RATE;
        } else {
          return modelRates.STANDARD_RATE;
        }
      case PricingModel.SEASONAL_REDUCED:
        if (this.isWinterWorkingDay(timestamp)) {
          return modelRates.REDUCED_RATE;
        } else {
          return modelRates.STANDARD_RATE;
        }
    }
  }
}