import { Client } from '@libsql/client';
import db from './db';

export async function createTables(client: Client = db) {
  await client.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        translation TEXT DEFAULT 'csb',
        created_at TEXT
      )
    `,
    args: []
  });

  await client.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY,
        verse_number INTEGER,
        translation TEXT DEFAULT 'csb',
        verse_text TEXT,
        UNIQUE(verse_number, translation)
      )
    `,
    args: []
  });

  await client.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS phrases (
        id INTEGER PRIMARY KEY,
        verse_id INTEGER,
        order_in_verse INTEGER,
        phrase_text TEXT,
        FOREIGN KEY (verse_id) REFERENCES verses(id)
      )
    `,
    args: []
  });

  await client.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS phrase_progress (
        id INTEGER PRIMARY KEY,
        user_id TEXT,
        phrase_id INTEGER,
        ease_factor REAL DEFAULT 2.5,
        interval_days INTEGER DEFAULT 0,
        due_date TEXT,
        repetitions INTEGER DEFAULT 0,
        lapses INTEGER DEFAULT 0,
        mastery_level INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (phrase_id) REFERENCES phrases(id)
      )
    `,
    args: []
  });

  await client.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS practice_events (
        id INTEGER PRIMARY KEY,
        user_id TEXT,
        phrase_id INTEGER,
        event_type TEXT,
        hint_level INTEGER,
        input_text TEXT,
        score REAL,
        self_rating TEXT,
        duration_ms INTEGER,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (phrase_id) REFERENCES phrases(id)
      )
    `,
    args: []
  });
}
