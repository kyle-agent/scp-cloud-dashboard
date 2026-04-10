// ======== TAB 2: 서비스 제공 현황 ========
// Data sources: config.js + data/services.json + data/metrics.json + data/accounts.json

const ServiceProvision = {
  rendered: false,

  // ===== Helpers =====
  select: (selector) => document.querySelector(selector),

  createRng(seed) {
    let state = seed;
    return () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  },

  formatRevenue(value) {
    if (value >= 1e9) return `\u20a9${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `\u20a9${(value / 1e6).toFixed(1)}M`;
    return `\u20a9${value.toFixed(0)}`;
  },

  // ===== Main Render =====
  renderTab2() {
    if (this.rendered) return;
    this.rendered = true;

    const services = window.API_SVCS || [];
    const random = this.createRng(42);
    const { months, categoryColors, categoryIcons } = AppConfig;

    // Load accounts data (fire-and-forget with fallback)
    this.loadAccountsData();

    // Account summary
    const totalAccounts = 1287;
    const newToday = 3;
    const newWeek = 18;
    const newMonth = 87;

    // Category revenue aggregation
    const categoryMap = {};
    for (const svc of services) {
      if (!categoryMap[svc.category]) {
        categoryMap[svc.category] = {
          name: svc.category,
          revenue: 0,
          count: 0,
          color: categoryColors[svc.category] || '#9ca3af',
        };
      }
      categoryMap[svc.category].revenue += svc.r * 500;
      categoryMap[svc.category].count++;
    }

    const sortedCategories = Object.keys(categoryMap).sort((a, b) => categoryMap[b].revenue - categoryMap[a].revenue);
    const totalRevenue = sortedCategories.reduce((sum, cat) => sum + categoryMap[cat].revenue, 0);
    const revenueGrowth = Math.round(totalRevenue * 0.05);
    const topService = [...services].sort((a, b) => b.r - a.r)[0];

    // Total instances
    let totalInstances = 0;
    for (const _ of services) {
      totalInstances += Math.floor(50 + random() * 400);
    }

    // Per-category service data
    const serviceData = {};
    for (const svc of services) {
      if (!serviceData[svc.category]) serviceData[svc.category] = [];

      serviceData[svc.category].push({
        key: svc.key,
        name: svc.name,
        apiCount: svc.apiCount || 0,
        category: svc.category,
        color: categoryColors[svc.category] || '#9ca3af',
        icon: categoryIcons[svc.category] || '\ud83d\udce6',
        totalInstances: Math.floor(50 + random() * 500),
        newMonthly: Math.floor(10 + random() * 50),
        newDaily: Math.floor(1 + random() * 8),
        lastRevenue: Math.round(svc.r * 300),
        requests: svc.r,
      });
    }

    // Build HTML
    const html = [
      this.buildSlaBar(totalAccounts, newToday, newWeek, newMonth),
      this.buildKpiCards(revenueGrowth, totalInstances, topService),
      this.buildChartContainers(),
      this.buildCategoryCards(serviceData),
    ].join('');

    this.select('#svc-container').innerHTML = html;

    // Render charts after DOM update
    setTimeout(() => {
      this.renderCharts(categoryMap, sortedCategories, months, random, serviceData);
    }, 200);
  },

  // ===== Data Loading =====
  async loadAccountsData() {
    try {
      const data = await AppConfig.fetchData('accounts');
      window.ACCOUNTS = data;
    } catch {
      window.ACCOUNTS = {
        totalAccounts: 1287,
        newAccountsToday: 3,
        newAccountsThisWeek: 18,
        newAccountsThisMonth: 87,
        lastMonthRevenue: 18500000000,
        monthOverMonthGrowth: 0.08,
        totalActiveInstances: 5847,
        monthlyRevenueTrend: [12100, 12500, 13100, 12800, 13500, 14200, 14800, 15500, 15200, 16100, 16800, 18500],
      };
    }
  },

  // ===== SLA Bar =====
  buildSlaBar(totalAccounts, newToday, newWeek, newMonth) {
    const items = [
      { label: 'Overall Account', value: totalAccounts.toLocaleString(), sub: '<span class="kpi-up">Active</span>' },
      { label: 'New (Today)', value: `+${newToday}`, color: '#34d399', sub: '<span class="kpi-up">+12% WoW</span>' },
      { label: 'New (This Week)', value: `+${newWeek}`, color: '#34d399', sub: '<span class="kpi-up">+7% MoM</span>' },
      { label: 'New (This Month)', value: `+${newMonth}`, color: '#34d399', sub: '<span class="kpi-up">Cumulative</span>' },
    ];

    return `<div class="sla-bar">${items.map(item => `
      <div class="sla-item">
        <div class="sla-label">${item.label}</div>
        <div class="sla-val"${item.color ? ` style="color:${item.color}"` : ''}>${item.value}</div>
        <div class="sla-sub">${item.sub}</div>
      </div>
    `).join('')}</div>`;
  },

  // ===== KPI Cards =====
  buildKpiCards(revenueGrowth, totalInstances, topService) {
    const topColor = topService ? categoryColors(topService) : '#9ca3af';
    const topName = topService ? topService.name : '-';
    const topRev = topService ? this.formatRevenue(topService.r * 500) : '-';

    const cards = [
      { label: 'Last Month Revenue', value: '\u20a918.5B', sub: '<span class="kpi-up">\u25b2 8% vs prev month</span>' },
      { label: 'MoM Growth', value: `+${(revenueGrowth / 1e6).toFixed(0)}M`, sub: '<span class="kpi-up">\u25b2 Growing</span>' },
      { label: 'Total Active Instances', value: totalInstances.toLocaleString(), sub: '<span class="kpi-up">\u25b2 234 new</span>' },
      { label: 'Top Revenue Service', value: topName, valueColor: topColor, sub: `<span style="color:#34d399">${topRev}</span>` },
    ];

    return `<div class="kpi-grid">${cards.map(card => `
      <div class="kpi-card">
        <div class="kpi-label">${card.label}</div>
        <div class="kpi-value"${card.valueColor ? ` style="color:${card.valueColor}"` : ''}>${card.value}</div>
        <div class="kpi-sub">${card.sub}</div>
      </div>
    `).join('')}</div>`;

    function categoryColors(svc) {
      return AppConfig.categoryColors[svc.category] || '#9ca3af';
    }
  },

  // ===== Chart Containers =====
  buildChartContainers() {
    return `
      <div class="charts-grid">
        <div class="chart-card"><h3>Category Revenue</h3><canvas id="ch2-catrev"></canvas></div>
        <div class="chart-card"><h3>Monthly Revenue Trend</h3><canvas id="ch2-monthrev"></canvas></div>
      </div>
    `;
  },

  // ===== Category Service Cards =====
  buildCategoryCards(serviceData) {
    const categoryOrder = [
      'Compute', 'Networking', 'Database', 'Storage', 'Container',
      'Data Analytics', 'Application Service', 'Security', 'Management',
      'Financial Management', 'DevOps Tools', 'AI-ML', 'Platform',
    ];

    return categoryOrder.map(category => {
      const items = serviceData[category];
      if (!items || items.length === 0) return '';

      const icon = AppConfig.categoryIcons[category] || '\ud83d\udce6';

      const serviceCards = items.map(svc => {
        const safeKey = svc.key.replace(/[^a-zA-Z0-9]/g, '_');

        return `
          <div class="api-svc-card" style="margin-bottom:0; cursor:default">
            <div>
              <div class="svc-title">${svc.icon} ${svc.name}</div>
              <div class="svc-cat">${svc.category} \u00b7 ${svc.apiCount} APIs</div>
            </div>
            <div class="svc-metrics">
              <div class="m-item"><div class="m-val" style="color:${svc.color}">${svc.totalInstances.toLocaleString()}</div><div class="m-label">Total</div></div>
              <div class="m-item"><div class="m-val" style="color:#34d399">+${svc.newMonthly}</div><div class="m-label">This Month</div></div>
              <div class="m-item"><div class="m-val" style="color:#fbbf24">+${svc.newDaily}</div><div class="m-label">Today</div></div>
              <div class="m-item"><div class="m-val">${this.formatRevenue(svc.lastRevenue)}</div><div class="m-label">Last M Rev</div></div>
            </div>
            <div style="margin-top:16px; height:80px"><canvas id="ci_${safeKey}"></canvas></div>
            <div style="margin-top:12px; height:80px"><canvas id="cr_${safeKey}"></canvas></div>
          </div>
        `;
      }).join('');

      return `
        <div style="margin-top:32px">
          <h3 style="font-size:1.1rem; color:#e5e7eb; margin-bottom:16px">${icon} ${category}</h3>
          <div class="services-grid">${serviceCards}</div>
        </div>
      `;
    }).join('');
  },

  // ===== Render Charts =====
  renderCharts(categoryMap, sortedCategories, months, random, serviceData) {
    const gridColor = '#1f293744';
    const gridColorLight = '#1f293722';

    // Category Revenue Chart
    const catLabels = sortedCategories.map(cat => `${AppConfig.categoryIcons[categoryMap[cat].name] || ''}${categoryMap[cat].name}`);
    const catRevenues = sortedCategories.map(cat => Math.round(categoryMap[cat].revenue / 1e6));
    const catColors = sortedCategories.map(cat => `${categoryMap[cat].color}cc`);

    const catRevCanvas = this.select('#ch2-catrev');
    if (catRevCanvas) {
      Dashboard.charts.categoryRevenue = new Chart(catRevCanvas, {
        type: 'bar',
        data: {
          labels: catLabels,
          datasets: [{ data: catRevenues, backgroundColor: catColors, borderRadius: 6 }],
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: gridColor } },
            y: { grid: { color: gridColor } },
          },
        },
      });
    }

    // Monthly Revenue Trend Chart
    const monthlyRevenue = [12100, 12500, 13100, 12800, 13500, 14200, 14800, 15500, 15200, 16100, 16800, 18500];
    const monthRevCanvas = this.select('#ch2-monthrev');
    if (monthRevCanvas) {
      Dashboard.charts.monthlyRevenue = new Chart(monthRevCanvas, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            data: monthlyRevenue,
            borderColor: '#7dd3fc',
            backgroundColor: 'rgba(125, 211, 252, .1)',
            fill: true,
            tension: .4,
            pointRadius: 4,
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: false, grid: { color: gridColor } },
            x: { grid: { color: gridColor } },
          },
        },
      });
    }

    // Per-service charts
    const categoryOrder = [
      'Compute', 'Networking', 'Database', 'Storage', 'Container',
      'Data Analytics', 'Application Service', 'Security', 'Management',
      'Financial Management', 'DevOps Tools', 'AI-ML', 'Platform',
    ];

    for (const category of categoryOrder) {
      const items = serviceData[category];
      if (!items) continue;

      for (const svc of items) {
        const safeKey = svc.key.replace(/[^a-zA-Z0-9]/g, '_');

        // Instance trend
        const instanceTrend = months.map((_, idx) =>
          Math.round(svc.totalInstances * (0.4 + 0.6 * Math.pow(idx / 11, 0.8)) * (0.85 + random() * 0.3))
        );

        const instanceCanvas = document.getElementById(`ci_${safeKey}`);
        if (instanceCanvas) {
          new Chart(instanceCanvas, {
            type: 'bar',
            data: {
              labels: months,
              datasets: [{
                label: 'Instances',
                data: instanceTrend,
                backgroundColor: `${svc.color}aa`,
                borderRadius: 4,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: gridColorLight } },
                y: { beginAtZero: true, grid: { color: gridColorLight } },
              },
            },
          });
        }

        // Revenue trend
        const revenueTrend = months.map((_, idx) =>
          Math.round(svc.lastRevenue / 12 * (0.6 + 0.4 * idx / 11) * (0.85 + random() * 0.3))
        );

        const revenueCanvas = document.getElementById(`cr_${safeKey}`);
        if (revenueCanvas) {
          new Chart(revenueCanvas, {
            type: 'line',
            data: {
              labels: months,
              datasets: [{
                label: 'Revenue',
                data: revenueTrend,
                borderColor: svc.color,
                backgroundColor: `${svc.color}22`,
                fill: true,
                tension: .4,
                borderWidth: 2,
                pointRadius: 0,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: gridColorLight } },
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback(val) {
                      if (val >= 1e6) return `\u20a9${(val / 1e6).toFixed(1)}M`;
                      if (val >= 1e3) return `\u20a9${(val / 1e3).toFixed(0)}K`;
                      return `\u20a9${val}`;
                    },
                  },
                  grid: { color: gridColorLight },
                },
              },
            },
          });
        }
      }
    }
  },
};

// Expose renderTab2 as a global function for tab1.js to call
function renderTab2() {
  ServiceProvision.renderTab2();
}
