import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePokemon } from '../src/data/normalize.js';
import { createCache } from '../src/data/cache.js';
import { createRepository } from '../src/data/repository.js';
import { createLocalData } from '../src/data/local-data.js';
import { createApi } from '../src/data/api.js';
import { description } from '../src/games/moves.js';
import { cap } from '../src/shared.js';

test('normaliza nomes PT-BR e campos principais', () => {
  const value = normalizePokemon({ id: 25, name: 'pikachu', species: { names: [{ language: { name: 'pt-BR' }, name: 'Pikachu' }] }, types: [{ slot: 1, type: { name: 'electric' } }], stats: [{ base_stat: 35, stat: { name: 'hp' } }] });
  assert.deepEqual(value.names, { en: 'pikachu', pt: 'Pikachu' }); assert.equal(value.stats.hp, 35);
});
test('cache persiste valores serializáveis', () => { const store = new Map(); const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) }; const first = createCache({ storage }); first.set('x', { ok: true }); assert.deepEqual(createCache({ storage }).get('x'), { ok: true }); });
test('repositório prioriza local e usa fallback online', async () => { const calls = []; const repo = createRepository({ local: { get: async (r, id) => id === '1' ? { id: 1 } : undefined }, api: async path => { calls.push(path); return { id: 2 }; } }); assert.equal((await repo.get('pokemon', '1')).source, 'local'); assert.equal((await repo.get('pokemon', '2')).source, 'online'); assert.deepEqual(calls, ['/pokemon/2']); });
test('manifesto resolve registros no segmento correto', async () => {
  const files = { 'pokemon/index.json': [{ id: 25 }], 'pokemon/segments/25-25.json': { '25': { id: 25, name: 'pikachu' } } };
  const local = createLocalData({ manifest: { schema: 1, resources: { pokemon: { index: 'pokemon/index.json', segments: [{ from: 25, to: 25, file: 'pokemon/segments/25-25.json' }] } } }, readJson: async file => files[file] });
  assert.deepEqual(await local.get('pokemon', 25), { id: 25, name: 'pikachu' });
});
test('cliente da API preserva base path e faz retry', async () => {
  const urls = []; let attempts = 0;
  const api = createApi({ baseUrl: 'https://example.test/api/v2', fetchImpl: async url => { urls.push(String(url)); if (++attempts === 1) return { ok: false, status: 503 }; return { ok: true, json: async () => ({ ok: true }) }; }, retries: 1, timeout: 100 });
  assert.deepEqual(await api('/pokemon/25'), { ok: true }); assert.equal(attempts, 2); assert.equal(urls[1], 'https://example.test/api/v2/pokemon/25');
});
test('descrição de ataque ignora mensagem de indisponibilidade mais recente', () => {
  const move = { flavor_text_entries: [
    { language: { name: 'en' }, flavor_text: 'A chopping attack\nwith a high critical-hit ratio.' },
    { language: { name: 'en' }, flavor_text: "This move can't be used. It's recommended that this move is forgotten." }
  ], effect_entries: [] };
  assert.equal(description(move), 'A chopping attack with a high critical-hit ratio.');
  move.flavor_text_entries[1].flavor_text = 'This move can’t be used. It’s recommended that this move is forgotten.';
  assert.equal(description(move), 'A chopping attack with a high critical-hit ratio.');
});
test('descrição de ataque usa efeito curto quando não há flavor text válida', () => {
  const move = { flavor_text_entries: [{ language: { name: 'en' }, flavor_text: 'This move can’t be used.' }], effect_entries: [{ language: { name: 'en' }, short_effect: 'Has an increased chance for a critical hit.' }] };
  assert.equal(description(move), 'Has an increased chance for a critical hit.');
});
test('descrição de ataque aceita dados incompletos', () => {
  assert.equal(description({}), '');
  assert.equal(description(null), '');
});
test('formata nomes com hífens simples ou consecutivos', () => {
  assert.equal(cap('thunder-punch'), 'Thunder Punch');
  assert.equal(cap('breakneck-blitz--physical'), 'Breakneck Blitz Physical');
});
