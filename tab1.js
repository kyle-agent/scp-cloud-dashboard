// ======== TAB 1: API 운영 현황 ========
// Data sources: data/services.json + data/metrics.json

const Dashboard = {
  charts: {},
  healthData: null,
  metricsData: null,

  // ===== DOM Helpers =====
  select: (selector) => document.querySelector(selector),
  selectAll: (selector) => document.querySelectorAll(selector),

  // ===== Number Formatting =====
  formatNumber(num) {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  },

  // ===== Clock =====
  startClock() {
    const updateClock = () => {
      const now = new Date();
      this.select('#clock').textContent = `업데이트: ${now.toLocaleString('ko-KR')}`;
    };
    updateClock();
    setInterval(updateClock, 1000);
  },

  // ===== Seeded RNG =====
  createRng(seed) {
    let state = seed;
    return () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  },

  // ===== Health Simulation =====
  simulateHealth() {
    const random = this.createRng(777);
    const baseResponseTimes = {
      'CacheStore(DBaaS)': 18, 'Global CDN': 25, 'Cloud DNS': 28, 'GSLB': 29,
      'Load Balancer': 33, 'Security Group': 31, 'VPC': 35, 'IAM': 35,
      'Cloud Functions': 38, 'Direct Connect': 42, 'Parallel File Storage': 39,
      'File Storage': 43, 'Cost Explorer': 44, 'VPN': 44, 'Object Storage': 47,
      'Cloud Monitoring': 47, 'Block Storage': 44, 'Certificate Manager': 42,
      'Virtual Server': 45, 'Archive Storage': 62, 'Backup': 55,
      'Kubernetes Engine': 56, 'MariaDB(DBaaS)': 59, 'MySQL(DBaaS)': 54,
      'Search Engine': 53, 'Event Streams': 49, 'Data Flow': 46,
      'Secrets Manager': 41, 'Secret Vault': 39, 'Key Management Service': 38,
      'Config Inspection': 45, 'SQL Server(DBaaS)': 63, 'EPAS(DBaaS)': 67,
      'PostgreSQL(DBaaS)': 71, 'Quick Query': 37, 'Queue Service': 34,
      'Data Ops': 41, 'Vertica(DBaaS)': 78, 'Logging & Audit': 52,
      'ID Center': 43, 'Organization': 38, 'ServiceWatch': 40,
      'Cloud ML': 65, 'AI & MLOps Platform': 70, 'DevOps Service': 48,
      'Billing Plan': 41, 'Budget': 39, 'Pricing': 40,
      'Container Registry': 51, 'Bare Metal': 52, 'Multi-node GPU Cluster': 41,
      'Resource Manager': 42, 'Network Logging': 44, 'Cloud Control': 46,
      'Support Center': 45, 'Quota Service': 38,
      'Block Storage (BM)': 48, 'API Gateway': 30, 'Data Analytics': 45,
      'Firewall': 36, 'STS': 50, 'Product': 43,
    };

    if (!Array.isArray(this.healthData)) return;

    for (const endpoint of this.healthData) {
      const baseTime = baseResponseTimes[endpoint.name] || 45;
      const roll = random();

      if (roll < 0.04) {
        endpoint.status = 'down';
        endpoint.resp = 0;
      } else if (roll < 0.12) {
        endpoint.status = 'degraded';
        endpoint.resp = Math.round(baseTime * (1.5 + random() * 1.5));
      } else {
        endpoint.status = 'up';
        endpoint.resp = Math.round(baseTime * (0.8 + random() * 0.4));
      }
    }
  },

  // ===== Data Loading =====
  async loadData() {
    try {
      const [servicesData, metricsData] = await Promise.all([
        AppConfig.fetchData('services'),
        AppConfig.fetchData('metrics'),
      ]);

      this.healthData = servicesData;
      this.metricsData = metricsData;
      this.simulateHealth();

      window.API_SVCS = metricsData.svc;
      window.API_EPS = metricsData.ep;

      this.renderTab1();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.select('#api-kpis').innerHTML =
        `<p style="padding:40px; text-align:center; color:#f87171">데이터 로딩 실패: ${error.message}</p>`;
    }
  },

  // ===== Main Render =====
  renderTab1() {
    const services = window.API_SVCS || [];
    const endpoints = window.API_EPS || [];
    const healthEntries = this.healthData || [];

    // Health aggregation
    const upCount = healthEntries.filter(entry => entry.status === 'up').length;
    const downCount = healthEntries.filter(entry => entry.status === 'down').length;
    const degradedCount = healthEntries.filter(entry => entry.status === 'degraded').length;
    const totalServices = healthEntries.length;
    const healthRate = totalServices ? ((upCount / totalServices) * 100).toFixed(1) : 100;

    // API performance aggregation
    const totalCalls = endpoints.reduce((sum, ep) => sum + ep.r, 0);
    const avgP50 = endpoints.length
      ? Math.round(endpoints.reduce((sum, ep) => sum + ep.p50, 0) / endpoints.length)
      : 0;
    const avgP99 = endpoints.length
      ? Math.round(endpoints.reduce((sum, ep) => sum + ep.p99, 0) / endpoints.length)
      : 0;
    const avgResponse = endpoints.length
      ? Math.round(endpoints.reduce((sum, ep) => sum + (ep.s === 'error' ? ep.p99 : ep.p50), 0) / endpoints.length)
      : 0;
    const errorRate = endpoints.length
      ? (endpoints.reduce((sum, ep) => sum + ep.e, 0) / endpoints.length).toFixed(1)
      : 0;
    const successRate = (100 - parseFloat(errorRate)).toFixed(1);
    const errorEndpointCount = endpoints.filter(ep => ep.s === 'error').length;

    this.updateStatusBadge(downCount, degradedCount);
    this.renderSlaBar(totalServices, totalCalls, endpoints.length, avgResponse, avgP50, successRate);
    this.renderKpiCards(upCount, healthRate, degradedCount, downCount, errorEndpointCount, errorRate, avgP50, avgP99);
    this.renderCharts(endpoints, totalCalls, errorRate, services);
    this.populateCategoryFilter(services);
    this.renderServiceCards('', '');
    this.renderTopErrorApis(endpoints);
    this.attachEventListeners(endpoints);
  },

  // ===== Status Badge =====
  updateStatusBadge(downCount, degradedCount) {
    const badge = this.select('#sys-status');

    if (downCount > 0) {
      badge.className = 'status-badge err';
      badge.innerHTML = '<span class="dot" style="background:#f87171"></span><span>서비스 이상</span>';
    } else if (degradedCount > 0) {
      badge.className = 'status-badge warn';
      badge.innerHTML = '<span class="dot" style="background:#fbbf24"></span><span>지연 감지</span>';
    } else {
      badge.className = 'status-badge ok';
      badge.innerHTML = '<span class="dot"></span><span>정상</span>';
    }
  },

  // ===== SLA Bar =====
  renderSlaBar(totalServices, totalCalls, endpointCount, avgResponse, avgP50, successRate) {
    const items = [
      { label: '모니터링 서비스', value: totalServices, sub: '<span class="kpi-up">헬스체크</span>' },
      { label: '시간당 API 호출', value: this.formatNumber(totalCalls), sub: `전체 ${endpointCount} 엔드포인트` },
      { label: '평균 응답시간', value: `${avgResponse}ms`, sub: `P50: ${avgP50}ms` },
      { label: 'API 성공률', value: `${successRate}%`, sub: '<span class="kpi-up">200 OK</span>' },
    ];

    this.select('#sla-bar').innerHTML = items.map(item => `
      <div class="sla-item">
        <div class="sla-label">${item.label}</div>
        <div class="sla-val">${item.value}</div>
        <div class="sla-sub">${item.sub}</div>
      </div>
    `).join('');
  },

  // ===== KPI Cards =====
  renderKpiCards(upCount, healthRate, degradedCount, downCount, errorEndpointCount, errorRate, avgP50, avgP99) {
    const cards = [
      { label: '정상 서비스', value: upCount, sub: `<span class="kpi-up">${healthRate}% 가용성</span>` },
      { label: '지연 서비스', value: degradedCount, sub: degradedCount > 0 ? '<span class="kpi-warn">응답 지연</span>' : '<span class="kpi-up">없음</span>' },
      { label: '다운 서비스', value: downCount, sub: downCount > 0 ? '<span class="kpi-down">대응필요</span>' : '<span class="kpi-up">안정</span>' },
      { label: '오류 API', value: errorEndpointCount, sub: `<span class="kpi-warn">에러율 ${errorRate}%</span>` },
      { label: 'P50 응답', value: `${avgP50}ms`, sub: '<span class="kpi-up">건강</span>' },
      { label: 'P99 응답', value: `${avgP99}ms`, sub: avgP99 > 300 ? '<span class="kpi-down">주의</span>' : '<span class="kpi-up">정상</span>' },
    ];

    this.select('#api-kpis').innerHTML = cards.map(card => `
      <div class="kpi-card">
        <div class="kpi-label">${card.label}</div>
        <div class="kpi-value">${card.value}</div>
        <div class="kpi-sub">${card.sub}</div>
      </div>
    `).join('');
  },

  // ===== Charts =====
  renderCharts(endpoints, totalCalls, errorRate, services) {
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const trafficPattern = [.05, .03, .02, .01, .01, .015, .04, .12, .18, .15, .12, .10, .09, .08, .07, .06, .05, .04, .04, .05, .06, .08, .09, .10];
    const patternSum = trafficPattern.reduce((a, b) => a + b, 0);

    const hourlyCalls = new Array(24).fill(0);
    const hourlyP50 = new Array(24).fill(0);
    const hourlyP99 = new Array(24).fill(0);

    for (const endpoint of endpoints) {
      const trafficDistributor = endpoint.r / patternSum;
      for (let hour = 0; hour < 24; hour++) {
        hourlyCalls[hour] += Math.round(trafficDistributor * trafficPattern[hour]);
        hourlyP50[hour] += endpoint.p50;
        hourlyP99[hour] += endpoint.p99;
      }
    }

    const avgHourlyP50 = hourlyP50.map(val => Math.round(val / endpoints.length));
    const avgHourlyP99 = hourlyP99.map(val => Math.round(val / endpoints.length));

    const errorPercent = parseFloat(errorRate) / 100 || 0;
    const errors404 = hourlyCalls.map(calls => Math.round(calls * errorPercent * 0.6));
    const errors500 = hourlyCalls.map(calls => Math.round(calls * errorPercent * 0.4));

    const gridColor = '#1f293744';

    // Chart 1: Call Trend
    this.charts.callTrend = new Chart(this.select('#ch-trend-calls'), {
      type: 'line',
      data: {
        labels: hourLabels,
        datasets: [{
          data: hourlyCalls,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, .1)',
          fill: true,
          tension: .4,
          pointRadius: 2,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: `${this.formatNumber(totalCalls)} 호출/24h`, color: '#9ca3af', font: { size: 11 } },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor } },
          x: { grid: { color: gridColor } },
        },
      },
    });

    // Chart 2: Response Time Trend
    this.charts.responseTrend = new Chart(this.select('#ch-trend-resp'), {
      type: 'line',
      data: {
        labels: hourLabels,
        datasets: [
          { label: 'P50', data: avgHourlyP50, borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, .08)', fill: true, tension: .4, borderWidth: 2, pointRadius: 0 },
          { label: 'P99', data: avgHourlyP99, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, .05)', fill: true, tension: .4, borderWidth: 2, pointRadius: 0 },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true, position: 'top', labels: { font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor } },
          x: { grid: { color: gridColor } },
        },
      },
    });

    // Chart 3: Error Trend
    this.charts.errorTrend = new Chart(this.select('#ch-trend-errs'), {
      type: 'bar',
      data: {
        labels: hourLabels,
        datasets: [
          { label: '404', data: errors404, backgroundColor: 'rgba(251, 191, 36, .7)', borderRadius: 3 },
          { label: '500', data: errors500, backgroundColor: 'rgba(248, 113, 113, .7)', borderRadius: 3 },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true, position: 'top', labels: { font: { size: 11 } } } },
        scales: {
          x: { stacked: true, grid: { color: gridColor } },
          y: { stacked: true, beginAtZero: true, grid: { color: gridColor } },
        },
      },
    });

    // Chart 4: Top 10 Services
    const topServices = [...services].sort((a, b) => b.r - a.r).slice(0, 10);

    this.charts.topServices = new Chart(this.select('#ch-top10'), {
      type: 'bar',
      data: {
        labels: topServices.map(svc => `${AppConfig.categoryIcons[svc.category] || ''}${svc.name}`),
        datasets: [
          {
            label: '정상',
            data: topServices.map(svc => svc.r ? Math.round(svc.r * (1 - svc.e / 100)) : 0),
            backgroundColor: 'rgba(52, 211, 153, .8)',
            borderRadius: 4,
            stack: 's',
          },
          {
            label: '오류',
            data: topServices.map(svc => svc.r ? Math.round(svc.r * svc.e / 100) : 0),
            backgroundColor: 'rgba(248, 113, 113, .8)',
            borderRadius: 4,
            stack: 's',
          },
        ],
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: true, position: 'top' } },
        scales: {
          x: { stacked: true, beginAtZero: true, grid: { color: gridColor } },
          y: { stacked: true, ticks: { font: { size: 11 } }, grid: { color: gridColor } },
        },
      },
    });
  },

  // ===== Category Filter =====
  populateCategoryFilter(services) {
    const categories = [...new Set(services.map(svc => svc.category))].sort();

    const optionsHtml = [
      '<option value="">전체 카테고리</option>',
      ...categories.map(cat =>
        `<option value="${cat}">${AppConfig.categoryIcons[cat] || ''} ${cat}</option>`
      ),
    ].join('');

    this.select('#api-cat-filter').innerHTML = optionsHtml;
  },

  // ===== Service Cards =====
  renderServiceCards(categoryFilter, searchTerm) {
    const services = window.API_SVCS || [];
    const healthEntries = this.healthData || [];

    const filtered = services.filter(svc => {
      if (categoryFilter && svc.category !== categoryFilter) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return svc.name.toLowerCase().includes(query) || svc.key.toLowerCase().includes(query);
      }
      return true;
    });

    const html = filtered.map(svc => {
      const errorsPerHour = Math.round(svc.r * svc.e / 100);
      const errorColor = svc.e > 5 ? '#f87171' : svc.e > 2 ? '#fbbf24' : '#34d399';
      const categoryColor = AppConfig.categoryColors[svc.category] || '#60a5fa';
      const categoryIcon = AppConfig.categoryIcons[svc.category] || '';

      // Find matching health endpoint
      const healthEntry = healthEntries.find(entry =>
        entry.name === svc.name ||
        entry.name.includes(svc.name) ||
        svc.name.includes(entry.name)
      );

      let dotColor, dotStatus;
      if (healthEntry) {
        if (healthEntry.status === 'up')       { dotColor = '#34d399'; dotStatus = '정상'; }
        else if (healthEntry.status === 'degraded') { dotColor = '#fbbf24'; dotStatus = '지연'; }
        else                                        { dotColor = '#f87171'; dotStatus = '다운'; }
      } else {
        dotColor = '#6b7280';
        dotStatus = 'N/A';
      }

      const detailId = `svc-detail-${svc.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Sparkline SVG
      let sparklineSvg = '';
      if (svc.qt && svc.qt.length) {
        const maxRequests = Math.max(...svc.qt) || 1;
        const pathData = svc.qt.map((val, idx) => {
          const x = (idx / 23 * 100).toFixed(1);
          const y = (16 - val / maxRequests * 14).toFixed(1);
          return `${idx === 0 ? 'M' : 'L'}${x} ${y}`;
        }).join(' ');
        sparklineSvg = `<svg viewBox="0 0 100 16" style="width:100%; height:16px; margin-top:8px; opacity:.65">
          <path d="${pathData}" stroke="${categoryColor}" stroke-width="1.5" fill="none"/>
        </svg>`;
      }

      return `
        <div class="api-svc-card" style="position:relative" data-svc-name="${svc.name}">
          <div style="position:absolute; top:12px; right:14px; display:flex; align-items:center; gap:6px">
            <div style="width:10px; height:10px; border-radius:50%; background:${dotColor}; box-shadow:0 0 8px ${dotColor}; animation:pulse 2s infinite"></div>
            <span style="font-size:.68rem; font-weight:600; color:${dotColor}">${dotStatus}</span>
          </div>
          <div style="display:flex; justify-content:flex-start; align-items:flex-start; margin-bottom:8px; padding-right:70px">
            <div>
              <div class="svc-title">${categoryIcon} ${svc.name}</div>
              <div class="svc-cat">${svc.category} \u00b7 ${svc.apiCount || 0}개 API</div>
            </div>
          </div>
          <div class="svc-metrics">
            <div class="m-item"><div class="m-val" style="color:${categoryColor}">${this.formatNumber(svc.r)}</div><div class="m-label">호출/h</div></div>
            <div class="m-item"><div class="m-val" style="color:${errorColor}">${this.formatNumber(errorsPerHour)}</div><div class="m-label">오류/h</div></div>
            <div class="m-item"><div class="m-val">${svc.p50}ms</div><div class="m-label">P50</div></div>
            <div class="m-item"><div class="m-val" style="color:${svc.p99 > 300 ? '#f87171' : '#e5e7eb'}">${svc.p99}ms</div><div class="m-label">P99</div></div>
          </div>
          ${sparklineSvg}
          <div class="api-svc-detail" id="${detailId}">
            <div style="margin-bottom:8px; font-size:.85rem; font-weight:600; color:#e5e7eb">\ud83d\udd1d TOP 5 API</div>
            <table style="width:100%">
              <thead><tr><th>메서드</th><th>API 경로</th><th>호출/h</th><th>P50</th><th>P99</th><th>오류/h</th><th>오류율</th></tr></thead>
              <tbody id="${detailId}-body"></tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    const grid = this.select('#api-svc-grid');
    if (grid) {
      grid.innerHTML = html || '<p style="text-align:center; color:#6b7280; padding:40px">해당 서비스가 없습니다</p>';
    }
  },

  // ===== Service TOP 5 Detail =====
  renderServiceTop5(serviceName, detailBox) {
    const endpoints = window.API_EPS || [];

    let matched = endpoints.filter(ep => ep.sv === serviceName);
    if (matched.length === 0) {
      matched = endpoints.filter(ep => ep.p.includes('/v1/'));
    }

    matched.sort((a, b) => b.r - a.r);
    let top5 = matched.slice(0, 5);
    if (top5.length === 0) top5 = endpoints.slice(0, 5);

    const html = top5.map(ep => {
      const errorsPerHour = Math.round(ep.r * ep.e / 100);
      const severityClass = ep.e > 5 ? 'sev-c' : ep.e > 1 ? 'sev-w' : '';
      const p99Color = ep.p99 > 300 ? '#f87171' : ep.p99 > 150 ? '#fbbf24' : '#e5e7eb';

      return `
        <tr>
          <td><span class="method-badge method-${ep.m.toLowerCase()}">${ep.m}</span></td>
          <td style="font-family:monospace; font-size:.78rem; color:#e5e7eb">${ep.p}</td>
          <td>${this.formatNumber(ep.r)}</td>
          <td>${ep.p50}ms</td>
          <td style="color:${p99Color}">${ep.p99}ms</td>
          <td class="${severityClass}">${this.formatNumber(errorsPerHour)}</td>
          <td class="${severityClass}">${ep.e}%</td>
        </tr>
      `;
    }).join('');

    const tbody = document.getElementById(`${detailBox.id}-body`);
    if (tbody) tbody.innerHTML = html;
  },

  // ===== Top Error APIs =====
  renderTopErrorApis(endpoints) {
    const topErrors = [...endpoints]
      .sort((a, b) => (b.r * b.e / 100) - (a.r * a.e / 100))
      .slice(0, 20);

    const html = topErrors.map(ep => {
      const errorsPerHour = Math.round(ep.r * ep.e / 100);
      const severityClass = ep.e > 5 ? 'sev-c' : ep.e > 1 ? 'sev-w' : '';
      const categoryColor = AppConfig.categoryColors[ep.ct] || '#9ca3af';
      const categoryIcon = AppConfig.categoryIcons[ep.ct] || '';

      return `
        <tr>
          <td style="color:${categoryColor}">${categoryIcon} ${ep.sv}</td>
          <td><span class="method-badge method-${ep.m.toLowerCase()}">${ep.m}</span></td>
          <td style="font-family:monospace; font-size:.78rem; color:#e5e7eb">${ep.p}</td>
          <td style="color:#9ca3af; font-size:.78rem; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${ep.d || ''}</td>
          <td style="font-weight:600">${this.formatNumber(ep.r)}</td>
          <td class="${severityClass}">${this.formatNumber(errorsPerHour)}</td>
          <td class="${severityClass}">${ep.e}%</td>
        </tr>
      `;
    }).join('');

    const tbody = document.getElementById('top-err-tbl');
    if (tbody) tbody.innerHTML = html;
  },

  // ===== Event Listeners =====
  attachEventListeners(endpoints) {
    setTimeout(() => {
      const categoryFilter = this.select('#api-cat-filter');
      const searchInput = this.select('#api-svc-search');

      const applyFilter = () => {
        this.renderServiceCards(
          categoryFilter ? categoryFilter.value : '',
          searchInput ? searchInput.value : ''
        );
      };

      if (categoryFilter) categoryFilter.addEventListener('change', applyFilter);
      if (searchInput) searchInput.addEventListener('input', applyFilter);

      this.selectAll('.api-svc-card').forEach(card => {
        card.addEventListener('click', () => {
          const serviceName = card.getAttribute('data-svc-name');
          if (!serviceName) return;

          const detailId = `svc-detail-${serviceName.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const detailBox = document.getElementById(detailId);
          if (!detailBox) return;

          const wasShowing = detailBox.classList.contains('show');

          // Collapse all other details
          this.selectAll('.api-svc-detail.show').forEach(el => {
            if (el !== detailBox) {
              el.classList.remove('show');
              const parentCard = el.closest('.api-svc-card');
              if (parentCard) parentCard.classList.remove('expanded');
            }
          });

          if (!wasShowing) {
            detailBox.classList.add('show');
            card.classList.add('expanded');
            if (!detailBox.dataset.rendered) {
              this.renderServiceTop5(serviceName, detailBox);
              detailBox.dataset.rendered = '1';
            }
          } else {
            detailBox.classList.remove('show');
            card.classList.remove('expanded');
          }
        });
      });
    }, 100);
  },

  // ===== Tab Switching =====
  initTabs() {
    this.selectAll('.tab-btn').forEach(button => {
      button.addEventListener('click', () => {
        this.selectAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        this.selectAll('.tab-content').forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        const targetTab = document.getElementById(`tab-${button.dataset.tab}`);
        if (targetTab) targetTab.classList.add('active');

        // Resize all charts on tab switch
        Object.values(this.charts).forEach(chart => {
          if (chart && chart.resize) chart.resize();
        });

        // Trigger Tab 2 render
        if (button.dataset.tab === 'services') {
          try {
            if (typeof renderTab2 === 'function') renderTab2();
          } catch (err) {
            console.error(err);
          }
        }
      });
    });
  },

  // ===== Init =====
  init() {
    this.startClock();
    this.initTabs();
    this.loadData();
  },
};

// Start the dashboard
Dashboard.init();
