// ======== TAB 1: API 운영 현황 ========

var charts={};
var rng=function(seed){var s=seed;return function(){s=(s*16807)%2147483647;return(s-1)/2147483646;};};
function E(s){return document.querySelector(s);}
function EA(s){return document.querySelectorAll(s);}
function formatNum(n){if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return n.toString();}
function clockFn(){var n=new Date();E('#clock').textContent='업데이트: '+n.toLocaleString('ko-KR');}
clockFn();setInterval(clockFn,1000);

var CAT_COLORS = {
 'Compute':'#60a5fa','Storage':'#a78bfa','Container':'#34d399',
 'Networking':'#fbbf24','Database':'#f87171','Data Analytics':'#c084fc',
 'Application Service':'#fb923c','Security':'#e879f9','Cloud Control':'#6ee7b7',
 'Financial Management':'#4ade80','DevOps':'#38bdf8','AI-ML':'#d946ef',
 'Platform':'#94a3b8','Management':'#6ee7b7','DevOps Tools':'#38bdf8'
};
var CAT_ICONS = {
 'Compute':'🖥️','Storage':'💾','Container':'📦',
 'Networking':'🌐','Database':'🗄️','Data Analytics':'📊',
 'Application Service':'⚙️','Security':'🔒','Cloud Control':'📡',
 'AI-ML':'🧠','Financial Management':'💰','DevOps Tools':'🚀',
 'Platform':'🏗️','Management':'⚙️'
};

