"use strict";

const { uniqueId } = require("lodash");

// Print all entries, across all of the *async* sources, in chronological order.
async function nextEntry(source) {
  if (source.drained) return null;
  const entry = await source.popAsync();
  return entry;
}

// Print all entries, across all of the sources, in chronological order.
async function printLogEntries(logSources, printer) {
  // we might hit the entry several times so cache it
  const cachedEntries = {};

  async function getOldestSource(sources) {
    let oldestSource = null;
    let oldestEntry = null;
    // merge-sort
    for (const source of sources) {
      // pop is being created depending if random time over current date
      const entry = source.id
        ? cachedEntries[source.id].pop()
        : await nextEntry(source);
      if (entry) {
        if (!oldestEntry || entry.date < oldestEntry.date) {
          oldestEntry = entry;
          oldestSource = source;
        } else {
          if (!source.id) {
            source.id = uniqueId();
            cachedEntries[source.id] = [];
          }
          cachedEntries[source.id].push(entry);
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
