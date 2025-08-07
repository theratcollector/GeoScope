import pkg from "xlsx";
const { readFile, utils } = pkg;
import fs from "fs";

// JSON & Excel lesen
const countries = JSON.parse(fs.readFileSync("countries.json"));
const workbook = readFile("FIW_DATA.xlsx");
const sheet = workbook.Sheets["FIW13-25"];

// Alle Zeilen als Array (header: 1)
const rows = utils.sheet_to_json(sheet, { defval: null, header: 1 });

const headerRow = rows[1]; // Zeile 2 = echte Spaltenüberschriften
console.log("📋 Erkannte Spaltenüberschriften:", headerRow);

let added = 0;
let skipped = 0;

// Ab Zeile 3: echte Daten
for (let i = 2; i < rows.length; i++) {
  const row = rows[i];
  if (!row[0]) continue; // leere Zeile überspringen

  const countryName = row[0]; // A-Spalte = Country/Territory
  const country = countries.find(c =>
    c.name?.common?.toLowerCase() === countryName.toLowerCase()
  );

  if (country) {
    const fiwData = {};
    for (let j = 1; j < headerRow.length; j++) {
      const key = headerRow[j];
      const value = row[j];
      fiwData[key] = value;
    }

    country.fiw = fiwData;
    added++;
  } else {
    skipped++;
  }
}

fs.writeFileSync("countries.json", JSON.stringify(countries, null, 2));
console.log(`✅ Merge abgeschlossen: ${added} Länder ergänzt, ${skipped} ohne Match.`);
