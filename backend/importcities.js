console.log("import cities started...");

import fs from "fs";
import Database from "better-sqlite3";

// 1️⃣ DB erstellen/öffnen
const db = new Database("cities.db");

// 2️⃣ Tabelle anlegen (falls noch nicht vorhanden)
db.exec(`
CREATE TABLE IF NOT EXISTS cities (
    geoname_id TEXT PRIMARY KEY,
    name TEXT,
    ascii_name TEXT,
    alternate_names TEXT,
    country_code TEXT,
    cou_name_en TEXT,
    admin1_code TEXT,
    admin2_code TEXT,
    population INTEGER,
    lat REAL,
    lon REAL
)
`);

// 3️⃣ JSON laden
console.log("📥 Lade cities.json...");
const cities = JSON.parse(fs.readFileSync("cities.json", "utf8"));
console.log(`✅ ${cities.length} Städte geladen.`);

// 4️⃣ Prepared Statement zum Einfügen
const insert = db.prepare(`
INSERT OR REPLACE INTO cities
(geoname_id, name, ascii_name, alternate_names, country_code, cou_name_en, admin1_code, admin2_code, population, lat, lon)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((rows) => {
  for (const city of rows) {
    insert.run(
      city.geoname_id,
      city.name,
      city.ascii_name,
      JSON.stringify(city.alternate_names || []),
      city.country_code,
      city.cou_name_en,
      city.admin1_code,
      city.admin2_code,
      city.population || 0,
      city.coordinates?.lat || null,
      city.coordinates?.lon || null
    );
  }
});

// 5️⃣ Daten importieren
console.log("🚀 Importiere Städte...");
insertMany(cities);
console.log("🎉 Fertig! Alles in cities.db gespeichert.");
