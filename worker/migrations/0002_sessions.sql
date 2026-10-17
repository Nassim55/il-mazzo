-- Sign-ins: one row per signed-in device. The token itself is never stored, only its
-- SHA-256 hash; space_id is the account's space (the hash of its Google account ID).
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_space ON sessions (space_id);
