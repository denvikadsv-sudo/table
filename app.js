'use strict';
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const rub = n => n === 0 ? '0 ₽' : n.toLocaleString('ru-RU') + ' ₽';

/* ── DEFAULT DATA ─────────────────────────────── */
const TEACHERS = [
  {id:'t1',name:'Светлана',full:'Игишева Светлана Ивановна',sub:'Начальные классы',col:'#2563EB',
   types:[{id:'l11',dur:40,p:1500,r:1500},{id:'l12',dur:60,p:2250,r:2250},{id:'l13',dur:40,p:1700,r:1700},{id:'l14',dur:60,p:2500,r:2500}]},
  {id:'t2',name:'Юлия',full:'Прохорова Юлия Петровна',sub:'Начальные классы',col:'#059669',
   types:[{id:'l21',dur:40,p:1200,r:650},{id:'l22',dur:60,p:1700,r:1000},{id:'l23',dur:40,p:1500,r:650},{id:'l24',dur:60,p:2250,r:1000}]},
  {id:'t3',name:'Анастасия',full:'Дмитриенко Анастасия Михайловна',sub:'Математика',col:'#7C3AED',
   types:[{id:'l31',dur:60,p:2500,r:2000}]},
  {id:'t4',name:'Ирина',full:'Сундукова Ирина Валерьевна',sub:'Русский яз. (ОГЭ/ЕГЭ)',col:'#DC2626',
   types:[{id:'l41',dur:60,p:1700,r:1000},{id:'l42',dur:60,p:2250,r:1200}]},
  {id:'t5',name:'Елизавета',full:'Елизавета Владимировна',sub:'Биология, Химия',col:'#0891B2',
   types:[{id:'l51',dur:40,p:1200,r:800},{id:'l52',dur:60,p:1700,r:1200}]},
  {id:'t6',name:'Алена',full:'Алена Максимовна',sub:'Обществознание',col:'#D97706',
   types:[{id:'l61',dur:60,p:1700,r:1000}]},
  {id:'t7',name:'Доли',full:'Доли',sub:'Английский язык',col:'#0D9488',
   types:[{id:'l71',dur:40,p:1500,r:1000},{id:'l72',dur:60,p:2250,r:1300}]},
  {id:'t8',name:'Наталья',full:'Наталья Васильевна',sub:'Физика, Математика',col:'#E11D48',
   types:[{id:'l81',dur:40,p:1200,r:650},{id:'l82',dur:60,p:1700,r:1000},{id:'l83',dur:40,p:1500,r:650},{id:'l84',dur:60,p:2250,r:1000}]},
];

const DEF_STUDENTS = [
  {id:'s1',num:1,cls:'2, 6',name:'Каролина, Артем',status:'active',group:''},
  {id:'s2',num:2,cls:'4',name:'Артур',status:'vacation',group:''},
  {id:'s3',num:3,cls:'',name:'Коля',status:'active',group:''},
  {id:'s4',num:4,cls:'7',name:'Семен',status:'vacation',group:''},
  {id:'s5',num:5,cls:'5',name:'Аня',status:'vacation',group:''},
  {id:'s6',num:6,cls:'',name:'Магинур',status:'active',group:''},
  {id:'s7',num:7,cls:'',name:'',status:'active',group:''},
  {id:'s8',num:8,cls:'',name:'Михаил Попов',status:'active',group:''},
  {id:'s9',num:9,cls:'10',name:'Яна',status:'active',group:''},
  {id:'s10',num:10,cls:'10',name:'Алла',status:'vacation',group:''},
  {id:'s11',num:11,cls:'',name:'Михаил',status:'vacation',group:''},
  {id:'s12',num:12,cls:'',name:'Федор',status:'vacation',group:''},
  {id:'s13',num:13,cls:'11',name:'Скляров Иван',status:'active',group:'Ученики Татьяны'},
];

const DEF_LESSONS = {
  s1:[{tid:'t1',ltid:'l11',n:4}],
  s3:[{tid:'t1',ltid:'l14',n:1}],
  s4:[{tid:'t1',ltid:'l11',n:3},{tid:'t3',ltid:'l31',n:2}],
  s6:[{tid:'t3',ltid:'l31',n:2},{tid:'t4',ltid:'l41',n:2}],
  s8:[{tid:'t4',ltid:'l41',n:2}],
  s9:[{tid:'t5',ltid:'l52',n:2},{tid:'t3',ltid:'l31',n:2}],
  s13:[{tid:'t8',ltid:'l82',n:2}],
};

/* ── WEEK HELPERS ─────────────────────────────── */
function getMonday(d) {
  const date=new Date(d||Date.now()); date.setHours(12,0,0,0);
  const day=date.getDay();
  date.setDate(date.getDate()+(day===0?-6:1-day));
  return date;
}
function weekLabel(monday) {
  const sun=new Date(monday); sun.setDate(sun.getDate()+6);
  const mo=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  if(monday.getMonth()===sun.getMonth()) return `${monday.getDate()}–${sun.getDate()} ${mo[monday.getMonth()]}`;
  return `${monday.getDate()} ${mo[monday.getMonth()]} – ${sun.getDate()} ${mo[sun.getMonth()]}`;
}
function toISODate(d) { return new Date(d).toISOString().slice(0,10); }

/* ── STATE ────────────────────────────────────── */
let S = {teachers:[], students:[], weeks:{}, curWk:null, theme:'', sync:{token:'',gistId:'',lastSync:''}};

function loadS() {
  try {
    const saved = localStorage.getItem('uc-v3');
    if (saved) {
      S = JSON.parse(saved);
      if (!S.teachers?.length) S.teachers = TEACHERS;
      if (!S.partners) S.partners = [];
      S.partners.forEach(p=>{ if(!p.studentIds) p.studentIds=[]; });
      if (!S.sync) S.sync = {token:'',gistId:'',lastSync:''};
    } else { initS(); }
  } catch { initS(); }
  document.documentElement.setAttribute('data-theme', S.theme || '');
}

function initS() {
  const monday=getMonday(); const wid='w'+Date.now();
  S = { teachers:TEACHERS, students:DEF_STUDENTS, partners:[],
    weeks:{[wid]:{id:wid,label:weekLabel(monday),startDate:toISODate(monday),startBal:0,lessons:DEF_LESSONS,stBal:{}}},
    curWk:wid, theme:'', sync:{token:'',gistId:'',lastSync:''} };
}

function autoSelectCurrentWeek() {
  const today=toISODate(new Date());
  const found=Object.values(S.weeks).find(w=>{
    if(!w.startDate) return false;
    const sun=new Date(w.startDate+'T12:00:00'); sun.setDate(sun.getDate()+6);
    return w.startDate<=today && today<=toISODate(sun);
  });
  if(found) S.curWk=found.id;
}

function saveLocal() { localStorage.setItem('uc-v3', JSON.stringify(S)); }

let autoSyncTimer;
function save() { saveLocal(); scheduleAutoSync(); }

function setSyncDot(state) {
  const dot = document.getElementById('syncDot');
  if (state === 'off') { dot.classList.add('hide'); return; }
  dot.classList.remove('hide');
  dot.style.background = state === 'ok' ? 'var(--grn)' : state === 'busy' ? 'var(--amb)' : 'var(--red)';
}

function scheduleAutoSync() {
  if (!S.sync?.token) return;
  clearTimeout(autoSyncTimer);
  setSyncDot('busy');
  autoSyncTimer = setTimeout(doAutoSync, 2000);
}

