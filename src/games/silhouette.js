import { $, cap, fail, loading, renderAnswers, shuffle, sprite } from '../shared.js';
import { pokemonEntity } from '../history.js';
export function mount(panel, services, onAnswer = () => {}, onNext) {
  const stage = $('#sil-stage', panel), answers = $('#sil-answers', panel), feedback = $('#sil-feedback', panel), next = $('#sil-next', panel);
  async function newRound() { loading(stage); answers.innerHTML = ''; feedback.textContent = ''; next.classList.remove('show'); try { const {p} = await services.randomPokemon(); const names = new Set([p.name]); stage.innerHTML = `<span class="number">#${String(p.id).padStart(4,'0')}</span><img class="poke-img silhouette" src="${sprite(p)}" alt="Silhueta de Pokémon">`; while (names.size < 4) names.add((await services.randomPokemon()).p.name); renderAnswers(answers, shuffle([...names]), p.name, feedback, next, () => $('.poke-img', stage).classList.remove('silhouette'), (correct, selected) => onAnswer({correct, subject:pokemonEntity(p), selected:[{kind:'pokemon',name:selected,label:cap(selected),imageUrl:null}], expected:[pokemonEntity(p)]})); } catch (error) { fail(stage, error); } }
  next.onclick = () => onNext ? onNext(newRound) : newRound(); newRound(); return newRound;
}
