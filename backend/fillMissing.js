import fs from "fs";
import fetch from "node-fetch";

const FILE = "countries.json";
const countries = JSON.parse(fs.readFileSync(FILE, "utf-8"));

async function enrichCountries() {
  let updated = 0;
  let skipped = 0;

  for (const country of countries) {
    const code = country.cca3;
    if (!code) {
      skipped++;
      continue;
    }

    try {
      console.log(`🌍 Hole Daten für ${code}…`);

      // ✅ API-Call (holt ALLE Daten)
      const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
      if (!res.ok) {
        console.error(`❌ API-Fehler für ${code}:`, res.status);
        skipped++;
        continue;
      }

      const data = await res.json();
      const apiCountry = Array.isArray(data) ? data[0] : data;

      if (!apiCountry) {
        console.log(`⚠️ Keine Daten für ${code}`);
        skipped++;
        continue;
      }

      // ✅ Vergleichen und fehlende Felder ergänzen
      let changed = false;
      for (const key of Object.keys(apiCountry)) {
        if (!(key in country)) {       // Feld fehlt bei dir
          country[key] = apiCountry[key];
          changed = true;
          console.log(`➕ ${code}: Feld "${key}" ergänzt`);
        }
      }

      if (changed) updated++;

      // kleine Pause, damit API nicht zu schnell abgefragt wird
      await new Promise(r => setTimeout(r, 150));

    } catch (err) {
      console.error(`❌ Fehler bei ${code}:`, err.message);
      skipped++;
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(countries, null, 2));
  console.log(`✅ Fertig! ${updated} Länder ergänzt, ${skipped} übersprungen.`);
}

enrichCountries();