async function doAutoSync() {
  const tok = S.sync?.token;
  if (!tok) return;
  const content = JSON.stringify({teachers:S.teachers,students:S.students,partners:S.partners,weeks:S.weeks,curWk:S.curWk},null,2);
  const gid = S.sync?.gistId;
  const url = gid ? `https://api.github.com/gists/${gid}` : 'https://api.github.com/gists';
  try {
    const resp = await fetch(url, {
      method: gid ? 'PATCH' : 'POST',
      headers: {'Authorization':'token '+tok,'Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},
      body: JSON.stringify({description:'Учебный центр — данные',public:false,files:{[GIST_FILE]:{content}}})
    });
    if (!resp.ok) { setSyncDot('err'); return; }
    const gist = await resp.json();
    S.sync.gistId = gist.id; S.sync.lastSync = new Date().toISOString();
    saveLocal(); setSyncDot('ok');
  } catch { setSyncDot('err'); }
}

async function autoLoadOnStartup() {
  const tok = S.sync?.token;
  const gid = S.sync?.gistId;
  if (!tok || !gid) return;
  setSyncDot('busy');
  try {
    const resp = await fetch(`https://api.github.com/gists/${gid}`, {
      headers: {'Authorization':'token '+tok,'X-GitHub-Api-Version':'2022-11-28'}
    });
    if (!resp.ok) { setSyncDot('err'); return; }
    const gist = await resp.json();
    const raw = gist.files[GIST_FILE]?.content;
    if (!raw) { setSyncDot('err'); return; }
    const data = JSON.parse(raw);
    S.teachers = data.teachers?.length ? data.teachers : TEACHERS;
    S.students = data.students || [];
    S.partners = data.partners || [];
    S.weeks = data.weeks || {};
    S.curWk = data.curWk || Object.keys(S.weeks)[0] || null;
    S.sync.lastSync = new Date().toISOString();
    autoSelectCurrentWeek(); saveLocal(); render(); setSyncDot('ok');
  } catch { setSyncDot('err'); }
}
const sortedWkIds = () => Object.values(S.weeks)
  .sort((a,b)=>{
    if(a.startDate&&b.startDate) return a.startDate.localeCompare(b.startDate);
    return 0;
  }).map(w=>w.id);
const wk = () => S.weeks[S.curWk] || null;
const getT = tid => S.teachers.find(t => t.id === tid);
const getLT = (t, ltid) => t?.types.find(lt => lt.id === ltid);

/* ── CALC ─────────────────────────────────────── */
const lp = l => l.p !== undefined ? l.p : (getLT(getT(l.tid),l.ltid)?.p||0);
const lr = l => l.r !== undefined ? l.r : (getLT(getT(l.tid),l.ltid)?.r||0);

function calcSt(sid) {
  const ls = wk()?.lessons?.[sid] || [];
  let rev = 0, cost = 0;
  ls.forEach(l => { rev+=lp(l)*l.n; cost+=lr(l)*l.n; });
  return {rev, cost, profit:rev-cost};
}
function calcWk() {
  let rev=0, cost=0;
  S.students.forEach(s => { const c=calcSt(s.id); rev+=c.rev; cost+=c.cost; });
  return {rev, cost, profit:rev-cost};
}
function calcT() {
  const res={};
  S.students.forEach(s => {
    (wk()?.lessons?.[s.id]||[]).forEach(l => {
      if(!res[l.tid]) res[l.tid]={rev:0,cost:0,n:0};
      res[l.tid].rev+=lp(l)*l.n; res[l.tid].cost+=lr(l)*l.n; res[l.tid].n+=l.n;
    });
  });
  return res;
}

function calcTotalN() {
  const w=wk(); if(!w) return 0;
  let n=0;
  S.students.forEach(s=>{(w.lessons?.[s.id]||[]).forEach(l=>{n+=l.n;});});
  return n;
}

/* ── BALANCE HELPERS ──────────────────────────── */
function getPrevWkId(wid) {
  const ids=sortedWkIds(); const idx=ids.indexOf(wid);
  return idx>0 ? ids[idx-1] : null;
}
function getStLessonCost(sid, wid) {
  const w=S.weeks[wid]; if(!w) return 0;
  let cost=0;
  (w.lessons?.[sid]||[]).forEach(l=>{ cost+=lp(l)*l.n; });
  return cost;
}
function getBalEnd(sid, wid) {
  const w=S.weeks[wid]; if(!w) return 0;
  const prevId=getPrevWkId(wid);
  const balStart=prevId ? getBalEnd(sid,prevId) : (w.stBal?.[sid]?.balStart||0);
  const income=w.stBal?.[sid]?.income||0;
  return balStart+income-getStLessonCost(sid,wid);
}
function getBalStart(sid, wid) {
  const prevId=getPrevWkId(wid);
  if(!prevId) return S.weeks[wid]?.stBal?.[sid]?.balStart||0;
  return getBalEnd(sid,prevId);
}

/* ── RENDER ───────────────────────────────────── */
function renderWkSel() {
  const sel=document.getElementById('wkSel');
  sel.innerHTML=sortedWkIds().map(id=>{const w=S.weeks[id];
    return `<option value="${w.id}"${w.id===S.curWk?' selected':''}>${esc(w.label)}</option>`;
  }).join('');
}

function calcPartnerN(p, w) {
  if(!w||!p.studentIds?.length) return 0;
  let n=0;
  p.studentIds.forEach(sid=>{(w.lessons?.[sid]||[]).forEach(l=>{n+=l.n;});});
  return n;
}
function renderPartnerStudents(selectedIds) {
  const container=document.getElementById('fPStudents');
  const visible=S.students.filter(s=>s.status!=='finished');
  if(!visible.length){container.innerHTML='<span style="color:var(--txt3);font-size:12px">Нет учеников</span>';return;}
  container.innerHTML=visible.map(s=>
    `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;padding:1px 0">
      <input type="checkbox" value="${s.id}" ${selectedIds.includes(s.id)?'checked':''} style="width:15px;height:15px;cursor:pointer;accent-color:var(--acc)">
      <span>${esc(s.name||'—')}</span>
      ${s.cls?`<span style="color:var(--txt3);font-size:11px">${esc(s.cls)} кл.</span>`:''}
    </label>`
  ).join('');
}

function renderBal() {
  const w=wk(); const tot=calcWk(); const sb=w?.startBal||0;
  const partnerTotal=S.partners.reduce((s,p)=>s+calcPartnerN(p,w)*p.rate,0);
  document.getElementById('sRev').textContent = rub(tot.rev);
  document.getElementById('sCost').textContent = rub(tot.cost);
  const sbarP=document.getElementById('sbarP');
  if(S.partners.length>0){
    sbarP.style.display='';
    document.getElementById('sPartnerCost').textContent=rub(partnerTotal);
  } else { sbarP.style.display='none'; }
  document.getElementById('sProfit').textContent = rub(tot.profit-partnerTotal);
  document.getElementById('sEnd').textContent = rub(sb+tot.rev);
}

function getPrimaryTid(s, w) {
  if(s.teachers&&s.teachers.length) return s.teachers[0].tid;
  const ls=w?.lessons?.[s.id]||[];
  return ls.length>0 ? ls[0].tid : null;
}
function sortStudents(students, w) {
  const order={active:0,vacation:1,finished:2};
  const tidOrder={};
  S.teachers.forEach((t,i)=>{tidOrder[t.id]=i;});
  return [...students].sort((a,b)=>{
    const sa=order[a.status]??0, sb=order[b.status]??0;
    if(sa!==sb) return sa-sb;
    const ta=getPrimaryTid(a,w), tb=getPrimaryTid(b,w);
    if(!ta&&!tb) return 0;
    if(!ta) return 1; if(!tb) return -1;
    return (tidOrder[ta]??99)-(tidOrder[tb]??99);
  });
}

function renderSts() {
  const w=wk(); const body=document.getElementById('stBody'); const foot=document.getElementById('stFoot');
  if (!S.students.length) {
    body.innerHTML='<tr class="empty-msg"><td colspan="9">Учеников нет — нажмите «+ Ученик»</td></tr>';
    foot.innerHTML=''; return;
  }
  const sorted=sortStudents(S.students,w);
  const activeTids=[...new Set(sorted.filter(s=>s.status==='active').map(s=>getPrimaryTid(s,w)).filter(Boolean))];
  const showTchSep=activeTids.length>1;
  let rows=''; let totBs=0,totInc=0,totEnd=0;
  let lastStatus=null; let lastTid=null;
  sorted.forEach((s, sortIdx) => {
    const ls=w?.lessons?.[s.id]||[];
    const prevWkId=getPrevWkId(S.curWk);
    const income=w?.stBal?.[s.id]?.income||0;
    const balStart=getBalStart(s.id,S.curWk);
    const balEnd=getBalEnd(s.id,S.curWk);
    totBs+=balStart; totInc+=income; totEnd+=balEnd;
    if(s.status!==lastStatus){
      if(s.status==='vacation') rows+=`<tr class="st-sep"><td colspan="9">🌴 Каникулы</td></tr>`;
      else if(s.status==='finished') rows+=`<tr class="st-sep"><td colspan="9">✓ Завершили</td></tr>`;
      lastStatus=s.status; lastTid=null;
    }
    if(s.status==='active'&&showTchSep){
      const tid=getPrimaryTid(s,w);
      if(tid&&tid!==lastTid){
        const t=getT(tid);
        if(t) rows+=`<tr class="tch-sep"><td colspan="9"><span class="ldot" style="background:${t.col};width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:4px;vertical-align:middle"></span>${esc(t.name)}</td></tr>`;
        lastTid=tid;
      }
    }
    const pTch=s.status==='active'?getT(getPrimaryTid(s,w)):null;
    const stP=getStudentPartner(s.id);
    const bCls=s.status==='active'?'badge-on':s.status==='finished'?'badge-fin':'badge-vac';
    const bTxt=s.status==='active'?'Учащийся':s.status==='finished'?'Завершил':'Каникулы';
    let tags=ls.map(l => {
      const t=getT(l.tid); const lt=getLT(t,l.ltid);
      if(!t) return '';
      const dur=lt?.dur||'?';
      return `<span class="ltag">
        <span class="ldot" style="background:${t.col}"></span>
        <span class="ltag-name">${esc(t.name)}</span>
        <span class="ltag-info">${l.n}×${dur}мин</span>
        <span class="ltag-amt">${rub(lp(l)*l.n)}</span>
        <button class="ltag-rm" data-rm-sid="${s.id}" data-rm-tid="${l.tid}" data-rm-ltid="${l.ltid}">×</button>
      </span>`;
    }).join('');
    tags += `<button class="add-l-btn" data-add-ls="${s.id}">+ урок</button>`;
    const endCls=balEnd>0?'mn-g':balEnd<0?'mn-r':'mn-d';
    rows+=`<tr>
      <td class="mn" style="color:var(--txt3)">${sortIdx+1}</td>
      <td style="color:var(--txt2)">${esc(s.cls||'')}</td>
      <td><div style="display:flex;align-items:center;gap:8px">${pTch?'<span style="width:3px;height:18px;border-radius:2px;background:'+pTch.col+';display:block;flex-shrink:0"></span>':''}<span><strong>${esc(s.name||'—')}</strong>${s.group?`<br><span style="font-size:11px;color:var(--txt3)">${esc(s.group)}</span>`:''}${stP?`<br><span style="font-size:10px;color:var(--acc);font-weight:600">↪ ${esc(stP.name)} ${rub(stP.rate)}/ур.</span>`:''}</span></div></td>
      <td><span class="badge ${bCls}" data-cyc="${s.id}">${bTxt}</span></td>
      <td><div class="lcell">${tags}</div></td>
      <td class="r">${prevWkId?`<span class="mn" style="color:var(--txt2)">${balStart!==0?rub(balStart):'—'}</span>`:`<input class="tbl-inp" data-bal-sid="${s.id}" data-bal-field="balStart" value="${balStart||''}" placeholder="0 ₽" type="number">`}</td>
      <td class="r"><input class="tbl-inp" data-bal-sid="${s.id}" data-bal-field="income" value="${income||''}" placeholder="0 ₽" type="number"></td>
      <td class="r mn ${endCls}">${balEnd!==0?rub(balEnd):'—'}</td>
      <td><div class="racts">
        ${s.status!=='finished'?`<button class="rib fin" data-fin="${s.id}" title="Завершил">✓</button>`:''}
        <button class="rib" data-edit="${s.id}" title="Редактировать">✏</button>
        <button class="rib del" data-del="${s.id}" title="Удалить">✕</button>
      </div></td>
    </tr>`;
  });
  body.innerHTML=rows;
  const endTotCls=totEnd>0?'mn-g':totEnd<0?'mn-r':'mn-d';
  foot.innerHTML=`<tr>
    <td colspan="5" class="r" style="color:var(--txt3);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Итого за неделю</td>
    <td class="r mn">${totBs!==0?rub(totBs):'—'}</td>
    <td class="r mn mn-g">${totInc>0?rub(totInc):'—'}</td>
    <td class="r mn ${endTotCls}">${totEnd!==0?rub(totEnd):'—'}</td>
    <td></td>
  </tr>`;
}

function renderSum() {
  const w=wk(); const wt=calcWk(); const tt=calcT(); const sb=w?.startBal||0;
  const paid=w?.paid||{}; const partnerPaid=w?.partnerPaid||{};
  const tchWithLessons=S.teachers.filter(t=>tt[t.id]);
  const paidCount=tchWithLessons.filter(t=>paid[t.id]).length;
  const totalCount=tchWithLessons.length;
  const paidAmt=tchWithLessons.reduce((s,t)=>s+(paid[t.id]?tt[t.id].cost:0),0);
  const debtAmt=wt.cost-paidAmt;
  const partnerTotal=S.partners.reduce((s,p)=>s+calcPartnerN(p,w)*p.rate,0);
  const partnerPaidAmt=S.partners.reduce((s,p)=>s+(partnerPaid[p.id]?calcPartnerN(p,w)*p.rate:0),0);
  const partnerDebt=partnerTotal-partnerPaidAmt;
  let html=`<div class="scard">
    <div class="scard-hdr"><span class="scard-name">Итоги недели</span><span class="scard-sub">${esc(w?.label||'')}</span></div>
    <div class="srow"><span>Баланс начало</span><span class="srval">${rub(sb)}</span></div>
    <div class="srow"><span>Выручка от учеников</span><span class="srval" style="color:var(--grn)">${rub(wt.rev)}</span></div>
    <div class="srow"><span>Выплачено учителям</span><span class="srval" style="color:var(--red)">${rub(paidAmt)}</span></div>
    <div class="srow"><span>Долг учителям</span><span class="srval" style="color:${debtAmt>0?'var(--amb)':'var(--txt3)'}">${debtAmt>0?rub(debtAmt):'—'}</span></div>
    ${S.partners.length>0?`<div class="srow"><span>Выплачено партнёрам</span><span class="srval" style="color:var(--red)">${rub(partnerPaidAmt)}</span></div>`:''}
    ${S.partners.length>0&&partnerDebt>0?`<div class="srow"><span>Долг партнёрам</span><span class="srval" style="color:var(--amb)">${rub(partnerDebt)}</span></div>`:''}
    <div class="srow tot"><span>Прибыль центра</span><span class="srval" style="color:var(--acc)">${rub(wt.profit-partnerTotal)}</span></div>
    <div class="srow tot"><span>Баланс конец</span><span class="srval">${rub(sb+wt.rev)}</span></div>
    ${totalCount>0?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--bd2);font-size:12px;color:var(--txt3)">Оплачено учителей: <strong style="color:var(--txt)">${paidCount} из ${totalCount}</strong></div>`:''}
  </div>`;
  S.teachers.forEach(t => {
    const tc=tt[t.id]; if(!tc) return;
    const isPaid=!!paid[t.id];
    html+=`<div class="scard">
      <div class="scard-hdr">
        <span class="ldot" style="background:${t.col};width:9px;height:9px;border-radius:50%;display:inline-block;flex-shrink:0"></span>
        <span class="scard-name">${esc(t.name)}</span><span class="scard-sub">${esc(t.sub)}</span>
      </div>
      <div class="srow"><span>Уроков</span><span class="srval">${tc.n}</span></div>
      <div class="srow"><span>Выручка</span><span class="srval" style="color:var(--grn)">${rub(tc.rev)}</span></div>
      <div class="srow"><span>К выплате</span><span class="srval" style="color:var(--red)">${rub(tc.cost)}</span></div>
      <div class="srow tot"><span>Прибыль центра</span><span class="srval" style="color:var(--acc)">${rub(tc.rev-tc.cost)}</span></div>
      <button class="pay-btn ${isPaid?'paid':'unpaid'}" data-pay-tid="${t.id}">${isPaid?'✓ Оплачено':'○ Не оплачено'}</button>
    </div>`;
  });
  S.partners.forEach(p => {
    const pN=calcPartnerN(p,w);
    const cost=pN*p.rate;
    const isPaid=!!partnerPaid[p.id];
    const stNames=(p.studentIds||[]).map(sid=>S.students.find(s=>s.id===sid)?.name||'').filter(Boolean);
    html+=`<div class="scard">
      <div class="scard-hdr">
        <span class="scard-name">${esc(p.name)}</span><span class="scard-sub">партнёр</span>
      </div>
      ${stNames.length
        ?`<div class="srow" style="align-items:flex-start"><span style="flex-shrink:0">Ученики</span><span class="srval" style="text-align:right;font-size:12px;font-weight:600;color:var(--txt2);white-space:normal">${stNames.map(n=>esc(n)).join(', ')}</span></div>`
        :`<div class="srow"><span style="color:var(--txt3);font-size:12px">Ученики не назначены</span></div>`}
      <div class="srow"><span>Уроков</span><span class="srval">${pN}</span></div>
      <div class="srow"><span>Ставка</span><span class="srval">${rub(p.rate)}/урок</span></div>
      <div class="srow tot"><span>К выплате</span><span class="srval" style="color:${cost>0?'var(--red)':'var(--txt3)'}">${cost>0?rub(cost):'—'}</span></div>
      <button class="pay-btn ${isPaid?'paid':'unpaid'}" data-pay-pid="${p.id}">${isPaid?'✓ Оплачено':'○ Не оплачено'}</button>
    </div>`;
  });
  document.getElementById('sumGrid').innerHTML=html;
}

function togglePartnerPaid(pid) {
  const w=wk(); if(!w) return;
  if(!w.partnerPaid) w.partnerPaid={};
  w.partnerPaid[pid]=!w.partnerPaid[pid];
  save(); renderSum();
}

function togglePaid(tid) {
  const w=wk(); if(!w) return;
  if(!w.paid) w.paid={};
  w.paid[tid]=!w.paid[tid];
  save(); renderSum();
}

function renderTch() {
  let html='';
  S.teachers.forEach(t => {
    html+=`<div class="tcard">
      <div class="tcard-hdr">
        <div class="tstripe" style="background:${t.col}"></div>
        <div><h3>${esc(t.full)}</h3><p>${esc(t.sub)}</p></div>
      </div>
      <div class="rrow rhdr"><span>Тип</span><span class="r">Клиент</span><span class="r">Учитель</span><span class="r">Прибыль</span></div>`;
    t.types.forEach(lt => {
      html+=`<div class="rrow">
        <span style="color:var(--txt2)">${lt.dur} мин · ${lt.p.toLocaleString('ru-RU')}₽</span>
        <span class="r" style="color:var(--grn)">${lt.p.toLocaleString('ru-RU')} ₽</span>
        <span class="r" style="color:var(--red)">${lt.r.toLocaleString('ru-RU')} ₽</span>
        <span class="r" style="color:var(--acc);font-weight:700">${(lt.p-lt.r).toLocaleString('ru-RU')} ₽</span>
      </div>`;
    });
    html+=`</div>`;
  });
  document.getElementById('tchGrid').innerHTML=html;
}

function renderSyncCard() {
  const card=document.getElementById('syncCard');
  if(!card) return;
  const tok=S.sync?.token; const gid=S.sync?.gistId; const last=S.sync?.lastSync;
  if(tok&&gid) {
    card.innerHTML=`
      <div class="scard-hdr" style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--bd2)">
        <span class="scard-name">Настроено</span>
        <span style="width:8px;height:8px;border-radius:50%;background:var(--grn);display:inline-block;margin-left:6px"></span>
      </div>
      <div class="srow" style="margin-bottom:10px"><span style="color:var(--txt3);font-size:12px">Gist ID</span><span style="font-family:monospace;font-size:12px">${gid.slice(0,12)}…</span></div>
      ${last?`<div style="font-size:11px;color:var(--txt3);margin-bottom:14px">Последняя загрузка: ${new Date(last).toLocaleString('ru-RU')}</div>`:''}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn-pri" id="scBtnPull">⬇ Загрузить данные с сервера</button>
        <button class="btn-ghost" id="scBtnSettings">⚙ Изменить настройки</button>
      </div>
      <div style="margin-top:12px;font-size:12px;color:var(--txt3);line-height:1.6">
        На каждом устройстве токен вводится отдельно. Данные хранятся в GitHub Gist и загружаются при открытии страницы. Нажмите «⬇ Загрузить» чтобы получить свежие данные в любой момент.
      </div>`;
    document.getElementById('scBtnPull').addEventListener('click',()=>{autoLoadOnStartup();});
    document.getElementById('scBtnSettings').addEventListener('click',openSyncModal);
  } else {
    card.innerHTML=`
      <div style="font-size:13px;color:var(--txt2);margin-bottom:12px;line-height:1.6">
        Синхронизация не настроена. Настройте её чтобы данные были одинаковы на всех устройствах.
      </div>
      <button class="btn-pri" id="scBtnSetup">Настроить синхронизацию</button>`;
    document.getElementById('scBtnSetup').addEventListener('click',openSyncModal);
  }
}

function renderSettings() {
  let html='';
  S.teachers.forEach(t => {
    html+=`<div class="tcard">
      <div class="tcard-hdr">
        <div class="tstripe" style="background:${t.col}"></div>
        <div style="flex:1"><h3>${esc(t.full)}</h3><p>${esc(t.sub)}</p></div>
        <button class="rib" data-edit-tch="${t.id}" title="Редактировать">✏</button>
      </div>
      <div class="rrow rhdr"><span>Тип</span><span class="r">Клиент</span><span class="r">Учитель</span><span class="r">Прибыль</span></div>`;
    t.types.forEach(lt => {
      html+=`<div class="rrow">
        <span style="color:var(--txt2)">${lt.dur} мин</span>
        <span class="r" style="color:var(--grn)">${lt.p.toLocaleString('ru-RU')} ₽</span>
        <span class="r" style="color:var(--red)">${lt.r.toLocaleString('ru-RU')} ₽</span>
        <span class="r" style="color:var(--acc);font-weight:700">${(lt.p-lt.r).toLocaleString('ru-RU')} ₽</span>
      </div>`;
    });
    html+=`</div>`;
  });
  document.getElementById('settTchGrid').innerHTML=html;
  let pHtml='';
  S.partners.forEach(p=>{
    pHtml+=`<div class="tcard">
      <div class="tcard-hdr">
        <div style="flex:1"><h3>${esc(p.name)}</h3><p>партнёр</p></div>
        <button class="rib" data-edit-p="${p.id}" title="Редактировать">✏</button>
      </div>
      <div class="rrow rhdr"><span>Выплата</span><span class="r">За урок</span></div>
      <div class="rrow"><span style="color:var(--txt2)">Ставка</span><span class="r" style="color:var(--red)">${rub(p.rate)}</span></div>
    </div>`;
  });
  if(!pHtml) pHtml=`<div style="color:var(--txt3);font-size:13px;padding:8px 0">Партнёров нет — нажмите «+ Партнёр»</div>`;
  document.getElementById('partnersGrid').innerHTML=pHtml;
}

function render() { renderWkSel(); renderBal(); renderSts(); }

/* ── TOAST ────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'), 2500);
}

/* ── MODALS ───────────────────────────────────── */
const openM = id => document.getElementById(id).classList.remove('hide');
const closeM = id => document.getElementById(id).classList.add('hide');

/* ── STUDENT MODAL ────────────────────────────── */
let editSid=null;
let stLessons=[];

function renderStLessons() {
  const list=document.getElementById('stLessonsList');
  if(!stLessons.length){list.innerHTML='';return;}
  list.innerHTML=stLessons.map(function(l,i){
    const opts=S.teachers.map(function(t){
      return '<option value="'+t.id+'"'+(t.id===l.tid?' selected':'')+'>'+esc(t.name)+'</option>';
    }).join('');
    return '<div class="stl-row">'+
      '<select class="fi stl-tch" onchange="stlTch('+i+',this.value)">'+opts+'</select>'+
      '<input class="fi stl-price" type="number" min="0" value="'+(l.p!=null?l.p:'')+'" oninput="stlUpd('+i+',\'p\',+this.value)" placeholder="Цена">'+
      '<input class="fi stl-price" type="number" min="0" value="'+(l.r!=null?l.r:'')+'" oninput="stlUpd('+i+',\'r\',+this.value)" placeholder="Ставка">'+
      '<button class="stl-del" onclick="stlDel('+i+')">×</button>'+
      '</div>';
  }).join('');
}
function stlTch(i,tid){
  stLessons[i].tid=tid;
  const t=getT(tid);const lt=t&&t.types&&t.types[0];
  if(lt){stLessons[i].p=lt.p;stLessons[i].r=lt.r;}
  renderStLessons();
}
function stlUpd(i,field,val){stLessons[i][field]=val;}
function stlDel(i){stLessons.splice(i,1);renderStLessons();}
function addStLesson(){
  const t=S.teachers[0];const lt=t&&t.types&&t.types[0];
  stLessons.push({tid:t?t.id:'',p:lt?lt.p:0,r:lt?lt.r:0});
  renderStLessons();
}

function openAddSt() {
  editSid=null;stLessons=[];
  document.getElementById('mStTitle').textContent='Новый ученик';
  ['fCls','fName','fGroup'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('fStatus').value='active';
  fillPartnerSel(null);renderStLessons();
  openM('mStudent'); setTimeout(()=>document.getElementById('fName').focus(),50);
}
function openEditSt(sid) {
  const s=S.students.find(s=>s.id===sid); if(!s) return;
  editSid=sid;
  document.getElementById('mStTitle').textContent='Редактировать ученика';
  document.getElementById('fCls').value=s.cls||'';
  document.getElementById('fName').value=s.name||'';
  document.getElementById('fGroup').value=s.group||'';
  document.getElementById('fStatus').value=s.status||'active';
  fillPartnerSel(getStudentPartner(sid)?.id||null);
  stLessons=(s.teachers||[]).map(function(t){return {tid:t.tid,p:t.p,r:t.r};});
  renderStLessons();
  openM('mStudent');
}
function saveSt() {
  const cls=document.getElementById('fCls').value.trim();
  const name=document.getElementById('fName').value.trim();
  const group=document.getElementById('fGroup').value.trim();
  const status=document.getElementById('fStatus').value;
  const pid=document.getElementById('fPartner').value;
  let sid=editSid;
  if(editSid){
    const s=S.students.find(s=>s.id===editSid);
    if(s){s.cls=cls;s.name=name;s.group=group;s.status=status;}
  } else {
    const maxN=S.students.reduce((m,s)=>Math.max(m,s.num||0),0);
    sid='s'+Date.now();
    S.students.push({id:sid,num:maxN+1,cls,name,group,status});
  }
  S.partners.forEach(p=>{
    if(!p.studentIds) p.studentIds=[];
    p.studentIds=p.studentIds.filter(id=>id!==sid);
  });
  if(pid){
    const p=S.partners.find(p=>p.id===pid);
    if(p){if(!p.studentIds)p.studentIds=[];if(!p.studentIds.includes(sid))p.studentIds.push(sid);}
  }
  const st=S.students.find(function(s){return s.id===sid;});
  if(st){
    const valid=stLessons.filter(function(l){return l.tid;});
    st.teachers=valid.map(function(l){return {tid:l.tid,p:l.p||0,r:l.r||0};});
  }
  save(); closeM('mStudent'); render();
}

/* ── LESSON MODAL ─────────────────────────────── */
let lessSid=null;
function fillTeacherSel() {
  document.getElementById('fTeacher').innerHTML=
    S.teachers.map(t=>`<option value="${t.id}">${esc(t.name)} — ${esc(t.sub)}</option>`).join('');
  fillLTypeSel();
}
function getStTeachers(sid) {
  const s=S.students.find(s=>s.id===sid);
  return s&&s.teachers&&s.teachers.length?s.teachers:null;
}
function prefillFromStTeacher() {
  const st=getStTeachers(lessSid); if(!st) return;
  const tid=document.getElementById('fTeacher').value;
  const entry=st.find(function(t){return t.tid===tid;});
  if(entry){
    document.getElementById('fLPrice').value=entry.p||0;
    document.getElementById('fLRate').value=entry.r||0;
  }
  updatePrev();
}
function fillLTypeSel() {
  const t=getT(document.getElementById('fTeacher').value);
  document.getElementById('fLType').innerHTML=t
    ?t.types.map(lt=>`<option value="${lt.id}">${lt.dur} мин · ${lt.p.toLocaleString('ru-RU')}₽</option>`).join('')
    :'';
  prefillPrices();
  updatePrev();
}
function prefillPrices(keepCustom) {
  const t=getT(document.getElementById('fTeacher').value);
  const lt=getLT(t,document.getElementById('fLType').value);
  if(!lt) return;
  if(keepCustom) return;
  const existing=lessSid&&wk()?.lessons?.[lessSid]?.find(l=>l.tid===t?.id&&l.ltid===lt.id);
  document.getElementById('fLPrice').value=existing?.p!==undefined?existing.p:lt.p;
  document.getElementById('fLRate').value=existing?.r!==undefined?existing.r:lt.r;
}
function updatePrev() {
  const t=getT(document.getElementById('fTeacher').value);
  const n=parseInt(document.getElementById('fCount').value)||0;
  const lp=parseInt(document.getElementById('fLPrice').value)||0;
  const lr=parseInt(document.getElementById('fLRate').value)||0;
  const el=document.getElementById('lPrev');
  if(!t||n<1){el.textContent='Укажите учителя и количество';return;}
  const rv=lp*n,co=lr*n,pr=rv-co;
  const lt=getLT(t,document.getElementById('fLType').value);
  const dur=lt?' · '+n+'×'+lt.dur+' мин':' · '+n+' ур.';
  el.innerHTML='<strong>'+esc(t.name)+'</strong>'+dur+'<br>'+
    'Клиент: <strong style="color:var(--grn)">'+rub(rv)+'</strong> · '+
    'Учителю: <strong style="color:var(--red)">'+rub(co)+'</strong> · '+
    'Прибыль: <strong style="color:var(--acc)">'+rub(pr)+'</strong>';
}
function setCount(n) {
  document.getElementById('fCount').value=n;
  document.getElementById('fCountDisplay').textContent=n;
  const picker=document.getElementById('fCountPicker');
  picker.querySelectorAll('button').forEach(b=>b.classList.toggle('cur',+b.dataset.v===n));
  picker.classList.add('hide');
  updatePrev();
}
function toggleCountPicker(e) {
  e.stopPropagation();
  const picker=document.getElementById('fCountPicker');
  if(!picker.children.length){
    for(let i=1;i<=99;i++){
      const b=document.createElement('button');
      b.type='button'; b.textContent=i; b.dataset.v=i;
      b.addEventListener('click',ev=>{ev.stopPropagation();setCount(i);});
      picker.appendChild(b);
    }
  }
  const isHidden=picker.classList.contains('hide');
  picker.classList.toggle('hide',!isHidden);
  if(isHidden){
    const cur=+document.getElementById('fCount').value||1;
    picker.querySelectorAll('button').forEach(b=>b.classList.toggle('cur',+b.dataset.v===cur));
    const curBtn=picker.querySelector('.cur');
    if(curBtn) setTimeout(()=>curBtn.scrollIntoView({block:'nearest'}),0);
  }
}
function openAddL(sid) {
  lessSid=sid;
  const stTch=getStTeachers(sid);
  if(stTch){
    document.getElementById('fTeacher').innerHTML=stTch.map(function(st){
      const t=getT(st.tid); return '<option value="'+(t?t.id:'')+'">'+(t?esc(t.name):'?')+'</option>';
    }).join('');
    document.getElementById('fLTypeRow').classList.add('hide');
    prefillFromStTeacher();
  } else {
    fillTeacherSel();
    document.getElementById('fLTypeRow').classList.remove('hide');
  }
  setCount(1);
  openM('mLesson'); setTimeout(()=>document.getElementById('fCountBtn').focus(),50);
}
function saveL() {
  const tid=document.getElementById('fTeacher').value;
  const ltid=document.getElementById('fLTypeRow').classList.contains('hide')?null:document.getElementById('fLType').value;
  const n=parseInt(document.getElementById('fCount').value)||0;
  const lp=parseInt(document.getElementById('fLPrice').value)||0;
  const lr=parseInt(document.getElementById('fLRate').value)||0;
  if(!tid||!ltid||n<1) return;
  const w=wk(); if(!w) return;
  if(!w.lessons) w.lessons={};
  if(!w.lessons[lessSid]) w.lessons[lessSid]=[];
  const ex=w.lessons[lessSid].find(l=>l.tid===tid&&l.ltid===ltid);
  if(ltid){
    if(ex){ex.n+=n;ex.p=lp;ex.r=lr;} else w.lessons[lessSid].push({tid,ltid,n,p:lp,r:lr});
  } else {
    if(ex){ex.n+=n;ex.p=lp;ex.r=lr;} else w.lessons[lessSid].push({tid,n,p:lp,r:lr});
  }
  save(); closeM('mLesson'); render();
}
function removeL(sid,tid,ltid) {
  const w=wk(); if(!w?.lessons?.[sid]) return;
  w.lessons[sid]=w.lessons[sid].filter(l=>!(l.tid===tid&&(ltid?l.ltid===ltid:!l.ltid)));
  save(); render();
}

/* ── TEACHER MODAL ────────────────────────────── */
let editTid=null;

function openEditTeacher(tid) {
  const t=S.teachers.find(t=>t.id===tid); if(!t) return;
  editTid=tid;
  document.getElementById('mTchTitle').textContent='Редактировать учителя';
  document.getElementById('fTchName').value=t.name||'';
  document.getElementById('fTchFull').value=t.full||'';
  document.getElementById('fTchSub').value=t.sub||'';
  document.getElementById('fTchCol').value=t.col||'#2563EB';
  document.getElementById('btnDelTch').style.display='inline-flex';
  renderLTRows(t.types.map(lt=>({dur:lt.dur,p:lt.p,r:lt.r})));
  openM('mTeacher'); setTimeout(()=>document.getElementById('fTchName').focus(),50);
}

function openAddTeacher() {
  editTid=null;
  document.getElementById('mTchTitle').textContent='Новый учитель';
  document.getElementById('fTchName').value='';
  document.getElementById('fTchFull').value='';
  document.getElementById('fTchSub').value='';
  document.getElementById('fTchCol').value='#2563EB';
  document.getElementById('btnDelTch').style.display='none';
  renderLTRows([{dur:60,p:2000,r:1000}]);
  openM('mTeacher'); setTimeout(()=>document.getElementById('fTchName').focus(),50);
}

function renderLTRows(rows) {
  document.getElementById('ltRows').innerHTML=rows.map((r,i)=>`
    <div class="lt-row">
      <input class="fi lt-dur" type="number" value="${r.dur}" min="1" max="180" placeholder="60">
      <input class="fi lt-p" type="number" value="${r.p}" min="0" placeholder="0">
      <input class="fi lt-r" type="number" value="${r.r}" min="0" placeholder="0">
      <button class="rib del lt-rm" data-lti="${i}" title="Удалить строку">✕</button>
    </div>`).join('');
}

function collectLTRows() {
  return [...document.querySelectorAll('#ltRows .lt-row')].map(row=>({
    dur:parseInt(row.querySelector('.lt-dur').value)||60,
    p:parseInt(row.querySelector('.lt-p').value)||0,
    r:parseInt(row.querySelector('.lt-r').value)||0
  })).filter(r=>r.dur>0);
}

function saveTeacher() {
  const name=document.getElementById('fTchName').value.trim();
  const full=document.getElementById('fTchFull').value.trim();
  const sub=document.getElementById('fTchSub').value.trim();
  const col=document.getElementById('fTchCol').value;
  const types=collectLTRows();
  if(!name||!types.length) { showToast('Укажите имя и хотя бы один тип урока'); return; }
  if(editTid) {
    const t=S.teachers.find(t=>t.id===editTid); if(!t) return;
    const existIds=t.types.map(lt=>lt.id);
    t.name=name; t.full=full||name; t.sub=sub; t.col=col;
    t.types=types.map((lt,i)=>({id:existIds[i]||('l'+t.id.slice(1)+'_'+(Date.now()+i)),dur:lt.dur,p:lt.p,r:lt.r}));
  } else {
    const tid='t'+Date.now();
    S.teachers.push({id:tid,name,full:full||name,sub,col,
      types:types.map((lt,i)=>({id:'l'+tid.slice(1)+'_'+i,dur:lt.dur,p:lt.p,r:lt.r}))});
  }
  save(); closeM('mTeacher'); renderSettings();
  showToast(editTid?'Учитель обновлён':'Учитель добавлен');
}

function deleteTeacher() {
  if(!editTid) return;
  const t=S.teachers.find(t=>t.id===editTid); if(!t) return;
  if(!confirm(`Удалить учителя «${t.full||t.name}»?\nВсе уроки этого учителя также будут удалены.`)) return;
  S.teachers=S.teachers.filter(tc=>tc.id!==editTid);
  Object.values(S.weeks).forEach(w=>{
    if(w.lessons) Object.keys(w.lessons).forEach(sid=>{
      w.lessons[sid]=(w.lessons[sid]||[]).filter(l=>l.tid!==editTid);
    });
  });
  save(); closeM('mTeacher'); renderSettings(); showToast('Учитель удалён');
}

/* ── PARTNER MODAL ────────────────────────────── */
let editPid=null;
function openAddPartner() {
  editPid=null;
  document.getElementById('mPTitle').textContent='Новый партнёр';
  document.getElementById('fPName').value='';
  document.getElementById('fPRate').value=200;
  document.getElementById('btnDelP').style.display='none';
  renderPartnerStudents([]);
  openM('mPartner'); setTimeout(()=>document.getElementById('fPName').focus(),50);
}
function openEditPartner(pid) {
  const p=S.partners.find(p=>p.id===pid); if(!p) return;
  editPid=pid;
  document.getElementById('mPTitle').textContent='Редактировать партнёра';
  document.getElementById('fPName').value=p.name;
  document.getElementById('fPRate').value=p.rate;
  document.getElementById('btnDelP').style.display='inline-flex';
  renderPartnerStudents(p.studentIds||[]);
  openM('mPartner'); setTimeout(()=>document.getElementById('fPName').focus(),50);
}
function savePartner() {
  const name=document.getElementById('fPName').value.trim();
  const rate=parseFloat(document.getElementById('fPRate').value)||0;
  const studentIds=[...document.getElementById('fPStudents').querySelectorAll('input[type=checkbox]:checked')].map(cb=>cb.value);
  if(!name) return;
  if(editPid){
    const p=S.partners.find(p=>p.id===editPid); if(!p) return;
    p.name=name; p.rate=rate; p.studentIds=studentIds;
  } else {
    S.partners.push({id:'p'+Date.now(),name,rate,studentIds});
  }
  save(); closeM('mPartner'); renderSettings();
  showToast(editPid?'Партнёр обновлён':'Партнёр добавлен');
}
function deletePartner() {
  if(!editPid) return;
  const p=S.partners.find(p=>p.id===editPid); if(!p) return;
  if(!confirm(`Удалить партнёра «${p.name}»?`)) return;
  S.partners=S.partners.filter(pt=>pt.id!==editPid);
  save(); closeM('mPartner'); renderSettings(); showToast('Партнёр удалён');
}

function getStudentPartner(sid) {
  return S.partners.find(p=>p.studentIds?.includes(sid))||null;
}
function fillPartnerSel(selectedId) {
  const sel=document.getElementById('fPartner');
  sel.innerHTML='<option value="">— нет партнёра —</option>'+
    S.partners.map(p=>`<option value="${p.id}"${p.id===selectedId?' selected':''}>${esc(p.name)} — ${rub(p.rate)}/урок</option>`).join('');
}

/* ── SYNC (GITHUB GIST) ───────────────────────── */
const GIST_FILE='uc-data.json';

function openSyncModal() {
  const tok=S.sync?.token||'';
  const gid=S.sync?.gistId||'';
  document.getElementById('syncToken').value=tok;
  document.getElementById('syncGistId').value=gid;
  updateGistLink(gid);
  const last=S.sync?.lastSync;
  const ts=document.getElementById('lastSyncTime');
  ts.textContent=last?'Последняя синхронизация: '+new Date(last).toLocaleString('ru-RU'):'';
  setSyncStatus('','');
  openM('mSync');
}

function updateGistLink(gid) {
  const link=document.getElementById('gistLink');
  if(gid){link.href=`https://gist.github.com/${gid}`;link.style.display='inline-flex';}
  else{link.style.display='none';}
}

