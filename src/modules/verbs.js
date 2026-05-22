import { elements, renderVerbsTable } from './ui.js';

// Yerel fiil listesi belleği (local state)
let allVerbs = [];

/**
 * Düzensiz fiiller özelliğini başlatır.
 * JSON verilerini çeker ve arama olay dinleyicisini bağlar.
 */
export const initVerbsFeature = async () => {
    try {
        // 1. JSON Verilerini Çek
        const response = await fetch('src/data/irregular_verbs.json');
        if (!response.ok) {
            throw new Error(`Fiil verileri yüklenirken hata oluştu (HTTP: ${response.status})`);
        }
        allVerbs = await response.json();

        // 2. Tabloyu ilk kez tüm verilerle çiz
        renderVerbsTable(allVerbs);

        // 3. Arama kutusuna dinleyici bağla
        setupSearchListener();

    } catch (error) {
        console.error('Düzensiz fiiller yüklenemedi:', error);
        
        // Hata durumunda kullanıcıyı bilgilendir
        if (elements.verbsTableBody) {
            elements.verbsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--danger); padding: 30px;">
                        <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i> 
                        Veriler yüklenirken bir hata oluştu: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
};

/**
 * Arama girdisini gerçek zamanlı dinler ve tabloyu filtreler.
 */
const setupSearchListener = () => {
    if (!elements.searchVerbsInput) return;

    elements.searchVerbsInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
            // Arama temizlendiyse tüm tabloyu geri çiz
            renderVerbsTable(allVerbs);
            return;
        }

        // V1, V2, V3 veya Türkçe anlam alanlarında sorgu ara (case-insensitive)
        const filteredVerbs = allVerbs.filter(verb => 
            verb.v1.toLowerCase().includes(query) ||
            verb.v2.toLowerCase().includes(query) ||
            verb.v3.toLowerCase().includes(query) ||
            verb.meaning.toLowerCase().includes(query)
        );

        // Tabloyu filtreli çiz
        renderVerbsTable(filteredVerbs);
    });
};
