import { PT, TYPE_ICONS, cap, sprite } from './shared.js';

export const typeEntity = name => ({kind:'type',name,label:PT[name]||cap(name),imageUrl:TYPE_ICONS[name]});
export const pokemonEntity = pokemon => ({kind:'pokemon',name:pokemon.name,label:cap(pokemon.name),id:pokemon.id,imageUrl:sprite(pokemon)});
export const moveEntity = move => ({kind:'move',name:move.name,label:cap(move.name),type:typeEntity(move.type.name),imageUrl:null});
export const noneEntity = () => ({kind:'none',name:'none',label:'Nenhum',imageUrl:null});
export const answerEntity = value => value === 'none' ? noneEntity() : typeEntity(value);
export const recordLabel = item => item.kind === 'pokemon' ? item.label : item.kind === 'move' ? `${item.label} · ${item.type.label}` : item.label;