function setSyncStatus(msg,type) {
  const el=document.getElementById('syncStatus');
  el.className='sync-status'+(type?' '+type:'');
  el.innerHTML=msg;
}

function setSyncBusy(busy) {
  const btnSave=document.getElementById('btnSaveGist');
  const btnLoad=document.getElementById('btnLoadGist');
  btnSave.disabled=busy; btnLoad.disabled=busy;
  if(busy) { setSyncStatus('<span class="spinner"></span> Подождите…','loading'); setSyncDot('busy'); }
}

function saveToken() {
  const tok=document.getElementById('syncToken').value.trim();
  const gid=document.getElementById('syncGistId').value.trim();
  if(!S.sync) S.sync={};
  S.sync.token=tok;
  if(gid) S.sync.gistId=gid;
  save();
  showToast('Токен сохранён');
}

async function saveToGist() {
  const tok=(document.getElementById('syncToken').value.trim())||S.sync?.token;
  if(!tok){setSyncStatus('Введите GitHub токен','err');return;}
  setSyncBusy(true);
  const content=JSON.stringify({teachers:S.teachers,students:S.students,partners:S.partners,weeks:S.weeks,curWk:S.curWk},null,2);
  try {
    const gid=S.sync?.gistId||document.getElementById('syncGistId').value.trim();
    const url=gid?`https://api.github.com/gists/${gid}`:'https://api.github.com/gists';
    const method=gid?'PATCH':'POST';
    const resp=await fetch(url,{
      method,
      headers:{'Authorization':'token '+tok,'Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},
      body:JSON.stringify({description:'Учебный центр — данные',public:false,files:{[GIST_FILE]:{content}}})
    });
    if(!resp.ok){const e=await resp.json();throw new Error(e.message||'HTTP '+resp.status);}
    const gist=await resp.json();
    if(!S.sync) S.sync={};
    S.sync.token=tok; S.sync.gistId=gist.id; S.sync.lastSync=new Date().toISOString();
    save();
    document.getElementById('syncGistId').value=gist.id;
    document.getElementById('lastSyncTime').textContent='Последняя синхронизация: '+new Date().toLocaleString('ru-RU');
    updateGistLink(gist.id);
    setSyncDot('ok');
    setSyncStatus('✓ Сохранено. Синхронизация теперь автоматическая.','ok');
  } catch(e) {
    setSyncDot('err');
    setSyncStatus('Ошибка: '+esc(e.message),'err');
  } finally { setSyncBusy(false); }
}

async function loadFromGist() {
  const tok=(document.getElementById('syncToken').value.trim())||S.sync?.token;
  const gid=(document.getElementById('syncGistId').value.trim())||S.sync?.gistId;
  if(!tok){setSyncStatus('Введите GitHub токен','err');return;}
  if(!gid){setSyncStatus('Введите Gist ID','err');return;}
  setSyncBusy(true);
  try {
    const resp=await fetch(`https://api.github.com/gists/${gid}`,{
      headers:{'Authorization':'token '+tok,'X-GitHub-Api-Version':'2022-11-28'}
    });
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    const gist=await resp.json();
    const raw=gist.files[GIST_FILE]?.content;
    if(!raw) throw new Error('Файл '+GIST_FILE+' не найден в Gist');
    const data=JSON.parse(raw);
    S.teachers=data.teachers?.length?data.teachers:TEACHERS;
    S.students=data.students||[];
    S.weeks=data.weeks||{};
    S.curWk=data.curWk||Object.keys(S.weeks)[0]||null;
    if(!S.sync) S.sync={};
    S.sync.token=tok; S.sync.gistId=gid; S.sync.lastSync=new Date().toISOString();
    save(); render();
    document.getElementById('lastSyncTime').textContent='Последняя синхронизация: '+new Date().toLocaleString('ru-RU');
    setSyncDot('ok');
    setSyncStatus('✓ Данные загружены','ok');
  } catch(e) {
    setSyncDot('err');
    setSyncStatus('Ошибка: '+esc(e.message),'err');
  } finally { setSyncBusy(false); }
}

/* ── WEEKS ────────────────────────────────────── */
let editWkId=null;

function addWk() {
  editWkId=null;
  document.getElementById('mWkTitle').textContent='Новая неделя';
  document.getElementById('btnSaveWk').textContent='Добавить неделю';
  document.getElementById('btnDelWkModal').style.display='none';
  // Suggest next week after the last existing week
  const ids=sortedWkIds();
  let suggestedMonday;
  if(ids.length>0){
    const lastWk=S.weeks[ids[ids.length-1]];
    if(lastWk.startDate){
      const lastMon=new Date(lastWk.startDate+'T12:00:00');
      suggestedMonday=new Date(lastMon);
      suggestedMonday.setDate(suggestedMonday.getDate()+7);
    }
  }
  if(!suggestedMonday) suggestedMonday=getMonday();
  document.getElementById('fWkDate').value=toISODate(suggestedMonday);
  updateWkPreview();
  // Show hint: what week comes next
  const hintEl=document.getElementById('wkHint');
  if(ids.length>0){
    hintEl.textContent='Следующая неделя после последней: '+weekLabel(suggestedMonday);
  } else { hintEl.textContent=''; }
  openM('mWeek');
}

function editCurrentWk() {
  const w=wk(); if(!w) return;
  editWkId=S.curWk;
  document.getElementById('mWkTitle').textContent='Изменить неделю';
  document.getElementById('btnSaveWk').textContent='Сохранить';
  document.getElementById('btnDelWkModal').style.display='inline-flex';
  document.getElementById('fWkDate').value=w.startDate||toISODate(getMonday());
  updateWkPreview();
  document.getElementById('wkHint').textContent='';
  openM('mWeek');
}

function deleteWkModal() {
  const ids=sortedWkIds();
  if(ids.length<=1){showToast('Нельзя удалить единственную неделю');return;}
  const w=wk(); if(!w) return;
  if(!confirm(`Удалить неделю «${w.label}»?\nВсе данные за эту неделю будут потеряны.`)) return;
  const idx=ids.indexOf(S.curWk);
  delete S.weeks[S.curWk];
  const remaining=sortedWkIds();
  S.curWk=remaining[Math.min(idx,remaining.length-1)];
  save(); render(); closeM('mWeek');
  showToast('Неделя удалена');
}

function updateWkPreview() {
  const v=document.getElementById('fWkDate').value;
  const el=document.getElementById('wkPreview');
  if(!v){el.textContent='';return;}
  el.textContent=weekLabel(getMonday(new Date(v+'T12:00:00')));
}

function setWkDateTo(monday) {
  document.getElementById('fWkDate').value=toISODate(monday);
  updateWkPreview();
}

function saveWk() {
  const v=document.getElementById('fWkDate').value; if(!v) return;
  const monday=getMonday(new Date(v+'T12:00:00'));
  const startDate=toISODate(monday);
  const label=weekLabel(monday);
  if(editWkId){
    const w=S.weeks[editWkId]; if(!w) return;
    w.startDate=startDate; w.label=label;
    save(); render(); closeM('mWeek');
    showToast('Неделя обновлена');
    return;
  }
  const existing=Object.values(S.weeks).find(w=>w.startDate===startDate);
  if(existing){S.curWk=existing.id;save();render();closeM('mWeek');return;}
  const wid='w'+Date.now();
  S.weeks[wid]={id:wid,label,startDate,startBal:0,lessons:{},stBal:{}};
  S.curWk=wid; save(); render(); closeM('mWeek');
}
function navWk(dir) {
  const ids=sortedWkIds(); const idx=ids.indexOf(S.curWk);
  const ni=idx+dir; if(ni>=0&&ni<ids.length){S.curWk=ids[ni];save();render();}
}

/* ── EVENTS ───────────────────────────────────── */
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  ['students','summary','teachers','settings'].forEach(t=>{
    document.getElementById('tab-'+t).classList.toggle('hide',t!==btn.dataset.tab);
  });
  if(btn.dataset.tab==='summary') renderSum();
  if(btn.dataset.tab==='teachers') renderTch();
  if(btn.dataset.tab==='settings') { renderSettings(); renderSyncCard(); }
}));

