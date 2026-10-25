import { loadArchive } from '../src/lib/archive';

const archive = loadArchive();
console.log(`Public content validated: ${archive.records.length} records, ${archive.logs.length} logs.`);
