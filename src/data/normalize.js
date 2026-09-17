const localized = (entries, language) => entries?.find(item => item.language?.name === language)?.name || null;
const named = values => (values || []).map(value => typeof value === 'string' ? value : value.name).filter(Boolean);

export function normalizePokemon(payload) {
  const types = (payload.types || []).sort((a, b) => a.slot - b.slot).map(item => ({ slot: item.slot, type: { name: item.type.name } }));
  return {
    id: payload.id,
    name: payload.name,
    names: { en: payload.name, pt: localized(payload.species?.names, 'pt-BR') || localized(payload.species?.names, 'pt') },
    types,
    abilities: named(payload.abilities?.map(item => item.ability)),
    stats: Object.fromEntries((payload.stats || []).map(item => [item.stat.name, item.base_stat])),
    height: payload.height ?? null,
    weight: payload.weight ?? null,
    sprites: { front_default: payload.sprites?.front_default || null, front: payload.sprites?.front_default || null, other: { 'official-artwork': { front_default: payload.sprites?.other?.['official-artwork']?.front_default || null } }, artwork: payload.sprites?.other?.['official-artwork']?.front_default || null },
    species: payload.species ? { name: payload.species.name, url: payload.species.url } : null
  };
}

export function normalizeSpecies(payload) {
  return {
    id: payload.id,
    name: payload.name,
    names: { en: payload.name, pt: localized(payload.names, 'pt-BR') || localized(payload.names, 'pt') },
    genus: localized(payload.genera, 'pt-BR') || localized(payload.genera, 'pt') || localized(payload.genera, 'en'),
    generation: payload.generation?.name || null,
    isLegendary: Boolean(payload.is_legendary), is_legendary: Boolean(payload.is_legendary),
    isMythical: Boolean(payload.is_mythical), is_mythical: Boolean(payload.is_mythical),
    isBaby: Boolean(payload.is_baby), is_baby: Boolean(payload.is_baby),
    color: payload.color ? { name: payload.color.name } : null,
    habitat: payload.habitat ? { name: payload.habitat.name } : null,
    flavorText: localized(payload.flavor_text_entries, 'pt-BR') || localized(payload.flavor_text_entries, 'pt') || localized(payload.flavor_text_entries, 'en')
  };
}

export function normalizeMove(payload) {
  return {
    id: payload.id,
    name: payload.name,
    names: { en: payload.name, pt: localized(payload.names, 'pt-BR') || localized(payload.names, 'pt') },
    type: payload.type ? { name: payload.type.name } : null,
    damage_class: payload.damage_class ? { name: payload.damage_class.name } : null,
    damageClass: payload.damage_class?.name || null,
    generation: payload.generation ? { name: payload.generation.name } : null,
    power: payload.power ?? null,
    accuracy: payload.accuracy ?? null,
    pp: payload.pp ?? null,
    priority: payload.priority ?? 0,
    effect: localized(payload.effect_entries, 'pt-BR') || localized(payload.effect_entries, 'pt') || localized(payload.effect_entries, 'en'),
    flavor_text_entries: payload.flavor_text_entries || [], effect_entries: payload.effect_entries || []
  };
}

export function normalizeItem(payload) {
  return {
    id: payload.id,
    name: payload.name,
    names: { en: payload.name, pt: localized(payload.names, 'pt-BR') || localized(payload.names, 'pt') },
    category: payload.category?.name || null,
    cost: payload.cost ?? null,
    sprite: payload.sprites?.default || null,
    effect: localized(payload.effect_entries, 'pt-BR') || localized(payload.effect_entries, 'pt') || localized(payload.effect_entries, 'en')
    ,sprites: { default: payload.sprites?.default || null }
  };
}

export const NORMALIZERS = { pokemon: normalizePokemon, species: normalizeSpecies, moves: normalizeMove, items: normalizeItem };
export const normalizeResource = payload => payload;
