import express from "express";
import fs from "fs";
import cors from "cors";
import Database from "better-sqlite3";
import rateLimit from "express-rate-limit";
import xss from "xss"; // optional, nur falls du XSS-Schutz brauchst

const app = express();
const PORT = 3000;

// Rate Limit: 100 requests pro IP pro Minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS nur für deine Seite
app.use(cors({
  origin: "https://geo-scope.netlify.app",
  optionsSuccessStatus: 200
}));

// Middleware: Nur Anfragen mit korrekt referer zulassen (optional, nicht narrensicher!)
app.use((req, res, next) => {
  const referer = req.get("Referer");
  if (referer && !referer.startsWith("https://geo-scope.netlify.app")) {
    return res.status(403).json({ error: "Forbidden - Invalid referer" });
  }
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  console.log("📥 Request:", req.method, req.url);
  next();
});

// SQLite DB laden
const db = new Database("cities.db");

// Länder laden
let countries = [];
try {
  countries = JSON.parse(fs.readFileSync("countries.json"));
} catch (err) {
  console.error("❌ Fehler beim Laden von countries.json:", err.message);
}

// Input-Sanitizing-Helfer
function sanitize(input) {
  return String(input)
    .replace(/[^a-z0-9äöüß\- ]/gi, "")
    .trim()
    .toLowerCase();
}

// /countries/search
app.get("/geoscope/countries/search", (req, res) => {
  const q = sanitize(req.query.q || "");
  if (!q) return res.json([]);

  const results = countries
    .map(country => {
      let score = 0;
      if (country.name?.common?.toLowerCase().includes(q)) score += 10;
      if (country.name?.official?.toLowerCase().includes(q)) score += 8;

      const searchFields = ["capital", "region", "subregion", "cca2", "cca3", "cioc"];
      searchFields.forEach(field => {
        const value = country[field];
        if (!value) return;

        if (Array.isArray(value)) {
          value.forEach(v => {
            if (sanitize(v).includes(q)) score += 3;
          });
        } else {
          if (sanitize(value).includes(q)) score += 3;
        }
      });

      deepSearch(country, q, matchScore => score += matchScore);
      return { ...country, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  res.json(results);
});

function deepSearch(obj, term, addScore) {
  for (const key in obj) {
    if (["name"].includes(key)) continue;

    const value = obj[key];
    if (value == null) continue;

    if (typeof value === "string" || typeof value === "number") {
      if (sanitize(value).includes(term)) addScore(1);
    } else if (Array.isArray(value)) {
      value.forEach(v => {
        if (typeof v === "string" || typeof v === "number") {
          if (sanitize(v).includes(term)) addScore(1);
        } else if (typeof v === "object") {
          deepSearch(v, term, addScore);
        }
      });
    } else if (typeof value === "object") {
      deepSearch(value, term, addScore);
    }
  }
}

// /countries/random
app.get("/geoscope/countries/random", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50
  const shuffled = [...countries];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  res.json(shuffled.slice(0, limit));
});

// /cities/search
app.get("/geoscope/cities/search", (req, res) => {
  const q = sanitize(req.query.q || "");
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

// /cities/random
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
  console.log(`✅ Server läuft auf http://localhost:${PORT}`)
);