document.getElementById('wkSel').addEventListener('change',e=>{S.curWk=e.target.value;save();render();});
document.getElementById('btnPrev').addEventListener('click',()=>navWk(-1));
document.getElementById('btnNext').addEventListener('click',()=>navWk(1));
document.getElementById('btnAddWk').addEventListener('click',addWk);
document.getElementById('btnEditWk').addEventListener('click',editCurrentWk);
document.getElementById('btnDelWkModal').addEventListener('click',deleteWkModal);
document.getElementById('btnTheme').addEventListener('click',()=>{
  const cur=document.documentElement.getAttribute('data-theme');
  const next=cur==='dark'?'light':cur==='light'?'':'dark';
  S.theme=next; document.documentElement.setAttribute('data-theme',next); save();
});
document.getElementById('btnSync').addEventListener('click',()=>{
  if(S.sync?.token&&S.sync?.gistId) autoLoadOnStartup();
  else openSyncModal();
});
document.getElementById('btnSyncSettings').addEventListener('click',openSyncModal);
document.getElementById('btnSaveToken').addEventListener('click',saveToken);
document.getElementById('btnSaveGist').addEventListener('click',saveToGist);
document.getElementById('btnLoadGist').addEventListener('click',loadFromGist);
document.getElementById('btnAddSt').addEventListener('click',openAddSt);
document.getElementById('btnSaveSt').addEventListener('click',saveSt);
document.getElementById('btnAddStLesson').addEventListener('click',addStLesson);
document.getElementById('btnSaveL').addEventListener('click',saveL);
document.getElementById('fTeacher').addEventListener('change',function(){
  if(lessSid&&getStTeachers(lessSid)){prefillFromStTeacher();}else{fillLTypeSel();}
});
document.getElementById('fLType').addEventListener('change',()=>{prefillPrices();updatePrev();});
document.getElementById('fCountBtn').addEventListener('click',toggleCountPicker);
document.addEventListener('click',e=>{
  const p=document.getElementById('fCountPicker');
  if(p&&!p.classList.contains('hide')&&!p.contains(e.target)&&e.target.id!=='fCountBtn'&&!e.target.closest('#fCountBtn')) p.classList.add('hide');
});
document.getElementById('fLPrice').addEventListener('input',updatePrev);
document.getElementById('fLRate').addEventListener('input',updatePrev);

