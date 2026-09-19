/**
 * Node.js Runtime Features — Streams, Buffers & the File System
 *
 * GOAL
 * 1) Load the whole file into memory with fs.readFile, and log its size.
 * 2) Then flow the same file through a stream and pipe it to a writable stream (a copy).
 * 3) Then explain, in your own words, why the stream approach is preferable for
 *    large files.
 *
 * The starter already imports "fs" and "path" for you and points at a large
 * sample file ("sample-data.txt") that lives next to this script.
 *
 * Run it with: npm start
 */

const fs = require("fs");
const path = require("path");

// Paths to the sample file (do not hand-build paths with +)
const INPUT = path.join(__dirname, "sample-data.txt");
const OUTPUT = path.join(__dirname, "sample-copy.txt");

// ── PART 1: read the whole file into memory, then log its size ───────────────
function readWholeFile() {
  fs.readFile(INPUT, (err, data) => {
    if (err) {
      console.error(err.message);
      return;
    }

    console.log(`readFile: loaded ${data.length} bytes into memory at once`);
  });
}

// ── PART 2: stream the file and pipe it to a writable stream ────────────────
function streamFile() {
  const read = fs.createReadStream(INPUT);
  const write = fs.createWriteStream(OUTPUT);

  read.pipe(write);

  write.on("finish", () => {
    console.log(
      "stream: finished copying via chunks (peak memory stays flat)"
    );
  });
}

// ── PART 3: explain the difference ──────────────────────────────────────────
// fs.readFile loads the whole file into memory at once, so memory usage grows with the file size.
// A stream moves the file in small chunks, so it does not hold the whole file in memory and peak memory stays flat.

// Run both approaches
readWholeFile();
streamFile();

module.exports = { readWholeFile, streamFile, INPUT, OUTPUT };