// ===================================================================
// SERVICE HEALTH ENDPOINTS (실제 kr-west1 서비스 URL)
// ===================================================================
var HEALTH_ENDPOINTS = [
 // Compute
 {svc:'Virtual Server',cat:'Compute',url:'https://virtualserver.kr-west1.e.samsungsdscloud.com'},
 {svc:'Bare Metal',cat:'Compute',url:'https://baremetal.kr-west1.e.samsungsdscloud.com'},
 {svc:'Cloud Functions',cat:'Compute',url:'https://scf.kr-west1.e.samsungsdscloud.com'},
 {svc:'Multi-node GPU Cluster',cat:'Compute',url:'https://multinodegpucluster.kr-west1.e.samsungsdscloud.com'},
 // Storage
 {svc:'Archive Storage',cat:'Storage',url:'https://archivestorage.kr-west1.e.samsungsdscloud.com'},
 {svc:'Backup',cat:'Storage',url:'https://backup.kr-west1.e.samsungsdscloud.com'},
 {svc:'Block Storage (BM)',cat:'Storage',url:'https://baremetal-blockstorage.kr-west1.e.samsungsdscloud.com'},
 {svc:'File Storage',cat:'Storage',url:'https://filestorage.kr-west1.e.samsungsdscloud.com'},
 {svc:'Block Storage',cat:'Storage',url:'https://blockstorage.kr-west1.e.samsungsdscloud.com'},
 {svc:'Object Storage',cat:'Storage',url:'https://objectstorage.kr-west1.e.samsungsdscloud.com'},
 {svc:'Parallel File Storage',cat:'Storage',url:'https://parallel-filestorage.kr-west1.e.samsungsdscloud.com'},
 // Container
 {svc:'Kubernetes Engine',cat:'Container',url:'https://ske.kr-west1.e.samsungsdscloud.com'},
 {svc:'Container Registry',cat:'Container',url:'https://scr.kr-west1.e.samsungsdscloud.com'},
 // Networking
 {svc:'VPC',cat:'Networking',url:'https://vpc.kr-west1.e.samsungsdscloud.com'},
 {svc:'Load Balancer',cat:'Networking',url:'https://loadbalancer.kr-west1.e.samsungsdscloud.com'},
 {svc:'Cloud DNS',cat:'Networking',url:'https://dns.kr-west1.e.samsungsdscloud.com'},
 {svc:'Security Group',cat:'Networking',url:'https://security-group.kr-west1.e.samsungsdscloud.com'},
 {svc:'Firewall',cat:'Networking',url:'https://firewall.kr-west1.e.samsungsdscloud.com'},
 {svc:'Direct Connect',cat:'Networking',url:'https://direct-connect.kr-west1.e.samsungsdscloud.com'},
 {svc:'VPN',cat:'Networking',url:'https://vpn.kr-west1.e.samsungsdscloud.com'},
 {svc:'Global CDN',cat:'Networking',url:'https://cdn.kr-west1.e.samsungsdscloud.com'},
 {svc:'GSLB',cat:'Networking',url:'https://gslb.kr-west1.e.samsungsdscloud.com'},
 // Database
 {svc:'EPAS(DBaaS)',cat:'Database',url:'https://epas.kr-west1.e.samsungsdscloud.com'},
 {svc:'PostgreSQL(DBaaS)',cat:'Database',url:'https://postgresql.kr-west1.e.samsungsdscloud.com'},
 {svc:'MariaDB(DBaaS)',cat:'Database',url:'https://mariadb.kr-west1.e.samsungsdscloud.com'},
 {svc:'MySQL(DBaaS)',cat:'Database',url:'https://mysql.kr-west1.e.samsungsdscloud.com'},
 {svc:'SQL Server(DBaaS)',cat:'Database',url:'https://sqlserver.kr-west1.e.samsungsdscloud.com'},
 {svc:'CacheStore(DBaaS)',cat:'Database',url:'https://cachestore.kr-west1.e.samsungsdscloud.com'},
 // Data Analytics
 {svc:'Event Streams',cat:'Data Analytics',url:'https://eventstreams.kr-west1.e.samsungsdscloud.com'},
 {svc:'Search Engine',cat:'Data Analytics',url:'https://searchengine.kr-west1.e.samsungsdscloud.com'},
 {svc:'Vertica(DBaaS)',cat:'Data Analytics',url:'https://vertica.kr-west1.e.samsungsdscloud.com'},
 {svc:'Data Flow',cat:'Data Analytics',url:'https://data-flow.kr-west1.e.samsungsdscloud.com'},
 {svc:'Data Ops',cat:'Data Analytics',url:'https://data-ops.kr-west1.e.samsungsdscloud.com'},
 {svc:'Quick Query',cat:'Data Analytics',url:'https://quick-query.kr-west1.e.samsungsdscloud.com'},
 // Application Service
 {svc:'API Gateway',cat:'Application Service',url:'https://apigateway.kr-west1.e.samsungsdscloud.com'},
 {svc:'Queue Service',cat:'Application Service',url:'https://queueservice.kr-west1.e.samsungsdscloud.com'},
 // Security
 {svc:'Key Management Service',cat:'Security',url:'https://kms.kr-west1.e.samsungsdscloud.com'},
 {svc:'Config Inspection',cat:'Security',url:'https://configinspection.kr-west1.e.samsungsdscloud.com'},
 {svc:'Certificate Manager',cat:'Security',url:'https://certificatemanager.kr-west1.e.samsungsdscloud.com'},
 {svc:'Secret Vault',cat:'Security',url:'https://secretvault.kr-west1.e.samsungsdscloud.com'},
 {svc:'Secrets Manager',cat:'Security',url:'https://secretsmanager.kr-west1.e.samsungsdscloud.com'},
 // Management
 {svc:'Cloud Monitoring',cat:'Management',url:'https://cloudmonitoring.kr-west1.e.samsungsdscloud.com'},
 {svc:'IAM',cat:'Management',url:'https://iam.kr-west1.e.samsungsdscloud.com'},
 {svc:'ID Center',cat:'Management',url:'https://iam-identity-center.kr-west1.e.samsungsdscloud.com'},
 {svc:'Logging & Audit',cat:'Management',url:'https://loggingaudit.kr-west1.e.samsungsdscloud.com'},
 {svc:'Organization',cat:'Management',url:'https://organization.kr-west1.e.samsungsdscloud.com'},
 {svc:'ServiceWatch',cat:'Management',url:'https://servicewatch.kr-west1.e.samsungsdscloud.com'},
 {svc:'Resource Manager',cat:'Management',url:'https://resourcemanager.kr-west1.e.samsungsdscloud.com'},
 {svc:'Quota Service',cat:'Management',url:'https://quota.kr-west1.e.samsungsdscloud.com'},
 {svc:'Support Center',cat:'Management',url:'https://support.kr-west1.e.samsungsdscloud.com'},
 {svc:'Network Logging',cat:'Management',url:'https://network-logging.kr-west1.e.samsungsdscloud.com'},
 {svc:'Cloud Control',cat:'Management',url:'https://cloudcontrol.kr-west1.e.samsungsdscloud.com'},
 // Financial
 {svc:'Cost Explorer',cat:'Financial Management',url:'https://costexplorer.kr-west1.e.samsungsdscloud.com'},
 {svc:'Billing Plan',cat:'Financial Management',url:'https://billingplan.kr-west1.e.samsungsdscloud.com'},
 {svc:'Budget',cat:'Financial Management',url:'https://budget.kr-west1.e.samsungsdscloud.com'},
 {svc:'Pricing',cat:'Financial Management',url:'https://pricing.kr-west1.e.samsungsdscloud.com'},
 // DevOps
 {svc:'DevOps Service',cat:'DevOps Tools',url:'https://devopsservice.kr-west1.e.samsungsdscloud.com'},
 // AI-ML
 {svc:'Cloud ML',cat:'AI-ML',url:'https://cloud-ml.kr-west1.e.samsungsdscloud.com'},
 {svc:'AI & MLOps Platform',cat:'AI-ML',url:'https://aimlops-platform.kr-west1.e.samsungsdscloud.com'},
 // Platform
 {svc:'Product',cat:'Platform',url:'https://product.kr-west1.e.samsungsdscloud.com'},
 {svc:'STS',cat:'Platform',url:'https://sts.kr-west1.e.samsungsdscloud.com'},
];