document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeM(b.dataset.close)));
document.querySelectorAll('.mbg').forEach(bg=>bg.addEventListener('click',e=>{if(e.target===bg)bg.classList.add('hide');}));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeM('mStudent');closeM('mLesson');closeM('mSync');closeM('mTeacher');closeM('mWeek');closeM('mPartner');closeStatusPop();}
});
document.getElementById('fWkDate').addEventListener('input',updateWkPreview);
document.getElementById('btnPickThisWk').addEventListener('click',()=>setWkDateTo(getMonday()));
document.getElementById('btnPickNextWk').addEventListener('click',()=>{
  const mon=getMonday(); mon.setDate(mon.getDate()+7); setWkDateTo(mon);
});
document.getElementById('btnSaveWk').addEventListener('click',saveWk);
document.getElementById('btnAddTch').addEventListener('click',openAddTeacher);
document.getElementById('btnSaveTch').addEventListener('click',saveTeacher);
document.getElementById('btnDelTch').addEventListener('click',deleteTeacher);
document.getElementById('btnAddP').addEventListener('click',openAddPartner);
document.getElementById('btnSaveP').addEventListener('click',savePartner);
document.getElementById('btnDelP').addEventListener('click',deletePartner);
document.getElementById('btnAddLT').addEventListener('click',()=>{
  const rows=collectLTRows(); rows.push({dur:60,p:0,r:0}); renderLTRows(rows);
});
document.getElementById('ltRows').addEventListener('click',e=>{
  const rm=e.target.closest('.lt-rm');
  if(rm){ const rows=collectLTRows(); rows.splice(parseInt(rm.dataset.lti),1); renderLTRows(rows); }
});
document.getElementById('settTchGrid').addEventListener('click',e=>{
  const btn=e.target.closest('[data-edit-tch]');
  if(btn) openEditTeacher(btn.dataset.editTch);
});
document.getElementById('partnersGrid').addEventListener('click',e=>{
  const btn=e.target.closest('[data-edit-p]');
  if(btn) openEditPartner(btn.dataset.editP);
});
document.getElementById('sumGrid').addEventListener('click',e=>{
  const btn=e.target.closest('[data-pay-tid]');
  if(btn) togglePaid(btn.dataset.payTid);
  const pbtn=e.target.closest('[data-pay-pid]');
  if(pbtn) togglePartnerPaid(pbtn.dataset.payPid);
});

