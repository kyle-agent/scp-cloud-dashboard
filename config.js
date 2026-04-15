// ======== config.js - Centralized configuration ========
//
// Data routing (Option D — hybrid):
//   services  → static JSON   (manually curated catalog)
//   metrics   → backend BFF   (FastAPI → OpenSearch, see ./backend)
//   accounts  → static JSON   (regenerated daily by ./etl, see ./etl)
//
// Set BACKEND_URL to '' to fall back to local JSON for all three (dev mode).
var AppConfig = {
  // Where static JSON files live (services, accounts)
  STATIC_URL: '.',

  // Where the BFF lives. Empty string = use local JSON for metrics too.
  // Examples: '/api/dashboard', 'http://localhost:8000/api/dashboard'
  BACKEND_URL: '',

  // Per-file routing. `source` is either 'static' or 'backend'.
  DATA_FILES: {
    services: { source: 'static', path: 'data/services.json' },
    metrics:  { source: 'backend', path: '/metrics', fallback: 'data/metrics.json' },
    accounts: { source: 'static', path: 'data/accounts.json' }
  },

  // Polling interval for live data (milliseconds) — should match backend cache TTL
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

  // Helper: resolve a data file's URL based on its routing config
  _resolveUrl: function(file) {
    var cfg = this.DATA_FILES[file];
    if(!cfg) throw new Error('Unknown data file: ' + file);
    if(cfg.source === 'backend' && this.BACKEND_URL) {
      return this.BACKEND_URL + cfg.path;
    }
    // static, or backend with no BACKEND_URL → fall back to local JSON
    var localPath = cfg.fallback || cfg.path;
    return this.STATIC_URL + '/' + localPath;
  },

  // Helper: fetch JSON data
  fetchData: function(file) {
    var url = this._resolveUrl(file);
    return fetch(url).then(function(r) {
      if(!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.json();
    });
  }
};

// Convenience alias
var C = AppConfig;
