import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:romans8.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});
async function createTables() {
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      translation TEXT DEFAULT 'csb',
      created_at TEXT
    )`,
    args: []
  });

  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY,
      verse_number INTEGER,
      translation TEXT DEFAULT 'csb',
      verse_text TEXT,
      UNIQUE(verse_number, translation)
    )`,
    args: []
  });

  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS phrases (
      id INTEGER PRIMARY KEY,
      verse_id INTEGER,
      order_in_verse INTEGER,
      phrase_text TEXT,
      FOREIGN KEY (verse_id) REFERENCES verses(id)
    )`,
    args: []
  });

  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS phrase_progress (
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
    )`,
    args: []
  });

  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS practice_events (
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
    )`,
    args: []
  });
}
import { romans8CSB } from './romans8-data';
import { romans8ESV } from './romans8-esv';

function splitIntoPhrases(verseText: string): string[] {
  const phrases: string[] = [];
  
  const segments = verseText.split(/([,;:—.!?])/);
  
  let currentPhrase = '';
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    if (/^[,;:—.!?]$/.test(segment)) {
      currentPhrase += segment;
      continue;
    }
    
    const trimmed = segment.trim();
    if (!trimmed) continue;
    
    const words = trimmed.split(/\s+/);
    
    if (currentPhrase) {
      const currentWords = currentPhrase.trim().split(/\s+/).filter(w => w);
      const combinedWords = currentWords.length + words.length;
      
      if (combinedWords <= 12 && currentWords.length < 3) {
        currentPhrase = currentPhrase.trim() + ' ' + trimmed;
        continue;
      } else {
        if (currentPhrase.trim()) {
          phrases.push(currentPhrase.trim());
        }
        currentPhrase = trimmed;
      }
    } else {
      currentPhrase = trimmed;
    }
    
    const phraseWords = currentPhrase.trim().split(/\s+/).filter(w => w);
    if (phraseWords.length >= 3 && phraseWords.length <= 12) {
      continue;
    }
    
    if (phraseWords.length > 12) {
      const wordsArr = currentPhrase.trim().split(/\s+/);
      while (wordsArr.length > 12) {
        const chunk = wordsArr.splice(0, Math.min(8, wordsArr.length));
        phrases.push(chunk.join(' '));
      }
      currentPhrase = wordsArr.join(' ');
    }
  }
  
  if (currentPhrase.trim()) {
    const finalWords = currentPhrase.trim().split(/\s+/).filter(w => w);
    if (finalWords.length > 0) {
      if (finalWords.length < 3 && phrases.length > 0) {
        const lastPhrase = phrases.pop()!;
        const lastWords = lastPhrase.split(/\s+/);
        if (lastWords.length + finalWords.length <= 12) {
          phrases.push(lastPhrase + ' ' + currentPhrase.trim());
        } else {
          phrases.push(lastPhrase);
          phrases.push(currentPhrase.trim());
        }
      } else {
        phrases.push(currentPhrase.trim());
      }
    }
  }
  
  return phrases.filter(p => p.length > 0);
}

async function seedTranslation(
  verses: Array<{ verseNumber: number; text: string }>,
  translation: string
): Promise<number> {
  let totalPhrases = 0;

  for (const verse of verses) {
    const result = await db.execute({
      sql: 'INSERT OR REPLACE INTO verses (verse_number, translation, verse_text) VALUES (?, ?, ?)',
      args: [verse.verseNumber, translation, verse.text]
    });
    const verseId = Number(result.lastInsertRowid);

    const phrases = splitIntoPhrases(verse.text);

    for (let index = 0; index < phrases.length; index++) {
      await db.execute({
        sql: 'INSERT INTO phrases (verse_id, order_in_verse, phrase_text) VALUES (?, ?, ?)',
        args: [verseId, index + 1, phrases[index]]
      });
      totalPhrases++;
    }

    console.log(`[${translation.toUpperCase()}] Verse ${verse.verseNumber}: ${phrases.length} phrases`);
  }

  return totalPhrases;
}

async function seed() {
  console.log('Creating tables...');
  await createTables();
  
  console.log('Inserting verses...');
  
  await db.execute({ sql: 'DELETE FROM phrases', args: [] });
  await db.execute({ sql: 'DELETE FROM verses', args: [] });
  
  console.log('\n--- Seeding CSB Translation ---');
  const csbPhrases = await seedTranslation(romans8CSB, 'csb');

  console.log('\n--- Seeding ESV Translation ---');
  const esvPhrases = await seedTranslation(romans8ESV, 'esv');
  
  console.log(`\nSeeding complete!`);
  console.log(`Total verses: ${romans8CSB.length + romans8ESV.length} (39 CSB + 39 ESV)`);
  console.log(`Total phrases: ${csbPhrases + esvPhrases} (${csbPhrases} CSB + ${esvPhrases} ESV)`);
}

seed();
