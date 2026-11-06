import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GEN_RANGES } from '../src/filters.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = join(root, 'data', 'pokeapi');
const out = join(root, 'data', 'pokemon-grid-puzzle', 'guardrails.json');
const STARTERS = new Set([1,4,7,152,155,158,252,255,258,387,390,393,495,498,501,650,653,656,722,725,728,810,813,816,906,909,912]);
const COLORS = ['black','blue','brown','gray','green','pink','purple','red','white','yellow'];
const HABITATS = ['cave','forest','grassland','mountain','rare','rough-terrain','sea','urban','waters-edge'];
const ranges = Object.entries(GEN_RANGES);
const readJson = file => readFile(join(root, file), 'utf8').then(JSON.parse);

async function loadResource(name) {
  const manifest = await readJson('data/pokeapi/manifest.json');
  const resource = manifest.resources[name];
  const chunks = await Promise.all(resource.segments.map(segment => readJson(segment.file)));
  return chunks.flatMap(chunk => Object.values(chunk));
}
const generation = id => ranges.find(([, [from, to]]) => id >= from && id <= to)?.[0] || null;
const criterionId = (kind, value) => `${kind}:${value}`;
function matchesPokemon(p, species, criterion) {
  const speciesId = species?.id || p.id;
  if (criterion.kind === 'type') return p.types.some(item => item.type.name === criterion.value);
  if (criterion.kind === 'gen') return generation(speciesId) === String(criterion.value);
  if (criterion.kind === 'legendary') return Boolean(species?.is_legendary);
  if (criterion.kind === 'mythical') return Boolean(species?.is_mythical);
  if (criterion.kind === 'baby') return Boolean(species?.is_baby);
  if (criterion.kind === 'regional') return /-(alola|galar|hisui|paldea)(-|$)/.test(p.name);
  if (criterion.kind === 'starter') return STARTERS.has(speciesId);
  if (criterion.kind === 'color') return species?.color?.name === criterion.value;
  if (criterion.kind === 'habitat') return species?.habitat?.name === criterion.value;
  return false;
}
function makeCriteria() {
  const criteria = [];
  for (const [value, label] of Object.entries({ normal:'Normal',fire:'Fogo',water:'?gua',electric:'El?trico',grass:'Planta',ice:'Gelo',fighting:'Lutador',poison:'Veneno',ground:'Terra',flying:'Voador',psychic:'Ps?quico',bug:'Inseto',rock:'Pedra',ghost:'Fantasma',dragon:'Drag?o',dark:'Sombrio',steel:'A?o',fairy:'Fada'})) criteria.push({ id: criterionId('type', value), kind: 'type', value, label });
  criteria.push({ id:'regional:true',kind:'regional',value:true,label:'Forma regional' }, { id:'starter:true',kind:'starter',value:true,label:'Pok?mon inicial' });
  COLORS.forEach(value => criteria.push({ id:criterionId('color',value),kind:'color',value,label:`Cor: ${value}` }));
  HABITATS.forEach(value => criteria.push({ id:criterionId('habitat',value),kind:'habitat',value,label:value }));
  criteria.push({ id:'legendary:true',kind:'legendary',value:true,label:'Lend?rio' }, { id:'mythical:true',kind:'mythical',value:true,label:'M?tico' }, { id:'baby:true',kind:'baby',value:true,label:'Beb?' });
  for (const [value] of ranges) criteria.push({ id:criterionId('gen',value),kind:'gen',value,label:`Gera??o ${value}` });
  return criteria;
}
async function main() {
  const [pokemon, species] = await Promise.all([loadResource('pokemon'), loadResource('species')]);
  const speciesByName = new Map(species.map(item => [item.name, item]));
  const criteria = makeCriteria();
  const members = Object.fromEntries(criteria.map(criterion => [criterion.id, pokemon.filter(item => matchesPokemon(item, speciesByName.get(item.species?.name), criterion)).map(item => item.id)]));
  const pairs = {};
  for (let i = 0; i < criteria.length; i++) for (let j = i; j < criteria.length; j++) {
    const left = criteria[i].id, right = criteria[j].id;
    const rightSet = new Set(members[right]);
    const answers = members[left].filter(id => rightSet.has(id));
    pairs[[left, right].sort().join('|')] = { count: answers.length, answers };
  }
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify({ schema:1, generatedAt:new Date().toISOString(), pokemonCount:pokemon.length, criteria:Object.fromEntries(criteria.map(({id,kind,value,label}) => [id,{kind,value,label}])), pairs }, null, 2) + '\n');
  console.log(`Guardrails gerados: ${criteria.length} crit?rios, ${Object.keys(pairs).length} pares.`);
}
async function validate() { const value = JSON.parse(await readFile(out, 'utf8')); if(value.schema !== 1 || !value.criteria || !value.pairs) throw new Error('Guardrails inv?lidos'); for(const [key,pair] of Object.entries(value.pairs)){ if(!key.includes('|') || pair.count !== pair.answers.length || pair.answers.some(id=>!Number.isInteger(id))) throw new Error(`Par inv?lido: ${key}`); } console.log(`Guardrails v?lidos: ${Object.keys(value.criteria).length} crit?rios, ${Object.keys(value.pairs).length} pares.`); }
if (process.argv.includes('--validate')) validate().catch(error => { console.error(error.message); process.exitCode = 1; }); else main().catch(error => { console.error(error); process.exitCode = 1; });