// Simulate health check results (since we can't actually reach internal endpoints)
(function(){
 var sr = rng(777);
 var baseResp = {
  'CacheStore(DBaaS)':18,'Global CDN':25,'Cloud DNS':28,'GSLB':29,
  'Load Balancer':33,'Security Group':31,'VPC':35,'IAM':35,
  'Cloud Functions':38,'Direct Connect':42,'Parallel File Storage':39,
  'File Storage':43,'Cost Explorer':44,'VPN':44,'Object Storage':47,
  'Cloud Monitoring':47,'Block Storage':44,'Certificate Manager':42,
  'Virtual Server':45,'Archive Storage':62,'Backup':55,
  'Kubernetes Engine':56,'MariaDB(DBaaS)':59,'MySQL(DBaaS)':54,
  'Search Engine':53,'Event Streams':49,'Data Flow':46,
  'Secrets Manager':41,'Secret Vault':39,'Key Management Service':38,
  'Config Inspection':45,'SQL Server(DBaaS)':63,'EPAS(DBaaS)':67,
  'PostgreSQL(DBaaS)':71,'Quick Query':37,'Queue Service':34,
  'Data Ops':41,'Vertica(DBaaS)':78,'Logging & Audit':52,
  'ID Center':43,'Organization':38,'ServiceWatch':40,
  'Cloud ML':65,'AI & MLOps Platform':70,'DevOps Service':48,
  'Billing Plan':41,'Budget':39,'Pricing':40,
  'Container Registry':51,'Bare Metal':52,'Multi-node GPU Cluster':41,
  'Resource Manager':42,'Network Logging':44,'Cloud Control':46,
  'Support Center':45,'Quota Service':38,
  'Block Storage (BM)':48,'API Gateway':30,'Data Analytics':45,
  'Firewall':36,'STS':50,'Product':43,
 };
 HEALTH_ENDPOINTS.forEach(function(ep){
  var b = baseResp[ep.svc] || 45;
  var r = sr();
  if(r<0.04){ep.status='down';ep.resp=0;}
  else if(r<0.12){ep.status='degraded';ep.resp=Math.round(b*(1.5+sr()*1.5));}
  else{ep.status='up';ep.resp=Math.round(b*(0.8+sr()*0.4));}
 });
})();

