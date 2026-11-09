const $=s=>document.querySelector(s);
const PROV=['Cagayan','Albay','Leyte','Samar','Quezon','Batangas','Iloilo','Palawan','Camarines Sur','Catanduanes'];
const SIT=['Stranded','Lost','Flooded','Road blocked','Trip cancelled'];
const NEEDS=['Evacuation','Medical','Food','Water','Shelter','Charging','Transport'];
const SCOL=['--c1','--c4','--c2','--c3','--c5'];
const KEY='stormtrack-v1';
let data=[];
// seeded sample
function seed(){let s=42;const r=()=>(s=(s*1664525+1013904223)%4294967296)/4294967296;const out=[],now=Date.now();
for(let i=0;i<140;i++){const day=Math.floor(Math.pow(r(),1.3)*30);const t=now-day*864e5-r()*864e5;
const pri=r()<.22?'High':r()<.55?'Moderate':'Low';
const ns=NEEDS.filter(()=>r()<.28);if(!ns.length)ns.push(NEEDS[Math.floor(r()*7)]);
out.push({id:i,date:t,province:PROV[Math.floor(Math.pow(r(),1.6)*PROV.length)],situation:SIT[Math.floor(r()*r()*5)],people:1+Math.floor(r()*r()*14),injured:r()<.2?1+Math.floor(r()*3):0,priority:pri,needs:ns})}
return out}
function load(){try{const v=localStorage.getItem(KEY);if(v){data=JSON.parse(v);return}}catch(e){}data=seed()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
load();
// setup controls
PROV.forEach(p=>{$('#fprov').add(new Option(p,p));$('#pv').add(new Option(p,p))});
$('#needs').innerHTML=NEEDS.map(n=>`<label><input type="checkbox" value="${n}"><span>${n}</span></label>`).join('');
const nowLocal=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)};
$('#add').date.value=nowLocal();
const ICO=['<svg viewBox="0 0 24 24"><path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.5"/></svg>','<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 2 5 5"/></svg>','<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 7v10M7 12h10"/></svg>','<svg viewBox="0 0 24 24"><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/></svg>'];
const W='<path d="M0 60q10-6 20 0t20 0 20 0 20 0 20 0 20 0v20H0z" fill="var(--c1)" opacity=".7"/>';
const SCN={Stranded:'<rect x="30" y="34" width="52" height="20" rx="5" fill="var(--c3)"/><rect x="36" y="38" width="12" height="9" fill="#fff" opacity=".8"/><rect x="52" y="38" width="12" height="9" fill="#fff" opacity=".8"/><circle cx="42" cy="56" r="6" fill="#222"/><circle cx="70" cy="56" r="6" fill="#222"/>'+W,Lost:'<path d="M8 72q30-10 40-28t64-24" fill="none" stroke="var(--c6)" stroke-width="3" stroke-dasharray="5 4"/><path d="M60 22a10 10 0 0 1 10 10c0 8-10 20-10 20S50 40 50 32a10 10 0 0 1 10-10z" fill="var(--c4)"/><circle cx="60" cy="32" r="4" fill="#fff"/>',Flooded:'<path d="M20 58V38l14-10 14 10v20z" fill="var(--c3)"/><rect x="29" y="44" width="10" height="12" fill="#fff" opacity=".7"/><path d="M62 58V42l12-8 12 8v16z" fill="var(--c5)"/>'+W,'Road blocked':'<path d="M40 80 52 30h16l12 50z" fill="var(--c6)"/><path d="M60 78v-8M60 62v-8M60 46v-6" stroke="#fff" stroke-width="2"/><rect x="36" y="52" width="48" height="8" rx="4" fill="#8b5a2b" transform="rotate(-8 60 56)"/>','Trip cancelled':'<path d="M22 50h76l-10 14H32z" fill="var(--c1)"/><rect x="46" y="36" width="28" height="14" fill="var(--c6)"/><rect x="56" y="26" width="8" height="10" fill="var(--c3)"/>'+W+'<path d="M84 14l14 14M98 14 84 28" stroke="var(--bad)" stroke-width="4" stroke-linecap="round"/>'};
const GEO={Cagayan:[17.6,121.7],Albay:[13.2,123.5],Leyte:[10.9,124.9],Samar:[11.9,125],Quezon:[14,121.9],Batangas:[13.8,121],Iloilo:[10.7,122.6],Palawan:[9.8,118.7],'Camarines Sur':[13.6,123.2],Catanduanes:[13.8,124.2]};
const LEFT=['Camarines Sur','Batangas','Palawan','Iloilo'];
const col=i=>`var(${SCOL[i%5]})`;
const fmt=n=>n.toLocaleString();
function filt(days,off=0){const now=Date.now(),a=now-(days+off)*864e5,b=now-off*864e5,pri=$('#fpri').value,pv=$('#fprov').value,q=$('#q').value.toLowerCase();
return data.filter(d=>d.date>=a&&d.date<=b&&(!pri||d.priority===pri)&&(!pv||d.province===pv)&&(!q||(d.province+d.situation+d.priority+d.needs.join()).toLowerCase().includes(q)))}
function count(arr,fn){const m={};arr.forEach(d=>[].concat(fn(d)).forEach(k=>m[k]=(m[k]||0)+1));return Object.entries(m).sort((a,b)=>b[1]-a[1])}
let seen=new Set(data.map(d=>d.id)),pulse={},feed=[],liveOn=true,simN=0;
function track(){const now=Date.now();data.forEach(d=>{if(!seen.has(d.id)){seen.add(d.id);pulse[d.province]=now;feed.unshift(d)}});feed.splice(6)}
function tick(){if(!liveOn||document.hidden)return;const r=Math.random,ns=NEEDS.filter(()=>r()<.28);if(!ns.length)ns.push(NEEDS[Math.floor(r()*7)]);
data.push({id:1e6+simN++,date:Date.now(),province:PROV[Math.floor(Math.pow(r(),1.6)*PROV.length)],situation:SIT[Math.floor(r()*r()*5)],people:1+Math.floor(r()*r()*14),injured:r()<.2?1+Math.floor(r()*3):0,priority:r()<.22?'High':r()<.55?'Moderate':'Low',needs:ns});if(data.length>600)data.shift();render()}
setInterval(tick,4500);
$('#liveBtn').onclick=()=>{liveOn=!liveOn;$('#liveBtn').textContent=liveOn?'Pause':'Resume';$('#lv').className='live'+(liveOn?'':' off');$('#lv').innerHTML='<i></i>'+(liveOn?'LIVE':'PAUSED')};
function render(){
track();
const days=+$('#range').value,f=filt(days),prev=filt(days,days);
// KPIs
const ppl=f.reduce((a,d)=>a+d.people,0),inj=f.reduce((a,d)=>a+d.injured,0),hi=f.filter(d=>d.priority==='High').length;
const delta=(a,b)=>{if(!b)return'<span class="flat">no prior data</span>';const p=Math.round((a-b)/b*100);return`<span class="${p>0?'up':p<0?'dn':'flat'}">${p>0?'▲':p<0?'▼':'•'} ${Math.abs(p)}% vs previous ${days}d</span>`};
const pp=prev.reduce((a,d)=>a+d.people,0);
$('#kpis').innerHTML=[['Total incidents',fmt(f.length),delta(f.length,prev.length)],['People affected',fmt(ppl),delta(ppl,pp)],['Injured / ill',fmt(inj),'<span class="flat">reported cases</span>'],['High priority',f.length?Math.round(hi/f.length*100)+'%':'0%',`<span class="flat">${hi} incidents</span>`]].map((k,i)=>`<div class="card kpi"><div class="kic">${ICO[i]}</div><small>${k[0]}</small><b>${k[1]}</b>${k[2]}</div>`).join('');
// trend
const W=620,H=210,pl=34,pb=24,pt=10,byDay=Array(days).fill(0),now=new Date();now.setHours(23,59,59,999);
f.forEach(d=>{const i=days-1-Math.floor((now-d.date)/864e5);if(i>=0&&i<days)byDay[i]++});
const mx=Math.max(4,...byDay),X=i=>pl+i*(W-pl-8)/Math.max(1,days-1),Y=v=>pt+(H-pt-pb)*(1-v/mx);
const pts=byDay.map((v,i)=>X(i)+','+Y(v)).join(' ');let g='';
for(let k=0;k<=4;k++){const v=Math.round(mx*k/4);g+=`<line class="axis" x1="${pl}" x2="${W}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pl-6}" y="${Y(v)+4}" text-anchor="end">${v}</text>`}
const step=Math.ceil(days/7);for(let i=0;i<days;i+=step){const d=new Date(now-(days-1-i)*864e5);g+=`<text x="${X(i)}" y="${H-6}" text-anchor="middle">${d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</text>`}
$('#trend').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Incidents per day">${g}<polygon points="${X(0)},${Y(0)} ${pts} ${X(days-1)},${Y(0)}" fill="var(--c1)" opacity=".12"/><polyline points="${pts}" fill="none" stroke="var(--c1)" stroke-width="2.5" stroke-linejoin="round"/>${byDay.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="var(--c1)"><title>${v} incidents</title></circle>`).join('')}</svg>`;
$('#tsub').textContent='per day';
// donut
const sc=count(f,d=>d.situation),tot=f.length||1,R=62,C=2*Math.PI*R;let acc=0;
$('#donut').innerHTML=`<svg viewBox="0 0 180 180" style="max-width:220px;margin:auto"><g transform="rotate(-90 90 90)"><circle cx="90" cy="90" r="${R}" fill="none" stroke="var(--field)" stroke-width="22"/>${sc.map(([k,v])=>{const l=v/tot*C,s=`<circle cx="90" cy="90" r="${R}" fill="none" stroke="${col(SIT.indexOf(k))}" stroke-width="22" stroke-dasharray="${l} ${C-l}" stroke-dashoffset="${-acc}"><title>${k}: ${v}</title></circle>`;acc+=l;return s}).join('')}</g><text x="90" y="92" text-anchor="middle" style="font-size:26px;font-weight:700;fill:var(--ink)">${f.length}</text><text x="90" y="110" text-anchor="middle">incidents</text></svg>`;
$('#dleg').innerHTML=sc.map(([k,v])=>`<span><i style="background:${col(SIT.indexOf(k))}"></i>${k} ${Math.round(v/tot*100)}%</span>`).join('');
// bars
const bars=(arr,c)=>{const m=Math.max(1,...arr.map(a=>a[1]));return arr.map(([k,v],i)=>`<div class="hb"><span>${k}</span><div><i style="width:${v/m*100}%;background:${c||col(i)}"></i></div><span>${v}</span></div>`).join('')||'<span style="color:var(--mute)">No data</span>'};
$('#prov').innerHTML=bars(count(f,d=>d.province).slice(0,8),'var(--c1)');
$('#need').innerHTML=bars(count(f,d=>d.needs).slice(0,7),'var(--c2)');
// priority mix
const pc=['High','Moderate','Low'].map(k=>[k,f.filter(d=>d.priority===k).length]);let px=0;
$('#pmix').innerHTML=`<svg viewBox="0 0 400 40">${pc.map(([k,v])=>{const w=v/tot*400,s=`<rect x="${px}" y="6" width="${w}" height="28" fill="var(--${k==='High'?'bad':k==='Low'?'good':'c3'})"><title>${k}: ${v}</title></rect>`;px+=w;return s}).join('')}</svg><div class="legend">${pc.map(([k,v])=>`<span><i style="background:var(--${k==='High'?'bad':k==='Low'?'good':'c3'})"></i>${k}: ${v} (${Math.round(v/tot*100)}%)</span>`).join('')}</div>`;
// insights
const tp=count(f,d=>d.province)[0],tn=count(f,d=>d.needs)[0],pk=byDay.indexOf(Math.max(...byDay)),pd=new Date(now-(days-1-pk)*864e5);
$('#ins').innerHTML=f.length?[`<li>Most affected province: <b>${tp[0]}</b> (${tp[1]} incidents).</li>`,`<li>Most requested assistance: <b>${tn[0]}</b> (${tn[1]} reports).</li>`,`<li>Busiest day: <b>${pd.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</b> with ${Math.max(...byDay)} incidents.</li>`,`<li>Average group size: <b>${(ppl/f.length).toFixed(1)}</b> people per incident.</li>`].join(''):'<li>No incidents match the filters.</li>';
// map
const pcn=Object.fromEntries(count(f,d=>d.province)),mx2=(lo)=>20+(lo-117)/10*260,my2=(la)=>15+(18.8-la)/10*350;
$('#map').innerHTML=`<svg viewBox="0 0 300 380" style="max-height:420px" role="img" aria-label="Incident bubbles by province"><rect width="300" height="380" rx="12" fill="var(--field)"/>${[0,1,2,3,4,5].map(i=>`<path d="M0 ${40+i*62}q37-8 75 0t75 0 75 0 75 0" fill="none" stroke="var(--line)"/>`).join('')}${PROV.map(p=>{const [la,lo]=GEO[p],n=pcn[p]||0,r=n?6+Math.sqrt(n)*3.4:3,x=mx2(lo),y=my2(la),L=LEFT.includes(p);return`${Date.now()-(pulse[p]||0)<3500?`<circle class="ping" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="var(--c4)" stroke-width="2"/>`:''}<circle cx="${x}" cy="${y}" r="${r}" fill="var(--c4)" fill-opacity=".5" stroke="var(--c4)"><title>${p}: ${n} incidents</title></circle><text x="${x+(L?-r-4:r+4)}" y="${y+4}" text-anchor="${L?'end':'start'}">${p} (${n})</text>`}).join('')}</svg>`;
// gallery
const sm=Object.fromEntries(sc);
$('#feed').innerHTML=feed.map(d=>`<li><span>${new Date(d.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span><b>${d.province}</b> · ${d.situation} · ${d.people} ppl <span class="pill ${d.priority}">${d.priority}</span></li>`).join('')||'<li style="color:var(--mute)">Waiting for new reports…</li>';
$('#gal').innerHTML=SIT.map((k,i)=>`<div class="tile"><svg viewBox="0 0 120 80"><rect width="120" height="80" fill="var(--field)"/><ellipse cx="94" cy="14" rx="20" ry="8" fill="var(--c6)" opacity=".4"/>${SCN[k]}</svg><div><b>${k}</b><span style="color:${col(i)}">${sm[k]||0}</span></div></div>`).join('');
// table
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
$('#rows').innerHTML=[...f].sort((a,b)=>b.date-a.date).slice(0,12).map(d=>`<tr><td>${new Date(d.date).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td><td>${esc(d.province)}</td><td>${esc(d.situation)}</td><td>${d.people}</td><td>${d.injured}</td><td><span class="pill ${d.priority}">${d.priority}</span></td><td>${esc(d.needs.join(', '))}</td></tr>`).join('')||'<tr><td colspan="7" style="color:var(--mute)">No results</td></tr>';
}
['range','fpri','fprov'].forEach(i=>$('#'+i).addEventListener('change',render));$('#q').addEventListener('input',render);
$('#toggle').onclick=()=>{const a=$('#add');a.style.display=a.style.display==='block'?'none':'block'};
$('#add').addEventListener('submit',e=>{e.preventDefault();const f=e.target,fd=new FormData(f);
data.push({id:Date.now(),date:new Date(fd.get('date')).getTime(),province:fd.get('province'),situation:fd.get('situation'),people:+fd.get('people'),injured:+fd.get('injured')||0,priority:fd.get('priority'),needs:[...$('#needs').querySelectorAll('input:checked')].map(i=>i.value)});
save();f.reset();f.date.value=nowLocal();f.style.display='none';render()});
$('#reset').onclick=e=>{e.preventDefault();try{localStorage.removeItem(KEY)}catch(x){}data=seed();render()};
$('#csv').onclick=()=>{const f=filt(+$('#range').value),h='date,province,situation,people,injured,priority,needs\n',b=f.map(d=>[new Date(d.date).toISOString(),d.province,d.situation,d.people,d.injured,d.priority,'"'+d.needs.join('; ')+'"'].join(',')).join('\n');
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([h+b],{type:'text/csv'}));a.download='incidents.csv';a.click()};
render();
