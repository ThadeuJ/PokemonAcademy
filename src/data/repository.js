import { createApi } from './api.js';
import { createCache } from './cache.js';

export function createRepository({ local = {}, api = createApi(), cache = createCache() } = {}) {
  const getLocal = async (resource, id) => {
    const value = await local.get?.(resource, id);
    if (value === undefined || value === null) throw new Error('Dado local ausente');
    return value;
  };
  return {
    async get(resource, id) {
      const key = `${resource}/${id}`;
      if (cache.has(key)) return { data: cache.get(key), source: 'cache' };
      let source = 'local';
      const load = async () => { try { return await getLocal(resource, id); } catch (localError) { source = 'online'; try { return await api(`/${resource}/${id}`); } catch (onlineError) { onlineError.cause = localError; throw onlineError; } } };
      const data = await (cache.getOrSet ? cache.getOrSet(key, load) : load().then(value => cache.set(key, value)));
      return { data, source };
    },
    async list(resource, params = '') {
      const key = `${resource}?${params}`;
      if (cache.has(key)) return { data: cache.get(key), source: 'cache' };
      let source = 'local';
      const load = async () => { try { const data = await local.list?.(resource, params); if (data !== undefined) return data; throw Error(); } catch { source = 'online'; return api(`/${resource}${params ? `?${params}` : ''}`); } };
      const data = await (cache.getOrSet ? cache.getOrSet(key, load) : load().then(value => cache.set(key, value)));
      return { data, source };
    }
    ,async apiPath(path) {
      const clean = path.replace(/^\//, ''), [resource, id] = clean.split('?')[0].split('/'), query = clean.includes('?') ? clean.slice(clean.indexOf('?') + 1) : '';
      const localResource = { 'pokemon-species': 'species', pokemon: 'pokemon', move: 'moves', item: 'items', type: 'types', 'evolution-chain': 'evolutions' }[resource] || resource;
      const endpoint = { species: 'pokemon-species', moves: 'move', items: 'item', types: 'type' }[localResource] || localResource;
      if (resource === 'pokemon-species' && Number(id) > 1025) {
        try { const pokemon = await this.get('pokemon', id); return (await this.get('species', pokemon.data.species?.name)).data; } catch {}
      }
      if (!id) {
        try { return (await this.list(localResource, query)).data; }
        catch { return api(`/${endpoint}${query ? `?${query}` : ''}`); }
      }
      try { return (await this.get(localResource, id)).data; }
      catch { return api(`/${endpoint}/${id}`); }
    }
  };
}
