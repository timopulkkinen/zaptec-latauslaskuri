# Zaptec kuukausiraportti (latausetu)

Simppeli skripti, jolla pystyy luomaan kuukausittaisen latauskustannusraportin .xlsx -muodossa Zaptecin APIa hyödyntäen.
Nordpoolin hintatiedot haetaan osoitteesta http://sahkotin.fi/prices , propsit tekijälle.

Sähkövero ja ALV-prosentti on määritelty vakioksi `src/types.ts` -tiedostossa. Voisi olla komentoriviparametrikin, mutta eipä ehtinyt.

Esimerkki komentorivistä:
```bash
ZAPTEC_USERNAME=apiuse ZAPTEC_PASSWORD=apipassword node dist/index.js -y 2024 -m 08 -e 0.363 -o charging-report-202408.xlsx    
```

## Komentoriviargumentit:
- `-y`: Vuosi, jolta lataushistoriaa haetaan (pakollinen)
- `-m`: Kuukausi, jolta lataushistoriaa haetaan (pakollinen)
- `-e`: Pörssisähkön komissio euroissa, esim. 0.4 (pakollinen, jos ei -f)
- `-f`: Kiinteä sähkön hinta / kWh euroissa 
- `-o`: Tulostiedoston nimi, esim xyz.xlsx (pakollinen)
- `-p`: Siirtohinnan sopimustyyppi [STANDARD, NIGHT_TIME_REDUCED, SEASONAL_REDUCED] = [perus, yösähkö, vuodenaikasähkö]
- `-d`: Siirtoyhtiö, jonka hintoja käytetään. Näitä voi lisätä `public/transfer_rates.json` tiedostoon, vakiona löytyy Elenia.


# Kääntäminen ja riippuvuuksien asennus

Asenna NodeJS ja npm, jonka jälkeen suorita seuraavat komennot:
```bash
npm install
npm run build
```

Testattu Node.js versiolla v20.13.1. Toimii MacOS:lla, muista käyttiksistä ei tietoa.

Lisenssi MIT License. Tekijä ei ota vastuuta mistään vahingoista jne. Koodia saa vapaasti käyttää, forkata, muunnella jne.