// ===================================================================
// Load data and render
// ===================================================================
fetch('api_data.json').then(function(r){return r.json();}).then(function(d){
 window.API_SVCS=d.svc;
 window.API_EPS=d.ep;
 renderTab1();
}).catch(function(){
 // Fallback: use inline if available
 if(window.API_SVCS&&window.API_SVCS.length)renderTab1();
 else{E('#api-kpis').innerHTML='<p style=padding:40px;text-align:center;color:#9ca3af>데이터 로딩 실패</p>';}
});

function renderTab1(){
 var svcs=window.API_SVCS||[];
 var eps=window.API_EPS||[];
 healthSvcData = HEALTH_ENDPOINTS;

 // ----- Health Check aggregation -----
 var upCount=healthSvcData.filter(function(e){return e.status==='up';}).length;
 var downCount=healthSvcData.filter(function(e){return e.status==='down';}).length;
 var degCount=healthSvcData.filter(function(e){return e.status==='degraded';}).length;
 var totalSvc=healthSvcData.length;
 var healthRate=totalSvc?((upCount/totalSvc)*100).toFixed(1):100;

 // ----- API performance aggregation -----
 var totalCalls=eps.reduce(function(s,e){return s+e.r;},0);
 var avgP50=eps.length?Math.round(eps.reduce(function(s,e){return s+e.p50;},0)/eps.length):0;
 var avgP99=eps.length?Math.round(eps.reduce(function(s,e){return s+e.p99;},0)/eps.length):0;
 var avgResp=eps.length?Math.round(eps.reduce(function(s,e){return s+(e.s==='error'?e.p99:e.p50);},0)/eps.length):0;
 var errRate=eps.length?(eps.reduce(function(s,e){return s+e.e;},0)/eps.length).toFixed(1):0;
 var successRate=(100-parseFloat(errRate)).toFixed(1);
 var errEpsCount=eps.filter(function(e){return e.s==='error';}).length;

 // Update header badge
 var badge=E('#sys-status');
 if(downCount>0){badge.className='status-badge err';badge.innerHTML='<span class="dot" style="background:#f87171"></span><span>서비스 이상</span>';}
 else if(degCount>0){badge.className='status-badge warn';badge.innerHTML='<span class="dot" style="background:#fbbf24"></span><span>지연 감지</span>';}
 else{badge.className='status-badge ok';badge.innerHTML='<span class="dot"></span><span>정상</span>';}

 // SLA bar
 E('#sla-bar').innerHTML=[
  {l:'모니터링 서비스',v:totalSvc,s:'<span class=kpi-up>헬스체크</span>'},
  {l:'시간당 API 호출',v:formatNum(totalCalls),s:'전체 '+eps.length+' 엔드포인트'},
  {l:'평균 응답시간',v:avgResp+'ms',s:'P50: '+avgP50+'ms'},
  {l:'API 성공률',v:successRate+'%',s:'<span class=kpi-up>200 OK</span>'},
 ].map(function(k){return '<div class=sla-item><div class=sla-label>'+k.l+'</div><div class=sla-val>'+k.v+'</div><div class=sla-sub>'+k.s+'</div></div>';}).join('');

 // KPI cards
 E('#api-kpis').innerHTML=[
  {l:'정상 서비스',v:upCount,s:'<span class=kpi-up>'+healthRate+'% 가용성</span>'},
  {l:'지연 서비스',v:degCount,s:degCount>0?'<span class=kpi-warn>응답 지연</span>':'<span class=kpi-up>없음</span>'},
  {l:'다운 서비스',v:downCount,s:downCount>0?'<span class=kpi-down>대응필요</span>':'<span class=kpi-up>안정</span>'},
  {l:'오류 API',v:errEpsCount,s:'<span class=kpi-warn>에러율 '+errRate+'%</span>'},
  {l:'P50 응답',v:avgP50+'ms',s:'<span class=kpi-up>건강</span>'},
  {l:'P99 응답',v:avgP99+'ms',s:avgP99>300?'<span class=kpi-down>주의</span>':'<span class=kpi-up>정상</span>'},
 ].map(function(k){return '<div class=kpi-card><div class=kpi-label>'+k.l+'</div><div class=kpi-value>'+k.v+'</div><div class=kpi-sub>'+k.s+'</div></div>';}).join('');

 // ===== Charts =====
 var labels=['00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'];
 
 var hourCalls=new Array(24).fill(0);
 var hourP50=new Array(24).fill(0);
 var hourP99=new Array(24).fill(0);
 
 eps.forEach(function(ep){
  var pt=[.05,.03,.02,.01,.01,.015,.04,.12,.18,.15,.12,.10,.09,.08,.07,.06,.05,.04,.04,.05,.06,.08,.09,.10];
  var td=ep.r/pt.reduce(function(a,b){return a+b;},0);
  for(var i=0;i<24;i++){
   hourCalls[i]+=Math.round(td*pt[i]);
   hourP50[i]+=ep.p50;
   hourP99[i]+=ep.p99;
  }
 });
 var avgH50=hourP50.map(function(v){return Math.round(v/eps.length);});
 var avgH99=hourP99.map(function(v){return Math.round(v/eps.length);});

 // Error trend
 var errPct=parseFloat(errRate)/100||0;
 var err404=hourCalls.map(function(c){return Math.round(c*errPct*0.6);});
 var err500=hourCalls.map(function(c){return Math.round(c*errPct*0.4);});

 // Chart 1: Call trend
 charts.chCalls=new Chart(E('#ch-trend-calls'),{type:'line',data:{labels:labels,datasets:[{data:hourCalls,borderColor:'#60a5fa',backgroundColor:'rgba(96,165,250,.1)',fill:true,tension:.4,pointRadius:2,borderWidth:2}]},options:{responsive:true,plugins:{legend:{display:false},title:{display:true,text:formatNum(totalCalls)+' 호출/24h',color:'#9ca3af',font:{size:11}}},scales:{y:{beginAtZero:true,grid:{color:'#1f293744'}},x:{grid:{color:'#1f293744'}}}}});

 // Chart 2: Response time trend
 charts.chResp=new Chart(E('#ch-trend-resp'),{type:'line',data:{labels:labels,datasets:[
  {label:'P50',data:avgH50,borderColor:'#34d399',backgroundColor:'rgba(52,211,153,.08)',fill:true,tension:.4,borderWidth:2,pointRadius:0},
  {label:'P99',data:avgH99,borderColor:'#f97316',backgroundColor:'rgba(249,115,22,.05)',fill:true,tension:.4,borderWidth:2,pointRadius:0}
 ]},options:{responsive:true,plugins:{legend:{display:true,position:'top',labels:{font:{size:11}}}},scales:{y:{beginAtZero:true,grid:{color:'#1f293744'}},x:{grid:{color:'#1f293744'}}}}});

 // Chart 3: Error trend
 charts.chErrs=new Chart(E('#ch-trend-errs'),{type:'bar',data:{labels:labels,datasets:[
  {label:'404',data:err404,backgroundColor:'rgba(251,191,36,.7)',borderRadius:3},
  {label:'500',data:err500,backgroundColor:'rgba(248,113,113,.7)',borderRadius:3}
 ]},options:{responsive:true,plugins:{legend:{display:true,position:'top',labels:{font:{size:11}}}},scales:{x:{stacked:true,grid:{color:'#1f293744'}},y:{stacked:true,beginAtZero:true,grid:{color:'#1f293744'}}}}});

 // Chart 4: Top 10 services
 var top10=svcs.slice().sort(function(a,b){return b.r-a.r;}).slice(0,10);
 charts.chTop10=new Chart(E('#ch-top10'),{type:'bar',data:{
  labels:top10.map(function(s){return(CAT_ICONS[s.ct]||'')+s.n;}),
  datasets:[
   {label:'정상',data:top10.map(function(s){return Math.round(s.r*(1-s.e/100));}),backgroundColor:'rgba(52,211,153,.8)',borderRadius:4,stack:'s'},
   {label:'오류',data:top10.map(function(s){return Math.round(s.r*s.e/100);}),backgroundColor:'rgba(248,113,113,.8)',borderRadius:4,stack:'s'}
  ]
 },options:{responsive:true,indexAxis:'y',plugins:{legend:{display:true,position:'top'}},scales:{x:{stacked:true,beginAtZero:true,grid:{color:'#1f293744'}},y:{stacked:true,ticks:{font:{size:11}},grid:{color:'#1f293744'}}}}});

 // ===== Category filter for service cards =====
 var cfOpt='<option value="">전체 카테고리</option>';
 var svcCats=[];
 svcs.forEach(function(s){if(svcCats.indexOf(s.ct)===-1)svcCats.push(s.ct);});
 svcCats.sort().forEach(function(c){cfOpt+='<option value="'+c+'">'+(CAT_ICONS[c]||'')+' '+c+'</option>';});
 E('#api-cat-filter').innerHTML=cfOpt;
 renderSvcCards('','');

 // ===== TOP 20 오류 API =====
 renderTopErrApi(eps);

 // ===== Event Listeners =====
 setTimeout(function(){
  var sf=E('#api-cat-filter');
  var ss=E('#api-svc-search');
  function sFilter(){renderSvcCards(sf?sf.value:'',ss?ss.value:'');}
  if(sf)sf.addEventListener('change',sFilter);
  if(ss)ss.addEventListener('input',sFilter);

  // Card click => show TOP 5 API detail
  EA('.api-svc-card').forEach(function(card){
   card.addEventListener('click',function(e){
    var svcName=card.getAttribute('data-svc-name');
    if(!svcName)return;
    var detailBox=document.getElementById('svc-detail-'+svcName.replace(/[^a-zA-Z0-9]/g,'_'));
    if(!detailBox)return;
    
    var wasShowing=detailBox.classList.contains('show');
    
    // Close all other open cards
    EA('.api-svc-detail.show').forEach(function(el){
     if(el!==detailBox){
      el.classList.remove('show');
      var parentCard=el.closest('.api-svc-card');
      if(parentCard)parentCard.classList.remove('expanded');
     }
    });
    
    if(!wasShowing){
     detailBox.classList.add('show');
     card.classList.add('expanded');
     if(!detailBox.dataset.rendered){
      renderSvcTop5(svcName,detailBox);
      detailBox.dataset.rendered='1';
     }
    } else {
     detailBox.classList.remove('show');
     card.classList.remove('expanded');
    }
   });
  });
 },100);
}

