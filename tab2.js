// ======== TAB 2: 서비스 제공 현황 ========
var tab2Rendered=false;

function renderTab2(){
 if(tab2Rendered)return;
 tab2Rendered=true;
 var svcs=window.API_SVCS||[];
 var eps=window.API_EPS||[];
 var rng2=function(seed){var s=seed;return function(){s=(s*16807)%2147483647;return(s-1)/2147483646;};};
 var r2i=rng2(42);

 function fmtN(v){
  if(v>=1e9)return'\u20a9'+(v/1e9).toFixed(1)+'B';
  if(v>=1e6)return'\u20a9'+(v/1e6).toFixed(1)+'M';
  return'\u20a9'+v.toFixed(0);
 }

 var CC={Compute:'#60a5fa',Storage:'#a78bfa',Container:'#34d399',Networking:'#fbbf24',Database:'#f87171','Data Analytics':'#c084fc','Application Service':'#fb923c',Security:'#e879f9',Management:'#6ee7b7','Financial Management':'#4ade80','DevOps Tools':'#38bdf8','AI-ML':'#d946ef',Platform:'#94a3b8'};
 var IC={Compute:'\ud83d\udda5\ufe0f',Storage:'\ud83d\udcbe',Container:'\ud83d\udce6',Networking:'\ud83c\udf10',Database:'\ud83d\uddc4\ufe0f','Data Analytics':'\ud83d\udcca','Application Service':'\u2699\ufe0f',Security:'\ud83d\udd12',Management:'\ud83d\udce1','Financial Management':'\ud83d\udcb0','DevOps Tools':'\ud83d\ude80','AI-ML':'\ud83e\udde0',Platform:'\ud83c\udfd7\ufe0f'};
 var months=['1\uc6d4','2\uc6d4','3\uc6d4','4\uc6d4','5\uc6d4','6\uc6d4','7\uc6d4','8\uc6d4','9\uc6d4','10\uc6d4','11\uc6d4','12\uc6d4'];

 // Account + Category Revenue
 var totalAcc=1287,newToday=3,newWeek=18,newMonth=87;
 var catMap={};
 svcs.forEach(function(s){
  if(!catMap[s.ct])catMap[s.ct]={name:s.ct,rev:0,count:0,color:CC[s.ct]||'#9ca3af'};
  catMap[s.ct].rev+=s.r*500;
  catMap[s.ct].count++;
 });
 var catList=Object.keys(catMap).sort(function(a,b){return catMap[b].rev-catMap[a].rev;});
 var revTotal=0;catList.forEach(function(c){revTotal+=catMap[c].rev;});
 var revGrowth=Math.round(revTotal*.05);
 var topSvc=svcs.slice().sort(function(a,b){return b.r-a.r;})[0];

 // Total instances
 var totalInst=0;
 var rngI=rng2(888);
 svcs.forEach(function(){totalInst+=Math.floor(50+rngI()*400);});

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
 h+='<div class=kpi-card><div class=kpi-label>Total Active Instances</div><div class=kpi-value>'+totalInst.toLocaleString()+'</div><div class=kpi-sub><span class=kpi-up>\u25b2 234 new</span></div></div>';
 h+='<div class=kpi-card><div class=kpi-label>Top Revenue Service</div><div class=kpi-value style=color:'+((topSvc?CC[topSvc.ct]:'')||'#9ca3af')+'>'+(topSvc?topSvc.n:'-')+'</div><div class=kpi-sub><span style=color:#34d399>'+(topSvc?fmtN(topSvc.r*500):'-')+'</span></div></div>';
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
  if(!svcData[s.ct])svcData[s.ct]=[];
  var tI=Math.floor(50+r2i()*500);
  var nM=Math.floor(10+r2i()*50);
  var nD=Math.floor(1+r2i()*8);
  svcData[s.ct].push({
   key:s.k,name:s.n,ac:s.ac,ct:s.ct,
   color:CC[s.ct]||'#9ca3af',icon:IC[s.ct]||'\ud83d\udce6',
   tI:tI,nM:nM,nD:nD,lastRev:Math.round(s.r*300),r:s.r
  });
 });

 catOrder.forEach(function(cat){
  var items=svcData[cat];
  if(!items||!items.length)return;

  h+='<div style="margin-top:32px"><h3 style="font-size:1.1rem;color:#e5e7eb;margin-bottom:16px">'+(IC[cat]||'\ud83d\udce6')+' '+cat+'</h3>';
  h+='<div class="services-grid">';

  items.forEach(function(s){
   var safeKey=s.key.replace(/[^a-zA-Z0-9]/g,'_');

   // Service card
   h+='<div class="api-svc-card" style="margin-bottom:16px;cursor:default">';
   h+='<div><div class="svc-title">'+s.icon+' '+s.name+'</div>';
   h+='<div class="svc-cat">'+s.ct+' \u00b7 '+s.ac+' APIs</div></div>';

   h+='<div class="svc-metrics">';
   h+='<div class=m-item><div class=m-val style=color:'+s.color+'>'+s.tI.toLocaleString()+'</div><div class=m-label>Total</div></div>';
   h+='<div class=m-item><div class=m-val style=color:#34d399>+'+s.nM+'</div><div class=m-label>This Month</div></div>';
   h+='<div class=m-item><div class=m-val style=color:#fbbf24>+'+s.nD+'</div><div class=m-label>Today</div></div>';
   h+='<div class=m-item><div class=m-val>'+fmtN(s.lastRev)+'</div><div class=m-label>Last M Rev</div></div>';
   h+='</div>';

   // Canvas containers (outside any table/div nesting)
   h+='<div style="margin-top:16px;height:80px"><canvas id="ci_'+safeKey+'"></canvas></div>';
   h+='<div style="margin-top:12px;height:80px"><canvas id="cr_'+safeKey+'"></canvas></div>';

   h+='</div>'; // close card
  });

  h+='</div>'; // close grid
  h+='</div>'; // close category section
 });

 E('#svc-container').innerHTML=h;

 // === Render Charts ===
 setTimeout(function(){
  // Cat revenue
  var cL=catList.map(function(c){return IC[catMap[c].name]?IC[catMap[c].name]+catMap[c].name:catMap[c].name;});
  var cR=catList.map(function(c){return Math.round(catMap[c].rev/1e6);});
  var cC=catList.map(function(c){return catMap[c].color+'cc';});
  var el1=document.getElementById('ch2-catrev');
  if(el1)new Chart(el1,{type:'bar',data:{labels:cL,datasets:[{data:cR,backgroundColor:cC,borderRadius:6}]},options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,grid:{color:'#1f293744'}},y:{grid:{color:'#1f293744'}}}}});

  // Monthly rev
  var mRev=[12100,12500,13100,12800,13500,14200,14800,15500,15200,16100,16800,18500];
  var el2=document.getElementById('ch2-monthrev');
  if(el2)new Chart(el2,{type:'line',data:{labels:months,datasets:[{data:mRev,borderColor:'#7dd3fc',backgroundColor:'rgba(125,211,252,.1)',fill:true,tension:.4,pointRadius:4,borderWidth:2}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:false,grid:{color:'#1f293744'}},x:{grid:{color:'#1f293744'}}}}});

  // Pie - removed
  // catList.forEach(function(c){
  //  for(var i=0;i<catMap[c].count;i++){
  //   pL.push(catMap[c].name);
  //   pC.push(catMap[c].color+'cc');
  //  }
  // });
  // Per-service
  catOrder.forEach(function(cat){
   var it2=svcData[cat];
   if(!it2)return;
   it2.forEach(function(s){
    var sk=s.key.replace(/[^a-zA-Z0-9]/g,'_');

    // Instance trend
    var iTrend=months.map(function(_,i){return Math.round(s.tI*(0.4+0.6*Math.pow(i/11,0.8))*(0.85+r2i()*0.3));});
    var ie=document.getElementById('ci_'+sk);
    if(ie)new Chart(ie,{type:'bar',data:{labels:months,datasets:[{label:'Instances',data:iTrend,backgroundColor:s.color+'aa',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}},scales:{x:{grid:{color:'#1f293722'}},y:{beginAtZero:true,grid:{color:'#1f293722'}}}}});

    // Revenue trend
    var rTrend=months.map(function(_,i){return Math.round(s.lastRev/12*(0.6+0.4*i/11)*(0.85+r2i()*0.3));});
    var re=document.getElementById('cr_'+sk);
    if(re)new Chart(re,{type:'line',data:{labels:months,datasets:[{label:'Revenue',data:rTrend,borderColor:s.color,backgroundColor:s.color+'22',fill:true,tension:.4,borderWidth:2,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}},scales:{x:{grid:{color:'#1f293722'}},y:{beginAtZero:true,ticks:{callback:function(v){if(v>=1e6)return'\u20a9'+(v/1e6).toFixed(1)+'M';if(v>=1e3)return'\u20a9'+(v/1e3).toFixed(0)+'K';return'\u20a9'+v;}},grid:{color:'#1f293722'}}}}});
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
