// ======== config.js - Centralized configuration ========
var AppConfig = {
  // Base URL for data files (change to API endpoint when connecting to real backend)
  // e.g., DATA_URL = '/api/dashboard' or 'https://api.samsungsdscloud.com/dashboard'
  DATA_URL: '.',

  // Data file paths
  DATA_FILES: {
    services: 'data/services.json',
    metrics: 'data/metrics.json',
    accounts: 'data/accounts.json'
  },

  // Polling interval for live data (milliseconds)
  POLL_INTERVAL: 60000,

  // Category configuration
  CATEGORY_COLORS: {
    'Compute': '#60a5fa', 'Storage': '#a78bfa', 'Container': '#34d399',
    'Networking': '#fbbf24', 'Database': '#f87171', 'Data Analytics': '#c084fc',
    'Application Service': '#fb923c', 'Security': '#e879f9', 'Cloud Control': '#6ee7b7',
    'Financial Management': '#4ade80', 'DevOps': '#38bdf8', 'AI-ML': '#d946ef',
    'Platform': '#94a3b8', 'Management': '#6ee7b7', 'DevOps Tools': '#38bdf8'
  },
  CATEGORY_ICONS: {
    'Compute': '\ud83d\udda5\ufe0f', 'Storage': '\ud83d\udcbe', 'Container': '\ud83d\udce6',
    'Networking': '\ud83c\udf10', 'Database': '\ud83d\uddc4\ufe0f', 'Data Analytics': '\ud83d\udcca',
    'Application Service': '\u2699\ufe0f', 'Security': '\ud83d\udd12', 'Cloud Control': '\ud83d\udce1',
    'AI-ML': '\ud83e\udde0', 'Financial Management': '\ud83d\udcb0', 'DevOps Tools': '\ud83d\ude80',
    'Platform': '\ud83c\udfd7\ufe0f', 'Management': '\u2699\ufe0f'
  },

  // Months label
  MONTHS: ['1\uc6d4','2\uc6d4','3\uc6d4','4\uc6d4','5\uc6d4','6\uc6d4','7\uc6d4','8\uc6d4','9\uc6d4','10\uc6d4','11\uc6d4','12\uc6d4'],

  // Helper: format number
  formatNum: function(n) {
    if(n >= 1e6) return (n/1e6).toFixed(1)+'M';
    if(n >= 1e3) return (n/1e3).toFixed(1)+'K';
    return n.toString();
  },

  // Helper: fetch JSON data
  fetchData: function(file) {
    return fetch(this.DATA_URL + '/' + this.DATA_FILES[file])
      .then(function(r) { return r.json(); });
  }
};

// Convenience alias
var C = AppConfig;