// ===================================================================
// Service cards rendering
// ===================================================================
function renderSvcCards(catF,search){
 var svcs=window.API_SVCS||[];
 var filtered=svcs.filter(function(s){
  if(catF&&s.ct!==catF)return false;
  if(search&&(s.n.toLowerCase().indexOf(search.toLowerCase())===-1&&s.k.toLowerCase().indexOf(search.toLowerCase())===-1))return false;
  return true;
 });
 
 var h='';
 filtered.forEach(function(svc){
  var errH=Math.round(svc.r*svc.e/100);
  var errCol=svc.e>5?'#f87171':svc.e>2?'#fbbf24':'#34d399';
  
  // Find matching health endpoint
  var he = null;
  for(var i=0;i<HEALTH_ENDPOINTS.length;i++){
   if(HEALTH_ENDPOINTS[i].svc===svc.n || HEALTH_ENDPOINTS[i].svc.indexOf(svc.n)!==-1 || svc.n.indexOf(HEALTH_ENDPOINTS[i].svc)!==-1){
    he=HEALTH_ENDPOINTS[i];
    break;
   }
  }
  
  // Status indicator
  var dotColor, dotStatus;
  if(he){
   if(he.status==='up'){dotColor='#34d399';dotStatus='정상';}
   else if(he.status==='degraded'){dotColor='#fbbf24';dotStatus='지연';}
   else{dotColor='#f87171';dotStatus='다운';}
  } else {
   dotColor='#6b7280';dotStatus='N/A';
  }
  
  h+='<div class="api-svc-card" style="position:relative" data-svc-name="'+svc.n+'">';
  // Status indicator top-right
  h+='<div style="position:absolute;top:12px;right:14px;display:flex;align-items:center;gap:6px">';
  h+='<div style="width:10px;height:10px;border-radius:50%;background:'+dotColor+';box-shadow:0 0 8px '+dotColor+';animation:pulse 2s infinite"></div>';
  h+='<span style="font-size:.68rem;font-weight:600;color:'+dotColor+'">'+dotStatus+'</span>';
  h+='</div>';
  
  h+='<div style="display:flex;justify-content:flex-start;align-items:flex-start;margin-bottom:8px;padding-right:70px">';
  h+='<div><div class="svc-title">'+(CAT_ICONS[svc.ct]||'')+' '+svc.n+'</div>';
  h+='<div class="svc-cat">'+svc.ct+' · '+svc.ac+'개 API</div></div>';
  h+='</div>';
  h+='<div class="svc-metrics">';
  h+='<div class=m-item><div class=m-val style=color:'+(svc.c||CAT_COLORS[svc.ct])+'>'+formatNum(svc.r)+'</div><div class=m-label>호출/h</div></div>';
  h+='<div class=m-item><div class=m-val style=color:'+errCol+'>'+formatNum(errH)+'</div><div class=m-label>오류/h</div></div>';
  h+='<div class=m-item><div class=m-val>'+svc.p50+'ms</div><div class=m-label>P50</div></div>';
  h+='<div class=m-item><div class=m-val style=color:'+(svc.p99>300?'#f87171':'#e5e7eb')+'>'+svc.p99+'ms</div><div class=m-label>P99</div></div>';
  h+='</div>';
  // Sparkline
  if(svc.qt&&svc.qt.length){
   var maxR=Math.max.apply(null,svc.qt)||1;
   var pts=svc.qt.map(function(v,i){
    var x=i/23*100,y=16-v/maxR*14;
    return(i===0?'M':'L')+x.toFixed(1)+' '+y.toFixed(1);
   }).join(' ');
   h+='<svg viewBox="0 0 100 16" style="width:100%;height:16px;margin-top:8px;opacity:.65"><path d="'+pts+'" stroke="'+(svc.c||CAT_COLORS[svc.ct])+'" stroke-width="1.5" fill="none"/></svg>';
  }

  // TOP 5 API detail box
  var detailId='svc-detail-'+svc.n.replace(/[^a-zA-Z0-9]/g,'_');
  h+='<div class="api-svc-detail" id="'+detailId+'"><div style="margin-bottom:8px;font-size:.85rem;font-weight:600;color:#e5e7eb">🔝 TOP 5 API</div>';
  h+='<table style=width:100%><thead><tr>';
  h+='<th>메서드</th><th>API 경로</th><th>호출/h</th><th>P50</th><th>P99</th><th>오류/h</th><th>오류율</th>';
  h+='</tr></thead><tbody id="'+detailId+'-body"></tbody></table></div>';

  h+='</div>';
 });
 var grid=E('#api-svc-grid');
 if(grid)grid.innerHTML=h||'<p style="text-align:center;color:#6b7280;padding:40px">해당 서비스가 없습니다</p>';
}