document.getElementById('stBody').addEventListener('click',e=>{
  const rm=e.target.closest('[data-rm-sid]');
  if(rm){removeL(rm.dataset.rmSid,rm.dataset.rmTid,rm.dataset.rmLtid);return;}
  const al=e.target.closest('[data-add-ls]');
  if(al){openAddL(al.dataset.addLs);return;}
  const ed=e.target.closest('[data-edit]');
  if(ed){openEditSt(ed.dataset.edit);return;}
  const dl=e.target.closest('[data-del]');
  if(dl){
    const s=S.students.find(s=>s.id===dl.dataset.del);
    if(s&&confirm(`Удалить ученика «${s.name||'без имени'}»?`)){
      S.students=S.students.filter(st=>st.id!==dl.dataset.del);
      Object.values(S.weeks).forEach(w=>{if(w.lessons)delete w.lessons[dl.dataset.del];});
      save(); render();
    }
    return;
  }
  const cy=e.target.closest('[data-cyc]');
  if(cy){openStatusPop(cy.dataset.cyc,cy);return;}
  const fin=e.target.closest('[data-fin]');
  if(fin){
    const s=S.students.find(s=>s.id===fin.dataset.fin);
    if(s){s.status='finished';save();renderSts();renderBal();}
  }
});

document.getElementById('stBody').addEventListener('change',e=>{
  const inp=e.target.closest('[data-bal-sid]');
  if(!inp) return;
  const sid=inp.dataset.balSid; const field=inp.dataset.balField;
  const val=parseFloat(inp.value)||0;
  const w=wk(); if(!w) return;
  if(field==='balStart' && getPrevWkId(S.curWk)) return;
  if(!w.stBal) w.stBal={};
  if(!w.stBal[sid]) w.stBal[sid]={balStart:0,income:0};
  w.stBal[sid][field]=val;
  save(); renderSts(); renderBal();
});

