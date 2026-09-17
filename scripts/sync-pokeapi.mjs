import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePokemon, normalizeSpecies, normalizeMove, normalizeItem, normalizeResource } from '../src/data/normalize.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'data', 'pokeapi');
const base = 'https://pokeapi.co/api/v2';
const args = new Set(process.argv.slice(2));
const config = { pokemon: normalizePokemon, species: normalizeSpecies, moves: normalizeMove, items: normalizeItem, types: normalizeResource, abilities: normalizeResource, generations: normalizeResource, pokedexes: normalizeResource, forms: normalizeResource, evolutions: normalizeResource, 'version-groups': normalizeResource, versions: normalizeResource, locations: normalizeResource, 'location-areas': normalizeResource, 'encounter-methods': normalizeResource, 'encounter-conditions': normalizeResource, 'encounter-condition-values': normalizeResource };
const endpoint = { pokemon: 'pokemon', species: 'pokemon-species', moves: 'move', items: 'item', types: 'type', abilities: 'ability', generations: 'generation', pokedexes: 'pokedex', forms: 'pokemon-form', evolutions: 'evolution-chain', 'version-groups': 'version-group', versions: 'version', locations: 'location', 'location-areas': 'location-area', 'encounter-methods': 'encounter-method', 'encounter-conditions': 'encounter-condition', 'encounter-condition-values': 'encounter-condition-value' };
const options = { concurrency: Number(process.env.POKEAPI_CONCURRENCY || 6), timeout: 15000, retries: 3 };

const request = async url => {
  let error;
  for (let attempt = 0; attempt <= options.retries; attempt++) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), options.timeout);
    try { const response = await fetch(url, { signal: controller.signal }); if (!response.ok) throw Error(`HTTP ${response.status}: ${url}`); return response.json(); }
    catch (caught) { error = caught; if (attempt < options.retries) await new Promise(resolve => setTimeout(resolve, 300 * 2 ** attempt)); }
    finally { clearTimeout(timer); }
  }
  throw error;
};
const mapConcurrent = async (values, worker) => { const result = []; let cursor = 0; const run = async () => { while (cursor < values.length) { const index = cursor++; result[index] = await worker(values[index]); } }; await Promise.all(Array.from({ length: Math.min(options.concurrency, values.length) }, run)); return result; };
const write = async (file, value) => { await mkdir(dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(value, null, 2) + '\n'); };
const paginated = async resource => {
  const first = await request(`${base}/${resource}?limit=100&offset=0`);
  const pages = await mapConcurrent(Array.from({ length: Math.ceil((first.count - first.results.length) / 100) }, (_, i) => i + 1), page => request(`${base}/${resource}?limit=100&offset=${page * 100}`));
  return { count: first.count, results: first.results.concat(pages.flatMap(page => page.results)) };
};
const download = async (url, file) => { const response = await fetch(url); if (!response.ok) throw Error(`HTTP ${response.status}: ${url}`); await mkdir(dirname(file), { recursive: true }); await writeFile(file, Buffer.from(await response.arrayBuffer())); };

async function sync() {
  const manifest = { schema: 1, source: base, syncedAt: new Date().toISOString(), resources: {} };
  for (const [name, normalize] of Object.entries(config)) {
    const listing = await paginated(endpoint[name]);
    const entries = await mapConcurrent(listing.results, async item => {
      const payload = await request(item.url);
      if (name === 'pokemon' && payload.species?.url) payload.species = await request(payload.species.url);
      return normalize(payload);
    });
    const index = entries.map(({ id, name: en, names }) => ({ id, name: en, names }));
    const indexFile = `data/pokeapi/${name}/index.json`;
    await write(join(root, indexFile), index);
    const segments = [];
    for (let offset = 0; offset < entries.length; offset += 100) { const chunk = entries.slice(offset, offset + 100); const from = chunk[0].id, to = chunk.at(-1).id; const file = `data/pokeapi/${name}/segments/${from}-${to}.json`; await write(join(root, file), Object.fromEntries(chunk.map(item => [item.id, item]))); segments.push({ from, to, file }); }
    manifest.resources[name] = { count: listing.count, index: indexFile, segments };
    if (name === 'pokemon' && !args.has('--no-assets')) {
      manifest.assets = { ...(manifest.assets || {}), pokemonArtwork: 'data/pokeapi/assets/pokemon/{id}.png' };
      await mapConcurrent(entries.filter(item => item.sprites.artwork), item => download(item.sprites.artwork, join(root, `data/pokeapi/assets/pokemon/${item.id}.png`)));
    }
    if (name === 'items' && !args.has('--no-assets')) {
      manifest.assets = { ...(manifest.assets || {}), items: 'data/pokeapi/assets/items/{id}.png' };
      await mapConcurrent(entries.filter(item => item.sprite), item => download(item.sprite, join(root, `data/pokeapi/assets/items/${item.id}.png`)));
    }
  }
  if (!args.has('--no-assets')) {
    manifest.assets = { ...(manifest.assets || {}), types: 'data/pokeapi/assets/types/{id}.png' };
    const typeIds = { normal: 1, fighting: 2, flying: 3, poison: 4, ground: 5, rock: 6, bug: 7, ghost: 8, steel: 9, fire: 10, water: 11, grass: 12, electric: 13, psychic: 14, ice: 15, dragon: 16, dark: 17, fairy: 18 };
    await mapConcurrent(Object.values(typeIds), id => download(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${id}.png`, join(root, `data/pokeapi/assets/types/${id}.png`)));
  }
  await write(join(out, 'manifest.json'), manifest);
  console.log(`Snapshot sincronizado em ${manifest.syncedAt}`);
}

async function validate() { const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8')); if (manifest.schema !== 1 || !manifest.syncedAt || !manifest.resources) throw Error('Manifesto inválido'); for (const resource of Object.values(manifest.resources)) { await readFile(join(root, resource.index)); for (const segment of resource.segments) await readFile(join(root, segment.file)); } console.log('Snapshot válido'); }
if (args.has('--validate')) validate().catch(error => { console.error(error.message); process.exitCode = 1; }); else sync().catch(error => { console.error(error); process.exitCode = 1; });
