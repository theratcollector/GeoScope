import fs from "fs";
import fetch from "node-fetch";

const countries = JSON.parse(fs.readFileSync("countries.json", "utf-8"));

async function updateFlags() {
  let updated = 0;
  let skipped = 0;

  for (const country of countries) {
    const code = country.cca3;
    if (!code) {
      skipped++;
      continue;
    }

    // ✅ Falls Flags schon existieren → überspringen
    if (country.flags && country.flags.png && country.flags.svg) {
      console.log(`⏩ ${code}: Flags schon vorhanden, übersprungen`);
      skipped++;
      continue;
    }

    try {
      // Anfrage an RestCountries (nur Flags)
      const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}?fields=flags`);
      if (!res.ok) {
        console.error(`❌ Fehler für ${code}:`, res.status);
        skipped++;
        continue;
      }

      const data = await res.json();
      const flagData = Array.isArray(data) ? data[0]?.flags : data?.flags;

      if (flagData) {
        country.flags = flagData;   // ✅ Flags hinzufügen
        updated++;
        console.log(`✅ ${code}: Flags hinzugefügt`);
      } else {
        console.log(`⚠️ ${code}: keine Flags gefunden`);
        skipped++;
      }

      // kurze Pause, um API nicht zu stressen
      await new Promise(r => setTimeout(r, 20));

    } catch (err) {
      console.error(`❌ Request-Fehler für ${code}:`, err.message);
      skipped++;
    }
  }

  // ✅ geänderte JSON zurückschreiben
  fs.writeFileSync("countries.json", JSON.stringify(countries, null, 2));
  console.log(`🏁 Fertig: ${updated} neue Flags ergänzt, ${skipped} übersprungen.`);
}

updateFlags();
