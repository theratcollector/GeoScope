import express from "express";
import fs from "fs";
import cors from "cors";
import Database from "better-sqlite3"; 
import rateLimit from 'express-rate-limit'

const app = express();
const PORT = 3000;

let countries = JSON.parse(fs.readFileSync("countries.json"));

// 👉 SQLite DB laden
const db = new Database("cities.db");

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 100,            // Max 100 Requests pro IP/Minute
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

app.use(express.json());
app.use(cors({
  origin: 'https://geo-scope.netlify.app.netlify.app'
}))


app.use((req, res, next) => {
  console.log("📥 Request:", req.method, req.url);
  next();
});

/**
 * Länder-Suchfunktion mit Scoring
 */
app.get("/geoscope/countries/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  if (!q) return res.json([]);

  const results = countries
    .map(country => {
      let score = 0;

      if (country.name?.common?.toLowerCase().includes(q)) score += 10;
      if (country.name?.official?.toLowerCase().includes(q)) score += 8;

      const searchFields = [
        "capital",
        "region",
        "subregion",
        "cca2",
        "cca3",
        "cioc"
      ];

      searchFields.forEach(field => {
        const value = country[field];
        if (!value) return;

        if (Array.isArray(value)) {
          value.forEach(v => {
            if (v.toString().toLowerCase().includes(q)) score += 3;
          });
        } else {
          if (value.toString().toLowerCase().includes(q)) score += 3;
        }
      });

      deepSearch(country, q, (matchScore) => {
        score += matchScore;
      });

      return { ...country, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  res.json(results);
});

/**
 * Hilfsfunktion: durchsucht rekursiv das Objekt
 */
function deepSearch(obj, term, addScore) {
  for (const key in obj) {
    if (["name"].includes(key)) continue;

    const value = obj[key];
    if (value === null || value === undefined) continue;

    if (typeof value === "string" || typeof value === "number") {
      if (value.toString().toLowerCase().includes(term)) {
        addScore(1);
      }
    } else if (Array.isArray(value)) {
      value.forEach(v => {
        if (typeof v === "string" || typeof v === "number") {
          if (v.toString().toLowerCase().includes(term)) {
            addScore(1);
          }
        } else if (typeof v === "object") {
          deepSearch(v, term, addScore);
        }
      });
    } else if (typeof value === "object") {
      deepSearch(value, term, addScore);
    }
  }
}

/**
 * Random-Länder-Endpunkt
 */
app.get("/geoscope/countries/random", (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : null;

  const shuffled = [...countries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  res.json(limit ? shuffled.slice(0, limit) : shuffled);
});

/**
 * 🏙️ Cities Search
 * GET /cities/search?q=term
 */
app.get("/geoscope/cities/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  if (!q) return res.json([]);

  const stmt = db.prepare(`
    SELECT * FROM cities
    WHERE LOWER(name) LIKE ?
       OR LOWER(ascii_name) LIKE ?
       OR LOWER(alternate_names) LIKE ?
    ORDER BY population DESC
    LIMIT 500
  `);

  const results = stmt.all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(results);
});

/**
 * 🏙️ Cities Random (10 zufällige Städte)
 * GET /cities/random
 */
app.get("/geoscope/cities/random", (req, res) => {
  const stmt = db.prepare(`
    SELECT * FROM cities
    ORDER BY RANDOM()
    LIMIT 9
  `);

  const results = stmt.all();
  res.json(results);
});

app.listen(PORT, () =>
  console.log(`✅ Server alive on port http://localhost:${PORT}`)
);
