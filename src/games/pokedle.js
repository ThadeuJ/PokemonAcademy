import { $, cap, safe, sprite, generationOf, pokemonSearchCandidates } from '../shared.js';
import { formatDuration } from '../duration.js';

const typeName = type => type?.type?.name || '';
const evolutionInfo = (species, chain) => {
  let depth = 0, max = 0;
  const walk = (node, level = 0) => { if (!node) return; if (node.species?.name === species.name) depth = level; max = Math.max(max, level); node.evolves_to?.forEach(child => walk(child, level + 1)); };
  walk(chain?.chain);
  return depth === 0 ? 'Básico' : depth >= max ? 'Final' : 'Intermediário';
};

export function mount(panel, services) {
  let target, targetSpecies, targetChain, guesses = [], startedAt = 0, finished = false, timer;
  const regionNames = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'];
  const enabledRegions = new Set(regionNames.map((_, index) => index + 1));
  const elapsed = () => finished ? panel._pokedleElapsed : Math.max(0, Date.now() - startedAt);
  const displayTime = () => formatDuration(elapsed());
  const value = (p, sp, chain) => ({
    name: p.name, types: p.types.map(typeName), color: sp.color?.name || 'unknown', gen: generationOf(sp.id || p.id), stage: evolutionInfo(sp, chain), weight: p.weight, height: p.height
  });
  const mark = (actual, guessed) => actual === guessed ? 'O' : 'X';
  const arrow = (actual, guessed) => actual === guessed ? '=' : actual > guessed ? '↑' : '↓';
  const row = guess => {
    const a = value(target, targetSpecies, targetChain), g = value(guess.p, guess.sp, guess.chain);
    const cells = [mark(a.types[0], g.types[0]), mark(a.types[1] || '', g.types[1] || ''), mark(a.color, g.color), mark(a.gen, g.gen), mark(a.stage, g.stage), arrow(a.weight, g.weight), arrow(a.height, g.height)];
    const labels = [g.types[0] || '—', g.types[1] || '—', g.color, `G${g.gen}`, g.stage, `${(g.weight / 10).toFixed(1)} kg`, `${(g.height / 10).toFixed(1)} m`];
    return `<div class="pokedle-row"><strong>${cap(g.name)}</strong>${cells.map((cell, i) => `<span class="pokedle-clue ${cell === 'O' ? 'is-right' : cell === 'X' ? 'is-wrong' : 'is-arrow'}">${cell}<small>${labels[i]}</small></span>`).join('')}</div>`;
  };
  const render = () => {
    const time = displayTime();
    panel.innerHTML = `<div class="pokedle-head"><div class="eyebrow">Desafio diário</div><h2>Adivinha</h2><p class="lead">Escolha um Pokémon e descubra o alvo pelas indicações.</p></div><fieldset class="pokedle-regions"><legend>Regiões disponíveis</legend>${regionNames.map((name, index) => `<label><input type="checkbox" data-region="${index + 1}" ${enabledRegions.has(index + 1) ? 'checked' : ''}> ${name}</label>`).join('')}</fieldset><div class="pokedle-timer">Tempo <strong>${time}</strong></div><div class="pokedle-board"><div class="pokedle-labels"><strong>Pokémon</strong><span>Tipo 1</span><span>Tipo 2</span><span>Cor</span><span>Geração</span><span>Estado evolutivo</span><span>Peso</span><span>Altura</span></div><div class="pokedle-history">${guesses.map(row).join('')}</div></div>${finished ? `<div class="pokedle-result"><strong>Você encontrou ${cap(target.name)}!</strong><span>${guesses.length} ${guesses.length === 1 ? 'tentativa' : 'tentativas'} · ${time}</span><button class="ghost pokedle-new">Jogar novamente</button></div>` : `<div class="pokedle-form"><button class="confirm pokedle-pick" type="button">Escolher Pokémon</button></div><p class="pokedle-help">O = correto · X = errado · ↑↓ indicam a direção do peso e da altura.</p>`}`;
    const pickerForm = panel.querySelector('.pokedle-form');
    const board = panel.querySelector('.pokedle-board');
    if (pickerForm && board) board.before(pickerForm);
    panel.querySelector('.pokedle-new')?.addEventListener('click', start);
    if (!finished) bindForm();
    panel.querySelectorAll('[data-region]').forEach(input => input.onchange = () => {
      const region = Number(input.dataset.region);
      if (!input.checked && enabledRegions.size === 1) { input.checked = true; return; }
      input.checked ? enabledRegions.add(region) : enabledRegions.delete(region);
      start();
    });
  };
  const picker = $('#picker'), search = $('#poke-search'), results = $('#search-results'), autoAnswer = $('#auto-doku');
  const closePicker = () => { picker.classList.remove('show'); autoAnswer.classList.remove('hidden'); };
  const openPicker = () => { picker.classList.add('show'); autoAnswer.classList.add('hidden'); search.value = ''; results.innerHTML = '<div class="doku-status">Digite pelo menos 2 letras.</div>'; setTimeout(() => search.focus(), 30); };
  const submitGuess = async p => { if (guesses.some(item => item.p.name === p.name)) return closePicker(); const sp = p._species || await services.api(`/pokemon-species/${p.species?.name || p.name}`); const chainId = Number(sp.evolution_chain?.url?.match(/(\d+)\/?$/)?.[1]); const guess = { p, sp, chain: chainId ? await services.api(`/evolution-chain/${chainId}`) : null }; guesses.unshift(guess); if (p.name === target.name) { finished = true; panel._pokedleElapsed = Date.now() - startedAt; clearInterval(timer); } closePicker(); render(); };
  const searchPokemon = async query => { results.innerHTML = '<div class="loading"></div>'; try { const pokemon = await pokemonSearchCandidates(services, query, { generations: enabledRegions }); results.innerHTML = ''; pokemon.forEach(p => { const button = document.createElement('button'); button.className = 'result'; button.innerHTML = `<img src="${sprite(p)}" alt=""><span>${cap(p.name)}</span>`; button.onclick = () => submitGuess(p); results.appendChild(button); }); if (!pokemon.length) results.innerHTML = '<div class="doku-status">Nenhum resultado com as regiões atuais.</div>'; } catch { results.innerHTML = '<div class="error">Falha na busca.</div>'; } };
  const bindForm = () => { $('.pokedle-pick', panel).onclick = openPicker; let timerId; search.oninput = event => { clearTimeout(timerId); const query = event.target.value.trim().toLowerCase(); if (query.length >= 2) timerId = setTimeout(() => searchPokemon(query), 280); }; $('#close-picker').onclick = closePicker; picker.onclick = event => { if (event.target === picker) closePicker(); }; };
  async function start() { clearInterval(timer); finished = false; guesses = []; services.setFilters({ ...services.filters(), gen: 'all' }); panel.innerHTML = '<div class="loading"></div>'; try { let selected; do { selected = await services.randomPokemon(); } while (selected.p.id > 1025 || selected.p.name.includes("-") || !enabledRegions.has(generationOf(selected.sp.id || selected.p.id))); target = selected.p; targetSpecies = selected.sp; const chainId = Number(targetSpecies.evolution_chain?.url?.match(/(\d+)\/?$/)?.[1]); targetChain = chainId ? await services.api(`/evolution-chain/${chainId}`) : null; startedAt = Date.now(); render(); timer = setInterval(() => { const strong = panel.querySelector('.pokedle-timer strong'); if (strong) strong.textContent = displayTime(); }, 250); } catch (error) { panel.innerHTML = `<p class="error">${safe(error.message)}</p><button class="ghost pokedle-new">Tentar novamente</button>`; panel.querySelector('button').onclick = start; } }
  start();
  return start;
}



