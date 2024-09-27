import { JSONPath } from 'jsonpath-plus';
import dayjs from "dayjs";
import type { HourlyConsumption } from "../types.js";

export const getToken = async (username: string, password: string): Promise<string> => {
  const options ={
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: new URLSearchParams({
      username: username,
      password: password,
      grant_type: "password"
    }),
  }
  const response = await fetch("https://api.zaptec.com/oauth/token", options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} ${response.statusText} ${await response.text()}`);
  }
  const json = await response.json();
  return json.access_token;
}
export const getChargeHistory = async (token: string, from:dayjs.Dayjs, to: dayjs.Dayjs, extraSearchArgs?: any): Promise<HourlyConsumption[]> => {
  const searchParams = new URLSearchParams({
    GroupBy: 1,
    DetailLevel: 1,
    From: from.toISOString(),
    To: to.toISOString(),
    ...extraSearchArgs && extraSearchArgs
  });
  const url = new URL("https://api.zaptec.com/api/chargehistory");
  url.search = searchParams.toString();
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} ${response.statusText} ${await response.text()}`);
  }
  const rawData = await response.json();
  const data = JSONPath({ path: '$..EnergyDetails.*', json: rawData }).map((item): HourlyConsumption => {
    const ts = dayjs(item.Timestamp);
    return {
      ts: ts,
      kwh: item.Energy
    }
  });
  return data;
}
