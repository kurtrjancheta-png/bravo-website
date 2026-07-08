import { promises as fs } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'lib', 'reactions.json');

export async function getReactions() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid JSON, return empty object
    return {};
  }
}

async function writeDb(data) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write reactions database:', error);
  }
}

// Queue to serialize writes and prevent concurrency race conditions
let writeQueue = Promise.resolve();

export async function updateReaction(cardId, emojiType, username, action) {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const db = await getReactions();
        if (!db[cardId]) {
          db[cardId] = { love: [], like: [], salute: [] };
        }
        
        // Ensure emoji array exists
        if (!db[cardId][emojiType]) {
          db[cardId][emojiType] = [];
        }
        
        const userList = db[cardId][emojiType];
        const userIndex = userList.indexOf(username);
        
        if (action === 'react') {
          if (userIndex === -1) {
            userList.push(username);
          }
        } else if (action === 'unreact') {
          if (userIndex !== -1) {
            userList.splice(userIndex, 1);
          }
        }
        
        await writeDb(db);
        resolve(db[cardId]);
      } catch (err) {
        reject(err);
      }
    });
  });
}
