/**
 * Activity Calendar — GitHub tarzı aktivite ısı haritası.
 * Son 16 haftalık kelime ekleme & quiz aktivitesini görselleştirir.
 */

/**
 * Bir tarihin yerel YYYY-MM-DD string'ini döner.
 * @param {Date} date
 * @returns {string}
 */
const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * Kelimelerin createdAt alanlarından ve quiz aktivitelerinden günlük aktivite haritası oluşturur.
 * @param {Array} words - Tüm kelimeler
 * @param {Object} stats - Kullanıcı istatistikleri
 * @returns {Object} { 'YYYY-MM-DD': count }
 */
const buildActivityMap = (words, stats) => {
    const map = {};
    
    // 1. Kelime eklemeleri
    if (words) {
        words.forEach(w => {
            if (!w.createdAt) return;
            let date;
            if (w.createdAt.toDate) {
                date = w.createdAt.toDate();
            } else if (w.createdAt.seconds) {
                date = new Date(w.createdAt.seconds * 1000);
            } else {
                date = new Date(w.createdAt);
            }
            if (isNaN(date.getTime())) return;
            const key = toLocalDateStr(date);
            map[key] = (map[key] || 0) + 1;
        });
    }

    // 2. Quiz Aktiviteleri (dailyActivity)
    if (stats && stats.dailyActivity) {
        Object.keys(stats.dailyActivity).forEach(dateStr => {
            map[dateStr] = (map[dateStr] || 0) + stats.dailyActivity[dateStr];
        });
    }
    
    return map;
};

/**
 * Aktivite sayısını 0–4 arasında bir seviyeye dönüştürür.
 */
const getLevel = (count) => {
    if (!count || count === 0) return 0;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
};

/**
 * Aktivite takvimini render eder.
 * @param {Array} words - Tüm kelime listesi
 * @param {Object} stats - Kullanıcı istatistikleri
 */
export const renderCalendar = (words, stats) => {
    const gridEl    = document.getElementById('calendar-grid');
    const monthsEl  = document.getElementById('calendar-months');
    const statsEl   = document.getElementById('calendar-active-days');
    if (!gridEl || !monthsEl) return;

    const activityMap = buildActivityMap(words, stats);

    // Son 16 hafta (112 gün) — bugünden geriye
    const WEEKS = 16;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Takvimi Pazar başlayacak şekilde hizala
    const dayOfWeek = today.getDay(); // 0=Sun
    // Go back to last Sunday
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - dayOfWeek);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (WEEKS * 7 - 1));

    // Ay etiketleri için takip
    const monthLabels = []; // { weekIndex, label }
    let lastMonth = -1;

    gridEl.innerHTML = '';
    monthsEl.innerHTML = '';

    let activeDays = 0;

    for (let week = 0; week < WEEKS; week++) {
        const weekEl = document.createElement('div');
        weekEl.className = 'calendar-week';

        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + week * 7 + day);

            if (currentDate > today) {
                // Gelecek günler boş bırak
                const phantom = document.createElement('div');
                phantom.style.width = '12px';
                phantom.style.height = '12px';
                weekEl.appendChild(phantom);
                continue;
            }

            const dateStr = toLocalDateStr(currentDate);
            const count = activityMap[dateStr] || 0;
            const level = getLevel(count);

            if (count > 0) activeDays++;

            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.dataset.level = level;

            // Tooltip
            const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
            const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
            const label = count > 0
                ? `${count} kelime — ${dayNames[currentDate.getDay()]}, ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`
                : `${dayNames[currentDate.getDay()]}, ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`;
            dayEl.title = label;

            weekEl.appendChild(dayEl);

            // Ay etiketi takibi (haftanın ilk günü - Pazar)
            if (day === 0) {
                const month = currentDate.getMonth();
                if (month !== lastMonth) {
                    monthLabels.push({ weekIndex: week, label: monthNames[month] });
                    lastMonth = month;
                }
            }
        }

        gridEl.appendChild(weekEl);
    }

    // Ay etiketleri satırı
    for (let i = 0; i < WEEKS; i++) {
        const span = document.createElement('span');
        span.className = 'calendar-month-label';
        span.style.width = '15px';
        const found = monthLabels.find(m => m.weekIndex === i);
        span.textContent = found ? found.label : '';
        monthsEl.appendChild(span);
    }

    // Aktif gün sayısı
    if (statsEl) statsEl.textContent = `${activeDays} aktif gün`;
};
