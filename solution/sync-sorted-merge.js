"use strict";

function nextEntry(source) {
  if (source.drained) return null;
  const entry = source.pop();
  return entry;
}

// Print all entries, across all of the sources, in chronological order.
function printLogEntries(logSources, printer) {
  function getOldestSource(sources) {
    let oldestSource = null;
    let oldestEntry = null;
    // merge-sort
    for (const source of sources) {
      // pop is being created depending if random time over current date
      const entry = nextEntry(source);
      if (entry && (!oldestEntry || entry.date < oldestEntry.date)) {
        oldestEntry = entry;
        oldestSource = source;
      }
    }
    return { oldestSource, oldestEntry };
  }
  // loop through all sources
  let allDrained = false;
  while (!allDrained) {
    const { oldestSource, oldestEntry } = getOldestSource(logSources);
    if (oldestEntry) {
      printer.print(oldestEntry);
    } else {
      allDrained = true;
    }
  }
  printer.done();
}

module.exports = (logSources, printer) => {
  printLogEntries(logSources, printer);
  return console.log("Sync sort complete.");
};

// if we are limited by memory, could we print out to a file, knowing the head and tail toDateString();
// of that file, saving just the head and tail? If a new logSource is within those date, we could reopen the file to add that in.
// NOTE: file saving could be slow
