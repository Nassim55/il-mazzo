-- One "space" per sync key (stored only as the key's SHA-256 hash). Its version goes
-- up by one with every save, so a save based on an out-of-date copy can be refused.
CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- One row per progress store (a section's stats, review schedule, associations, the
-- story): its JSON as last agreed, or NULL once emptied by a reset, and its epoch.
CREATE TABLE items (
  space_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  epoch INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (space_id, key)
);
