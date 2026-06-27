/**
 * Irregular Verbs Module
 *
 * Lazy Loading: The verbs JSON dataset is loaded dynamically on first use
 * via import(). Users who never visit the Verbs page will not download
 * this dataset at all — it is excluded from the main bundle.
 *
 * SRP: This module only handles verb data fetching and search filtering.
 * Rendering is delegated to ui.renderVerbsTable().
 */

import { elements, renderVerbsTable } from './ui.js';

/** Cached verb list after first load. */
let verbsCache = null;

/**
 * Lazily loads the irregular verbs JSON on first invocation.
 * Subsequent calls return the cached array without re-importing.
 *
 * @returns {Promise<Array>} Array of verb objects { v1, v2, v3, meaning }.
 */
const loadVerbs = async () => {
    if (verbsCache) return verbsCache;
    const module  = await import('../data/irregular_verbs.json');
    verbsCache    = module.default;
    return verbsCache;
};

/**
 * Initialises the Verbs feature.
 * Loads the verb data, renders the full table, and binds the search listener.
 */
export const initVerbsFeature = async () => {
    try {
        const allVerbs = await loadVerbs();
        renderVerbsTable(allVerbs);
        setupSearchListener(allVerbs);
    } catch (error) {
        console.error('Düzensiz fiiller yüklenemedi:', error);

        if (elements.verbsTableBody) {
            elements.verbsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;color:var(--danger);padding:30px;">
                        <i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>
                        Veriler yüklenirken bir hata oluştu.
                    </td>
                </tr>`;
        }
    }
};

/**
 * Binds a real-time search listener to filter the verb table.
 *
 * @param {Array} allVerbs - Full verb list to search within.
 */
const setupSearchListener = (allVerbs) => {
    if (!elements.searchVerbsInput) return;

    elements.searchVerbsInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
            renderVerbsTable(allVerbs);
            return;
        }

        const filtered = allVerbs.filter(verb =>
            verb.v1.toLowerCase().includes(query) ||
            verb.v2.toLowerCase().includes(query) ||
            verb.v3.toLowerCase().includes(query) ||
            verb.meaning.toLowerCase().includes(query)
        );

        renderVerbsTable(filtered);
    });
};
