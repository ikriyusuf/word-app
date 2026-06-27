/**
 * Word CRUD Event Handlers
 *
 * Handles all word-related user interactions:
 * add, edit, delete, and PDF export.
 *
 * SRP: Each handler validates input, delegates to dbService,
 * and notifies the user via toast. No UI rendering logic here.
 */

import * as dbService from '../services/db.js';
import * as ui         from '../modules/ui.js';
import { store }       from '../store/state.js';
import { toast, confirmDialog } from '../utils/toast.js';
import {
    capitalizeFirstLetter,
    validateWordField,
    validateMeaningField,
    validateSentenceField,
    sanitizeInput,
} from '../utils/string.js';
import {
    MAX_WORD_LENGTH,
    MAX_SENTENCE_LENGTH,
} from '../config/constants.js';

// ─── Add Word ─────────────────────────────────────────────────────────────────

/**
 * Handles the "Add Word" form submission.
 * Validates all fields before persisting to Firestore.
 *
 * @param {SubmitEvent} e
 * @param {Function} loadWords - Callback to reload the word list after add.
 */
export const handleAddWord = async (e, loadWords) => {
    e.preventDefault();
    const { user } = store.getState();
    if (!user) return;

    const wordInput    = document.getElementById('word');
    const meaningInput = document.getElementById('meaning');
    const exampleInput = document.getElementById('example');

    const rawWord    = wordInput?.value    ?? '';
    const rawMeaning = meaningInput?.value ?? '';
    const rawExample = exampleInput?.value ?? '';

    // ── Validation ─────────────────────────────────────────────────────────
    const wordValidation    = validateWordField(rawWord);
    const meaningValidation = validateMeaningField(rawMeaning);
    const sentenceValidation = validateSentenceField(rawExample);

    if (!wordValidation.valid) {
        toast(wordValidation.error, 'warning');
        return;
    }
    if (!meaningValidation.valid) {
        toast(meaningValidation.error, 'warning');
        return;
    }
    if (!sentenceValidation.valid) {
        toast(sentenceValidation.error, 'warning');
        return;
    }

    const wordData = {
        userId:          user.uid,
        word:            capitalizeFirstLetter(sanitizeInput(rawWord, MAX_WORD_LENGTH)),
        meaning:         capitalizeFirstLetter(sanitizeInput(rawMeaning.toLowerCase(), MAX_WORD_LENGTH)),
        exampleSentence: capitalizeFirstLetter(sanitizeInput(rawExample, MAX_SENTENCE_LENGTH)),
    };

    try {
        await dbService.addWord(wordData);
        ui.elements.addWordForm.reset();
        await loadWords();
        toast('Kelime başarıyla eklendi!', 'success');
    } catch (error) {
        toast('Kelime eklenirken hata oluştu: ' + error.message, 'error');
    }
};

// ─── Edit Word ────────────────────────────────────────────────────────────────

/**
 * Opens the edit modal and populates it with the word's current data.
 *
 * @param {string} wordId
 */
export const handleEditOpen = (wordId) => {
    const { words } = store.getState();
    const word = words.find(w => w.id === wordId);
    if (word) ui.openEditModal(word);
};

/**
 * Handles the edit word form submission.
 * Validates all fields before updating in Firestore.
 *
 * @param {SubmitEvent} e
 * @param {Function} loadWords - Callback to reload the word list after edit.
 */