/* ── STATUS POPOVER ───────────────────────────── */
let statusPopSid=null;
function openStatusPop(sid, anchor) {
  statusPopSid=sid;
  const pop=document.getElementById('statusPop');
  const s=S.students.find(st=>st.id===sid);
  pop.querySelectorAll('button[data-set-status]').forEach(btn=>{
    btn.classList.toggle('pop-cur', btn.dataset.setStatus===(s?.status||'active'));
  });
  pop.classList.remove('hide');
  const r=anchor.getBoundingClientRect();
  let top=r.bottom+5, left=r.left;
  if(left+160>window.innerWidth-8) left=window.innerWidth-160-8;
  if(top+110>window.innerHeight-8) top=r.top-115;
  pop.style.top=top+'px'; pop.style.left=left+'px';
}
function closeStatusPop(){
  document.getElementById('statusPop').classList.add('hide');
  statusPopSid=null;
}
document.getElementById('statusPop').addEventListener('click',e=>{
  const btn=e.target.closest('[data-set-status]');
  if(!btn||!statusPopSid) return;
  if(btn.classList.contains('pop-cur')){closeStatusPop();return;}
  const s=S.students.find(st=>st.id===statusPopSid);
  if(s){s.status=btn.dataset.setStatus;save();renderSts();renderBal();}
  closeStatusPop();
});
document.addEventListener('click',e=>{
  const pop=document.getElementById('statusPop');
  if(!pop.classList.contains('hide')&&!pop.contains(e.target)&&!e.target.closest('[data-cyc]')) closeStatusPop();
});

/* ── INIT ─────────────────────────────────────── */
loadS();
autoSelectCurrentWeek();
if(S.sync?.gistId) setSyncDot(S.sync?.token ? 'ok' : 'off');
render();
autoLoadOnStartup();
