// ======== config.js - Centralized Configuration ========

const AppConfig = {
  dataUrl: '.',

  dataFiles: {
    services: 'data/services.json',
    metrics: 'data/metrics.json',
    accounts: 'data/accounts.json',
  },

  pollInterval: 60000,

  categoryColors: {
    'Compute':              '#60a5fa',
    'Storage':              '#a78bfa',
    'Container':            '#34d399',
    'Networking':           '#fbbf24',
    'Database':             '#f87171',
    'Data Analytics':       '#c084fc',
    'Application Service':  '#fb923c',
    'Security':             '#e879f9',
    'Cloud Control':        '#6ee7b7',
    'Financial Management': '#4ade80',
    'DevOps':               '#38bdf8',
    'AI-ML':                '#d946ef',
    'Platform':             '#94a3b8',
    'Management':           '#6ee7b7',
    'DevOps Tools':         '#38bdf8',
  },

  categoryIcons: {
    'Compute':              '\ud83d\udda5\ufe0f',
    'Storage':              '\ud83d\udcbe',
    'Container':            '\ud83d\udce6',
    'Networking':           '\ud83c\udf10',
    'Database':             '\ud83d\uddc4\ufe0f',
    'Data Analytics':       '\ud83d\udcca',
    'Application Service':  '\u2699\ufe0f',
    'Security':             '\ud83d\udd12',
    'Cloud Control':        '\ud83d\udce1',
    'AI-ML':                '\ud83e\udde0',
    'Financial Management': '\ud83d\udcb0',
    'DevOps Tools':         '\ud83d\ude80',
    'Platform':             '\ud83c\udfd7\ufe0f',
    'Management':           '\u2699\ufe0f',
  },

  months: ['1\uc6d4', '2\uc6d4', '3\uc6d4', '4\uc6d4', '5\uc6d4', '6\uc6d4',
           '7\uc6d4', '8\uc6d4', '9\uc6d4', '10\uc6d4', '11\uc6d4', '12\uc6d4'],

  formatNumber(num) {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  },

  async fetchData(fileKey) {
    const url = `${this.dataUrl}/${this.dataFiles[fileKey]}`;
    const response = await fetch(url);
    return response.json();
  },
};
