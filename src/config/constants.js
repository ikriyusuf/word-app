/**
 * Application-wide constants.
 * All magic numbers and repeated literals are defined here.
 * Import from this file instead of hardcoding values inline.
 */

// ─── Pagination ───────────────────────────────────────────────────────────────
/** Kelime listesinde sayfa başına gösterilen satır sayısı. */
export const WORDS_PER_PAGE = 10;

/** Firestore'dan tek seferde çekilecek maksimum kelime sayısı. */
export const FIRESTORE_WORDS_LIMIT = 200;

// ─── Matching Game ────────────────────────────────────────────────────────────
/** Eşleştirme oyununun süresi (saniye). */
export const GAME_DURATION_SEC = 30;

/** Oyun için gereken minimum kelime sayısı. */
export const MIN_WORDS_FOR_GAME = 5;

/** Doğru eşleşmede kazanılan puan. */
export const MATCH_CORRECT_SCORE = 10;

/** Yanlış eşleşmede kaybedilen puan. */
export const MATCH_WRONG_SCORE = 5;

/** Eşleşme animasyonunun bekleme süresi (ms). */
export const MATCH_CORRECT_DELAY_MS = 600;

/** Yanlış eşleşme geri alma süresi (ms). */
export const MATCH_WRONG_DELAY_MS = 800;

// ─── Quiz ─────────────────────────────────────────────────────────────────────
/** Cevap görüntülendikten sonra sonraki soruya geçme gecikmesi (ms). */
export const QUIZ_NEXT_DELAY_MS = 1500;

/** Kelime seslendirilmeden önce bekleme süresi (ms). */
export const QUIZ_SPEAK_DELAY_MS = 400;

/** Flashcard çevirme gecikmesi (ms). */
export const FLASHCARD_NEXT_DELAY_MS = 900;

/** Flashcard flip animasyon süresi (ms). */
export const FLASHCARD_FLIP_DURATION_MS = 560;

// ─── Input Validation ─────────────────────────────────────────────────────────
/** Kelime alanları için maksimum karakter sayısı. */
export const MAX_WORD_LENGTH = 100;

/** Örnek cümle için maksimum karakter sayısı. */
export const MAX_SENTENCE_LENGTH = 300;

/** Kullanıcı adı için maksimum karakter sayısı. */
export const MAX_DISPLAY_NAME_LENGTH = 60;

/** Şifre için minimum karakter sayısı. */
export const MIN_PASSWORD_LENGTH = 6;

/** Günlük hedef için maksimum değer. */
export const MAX_DAILY_GOAL = 200;

/** Günlük hedef için minimum değer. */
export const MIN_DAILY_GOAL = 1;

// ─── Spaced Repetition (SM-2) ─────────────────────────────────────────────────
/** Öğrenilmiş sayılması için gereken minimum tekrar sayısı. */
export const SRS_MIN_REPETITIONS_LEARNED = 3;

/** Öğrenilmiş sayılması için minimum kolaylık faktörü. */
export const SRS_MIN_EF_LEARNED = 2.3;

/** Ustalık eşiği — Öğrenildi (%). */
export const MASTERY_THRESHOLD_MASTERED = 80;

/** Ustalık eşiği — Öğreniyor (%). */
export const MASTERY_THRESHOLD_LEARNING = 50;

// ─── Theme ────────────────────────────────────────────────────────────────────
/** localStorage'da tema anahtarı. */
export const THEME_STORAGE_KEY = 'wordapp-theme';

/** Varsayılan tema. */
export const DEFAULT_THEME = 'light';

// ─── Word of the Day ──────────────────────────────────────────────────────────
/** localStorage'da günün kelimesi cache anahtarı. */
export const WOTD_STORAGE_KEY = 'wotd_cache';

// ─── Firestore Collections ────────────────────────────────────────────────────
export const COLLECTION_WORDS = 'words';
export const COLLECTION_STATS = 'user_stats';
