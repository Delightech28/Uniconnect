// Lightweight GIPHY search helper
// Usage: import { searchGifs } from '../services/giphyService';
// Provide an API key via import.meta.env.VITE_GIPHY_API_KEY or pass as first arg.

export async function searchGifs(apiKeyOrQuery, maybeQuery, limit = 24, offset = 0) {
    // Support both (apiKey, query) and (query) where API key is read from env
    let apiKey = import.meta.env?.VITE_GIPHY_API_KEY || '';
    let query = '';
    if (maybeQuery !== undefined) {
        apiKey = apiKeyOrQuery;
        query = maybeQuery;
    } else {
        query = apiKeyOrQuery;
    }

    if (!apiKey) {
        throw new Error('GIPHY API key not provided. Set VITE_GIPHY_API_KEY in your environment.');
    }

    const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g&lang=en`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`GIPHY search failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    // Return simplified objects with useful urls
    return (json.data || []).map(g => ({
        id: g.id,
        title: g.title,
        url: g.images?.downsized_medium?.url || g.images?.fixed_width?.url || g.images?.original?.url,
        preview: g.images?.fixed_width_small_still?.url || g.images?.downsized_still?.url || g.images?.preview_gif?.url
    }));
}
