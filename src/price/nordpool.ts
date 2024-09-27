import dayjs from "dayjs";
import type { HourlyPrice } from "../types.js";

type SahkotinResponse = {
  prices: [{
    date: string;
    value: number;
  }],
}
export const getHourlyPrices = async (from: dayjs.Dayjs, to: dayjs.Dayjs):Promise<HourlyPrice[]> => {
  const searchParams = new URLSearchParams({
    start: from.toISOString(),
    end: to.toISOString(),
  });
  const url = new URL("http://sahkotin.fi/prices");
  url.search = searchParams.toString();
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return (await response.json() as SahkotinResponse).prices.map((item: any): HourlyPrice => {
    return {
      ts: dayjs(item.date),
      price: item.value / 10 // price is €/MWh, we want c/kWh
    }
  });
};