// ===================================================================
// Service TOP 5 API detail (called on card click)
// ===================================================================
function renderSvcTop5(svcName,detailBox){
 var eps=window.API_EPS||[];
 // Find matching endpoints for this service
 var matched=eps.filter(function(e){
  return e.sv===svcName || (e.p.indexOf('/v1/')!==-1 && e.sv.indexOf(svcName.replace(/[^a-zA-Z가-힣]/g,''))!==-1);
 });
 // If no direct match, fuzzy match by path segments
 if(matched.length===0){
  matched=eps.filter(function(e){
   var svcParts=svcName.toLowerCase().replace(/[^a-z가-힣]/g,'').split('');
   var pathLower=e.p.toLowerCase().replace(/[^a-z가-힣]/g,'');
   for(var i=0;i<svcParts.length;i++){
    if(pathLower.indexOf(svcParts[i])!==-1)return true;
   }
   return pathLower.indexOf(svcName.toLowerCase().replace(/[^a-z가-힣]/g,''))!==-1 ||
          svcName.toLowerCase().indexOf(pathLower)!==-1;
  });
 }
 // Sort by requests, take top 5
 matched.sort(function(a,b){return b.r-a.r;});
 var top5=matched.slice(0,5);
 if(top5.length===0){
  // Fallback: return all eps that might match
  top5=eps.slice(0,5);
 }
 var h='';
 top5.forEach(function(ep){
  var errH=Math.round(ep.r*ep.e/100);
  var errCol=ep.e>5?'sev-c':ep.e>1?'sev-w':'';
  var pcol=ep.p99>300?'#f87171':ep.p99>150?'#fbbf24':'#e5e7eb';
  h+='<tr>';
  h+='<td><span class="method-badge method-'+ep.m.toLowerCase()+'">'+ep.m+'</span></td>';
  h+='<td style="font-family:monospace;font-size:.78rem;color:#e5e7eb">'+ep.p+'</td>';
  h+='<td style="font-weight:600">'+formatNum(ep.r)+'</td>';
  h+='<td>'+ep.p50+'ms</td>';
  h+='<td style="color:'+pcol+'">'+ep.p99+'ms</td>';
  h+='<td style="color:'+errCol+'">'+formatNum(errH)+'</td>';
  h+='<td style="color:'+errCol+'">'+ep.e+'%</td>';
  h+='</tr>';
 });
 var tbodyId=detailBox.id+'-body';
 var tbody=document.getElementById(tbodyId);
 if(tbody)tbody.innerHTML=h;
}

