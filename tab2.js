// ======== TAB 2: 서비스 제공 현황 ========
// Data sources: config.js + data/services.json + data/metrics.json + data/accounts.json

var tab2Rendered=false;

function renderTab2(){
 if(tab2Rendered)return;
 tab2Rendered=true;
 var svcs=window.API_SVCS||[];
 var eps=window.API_EPS||[];
 var rng2=function(seed){var s=seed;return function(){s=(s*16807)%2147483647;return(s-1)/2147483646;};};
 var r2i=rng2(42);
 function fmtN(v){if(v>=1e9)return'\u20a9'+(v/1e9).toFixed(1)+'B';if(v>=1e6)return'\u20a9'+(v/1e6).toFixed(1)+'M';return'\u20a9'+v.toFixed(0);}

 // Load accounts data (from ETL-generated data/accounts.json)
 C.fetchData('accounts').then(function(d){window.ACCOUNTS=d;}).catch(function(){window.ACCOUNTS={
  totalAccounts:1287,newAccountsToday:3,newAccountsThisWeek:18,newAccountsThisMonth:87,
  lastMonthRevenue:18500000000,monthOverMonthGrowth:0.08,totalActiveInstances:5847,
  monthlyRevenueTrend:[12100,12500,13100,12800,13500,14200,14800,15500,15200,16100,16800,18500]
 };});

 var months=C.MONTHS;

 // Account Summary
 var totalAcc=1287,newToday=3,newWeek=18,newMonth=87;

 // Category Revenue
 var catMap={};
 svcs.forEach(function(s){
  if(!catMap[s.category])catMap[s.category]={name:s.category,rev:0,count:0,color:C.CATEGORY_COLORS[s.category]||'#9ca3af'};
  catMap[s.category].rev+=s.r*500;
  catMap[s.category].count++;
 });
 var catList=Object.keys(catMap).sort(function(a,b){return catMap[b].rev-catMap[a].rev;});
 var revTotal=0;catList.forEach(function(c){revTotal+=catMap[c].rev;});
 var revGrowth=Math.round(revTotal*.05);
 var topSvc=svcs.slice().sort(function(a,b){return b.r-a.r;})[0];

 // Total instances
 var instTotal=0;
 svcs.forEach(function(s){instTotal+=Math.floor(50+r2i()*400);});

 var h='';

 // === SLA Bar ===
 h+='<div class="sla-bar">';
 h+='<div class=sla-item><div class=sla-label>Overall Account</div><div class=sla-val>'+totalAcc.toLocaleString()+'</div><div class=sla-sub><span class=kpi-up>Active</span></div></div>';
 h+='<div class=sla-item><div class=sla-label>New (Today)</div><div class=sla-val style=color:#34d399>+'+newToday+'</div><div class=sla-sub><span class=kpi-up>+12% WoW</span></div></div>';
 h+='<div class=sla-item><div class=sla-label>New (This Week)</div><div class=sla-val style=color:#34d399>+'+newWeek+'</div><div class=sla-sub><span class=kpi-up>+7% MoM</span></div></div>';
 h+='<div class=sla-item><div class=sla-label>New (This Month)</div><div class=sla-val style=color:#34d399>+'+newMonth+'</div><div class=sla-sub><span class=kpi-up>Cumulative</span></div></div>';
 h+='</div>';

 // === KPI Cards ===
 h+='<div class="kpi-grid">';
 h+='<div class=kpi-card><div class=kpi-label>Last Month Revenue</div><div class=kpi-value>\u20a918.5B</div><div class=kpi-sub><span class=kpi-up>\u25b2 8% vs prev month</span></div></div>';
 h+='<div class=kpi-card><div class=kpi-label>MoM Growth</div><div class=kpi-value>+'+(revGrowth/1e6).toFixed(0)+'M</div><div class=kpi-sub><span class=kpi-up>\u25b2 Growing</span></div></div>';
 h+='<div class=kpi-card><div class=kpi-label>Total Active Instances</div><div class=kpi-value>'+instTotal.toLocaleString()+'</div><div class=kpi-sub><span class=kpi-up>\u25b2 234 new</span></div></div>';
 h+='<div class=kpi-card><div class=kpi-label>Top Revenue Service</div><div class=kpi-value style=color:'+(topSvc?C.CATEGORY_COLORS[topSvc.category]:'#9ca3af')+'>'+(topSvc?topSvc.name:'-')+'</div><div class=kpi-sub><span style=color:#34d399>'+(topSvc?fmtN(topSvc.r*500):'-')+'</span></div></div>';
 h+='</div>';

 // === Charts ===
 h+='<div class="charts-grid">';
 h+='<div class="chart-card"><h3>Category Revenue</h3><canvas id="ch2-catrev"></canvas></div>';
 h+='<div class="chart-card"><h3>Monthly Revenue Trend</h3><canvas id="ch2-monthrev"></canvas></div>';
 h+='</div>';

 // === Per-Category, Per-Service ===
 var catOrder=['Compute','Networking','Database','Storage','Container','Data Analytics','Application Service','Security','Management','Financial Management','DevOps Tools','AI-ML','Platform'];
 var svcData={};
 svcs.forEach(function(s){
  if(!svcData[s.category])svcData[s.category]=[];
  var tI=Math.floor(50+r2i()*500);
  var nM=Math.floor(10+r2i()*50);
  var nD=Math.floor(1+r2i()*8);
  svcData[s.category].push({
   key:s.key,name:s.name,ac:s.apiCount||0,category:s.category,
   color:C.CATEGORY_COLORS[s.category]||'#9ca3af',icon:C.CATEGORY_ICONS[s.category]||'\ud83d\udce6',
   tI:tI,nM:nM,nD:nD,lastRev:Math.round(s.r*300),r:s.r
  });
 });

 catOrder.forEach(function(cat){
  var items=svcData[cat];
  if(!items||!items.length)return;

  h+='<div style="margin-top:32px"><h3 style="font-size:1.1rem;color:#e5e7eb;margin-bottom:16px">'+(C.CATEGORY_ICONS[cat]||'\ud83d\udce6')+' '+cat+'</h3>';
  h+='<div class="services-grid">';

  items.forEach(function(s){
   var safeKey=s.key.replace(/[^a-zA-Z0-9]/g,'_');
   h+='<div class="api-svc-card" style="margin-bottom:0;cursor:default">';
   h+='<div><div class="svc-title">'+s.icon+' '+s.name+'</div>';
   h+='<div class="svc-cat">'+s.category+' \u00b7 '+s.ac+' APIs</div></div>';
   h+='<div class="svc-metrics">';
   h+='<div class=m-item><div class=m-val style=color:'+s.color+'>'+s.tI.toLocaleString()+'</div><div class=m-label>Total</div></div>';
   h+='<div class=m-item><div class=m-val style=color:#34d399>+'+s.nM+'</div><div class=m-label>This Month</div></div>';
   h+='<div class=m-item><div class=m-val style=color:#fbbf24>+'+s.nD+'</div><div class=m-label>Today</div></div>';
   h+='<div class=m-item><div class=m-val>'+fmtN(s.lastRev)+'</div><div class=m-label>Last M Rev</div></div>';
   h+='</div>';
   h+='<div style="margin-top:16px;height:80px"><canvas id="ci_'+safeKey+'"></canvas></div>';
   h+='<div style="margin-top:12px;height:80px"><canvas id="cr_'+safeKey+'"></canvas></div>';
   h+='</div>';
  });
  h+='</div></div>';
 });

 E('#svc-container').innerHTML=h;

 // === Render Charts ===
 setTimeout(function(){
  var cL=catList.map(function(c){return(C.CATEGORY_ICONS[catMap[c].name]||'')+catMap[c].name;});
  var cR=catList.map(function(c){return Math.round(catMap[c].rev/1e6);});
  var cC=catList.map(function(c){return catMap[c].color+'cc';});
  if(E('#ch2-catrev'))charts.ch2CatRev=new Chart(E('#ch2-catrev'),{type:'bar',data:{labels:cL,datasets:[{data:cR,backgroundColor:cC,borderRadius:6}]},options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,grid:{color:'#1f293744'}},y:{grid:{color:'#1f293744'}}}}});

  var mRev=[12100,12500,13100,12800,13500,14200,14800,15500,15200,16100,16800,18500];
  if(E('#ch2-monthrev'))charts.ch2MonthRev=new Chart(E('#ch2-monthrev'),{type:'line',data:{labels:months,datasets:[{data:mRev,borderColor:'#7dd3fc',backgroundColor:'rgba(125,211,252,.1)',fill:true,tension:.4,pointRadius:4,borderWidth:2}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:false,grid:{color:'#1f293744'}},x:{grid:{color:'#1f293744'}}}}});

  catOrder.forEach(function(cat){
   var it2=svcData[cat];
   if(!it2)return;
   it2.forEach(function(s){
    var sk=s.key.replace(/[^a-zA-Z0-9]/g,'_');
    var iTrend=months.map(function(_,i){return Math.round(s.tI*(0.4+0.6*Math.pow(i/11,0.8))*(0.85+r2i()*0.3));});
    var ie=document.getElementById('ci_'+sk);
    if(ie)new Chart(ie,{type:'bar',data:{labels:months,datasets:[{label:'Instances',data:iTrend,backgroundColor:s.color+'aa',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}},scales:{x:{grid:{color:'#1f293722'}},y:{beginAtZero:true,grid:{color:'#1f293722'}}}}});

    var rTrend=months.map(function(_,i){return Math.round(s.lastRev/12*(0.6+0.4*i/11)*(0.85+r2i()*0.3));});
    var re=document.getElementById('cr_'+sk);
    if(re)new Chart(re,{type:'line',data:{labels:months,datasets:[{label:'Revenue',data:rTrend,borderColor:s.color,backgroundColor:s.color+'22',fill:true,tension:.4,borderWidth:2,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}},scales:{x:{grid:{color:'#1f293722'}},y:{beginAtZero:true,ticks:{callback:function(v){return'\u20a9'+(v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?'\u20a9'+(v/1e3).toFixed(0)+'K':'\u20a9'+v);}},grid:{color:'#1f293722'}}}}});
   });
  });
 },200);
}

// Auto-render on tab switch
setTimeout(function(){
 EA('.tab-btn').forEach(function(b){
  if(b.dataset.tab==='services'){
   b.addEventListener('click',function(){
    setTimeout(function(){renderTab2();},150);
   });
  }
 });
},300);
