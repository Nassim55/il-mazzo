-- A spasso's voices: each phrase is made once by Google Text-to-Speech and kept here,
-- so playing a card again never costs another request. key is the SHA-256 of the voice,
-- speed, sample rate and text; audio is the MP3 as base64, as Google returns it.
CREATE TABLE tts_clips (
  key TEXT PRIMARY KEY,
  voice TEXT NOT NULL,
  text TEXT NOT NULL,
  audio TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX tts_clips_created ON tts_clips (created_at);
