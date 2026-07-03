PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pharmacies (
  id TEXT PRIMARY KEY,
  google_place_id TEXT NOT NULL UNIQUE,
  is_stocked INTEGER NOT NULL DEFAULT 1,
  last_visited_on TEXT,
  cached_name TEXT,
  cached_address TEXT,
  cached_lat REAL,
  cached_lng REAL,
  google_details_cached_at TEXT,
  google_place_id_refreshed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacies_place_id ON pharmacies (google_place_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_last_visited ON pharmacies (last_visited_on);
CREATE INDEX IF NOT EXISTS idx_pharmacies_stocked ON pharmacies (is_stocked);

CREATE TABLE IF NOT EXISTS pharmacy_events (
  id TEXT PRIMARY KEY,
  pharmacy_id TEXT NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_events_pharmacy_id ON pharmacy_events (pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_events_event_date ON pharmacy_events (event_date);