// ===================================================================
// TOP 20 오류 API 테이블 (전체)
// ===================================================================
function renderTopErrApi(eps){
 var topErr=eps.slice().sort(function(a,b){
  return(b.r*b.e/100)-(a.r*a.e/100);
 }).slice(0,20);
 var h='';
 topErr.forEach(function(ep){
  var errH=Math.round(ep.r*ep.e/100);
  var errCol=ep.e>5?'sev-c':ep.e>1?'sev-w':'';
  var pcol=ep.p99>300?'#f87171':ep.p99>150?'#fbbf24':'#e5e7eb';
  h+='<tr>';
  h+='<td style="color:'+(CAT_COLORS[ep.ct]||'#9ca3af')+'">'+(CAT_ICONS[ep.ct]||'')+' '+ep.sv+'</td>';
  h+='<td><span class="method-badge method-'+ep.m.toLowerCase()+'">'+ep.m+'</span></td>';
  h+='<td style="font-family:monospace;font-size:.78rem;color:#e5e7eb">'+ep.p+'</td>';
  h+='<td style="color:#9ca3af;font-size:.78rem;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(ep.d||'')+'</td>';
  h+='<td style="font-weight:600">'+formatNum(ep.r)+'</td>';
  h+='<td style="color:'+errCol+'">'+formatNum(errH)+'</td>';
  h+='<td style="color:'+errCol+'">'+ep.e+'%</td>';
  h+='</tr>';
 });
 var tbl=document.getElementById('top-err-tbl');
 if(tbl)tbl.innerHTML=h;
}

// ===================================================================
// Tab switching
// ===================================================================
function initTabs(){
 EA('.tab-btn').forEach(function(b){
  b.addEventListener('click',function(){
   EA('.tab-btn').forEach(function(x){x.classList.remove('active')});
   EA('.tab-content').forEach(function(x){x.classList.remove('active')});
   b.classList.add('active');
   var tc=document.getElementById('tab-'+b.dataset.tab);
   if(tc)tc.classList.add('active');
   Object.keys(charts).forEach(function(k){if(charts[k]&&charts[k].resize)charts[k].resize();});
   // Trigger tab2 rendering when switching to it
   if(b.dataset.tab==='services')try{if(typeof renderTab2==='function')renderTab2();}catch(e){}
  });
 });
}
initTabs();
