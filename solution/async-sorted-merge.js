"use strict";

const { v4: uuidv4 } = require("uuid");
const { LRUCache } = require("lru-cache");

// Print all entries, across all of the *async* sources, in chronological order.
async function nextEntry(source) {
  if (source.drained) return null;
  const entry = await source.popAsync();
  return entry;
}

// Print all entries, across all of the sources, in chronological order.
async function printLogEntries(logSources, printer) {
  // Create an LRU cache with a maximum size of 1000 entries
  const cache = new LRUCache({ max: 1000 });

  async function getOldestSource(sources) {
    let oldestSource = null;
    let oldestEntry = null;
    // merge-sort
    for (const source of sources) {
      const cacheKey = source.id;
      // pop is being created depending if random time over current date
      const entry = cacheKey ? cache.get(cacheKey) : await nextEntry(source);
      if (entry) {
        if (!oldestEntry || entry.date < oldestEntry.date) {
          oldestEntry = entry;
          oldestSource = source;
        } else {
          if (!cacheKey) {
            source.id = uuidv4();
          }
          cache.set(cacheKey, entry);
        }
      }
    }
    return { oldestSource, oldestEntry };
  }
  // loop through all sources
  let allDrained = false;
  while (!allDrained) {
    const { oldestSource, oldestEntry } = await getOldestSource(logSources);
    if (oldestEntry) {
      printer.print(oldestEntry);
    } else {
      allDrained = true;
    }
  }
  printer.done();
}

module.exports = (logSources, printer) => {
  return new Promise((resolve, reject) => {
    printLogEntries(logSources, printer)
      .then(() => {
        resolve(console.log("Async sort complete."));
      })
      .catch((error) => {
        console.error("Async error:", error);
        reject(error);
      });
  });
};
