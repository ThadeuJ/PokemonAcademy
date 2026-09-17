import { GEN_RANGES, MEGAS, PARADOX_IDS, normalizeFilters } from './filters.js';
import { createRepository } from './data/repository.js';
import { createBrowserLocalData } from './data/local-data.js';
export { GEN_RANGES } from './filters.js';
export const API = 'https://pokeapi.co/api/v2';
export const PT = {normal:'Normal',fire:'Fogo',water:'Água',electric:'Elétrico',grass:'Planta',ice:'Gelo',fighting:'Lutador',poison:'Veneno',ground:'Terra',flying:'Voador',psychic:'Psíquico',bug:'Inseto',rock:'Pedra',ghost:'Fantasma',dragon:'Dragão',dark:'Sombrio',steel:'Aço',fairy:'Fada'};
const TYPE_IDS = {normal:1,fighting:2,flying:3,poison:4,ground:5,rock:6,bug:7,ghost:8,steel:9,fire:10,water:11,grass:12,electric:13,psychic:14,ice:15,dragon:16,dark:17,fairy:18};
export const TYPE_ICONS = Object.fromEntries(Object.entries(TYPE_IDS).map(([name,id]) => [name, new URL(`../data/pokeapi/assets/types/${id}.png`, import.meta.url).href]));
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const cap = value => value.split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
export const shuffle = values => [...values].sort(() => Math.random() - .5);
export const safe = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function createServices() {
  const cache = new Map();
  const local = createBrowserLocalData().catch(() => null);
  const repository = createRepository({ cache: undefined, local: { get: async (resource, id) => (await local)?.get(resource, id), list: async (resource, params) => (await local)?.list(resource, params) } });
  let activeFilters = normalizeFilters();
  return {
    api: async path => {
      if (cache.has(path)) return cache.get(path);
      const data = await repository.apiPath(path);
      cache.set(path, data);
      return data;
    },
    filters: () => activeFilters,
    setFilters: filters => { activeFilters = normalizeFilters(filters); },
    randomPokemon: async function() {
      const filters = activeFilters, range = filters.gen === 'all' ? [1,1025] : GEN_RANGES[filters.gen];
      const megaPool = MEGAS.filter(item => filters.gen === 'all' || item.gen === +filters.gen);
      for (let attempt=0; attempt<40; attempt++) {
        const mega = filters.mega && megaPool.length && Math.random()<.2 ? megaPool[Math.floor(Math.random()*megaPool.length)] : null;
        const id = mega?.id || Math.floor(Math.random()*(range[1]-range[0]+1))+range[0];
        const p = await this.api('/pokemon/'+id), sp = await this.api('/pokemon-species/'+(mega ? mega.name.split('-')[0] : id));
        const isMega = mega || p.name.includes('-mega'), isParadox = PARADOX_IDS.has(sp.id);
        if ((!filters.legendary&&sp.is_legendary)||(!filters.mythical&&sp.is_mythical)||(!filters.baby&&sp.is_baby)||(!filters.mega&&isMega)||(!filters.paradox&&isParadox)||(!isMega&&filters.gen!=='all'&&(sp.id<range[0]||sp.id>range[1]))) continue;
        return {p,sp};
      }
      throw Error('Nenhum Pokémon encontrado com esses filtros.');
    }
  };
}
export const addPokemonService = services => services;
export const sprite = pokemon => pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default || pokemon.sprites?.front || pokemon.sprites?.artwork;
export const loading = element => { element.innerHTML = '<div class="loading"></div>'; };
export const fail = (element, error) => { element.innerHTML = `<div class="error">${error.message}<br><small>Tente novamente.</small></div>`; };
export const typeData = services => name => services.api('/type/' + name);
export function renderAnswers(box, options, answer, feedback, next, reveal, onAnswer = () => {}) {
  box.innerHTML = '';
  options.forEach(option => {
    const button = document.createElement('button'); button.className = 'answer'; button.dataset.value = option; button.textContent = cap(option);
    button.onclick = () => { const correct = option === answer; $$('.answer', box).forEach(item => { item.disabled = true; if (item.dataset.value === answer) item.classList.add('correct'); }); if (!correct) button.classList.add('wrong'); feedback.textContent = correct ? 'Muito bem! Resposta correta.' : 'Quase! A resposta certa está destacada.'; feedback.style.color = correct ? 'var(--green)' : 'var(--red)'; next.classList.add('show'); if (reveal) reveal(); onAnswer(correct, option, answer); };
    box.appendChild(button);
  });
}
export function renderTypeChoices(box, options, answer, feedback, next, successText, onAnswer = () => {}) {
  box.innerHTML = '';
  options.forEach(option => {
    const button = document.createElement('button'); button.className = 'answer type-option' + (option === 'none' ? ' none-option' : ''); button.dataset.value = option;
    button.innerHTML = option === 'none' ? '<strong>Nenhum é<br>super efetivo</strong>' : `<img class="type-icon" src="${TYPE_ICONS[option]}" alt="${PT[option]}">`;
    button.onclick = () => { const correct = option === answer; $$('.answer', box).forEach(item => { item.disabled = true; if (item.dataset.value === answer) item.classList.add('correct'); }); if (!correct) button.classList.add('wrong'); feedback.textContent = correct ? successText : 'Quase! A resposta correta está destacada.'; feedback.style.color = correct ? 'var(--green)' : 'var(--red)'; next.classList.add('show'); onAnswer(correct, option, answer); };
    box.appendChild(button);
  });
}
export const multiplier = (relations, defenders) => defenders.reduce((value, defender) => value * (relations.no_damage_to.some(x => x.name === defender) ? 0 : relations.double_damage_to.some(x => x.name === defender) ? 2 : relations.half_damage_to.some(x => x.name === defender) ? .5 : 1), 1);
