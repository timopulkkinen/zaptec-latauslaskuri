import * as Zaptec from "./chargers/zaptec.js";
import * as PoolPrice from "./price/nordpool.js";
import { Distributor, PricingModel } from "./price/distributor.js";
import dayjs from "dayjs";
import { ELECTRICITY_TAX, VAT } from "./types.js";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import ExcelJS from 'exceljs';

const argv = yargs(hideBin(process.argv))
  .option('year', {
    alias: 'y',
    type: 'number',
    description: 'Year',
    demandOption: true
  })
  .option('month', {
    alias: 'm',
    type: 'number',
    description: 'Month',
    demandOption: true
  })
  .option('fixedPrice', {
    alias: 'f',
    type: 'number',
    description: 'Fixed price',
    default: undefined
  })
  .option('filename', {
    alias: 'o',
    type: 'string',
    description: 'Output filename',
    default: 'charging-report.xlsx'
  })
  .option('distributor', {
    alias: 'd',
    type: 'string',
    description: 'Distributor',
    default: 'elenia'
  })
  .option('pricingModel', {
    alias: 'p',
    type: 'string',
    description: 'Pricing model',
    choices: Object.keys(PricingModel),
    default: 'STANDARD'
  })
  .option('energyPriceCommission', {
    alias: 'e',
    type: 'number',
    description: 'Energy price commission in c/kWh',
    default: 0
  })
  .argv;

const main = async () => {
  const { year, month, fixedPrice, filename, distributor, pricingModel, energyPriceCommission } = argv;

  let fromDate = dayjs().year(Number(year)).month(Number(month) - 1).startOf('month');
  let toDate = dayjs().year(Number(year)).month(Number(month) - 1).endOf('month');
  const myDistributor = new Distributor(distributor);
  const pricingModelEnum = PricingModel[pricingModel as keyof typeof PricingModel];
  const token = await Zaptec.getToken(process.env.ZAPTEC_USERNAME, process.env.ZAPTEC_PASSWORD);
  const chargeHistory = await Zaptec.getChargeHistory(token, fromDate, toDate);

  chargeHistory.sort((a, b) => a.ts.unix() - b.ts.unix());

  const prices = fixedPrice ? undefined : await PoolPrice.getHourlyPrices(fromDate, toDate);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Charge History');

  worksheet.columns = [
    { header: 'Aikaleima', key: 'ts' },
    { header: 'kWh', key: 'kwh' },
    { header: 'Sähköenergia c / kWh', key: 'hourlyEnergyPrice' },
    { header: 'Komissio c / kWh', key: 'energyPriceCommission'},
    { header: 'Siirtomaksu c / kWh', key: 'hourlyDistributionFee' },
    { header: 'Sähkövero c / kWh', key: 'electricityTax' },
    { header: 'Kokonaishinta c / kWh ALV 0%', key: 'hourlyTotalPrice' },
    { header: 'Kustannus € ALV 0%', key: 'amount' },
    { header: 'Kustannus € ALV 24%', key: 'amountWithVat' }
  ];

  let totalKwh = 0;
  let totalAmount = 0;
  let totalHourlyPrice = 0;
  let numItems = 0;
  for (const item of chargeHistory) {
    const ts = item.ts;
    if(ts.isBefore(fromDate) || ts.isAfter(toDate)) continue; // Zaptec API returns data outside of the requested range
    const hour = ts.startOf("hour");
    if(item.kwh === 0) continue;
    const distributionFee = myDistributor.getRate(hour, pricingModelEnum);
    const hourlyEnergyPrice = fixedPrice && !isNaN(Number(fixedPrice)) ? Number(fixedPrice) : prices.find((price) => price.ts.isSame(hour)).price;
    if (hourlyEnergyPrice && !isNaN(hourlyEnergyPrice)) {
      numItems++;
      const hourlyTotalPrice = hourlyEnergyPrice + energyPriceCommission + distributionFee + ELECTRICITY_TAX;
      const amount = item.kwh * hourlyTotalPrice;
      const kwhr = Math.round(item.kwh*10000)/10000;
      const amtr = Math.round(amount*100)/10000;
      const amtrWithVat = Math.round(amount * VAT * 100) / 10000;
      totalKwh += kwhr;
      totalAmount += amtr;
      totalHourlyPrice += hourlyTotalPrice;
      worksheet.addRow({
        ts: ts.toISOString(),
        kwh: kwhr,
        hourlyEnergyPrice: hourlyEnergyPrice,
        energyPriceCommission: energyPriceCommission,
        hourlyDistributionFee: distributionFee,
        electricityTax: ELECTRICITY_TAX,
        hourlyTotalPrice: hourlyTotalPrice,
        amount: amtr,
        amountWithVat: amtrWithVat
      });
    }else{
      console.warn(`No price found for ${ts.toISOString()}`);
    }
  }
  worksheet.addRow({
    ts: 'Yhteensä',
    kwh: totalKwh,
    hourlyTotalPrice: Math.round(totalHourlyPrice/numItems*100)/100,
    amount: Math.round(totalAmount*100)/100,
    amountWithVat: Math.round(totalAmount * VAT * 100)/100
  });
  await workbook.xlsx.writeFile(filename);
};

main().then(() => console.log("done")).catch((e) => console.error(e));