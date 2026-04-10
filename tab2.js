// ======== TAB 2: 서비스 제공 현황 ========
// Data sources: config.js + data/services.json + data/metrics.json + data/accounts.json
//
// Layout:
//   1. Summary KPI row (totals: accounts, revenue, instances, top service)
//   2. Compact charts row (Category Revenue + Monthly Trend, side-by-side)
//   3. TOP 10 Revenue Services (scannable table)
//   4. Per-category accordion (collapsed by default; click to expand)

const ServiceProvision = {
  rendered: false,
  serviceData: {},
  categoryMap: {},
  random: null,

  // ===== Helpers =====
  select: (selector) => document.querySelector(selector),
  selectAll: (selector) => document.querySelectorAll(selector),

  createRng(seed) {
    let state = seed;
    return () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  },

  formatRevenueKrw(value) {
    if (value >= 1e9) return `\u20a9${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `\u20a9${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `\u20a9${(value / 1e3).toFixed(0)}K`;
    return `\u20a9${value.toFixed(0)}`;
  },

  // ===== Main Render =====
  renderTab2() {
    if (this.rendered) return;
    this.rendered = true;

    const services = window.API_SVCS || [];
    this.random = this.createRng(42);

    this.loadAccountsData();
    this.buildServiceData(services);

    const html = [
      this.buildSummaryKpis(services),
      this.buildCompactCharts(),
      this.buildTopServicesTable(services),
      this.buildCategoryAccordions(),
    ].join('');

    this.select('#svc-container').innerHTML = html;

    setTimeout(() => {
      this.renderSummaryCharts();
      this.attachAccordionListeners();
    }, 200);
  },

  // ===== Build Service Data =====
  buildServiceData(services) {
    const { categoryColors, categoryIcons } = AppConfig;

    // Aggregate by category
    this.categoryMap = {};
    for (const svc of services) {
      if (!this.categoryMap[svc.category]) {
        this.categoryMap[svc.category] = {
          name: svc.category,
          revenue: 0,
          instances: 0,
          serviceCount: 0,
          color: categoryColors[svc.category] || '#9ca3af',
        };
      }
      this.categoryMap[svc.category].revenue += svc.r * 500;
      this.categoryMap[svc.category].serviceCount++;
    }

    // Per-service data
    this.serviceData = {};
    for (const svc of services) {
      if (!this.serviceData[svc.category]) this.serviceData[svc.category] = [];

      const totalInstances = Math.floor(50 + this.random() * 500);
      this.categoryMap[svc.category].instances += totalInstances;

      this.serviceData[svc.category].push({
        key: svc.key,
        name: svc.name,
        apiCount: svc.apiCount || 0,
        category: svc.category,
        color: categoryColors[svc.category] || '#9ca3af',
        icon: categoryIcons[svc.category] || '\ud83d\udce6',
        totalInstances,
        newMonthly: Math.floor(10 + this.random() * 50),
        newDaily: Math.floor(1 + this.random() * 8),
        lastRevenue: Math.round(svc.r * 500),
        requests: svc.r,
      });
    }
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

  // ===== Summary KPIs =====
  buildSummaryKpis(services) {
    const totalRevenue = Object.values(this.categoryMap).reduce((sum, c) => sum + c.revenue, 0);
    const totalInstances = Object.values(this.categoryMap).reduce((sum, c) => sum + c.instances, 0);
    const topService = [...services].sort((a, b) => b.r - a.r)[0];
    const topServiceColor = topService ? AppConfig.categoryColors[topService.category] : '#9ca3af';

    const slaItems = [
      { label: '운영 계정 수', value: '1,287', sub: '<span class="kpi-up">전체 활성</span>' },
      { label: '신규 계정 (오늘)', value: '+3', valueColor: 'var(--success)', sub: '<span class="kpi-up">+12% WoW</span>' },
      { label: '신규 계정 (이번주)', value: '+18', valueColor: 'var(--success)', sub: '<span class="kpi-up">+7% MoM</span>' },
      { label: '신규 계정 (이번달)', value: '+87', valueColor: 'var(--success)', sub: '<span class="kpi-up">누적</span>' },
    ];

    const kpiCards = [
      { label: '전월 매출', value: '\u20a918.5B', sub: '<span class="kpi-up">\u25b2 8% MoM</span>' },
      { label: '예상 성장', value: `+${(totalRevenue * 0.05 / 1e6).toFixed(0)}M`, sub: '<span class="kpi-up">\u25b2 Growing</span>' },
      { label: '활성 인스턴스', value: totalInstances.toLocaleString(), sub: '<span class="kpi-up">\u25b2 +234 신규</span>' },
      { label: '서비스 카테고리', value: Object.keys(this.categoryMap).length.toString(), sub: `<span class="kpi-up">${services.length}개 서비스</span>` },
    ];

    const slaHtml = slaItems.map(item => `
      <div class="sla-item">
        <div class="sla-label">${item.label}</div>
        <div class="sla-val"${item.valueColor ? ` style="color:${item.valueColor}"` : ''}>${item.value}</div>
        <div class="sla-sub">${item.sub}</div>
      </div>
    `).join('');

    const kpiHtml = kpiCards.map(card => `
      <div class="kpi-card">
        <div class="kpi-label">${card.label}</div>
        <div class="kpi-value">${card.value}</div>
        <div class="kpi-sub">${card.sub}</div>
      </div>
    `).join('');

    return `
      <div class="sla-bar">${slaHtml}</div>
      <div class="kpi-grid">${kpiHtml}</div>
    `;
  },

  // ===== Compact Charts =====
  buildCompactCharts() {
    return `
      <div class="compact-charts">
        <div class="chart-card">
          <h3>\ud83d\udcca 카테고리별 매출 (전월, M\u20a9)</h3>
          <canvas id="ch2-catrev"></canvas>
        </div>
        <div class="chart-card">
          <h3>\ud83d\udcc8 월별 매출 추이 (M\u20a9)</h3>
          <canvas id="ch2-monthrev"></canvas>
        </div>
      </div>
    `;
  },

  // ===== TOP 10 Revenue Services Table =====
  buildTopServicesTable(services) {
    const top10 = [...services]
      .map(svc => ({
        ...svc,
        revenue: svc.r * 500,
        icon: AppConfig.categoryIcons[svc.category] || '',
        color: AppConfig.categoryColors[svc.category] || '#9ca3af',
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const maxRevenue = top10[0]?.revenue || 1;

    const rows = top10.map((svc, idx) => {
      const barWidth = (svc.revenue / maxRevenue * 100).toFixed(1);
      return `
        <tr>
          <td style="font-weight:700; color:var(--text-muted); width:32px">${idx + 1}</td>
          <td>
            <div style="font-weight:700; color:var(--text-primary)">${svc.icon} ${svc.name}</div>
          </td>
          <td><span style="font-size:.72rem; color:${svc.color}; font-weight:600">${svc.category}</span></td>
          <td style="font-weight:700; color:var(--text-primary)">${this.formatRevenueKrw(svc.revenue)}</td>
          <td style="min-width:160px">
            <div style="height:8px; background:var(--bg-input); border-radius:4px; overflow:hidden">
              <div style="height:100%; width:${barWidth}%; background:${svc.color}; border-radius:4px"></div>
            </div>
          </td>
          <td style="color:var(--text-secondary)">${svc.apiCount || 0} APIs</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="api-svc-header" style="margin-top:8px">
        <h3>\ud83c\udfc6 TOP 10 매출 서비스</h3>
      </div>
      <div class="table-card">
        <div style="overflow-x:auto">
          <table class="top-services-table">
            <thead>
              <tr>
                <th>#</th>
                <th>서비스</th>
                <th>카테고리</th>
                <th>전월 매출</th>
                <th>매출 비중</th>
                <th>API 수</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ===== Category Accordions =====
  buildCategoryAccordions() {
    const categoryOrder = [
      'Compute', 'Networking', 'Database', 'Storage', 'Container',
      'Data Analytics', 'Application Service', 'Security', 'Management',
      'Financial Management', 'DevOps Tools', 'AI-ML', 'Platform',
    ];

    const accordions = categoryOrder.map(category => {
      const items = this.serviceData[category];
      if (!items || items.length === 0) return '';

      const catInfo = this.categoryMap[category];
      const icon = AppConfig.categoryIcons[category] || '\ud83d\udce6';

      const compactCards = items.map(svc => `
        <div class="compact-svc-card">
          <div class="svc-title">${svc.icon} ${svc.name}</div>
          <div class="svc-cat">${svc.apiCount} APIs</div>
          <div class="svc-metrics">
            <div class="m-item">
              <div class="m-val" style="color:${svc.color}">${svc.totalInstances.toLocaleString()}</div>
              <div class="m-label">인스턴스</div>
            </div>
            <div class="m-item">
              <div class="m-val" style="color:var(--success)">+${svc.newMonthly}</div>
              <div class="m-label">월 신규</div>
            </div>
            <div class="m-item">
              <div class="m-val">${this.formatRevenueKrw(svc.lastRevenue)}</div>
              <div class="m-label">전월 매출</div>
            </div>
          </div>
        </div>
      `).join('');

      return `
        <div class="cat-accordion" data-category="${category}">
          <div class="cat-accordion-header">
            <h4>${icon} ${category}</h4>
            <div class="cat-accordion-meta">
              <span><span class="meta-num">${catInfo.serviceCount}</span> 서비스</span>
              <span><span class="meta-num">${catInfo.instances.toLocaleString()}</span> 인스턴스</span>
              <span><span class="meta-num">${this.formatRevenueKrw(catInfo.revenue)}</span></span>
              <span class="cat-arrow">\u25b6</span>
            </div>
          </div>
          <div class="cat-accordion-body">
            <div class="compact-svc-grid">${compactCards}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="api-svc-header" style="margin-top:24px">
        <h3>\ud83d\udcc1 카테고리별 상세 (클릭하여 펼치기)</h3>
      </div>
      <div>${accordions}</div>
    `;
  },

  // ===== Charts Render =====
  renderSummaryCharts() {
    const gridColor = '#3b4a6b55';
    const sortedCategories = Object.keys(this.categoryMap)
      .sort((a, b) => this.categoryMap[b].revenue - this.categoryMap[a].revenue);

    // Category Revenue (compact horizontal bar)
    const catLabels = sortedCategories.map(cat => `${AppConfig.categoryIcons[cat] || ''}${cat}`);
    const catRevenues = sortedCategories.map(cat => Math.round(this.categoryMap[cat].revenue / 1e6));
    const catColors = sortedCategories.map(cat => `${this.categoryMap[cat].color}cc`);

    const catRevCanvas = this.select('#ch2-catrev');
    if (catRevCanvas) {
      Dashboard.charts.categoryRevenue = new Chart(catRevCanvas, {
        type: 'bar',
        data: {
          labels: catLabels,
          datasets: [{
            data: catRevenues,
            backgroundColor: catColors,
            borderRadius: 4,
            barThickness: 12,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { color: '#a3b0c9', font: { size: 10 } },
            },
            y: {
              grid: { color: 'transparent' },
              ticks: { color: '#d8dfeb', font: { size: 11 } },
            },
          },
        },
      });
    }

    // Monthly Revenue Trend
    const monthlyRevenue = (window.ACCOUNTS && window.ACCOUNTS.monthlyRevenueTrend)
      || [12100, 12500, 13100, 12800, 13500, 14200, 14800, 15500, 15200, 16100, 16800, 18500];

    const monthRevCanvas = this.select('#ch2-monthrev');
    if (monthRevCanvas) {
      Dashboard.charts.monthlyRevenue = new Chart(monthRevCanvas, {
        type: 'line',
        data: {
          labels: AppConfig.months,
          datasets: [{
            data: monthlyRevenue,
            borderColor: '#7dd3fc',
            backgroundColor: 'rgba(125, 211, 252, .15)',
            fill: true,
            tension: .4,
            pointRadius: 4,
            pointBackgroundColor: '#7dd3fc',
            borderWidth: 2.5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: false,
              grid: { color: gridColor },
              ticks: { color: '#a3b0c9', font: { size: 10 } },
            },
            x: {
              grid: { color: gridColor },
              ticks: { color: '#d8dfeb', font: { size: 10 } },
            },
          },
        },
      });
    }
  },

  // ===== Accordion Toggle =====
  attachAccordionListeners() {
    this.selectAll('.cat-accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const accordion = header.parentElement;
        accordion.classList.toggle('open');
      });
    });
  },
};

// Expose renderTab2 as a global function for tab1.js to call
function renderTab2() {
  ServiceProvision.renderTab2();
}
