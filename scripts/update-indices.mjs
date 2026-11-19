// Refreshes src/data/marketIndices.json, the price and wage index history the Market
// Exposure page reads.
//
// Source: https://data.cainmenard.com/feeds/indices.json, built by the look-ahead-data
// pipeline from each agency's own API (BLS for everything used here). This script copies
// values exactly as published there. It does not round, average or recompute anything, so
// an index reads the same in this app as it does on data.cainmenard.com.
//
// Why a committed snapshot and not a fetch in the browser: the app promises that nothing
// leaves the browser, a build should not fail because another site is down, and bid-era
// index history does not change from day to day. Run this when new months matter:
//
//   node scripts/update-indices.mjs                  # from the live feed
//   node scripts/update-indices.mjs --from feed.json # from a local copy of the feed
import {readFileSync, writeFileSync} from 'node:fs';

const FEED_URL = 'https://data.cainmenard.com/feeds/indices.json';
const OUT = new URL('../src/data/marketIndices.json', import.meta.url);

// The series the app uses, in the order the index picker shows them. Everything here is a
// monthly BLS series. To add one, add its key from the feed and it appears in the picker
// (materials group) with no other change.
const MATERIALS = [
  'ppi_construction_materials',
  'ppi_inputs_nonres',
  'ppi_steel_mill',
  'ppi_hot_rolled_bars_shapes',
  'ppi_fab_structural_commodity',
  'ppi_copper_wire_cable',
  'ppi_ready_mix',
  'ppi_lumber',
];
const WAGES = ['construction_ahe'];

const fromFlag = process.argv.indexOf('--from');
const feed = fromFlag > -1
  ? JSON.parse(readFileSync(process.argv[fromFlag + 1], 'utf8'))
  : await (await fetch(FEED_URL)).json();

const series = {};
for (const [role, keys] of [['materials', MATERIALS], ['wages', WAGES]]) {
  for (const key of keys) {
    const s = feed.series[key];
    // Fail loudly: a missing series means the feed changed and the app would show a hole.
    if (!s) throw new Error(`feed has no series "${key}"`);
    if (s.frequency !== 'M') throw new Error(`"${key}" is not monthly`);
    series[key] = {
      role,
      title: s.title,
      units: s.units,
      seasonal: s.seasonal,
      source_id: s.source_id,
      source_url: s.source_url,
      credit: s.credit,
      page: s.page,
      // [month, value]. The month is the first seven characters of the feed's period
      // ("2021-06-01" becomes "2021-06"); the value is untouched.
      observations: s.observations.map(([period, value]) => [period.slice(0, 7), value]),
    };
  }
}

const out = {
  source: FEED_URL,
  generated_at: feed.generated_at,
  launch_date: feed.launch_date,
  history_note: feed.history_note,
  series,
};
writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(`marketIndices.json: ${Object.keys(series).length} series, feed generated ${feed.generated_at}`);
