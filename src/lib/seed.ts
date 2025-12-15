import Database from 'better-sqlite3';
import db from './db';
import { createTables } from './schema';
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

function seedTranslation(
  verses: Array<{ verseNumber: number; text: string }>,
  translation: string,
  insertVerse: Database.Statement,
  insertPhrase: Database.Statement
): number {
  let totalPhrases = 0;

  for (const verse of verses) {
    const result = insertVerse.run(verse.verseNumber, translation, verse.text);
    const verseId = result.lastInsertRowid;

    const phrases = splitIntoPhrases(verse.text);

    phrases.forEach((phrase, index) => {
      insertPhrase.run(verseId, index + 1, phrase);
      totalPhrases++;
    });

    console.log(`[${translation.toUpperCase()}] Verse ${verse.verseNumber}: ${phrases.length} phrases`);
  }

  return totalPhrases;
}

function seed() {
  console.log('Creating tables...');
  createTables();
  
  console.log('Inserting verses...');
  const insertVerse = db.prepare('INSERT OR REPLACE INTO verses (verse_number, translation, verse_text) VALUES (?, ?, ?)');
  const insertPhrase = db.prepare('INSERT INTO phrases (verse_id, order_in_verse, phrase_text) VALUES (?, ?, ?)');
  
  db.exec('DELETE FROM phrases');
  db.exec('DELETE FROM verses');
  
  console.log('\n--- Seeding CSB Translation ---');
  const csbPhrases = seedTranslation(romans8CSB, 'csb', insertVerse, insertPhrase);

  console.log('\n--- Seeding ESV Translation ---');
  const esvPhrases = seedTranslation(romans8ESV, 'esv', insertVerse, insertPhrase);
  
  console.log(`\nSeeding complete!`);
  console.log(`Total verses: ${romans8CSB.length + romans8ESV.length} (39 CSB + 39 ESV)`);
  console.log(`Total phrases: ${csbPhrases + esvPhrases} (${csbPhrases} CSB + ${esvPhrases} ESV)`);
}

seed();