export const handleEditWord = async (e, loadWords) => {
    e.preventDefault();

    const wordId     = ui.elements.editId.value;
    const rawWord    = ui.elements.editWord.value;
    const rawMeaning = ui.elements.editMeaning.value;
    const rawExample = ui.elements.editExample.value;

    // ── Validation ─────────────────────────────────────────────────────────
    const wordValidation     = validateWordField(rawWord);
    const meaningValidation  = validateMeaningField(rawMeaning);
    const sentenceValidation = validateSentenceField(rawExample);

    if (!wordValidation.valid) {
        toast(wordValidation.error, 'warning');
        return;
    }
    if (!meaningValidation.valid) {
        toast(meaningValidation.error, 'warning');
        return;
    }
    if (!sentenceValidation.valid) {
        toast(sentenceValidation.error, 'warning');
        return;
    }

    const updateData = {
        word:            capitalizeFirstLetter(sanitizeInput(rawWord, MAX_WORD_LENGTH)),
        meaning:         capitalizeFirstLetter(sanitizeInput(rawMeaning.toLowerCase(), MAX_WORD_LENGTH)),
        exampleSentence: capitalizeFirstLetter(sanitizeInput(rawExample, MAX_SENTENCE_LENGTH)),
    };

    try {
        await dbService.updateWord(wordId, updateData);
        ui.closeModals();
        await loadWords();
        toast('Kelime güncellendi!', 'success');
    } catch (error) {
        toast('Kelime güncellenirken hata oluştu: ' + error.message, 'error');
    }
};

// ─── Delete Word ──────────────────────────────────────────────────────────────

/**
 * Confirms and deletes a word by its ID.
 *
 * @param {string} wordId
 * @param {Function} loadWords - Callback to reload the word list after delete.
 */
export const handleDeleteWord = async (wordId, loadWords) => {
    const confirmed = await confirmDialog('Bu kelimeyi silmek istediğine emin misin?', 'Evet, sil');
    if (!confirmed) return;

    try {
        await dbService.deleteWord(wordId);
        await loadWords();
        toast('Kelime silindi.', 'info');
    } catch (error) {
        toast('Kelime silinirken hata oluştu: ' + error.message, 'error');
    }
};

// ─── PDF Export ───────────────────────────────────────────────────────────────

/**
 * Generates and downloads a PDF of the user's word list.
 * Uses html2pdf (loaded globally via CDN).
 */
export const handleExportPDF = () => {
    const { words } = store.getState();

    if (!words || words.length === 0) {
        toast('Dışa aktarılacak kelime bulunamadı.', 'info');
        return;
    }

    const container = document.createElement('div');
    container.style.cssText = 'padding:30px;font-family:Inter,sans-serif;color:#1f2937;background:#fff;';

    const today = new Date().toLocaleDateString('tr-TR');

    // Build rows without user data going directly into HTML attributes
    const rowsHtml = words.map((w, i) => {
        const bg   = i % 2 === 0 ? '#ffffff' : '#f9fafb';
        // We're building a static PDF document — escaping is sufficient here
        const esc  = (s) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;');
        return `
            <tr style="background:${bg};border-bottom:1px solid #e5e7eb;">
                <td style="padding:12px;font-weight:600;color:#111827;">${esc(w.word)}</td>
                <td style="padding:12px;color:#4b5563;">${esc(w.meaning)}</td>
                <td style="padding:12px;color:#6b7280;font-style:italic;">${esc(w.exampleSentence) || '-'}</td>
            </tr>`;
    }).join('');

    container.innerHTML = `
        <div style="margin-bottom:24px;border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <h2 style="margin:0 0 8px;font-size:24px;color:#111827;">Kelime Listem</h2>
            <p style="margin:0;color:#6b7280;font-size:14px;">Tarih: ${today} &nbsp;|&nbsp; Toplam: ${words.length}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;">
            <thead>
                <tr>
                    <th style="padding:12px;background:#f3f4f6;border-bottom:2px solid #d1d5db;color:#374151;width:25%;">Kelime</th>
                    <th style="padding:12px;background:#f3f4f6;border-bottom:2px solid #d1d5db;color:#374151;width:35%;">Anlamı</th>
                    <th style="padding:12px;background:#f3f4f6;border-bottom:2px solid #d1d5db;color:#374151;width:40%;">Örnek Cümle</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>`;

    const options = {
        margin:      [15, 15, 15, 15],
        filename:    `Kelimelerim_${today.replace(/\./g, '-')}.pdf`,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    // html2pdf is loaded globally via CDN script tag in index.html
    // eslint-disable-next-line no-undef
    html2pdf().set(options).from(container).save().then(() => {
        toast('Kelimeler PDF olarak indirildi.', 'success');
    });
};
