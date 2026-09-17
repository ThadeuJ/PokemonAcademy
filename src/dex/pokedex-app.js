import { createServices } from '../shared.js';
import { mountPokedex } from './pokedex.js';
import { cap, safe } from '../shared.js';

const idFromUrl = url => Number(url?.match(/(\d+)\/?$/)?.[1]);

export function createPokedexApp() {
  const root = document.querySelector('#pokedex');
  const link = document.querySelector('#pokedex-link');
  const menu = document.querySelector('#game-menu');
  const backdrop = document.querySelector('#menu-backdrop');
  const services = createServices();
  let active = false;
  const moveTableObserver = new MutationObserver(() => {
    const table = root.querySelector('.move-table');
    if (table?.querySelectorAll('thead th').length === 4) {
      moveTableObserver.disconnect();
      table.querySelector('thead th:last-child')?.remove();
      table.querySelectorAll('tbody tr').forEach(row => { row.querySelector('td:last-child')?.remove(); row.querySelector('td[colspan]')?.setAttribute('colspan', '3'); });
      moveTableObserver.observe(root, { childList: true, subtree: true });
    }
  });
  moveTableObserver.observe(root, { childList: true, subtree: true });
  const detailObserver = new MutationObserver(async () => {
    const detail = root.querySelector('.pokemon-detail');
    if (!detail || detail.querySelector('.dex-variants')) return;
    detailObserver.disconnect();
    try {
      const id = Number(detail.querySelector('.dex-number')?.textContent.match(/\d+/)?.[0]);
      const pokemon = await services.api(`/pokemon/${id}`);
      const catalog = await services.api('/pokemon?limit=2000');
      const baseName = (pokemon.species?.name || pokemon.name.split('-')[0]).toLowerCase();
      const variants = catalog.results.filter(item => { const name = item.name.toLowerCase(); return name !== pokemon.name.toLowerCase() && (name === baseName || name.startsWith(`${baseName}-`)); }).sort((a, b) => (a.id ?? idFromUrl(a.url)) - (b.id ?? idFromUrl(b.url)));
      const evolution = [...detail.querySelectorAll('section')].find(section => section.querySelector('h3')?.textContent === 'Evolução');
      const variantSection = document.createElement('section');
      variantSection.className = 'dex-variants';
      variantSection.innerHTML = `<h3>Formas alternativas</h3><div class="evolution-line">${variants.map(item => { const variantId = item.id ?? Number(item.url.match(/(\d+)\/?$/)?.[1]); return `<button class="evolution-node" data-pokemon="${variantId}"><img src="${new URL(`../../data/pokeapi/assets/pokemon/${variantId}.png`, import.meta.url).href}" alt="${safe(item.name)}"><strong>${cap(item.name)}</strong></button>`; }).join('') || '<p>Este Pokémon não possui formas alternativas registradas.</p>'}</div>`;
      evolution?.after(variantSection);
      const shinySection = document.createElement('section');
      shinySection.className = 'dex-shiny';
      shinySection.innerHTML = `<h3>Versão Shiny</h3><div class="evolution-line"><button class="evolution-node current"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png" alt="${safe(pokemon.name)} Shiny"><strong>${cap(pokemon.name)} Shiny</strong></button></div>`;
      variantSection.after(shinySection);
    } finally { detailObserver.observe(root, { childList: true, subtree: true }); }
  });
  detailObserver.observe(root, { childList: true, subtree: true });

  function route() {
    const match = location.hash.match(/^#\/pokedex(?:\/(\d+|[a-z-]+))?$/);
    if (!match) { active = false; link?.classList.remove('active'); return; }
    document.querySelectorAll('.panel').forEach(panel => panel.classList.toggle('active', panel === root));
    if (!active || root.dataset.id !== (match[1] || '')) { active = true; root.dataset.id = match[1] || ''; mountPokedex(root, services, match[1]); }
    document.querySelectorAll('[data-game]').forEach(button => button.classList.remove('active'));
    link?.classList.add('active');
  }

  link?.addEventListener('click', () => {
    menu?.classList.remove('open');
    backdrop?.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.querySelector('#menu-toggle')?.setAttribute('aria-expanded', 'false');
  });
  root?.addEventListener('click', event => {
    const back = event.target.closest('.dex-back');
    const pokemon = event.target.closest('[data-pokemon]');
    if (back) { event.preventDefault(); event.stopPropagation(); location.hash = '#/pokedex'; }
    else if (pokemon) { event.preventDefault(); event.stopPropagation(); location.hash = `#/pokedex/${pokemon.dataset.pokemon}`; }
  }, true);
  window.addEventListener('hashchange', route);
  route();
}
