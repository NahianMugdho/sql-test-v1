/* ============ ইঞ্জিন ============ */
const $=s=>document.querySelector(s);
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const norm=s=>s.toLowerCase().replace(/[`;]/g,'').replace(/\s+/g,' ').replace(/ ?([,()=<>]) ?/g,'$1').trim();
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
let mode='theory',cur=0;

function quizHTML(ci){
  const pool=CH[ci].quiz,set=shuf(pool).slice(0,20);
  let sc=0,done=0;
  const box=document.createElement('div');box.className='card';
  box.innerHTML=`<h3 style="margin-top:0">কুইজ <span class="score" id="sc"></span></h3><div id="qs"></div><button class="btn pri" id="shuf">🔀 শাফল — নতুন প্রশ্ন</button> <span style="color:var(--mute);font-size:13px">(প্রশ্নভান্ডার: ${pool.length}টি; প্রতিবার সর্বোচ্চ ২০টি)</span>`;
  const qs=box.querySelector('#qs'),scEl=box.querySelector('#sc');
  const upd=()=>scEl.textContent=`— স্কোর: ${sc}/${set.length}`;upd();
  set.forEach((x,i)=>{
    const d=document.createElement('div');d.className='q';
    if(x.t==='mcq'){
      const idx=shuf(x.o.map((_,k)=>k));
      d.innerHTML=`<div><b>${i+1}.</b> ${x.q}</div>`;
      let ans=false;
      idx.forEach(k=>{const b=document.createElement('button');b.className='opt';b.textContent=x.o[k];
        b.onclick=()=>{if(ans)return;ans=true;done++;
          if(k===x.a){b.classList.add('right');sc++}else{b.classList.add('wrong');[...d.querySelectorAll('.opt')].find(e=>e.textContent===x.o[x.a]).classList.add('right')}upd()};
        d.appendChild(b)});
    }else{
      d.innerHTML=`<div><b>${i+1}.</b> ${x.q.replace('____','<input class="fb" size="12" aria-label="উত্তর">')}</div><button class="btn" style="margin-top:6px">চেক</button><div class="res"></div>`;
      let ans=false;
      d.querySelector('button').onclick=()=>{if(ans)return;const v=norm(d.querySelector('input').value);if(!v)return;ans=true;
        const r=d.querySelector('.res'),ok=x.a.map(norm).includes(v);if(ok)sc++;
        r.className='res '+(ok?'ok':'no');r.textContent=ok?'✔ সঠিক':'✘ ভুল — সঠিক উত্তর: '+x.a[0];upd()};
    }
    qs.appendChild(d);
  });
  box.querySelector('#shuf').onclick=()=>{box.replaceWith(quizHTML(ci));};
  return box;
}

/* ============ SQL চালিয়ে মেলানো (sql.js / SQLite) ============ */
let SQLJS=null;
if(window.initSqlJs)initSqlJs({locateFile:f=>'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/'+f}).then(S=>SQLJS=S).catch(()=>{});
const strip=t=>t.replace(/^\s*(CREATE DATABASE|USE)\b[^;]*;/gim,'');
const mkdb=p=>{const d=new SQLJS.Database();d.exec(strip(({icml:ICSETUP,emp:EMPSETUP})[p.db]||SETUP));return d};
const rows=r=>r.length?r[r.length-1].values.map(x=>x.map(v=>typeof v==='number'?Math.round(v*100)/100:String(v)).join('|')):[];
function resTable(r){if(!r.length)return '<p>(কোনো row নেই / কমান্ড সফল)</p>';const q=r[r.length-1];return T(q.columns,q.values.map(x=>x.map(String)))}
function checkAns(p){
  const el=$('#a'),raw=el.value.trim(),r=$('#r');if(!raw)return;
  const user=p.fill?p.tpl.replace('____',raw):raw,full=p.fill?p.tpl.replace('____',p.ans):p.ans;
  $('#sol').innerHTML='';
  if(SQLJS){
    let a,b,ra,rb;
    try{a=mkdb(p);b=mkdb(p);ra=a.exec(user)}catch(e){r.className='res no';r.textContent='✘ SQL ত্রুটি: '+e.message;return}
    rb=b.exec(full);if(p.chk){ra=a.exec(p.chk);rb=b.exec(p.chk)}
    let x=rows(ra),y=rows(rb);if(!/order by/i.test(p.ans)){x.sort();y.sort()}
    const ok=x.length===y.length&&x.every((v,i)=>v===y[i]);
    r.className='res '+(ok?'ok':'no');r.textContent=ok?'✔ ঠিক হয়েছে! (ফলাফল মিলেছে)':'✘ ফলাফল মেলেনি — নিচে তোমার কুয়েরির আউটপুট দেখো';
    $('#sol').innerHTML='<h3>তোমার আউটপুট</h3>'+resTable(p.chk?ra:ra);a.close();b.close();return}
  const ok=[...p.ok,p.fill?p.ans:p.ans].map(norm).includes(norm(raw))||(!p.fill&&norm(full)===norm(raw));
  r.className='res '+(ok?'ok':'no');r.textContent=ok?'✔ ঠিক হয়েছে! (লেখা মিলেছে)':'✘ মেলেনি (অফলাইন মোড: শুধু লেখা মেলানো হচ্ছে — ইন্টারনেট থাকলে SQL চালিয়ে মেলে)';
}

function theory(i){
  cur=i;const m=$('#main');m.innerHTML=CH[i].h;if(CH[i].ans)m.querySelectorAll('p').forEach(p=>{const s=p.querySelector('strong'),k=s&&s.textContent.match(/^([AB])(\d+)\.$/);if(!k)return;
    const v=ANS[k[1]][k[2]-1];if(!v)return;const dt=document.createElement('details');
    dt.innerHTML='<summary>উত্তর দেখো</summary><div class="note">'+(k[1]==='A'?esc(v):v)+'</div>';p.after(dt)});
  if(CH[i].quiz.length)m.appendChild(quizHTML(i));
  const nx=document.createElement('p');
  nx.innerHTML=(i<CH.length-1?`<button class="btn pri" id="nx">পরের অধ্যায় →</button>`:`<button class="btn pri" id="nx">ব্যবহারিক শুরু করো →</button>`);
  m.appendChild(nx);$('#nx').onclick=()=>i<CH.length-1?go('theory',i+1):go('prac',0);
}

function prac(i){
  cur=i;const m=$('#main');
  if(i===0){
    m.innerHTML=`<h2>ব্যবহারিক: Bank Database</h2>
<p class="bn">ধাপ: ১) টেবিলের গঠন দেখো → ২) CREATE ও INSERT চালাও → ৩) সমস্যা সমাধান করো। MySQL Workbench / phpMyAdmin / DB Fiddle-এ নিজে চালিয়ে দেখো।</p>
<h3>সূত্র (Traditional + বাংলা মিশ্র)</h3><div class="scroll"><table><tr><th>কাজ</th><th>সূত্র</th></tr>${SYNTAX.map(s=>`<tr><td>${s[0]}</td><td><code>${esc(s[1])}</code></td></tr>`).join('')}</table></div>
<h3>টেবিল ও ডেটা</h3>${TABLES}
<h3>CREATE + INSERT (সম্পূর্ণ কোড)</h3><pre><code>${esc(SETUP)}</code></pre>
<h3>Employee অনুশীলন-সেট (PDF থেকে, সমস্যা ২৫–৩৬)</h3><pre><code>${esc(EMPSETUP)}</code></pre><h3>ICML অনুশীলন-সেট (সমস্যা ১০–২৪)</h3><pre><code>${esc(ICSETUP)}</code></pre><div class="warn"><b>সতর্কতা:</b> MySQL-এ Oracle-এর <code>number</code> নয়, <code>DECIMAL</code> লিখতে হয়; আর <code>&amp;variable</code> প্রম্পট MySQL-এ নেই — সরাসরি মান লেখো।</div>`;return}
  const k=i-1,p=P[k];
  m.innerHTML=`<h2>সমস্যা ${k+1}</h2><div class="card"><p><b>${p.q}</b></p>${p.db==='icml'?'<div class="note">ডেটাবেজ: ICML bank_test — Customer, Transaction</div>':p.db==='emp'?'<div class="note">ডেটাবেজ: emp_db — EmployeeDetails, EmployeeSalary (PDF থেকে)</div>':''}
  <p class="bn">সূত্র: ${esc(p.bn)}</p>
  ${p.fill?`<pre><code>${esc(p.tpl)}</code></pre><input class="fb" id="a" size="14" placeholder="ফাঁকা বসাও" style="font-size:15px">`:`<textarea id="a" placeholder="এখানে SQL লেখো..." spellcheck="false"></textarea>`}
  <p><button class="btn pri" id="chk">উত্তর মেলাও</button> <button class="btn" id="show">সম্পূর্ণ কোড ও আউটপুট দেখো</button></p><div class="res" id="r"></div><div id="sol"></div></div>
  <p>${k>0?'<button class="btn" id="pv">← আগের</button> ':''}${k<P.length-1?'<button class="btn pri" id="nx">পরের →</button>':''}</p>`;
  $('#chk').onclick=()=>checkAns(p);
  $('#show').onclick=()=>{$('#sol').innerHTML=`<h3>সম্পূর্ণ কোড</h3><pre><code>${esc(p.fill?p.tpl.replace('____',p.ans):p.ans)}</code></pre><h3>আউটপুট</h3>${p.out}`};
  if($('#pv'))$('#pv').onclick=()=>go('prac',i-1);if($('#nx'))$('#nx').onclick=()=>go('prac',i+1);
}

function go(md,i){mode=md;$('#t-theory').classList.toggle('on',md==='theory');$('#t-prac').classList.toggle('on',md==='prac');
  const items=md==='theory'?CH.map(c=>c.t):['পরিচিতি, সূত্র ও সেটআপ',...P.map((p,k)=>`সমস্যা ${k+1}${p.fill?' (ফাঁকা পূরণ)':''}`)];
  $('#nav').innerHTML=items.map((t,k)=>`<a href="#" data-k="${k}" class="${k===i?'on':''}">${t}</a>`).join('');
  $('#nav').querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();go(md,+a.dataset.k)});
  (md==='theory'?theory:prac)(i);window.scrollTo(0,0)}
$('#t-theory').onclick=()=>go('theory',0);$('#t-prac').onclick=()=>go('prac',0);
$('#theme').onclick=()=>{const r=document.documentElement,d=getComputedStyle(r).getPropertyValue('--bg').trim()==='#0c1522';r.dataset.theme=d?'light':'dark'};
go('theory',0);
