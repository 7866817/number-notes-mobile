'use strict';
const zodiac=['马','蛇','龙','兔','虎','牛','鼠','猪','狗','鸡','猴','羊'];
const animal=n=>zodiac[(n-1)%12];
const key='simple-number-notes-v1';
const keyPeriods='simple-number-notes-periods-v1';
const keyCurrent='simple-number-notes-current-period-v1';
function todayId(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const $=id=>document.getElementById(id);
const money=c=>(c/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function amountFor(r,n){return r.allocations ? r.allocations[r.nums.indexOf(n)] : r.cents;}
function rowTotal(r){return r.nums.reduce((sum,n)=>sum+amountFor(r,n),0);}
function parseStrict(text){
 const lines=text.trim().split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 if(!lines.length)throw Error('请输入号码和金额。');
 return lines.map((line,index)=>{
  const clean=line.replace(/[，,、；;。]+\s*$/,'').trim();
  const tail=clean.match(/^([0-9])\s*(?:的\s*)?尾(?:数)?\s*各\s*(\d+(?:\.\d{1,2})?)$/);
  if(tail){
   const nums=Array.from({length:49},(_,i)=>i+1).filter(n=>n%10===Number(tail[1]));
   const cents=Math.round(Number(tail[2])*100);
   if(!Number.isSafeInteger(cents)||cents<=0||cents>10000000000)throw Error('尾数金额应大于 0 且不超过 1 亿。');
   return {nums,cents,tailLabel:tail[1]+'尾各'+tail[2],time:Date.now(),id:crypto.randomUUID()};
  }
  const pack=clean.match(/^([鼠牛虎兔龙蛇马羊猴鸡狗猪龍馬雞豬])\s*(包|各)\s*(\d+(?:\.\d{1,2})?)$/);
  if(pack){
   const label=({'龍':'龙','馬':'马','雞':'鸡','豬':'猪'})[pack[1]]||pack[1];
   const nums=Array.from({length:49},(_,i)=>i+1).filter(n=>animal(n)===label);
   const total=Math.round(Number(pack[3])*100);
   if(!Number.isSafeInteger(total)||total<=0||total>10000000000)throw Error('包肖金额应大于 0 且不超过 1 亿。');
   const base=pack[2]==='包'?Math.floor(total/nums.length):total;
   const allocations=nums.map((n,i)=>base+(pack[2]==='包'&&i<total%nums.length?1:0));
   return {nums,cents:base,allocations,packLabel:label+pack[2]+pack[3],time:Date.now(),id:crypto.randomUUID()};
  }
  const m=clean.match(/^(\d{1,2}(?:\s*[\/／，,、]\s*\d{1,2})*)(?:\s*各\s*|\s+)(\d+(?:\.\d{1,2})?)$/);
  if(!m)throw Error('第 '+(index+1)+' 行格式不对，请输入 1/2/3 50 、1，2，3各50 、龙包50 或 5尾各10。');
  const nums=m[1].split(/[\/／，,、]/).map(Number);
  if(nums.some(n=>n<1||n>49))throw Error('第 '+(index+1)+' 行号码范围应为 1–49。');
  if(new Set(nums).size!==nums.length)throw Error('第 '+(index+1)+' 行有重复号码，请删除重复号码。');
  const cents=Math.round(Number(m[2])*100);
  if(!Number.isSafeInteger(cents)||cents<=0||cents>10000000000)throw Error('请输入大于 0 且不超过 1 亿的金额，最多两位小数。');
  return {nums,cents,time:Date.now(),id:crypto.randomUUID()};
 });
}
function splitGroups(text){
 const z='[鼠牛虎兔龙蛇马羊猴鸡狗猪]';
 const tail='(?:尾数?\\s*[0-9]|[0-9]\\s*(?:的\\s*)?尾(?:数)?)';
 const number='\\d{1,2}\\s*号?';
 const list=part=>part+'(?:\\s*[/,、和跟及]\\s*'+part+')*';
 const subject='(?:'+list(tail)+'|'+z+'(?:\\s*[/,、和跟及]?\\s*'+z+')*|'+list(number)+')';
 const mode='(?:每个号码|每个号|每个|每号|每注|各买|各下|各|总共|一共|合计|总计|总额|包)';
 const prefix='(?:(?:请帮我|帮我|请|我要|我想|我|人家)\\s*)?(?:(?:下注|买|下)\\s*)?';
 const amount='\\d+(?:\\.\\d{1,2})?(?![\\d.])';
 const suffix='(?:\\s*(?:美元|美金|块钱|块|元))?(?:\\s*[,，]?\\s*(?:平均分配|平均分|均分|平分))?';
 const pattern=new RegExp(prefix+subject+'(?:\\s*'+mode+'\\s*|\\s+)'+amount+suffix+'|'+prefix+'(?:'+z+'|'+tail+')\\s*'+amount+suffix,'y');
 const source=text.replace(/[\r\n]+/g,' ');let position=0;const groups=[];
 while(position<source.length){
  const separators=source.slice(position).match(/^[\s,，、;；。]+/);if(separators)position+=separators[0].length;
  if(position===source.length)break;
  pattern.lastIndex=position;const match=pattern.exec(source);
  if(!match)throw Error('这段暂时无法确定：“'+source.slice(position,position+45)+'”。请检查号码和金额，内容尚未保存。');
  groups.push(match[0].trim());position=pattern.lastIndex;
 }
 return groups;
}
const CN_D={一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
const CN_U={十:10,百:100,千:1000};
function cnFull(s){let t=0,c=0;for(const ch of s){if(CN_D[ch]!==undefined)c=CN_D[ch];else if(CN_U[ch]!==undefined){t+=(c||1)*CN_U[ch];c=0;}else return null;}t+=c;return t>0&&t<=9999?t:null;}
function recognize(text){
 const normalized=text.normalize('NFKC').replace(/[龍馬雞豬]/g,c=>({'龍':'龙','馬':'马','雞':'鸡','豬':'猪'})[c]).replace(/老鼠/g,'鼠').replace(/老虎/g,'虎').replace(/([一二三四五六七八九十]+)号/g,(m,cn)=>{const n=cnFull(cn);return (n!==null&&n>=1&&n<=49)?(n+'号'):m;});
 const expanded=normalized.replace(/([鼠牛虎兔龙蛇马羊猴鸡狗猪]+)\s*各包\s*(\d+(?:\.\d{1,2})?)/g, (_,animals,amount)=>Array.from(animals,a=>a+'包'+amount).join(';'));
 const numeric=expanded.replace(/\b(\d{1,2}(?:[ \t,、/]+\d{1,2})*)\s*各\s*(\d+(?:\.\d{1,2})?)/g,(_,list,amount)=>{
  const counts=new Map();
  for(const n of list.split(/[ \t,、/]+/).map(Number))counts.set(n,(counts.get(n)||0)+1);
  const groups=[];
  for(let k=1;k<=Math.max(...counts.values());k++)groups.push([...counts].filter(([,count])=>count>=k).map(([n])=>n).join('/')+'各'+amount);
  return groups.join(';');
 });
 const lines=splitGroups(numeric);
 if(!lines.length)throw Error('请先输入号码和金额。');
 return lines.map((source,i)=>{
  let s=source.replace(/^(?:请帮我|帮我|请|我要|我想|我|人家)\s*/,'').replace(/^(?:买|下|下注)\s*/,'').trim();
  s=s.replace(/(?:块钱|块|元|美元|美金)\s*$/,'').replace(/\s+/g,' ').trim();
  s=s.replace(/(?:每个号码|每个号|每个|每号|每注|各买|各下)/g,'各');
  s=s.replace(/(?:一共|总共|合计|总计|总额)/g,'包').replace(/平均分配|平均分|均分|平分/g,'均分');
  s=s.replace(/(?:\s*[,，]?\s*均分)\s*$/,'').replace(/包\s*包/g,'包');
  s=s.replace(/(?:尾数|尾)\s*([0-9])(?=\s*(?:[各包/]|$))/g,'$1尾').replace(/([0-9])\s*的?\s*尾数/g,'$1尾');
  s=s.replace(/([0-9])\s*的\s*尾/g,'$1尾');
  s=s.replace(/[,，、]/g,'/').replace(/(?:号|號)/g,'').replace(/\s*(?:和|跟|及)\s*/g,'/');
  // Allow an amount before an explicit equal-split instruction.
  if(/平均分配|平均分|均分|平分/.test(source)&&!/[包各]/.test(s))s=s.replace(/\s*(\d+(?:\.\d{1,2})?)$/,'包$1');
  const ambiguous=s.match(/^([鼠牛虎兔龙蛇马羊猴鸡狗猪]|[0-9]\s*尾)\s*(\d+(?:\.\d{1,2})?)$/);
  function expand(mode){
   let canonical=s;
   if(ambiguous)canonical=ambiguous[1]+mode+ambiguous[2];
   const combined=canonical.match(/^([鼠牛虎兔龙蛇马羊猴鸡狗猪/]+|[0-9]尾(?:\/[0-9]尾)+)\s*(各|包)\s*(\d+(?:\.\d{1,2})?)$/);
   if(combined && (combined[1].includes('/')||combined[1].length>1&&!combined[1].includes('尾'))){
    const animals=[...combined[1]].filter(c=>zodiac.includes(c));
    const tails=[...combined[1].matchAll(/([0-9])尾/g)].map(m=>Number(m[1]));
    if(new Set(animals).size!==animals.length||new Set(tails).size!==tails.length)throw Error('生肖或尾数重复。');
    const nums=Array.from({length:49},(_,j)=>j+1).filter(n=>animals.includes(animal(n))||tails.includes(n%10));
    const total=Math.round(Number(combined[3])*100);
    if(!Number.isSafeInteger(total)||total<=0||total>10000000000)throw Error('金额超出范围。');
    const base=combined[2]==='包'?Math.floor(total/nums.length):total;
    return {nums,cents:base,allocations:nums.map((n,j)=>base+(combined[2]==='包'&&j<total%nums.length?1:0)),packLabel:combined[1]+combined[2]+combined[3],time:Date.now(),id:crypto.randomUUID()};
   }
   const tailPack=canonical.match(/^([0-9])\s*尾\s*包\s*(\d+(?:\.\d{1,2})?)$/);
   if(tailPack){
    const nums=Array.from({length:49},(_,j)=>j+1).filter(n=>n%10===Number(tailPack[1]));
    const total=Math.round(Number(tailPack[2])*100);
    if(!Number.isSafeInteger(total)||total<=0||total>10000000000)throw Error('金额应大于0且不超过1亿。');
    const base=Math.floor(total/nums.length);
    return {nums,cents:base,allocations:nums.map((n,j)=>base+(j<total%nums.length?1:0)),packLabel:tailPack[1]+'尾包'+tailPack[2],time:Date.now(),id:crypto.randomUUID()};
   }
   const numericPack=canonical.match(/^(\d{1,2}(?:\s*[/,，、]\s*\d{1,2})*)\s*包\s*(\d+(?:\.\d{1,2})?)$/);
   if(numericPack){
    const r=parseStrict(numericPack[1]+' '+numericPack[2])[0];const total=r.cents,base=Math.floor(total/r.nums.length);
    return {...r,cents:base,allocations:r.nums.map((n,j)=>base+(j<total%r.nums.length?1:0)),packLabel:'号码均分'+numericPack[2]};
   }
   return parseStrict(canonical)[0];
  }
  try{return {source,choices:ambiguous?{each:expand('各'),total:expand('包')}:null,row:ambiguous?null:expand()};}
  catch(e){
   const reason=e&&e.message?e.message:'';
   if(/号码范围|重复|金额/.test(reason))throw Error('第 '+(i+1)+' 组：'+source+'。'+reason);
   throw Error('第 '+(i+1)+' 组暂时无法确定：'+source+'。请写清号码或生肖，以及“各多少”或“总共多少”。');
  }
 });
}
function valid(items){return Array.isArray(items)&&items.length<=100000&&items.every(r=>Array.isArray(r.nums)&&r.nums.length>0&&r.nums.length<=49&&new Set(r.nums).size===r.nums.length&&r.nums.every(n=>Number.isInteger(n)&&n>=1&&n<=49)&&Number.isSafeInteger(r.cents)&&r.cents>=0&&r.cents<=10000000000&&(r.allocations===undefined?r.cents>0:(Array.isArray(r.allocations)&&r.allocations.length===r.nums.length&&r.allocations.every(c=>Number.isSafeInteger(c)&&c>=0&&c<=10000000000)&&r.allocations.some(c=>c>0)))&&(r.packLabel===undefined||(typeof r.packLabel==='string'&&r.packLabel.length<50))&&Number.isFinite(r.time)&&typeof r.id==='string'&&(r.tailLabel===undefined||(typeof r.tailLabel==='string'&&r.tailLabel.length<50))&&(r.person===undefined||(typeof r.person==='string'&&r.person.length<=40)))&&new Set(items.map(r=>r.id)).size===items.length;}
let rows=[];try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(!valid(saved))throw Error();rows=saved;}catch{$('message').textContent='无法读取本机记录，请尝试恢复备份。';}
let periods=[];try{const saved=JSON.parse(localStorage.getItem(keyPeriods)||'[]');if(!Array.isArray(saved)||!saved.every(p=>p&&typeof p.id==='string'&&valid(p.rows)))throw Error();periods=saved;}catch{$('message').textContent='无法读取往期记录。';}
let currentPeriod=localStorage.getItem(keyCurrent)||'';
if(!currentPeriod){currentPeriod=todayId();try{localStorage.setItem(keyCurrent,currentPeriod);}catch{}}
if(currentPeriod<todayId()){
 let archived=null;
 if(rows.length){archived=currentPeriod;periods.unshift({id:currentPeriod,rows,closedAt:Date.now()});savePeriods();rows=[];try{localStorage.setItem(key,JSON.stringify(rows));}catch{}}
 currentPeriod=todayId();try{localStorage.setItem(keyCurrent,currentPeriod);}catch{}
 if(archived)$('message').textContent='已自动归档 '+archived+'，开启新一期 '+currentPeriod+'。';
}
let openPeriodId=null;
let riskSort='profit',riskDirection=1;
let filter='all';let personFilter='';let selectedNumber=null;
function commit(next){try{localStorage.setItem(key,JSON.stringify(next));rows=next;render();return true;}catch{$('message').textContent='保存失败，浏览器存储不可用或已满。请导出备份。';return false;}}
function savePeriods(){try{localStorage.setItem(keyPeriods,JSON.stringify(periods));return true;}catch{$('message').textContent='往期保存失败，浏览器存储不可用或已满。请导出备份。';return false;}}
function saveCurrentPeriod(){try{localStorage.setItem(keyCurrent,currentPeriod);}catch{}}
function freshPeriodId(){const base=todayId();const taken=new Set(periods.map(p=>p.id));taken.add(currentPeriod);let id=base,n=2;while(taken.has(id)){id=base+'-'+n++;}return id;}
function archiveCurrentPeriod(){
 if(rows.length){periods.unshift({id:currentPeriod,rows,closedAt:Date.now()});if(!savePeriods())return false;}
 rows=[];currentPeriod=freshPeriodId();saveCurrentPeriod();
 try{localStorage.setItem(key,JSON.stringify(rows));}catch{}
 render();$('message').textContent='已开启新一期 '+currentPeriod+'，旧期已归档到往期。';return true;
}
function newPeriod(){if(!rows.length){$('message').textContent='当前这期还是空的，不用开新一期。';return;}if(confirm('开新一期会把当前这期归档，确定吗？'))archiveCurrentPeriod();}
function periodTotals(p){const totals=Array(50).fill(0);p.rows.forEach(r=>r.nums.forEach(n=>totals[n]+=amountFor(r,n)));return {totals,grand:totals.reduce((a,b)=>a+b,0),covered:totals.filter(Boolean).length};}
function render(){renderRisk();$('periodLabel').textContent='本期 · '+currentPeriod;renderPeriods();if(selectedNumber!==null)showPayout(selectedNumber,false);const totals=Array(50).fill(0);rows.forEach(r=>r.nums.forEach(n=>totals[n]+=amountFor(r,n)));const grand=totals.reduce((a,b)=>a+b,0);$('total').textContent=money(grand);$('count').textContent=rows.length;$('covered').textContent=totals.filter(Boolean).length+' / 49';$('undo').disabled=!rows.length;let nums=Array.from({length:49},(_,i)=>i+1);if(filter==='only')nums=nums.filter(n=>totals[n]);if(filter==='sort')nums.sort((a,b)=>totals[b]-totals[a]||a-b);$('grid').innerHTML=nums.map(n=>`<button type="button" data-number="${n}" aria-label="查看 ${String(n).padStart(2,'0')} 号赔付" class="cell ${totals[n]?'filled':''} ${selectedNumber===n?'selected':''}"><b>${String(n).padStart(2,'0')}<em class="zodiac">${animal(n)}</em></b><span>${filter==='risk'?money(grand-totals[n]*47):(totals[n]?money(totals[n]):'—')}</span></button>`).join('');$('summaryNote').textContent=filter==='risk'?'开出该号码后的盈亏':'号码下方为累计金额';$('gridEmpty').classList.toggle('hidden',nums.length>0);const names=[...new Set(rows.map(r=>r.person||'未填写'))].sort();$('personFilter').replaceChildren(new Option('全部人员',''));names.forEach(name=>$('personFilter').add(new Option(name,name)));if(!names.includes(personFilter))personFilter='';$('personFilter').value=personFilter;const visibleRows=rows.filter(r=>!personFilter||(r.person||'未填写')===personFilter);$('personStats').textContent=visibleRows.length+' 笔 · 合计 '+money(visibleRows.reduce((s,r)=>s+rowTotal(r),0));$('records').replaceChildren();if(!visibleRows.length){const p=document.createElement('p');p.className='empty';p.textContent='还没有记录，添加第一笔吧';$('records').append(p);}visibleRows.slice().reverse().forEach(r=>{const el=document.createElement('div');el.className='record';const left=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('small');title.textContent=(r.person||'未填写')+' · '+r.nums.map(n=>String(n).padStart(2,'0')+animal(n)).join(' / ');sub.textContent=(r.tailLabel?r.tailLabel+' · 每个 '+money(r.cents):r.allocations?(r.packLabel+' · '+r.nums.map(n=>String(n).padStart(2,'0')+'='+money(amountFor(r,n))).join(' / ')):'每个 '+money(r.cents))+' · '+new Date(r.time).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});left.append(title,sub);const right=document.createElement('div');right.className='right';const amt=document.createElement('strong');amt.textContent=money(rowTotal(r));const del=document.createElement('button');del.textContent='删除';del.onclick=()=>{if(confirm('删除这笔记录？'))commit(rows.filter(x=>x.id!==r.id));};right.append(amt,del);el.append(left,right);$('records').append(el);});}
function renderPeriods(){
 const list=$('periodList');list.replaceChildren();
 list.classList.toggle('hidden',!!openPeriodId);
 $('periodDetail').classList.toggle('hidden',!openPeriodId);
 if(!periods.length){const p=document.createElement('p');p.className='empty';p.textContent='还没有往期，当前这期归档后会出现在这里';list.append(p);}
 periods.forEach(p=>{
  const t=periodTotals(p);
  const b=document.createElement('button');b.type='button';b.className='period-row';
  const left=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('small');
  title.textContent=p.id;sub.textContent=p.rows.length+' 笔 · 已录入 '+t.covered+' / 49 个号码';
  left.append(title,sub);
  const right=document.createElement('div');right.className='right';const amt=document.createElement('strong');amt.textContent=money(t.grand);right.append(amt);
  b.append(left,right);b.onclick=()=>showPeriod(p.id);list.append(b);
 });
 if(openPeriodId)showPeriod(openPeriodId);
}
function showPeriod(id){
 const p=periods.find(x=>x.id===id);if(!p){openPeriodId=null;$('periodDetail').classList.add('hidden');return;}
 openPeriodId=id;$('periodList').classList.add('hidden');$('periodDetail').classList.remove('hidden');
 const t=periodTotals(p);const body=$('periodDetailBody');body.replaceChildren();
 const h=document.createElement('h2');h.textContent=p.id+' · 明细';body.append(h);
 const stats=document.createElement('div');stats.className='period-result';
 const s1=document.createElement('div');s1.className='period-numbers';
 const d1=document.createElement('div'),d2=document.createElement('div');
 const l1=document.createElement('small');l1.textContent='本期总金额';const v1=document.createElement('strong');v1.textContent=money(t.grand);d1.append(l1,v1);
 const l2=document.createElement('small');l2.textContent='录入笔数';const v2=document.createElement('strong');v2.textContent=String(p.rows.length);d2.append(l2,v2);
 s1.append(d1,d2);stats.append(s1);
 const cov=document.createElement('p');cov.className='hint';cov.textContent='已录入号码 '+t.covered+' / 49';stats.append(cov);
 body.append(stats);
 const people=new Map();p.rows.forEach(r=>{const name=r.person||'未填写';people.set(name,(people.get(name)||0)+rowTotal(r));});
 const ph=document.createElement('p');ph.className='muted';ph.textContent='按人汇总';body.append(ph);
 [...people].sort((a,b)=>b[1]-a[1]).forEach(([name,amount])=>{const row=document.createElement('div');row.className='payout-person';const left=document.createElement('div'),label=document.createElement('span');label.textContent=name;left.append(label);const total=document.createElement('strong');total.textContent=money(amount);row.append(left,total);body.append(row);});
 const nh=document.createElement('p');nh.className='muted';nh.textContent='号码汇总';body.append(nh);
 t.totals.map((c,n)=>({n,c})).filter(x=>x.n>0&&x.c).sort((a,b)=>b.c-a.c).forEach(x=>{const row=document.createElement('div');row.className='payout-person';const left=document.createElement('div'),label=document.createElement('span');label.textContent=String(x.n).padStart(2,'0')+' '+animal(x.n);left.append(label);const total=document.createElement('strong');total.textContent=money(x.c);row.append(left,total);body.append(row);});
 const rh=document.createElement('p');rh.className='muted';rh.textContent='录入记录';body.append(rh);
 p.rows.slice().reverse().forEach(r=>{const el=document.createElement('div');el.className='record';const left=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('small');title.textContent=(r.person||'未填写')+' · '+r.nums.map(n=>String(n).padStart(2,'0')+animal(n)).join(' / ');sub.textContent=(r.tailLabel?r.tailLabel+' · 每个 '+money(r.cents):r.allocations?(r.packLabel+' · '+r.nums.map(n=>String(n).padStart(2,'0')+'='+money(amountFor(r,n))).join(' / ')):'每个 '+money(r.cents))+' · '+new Date(r.time).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});left.append(title,sub);const right=document.createElement('div');right.className='right';const amt=document.createElement('strong');amt.textContent=money(rowTotal(r));right.append(amt);el.append(left,right);body.append(el);});
}
let pending=null;
function resetPreview(){pending=null;$('recognition').classList.add('hidden');$('previewRows').replaceChildren();}
function renderPreview(){
 $('recognition').classList.remove('hidden');$('previewRows').replaceChildren();
 pending.items.forEach((item,index)=>{
  const card=document.createElement('div');card.className='preview-row';const source=document.createElement('strong');source.textContent=item.source;card.append(source);
  if(item.choices){const hint=document.createElement('p');hint.className='hint';hint.textContent='这里的金额是每个号码，还是全部号码的总额？';card.append(hint);const actions=document.createElement('div');actions.className='actions';[['each','每个号码'],['total','总额平均分']].forEach(([mode,label])=>{const b=document.createElement('button');b.className=item.mode===mode?'primary':'secondary';b.textContent=label;b.onclick=()=>{item.mode=mode;item.row=item.choices[mode];renderPreview();};actions.append(b);});card.append(actions);}
  if(item.row){const detail=document.createElement('p');detail.className='hint';detail.textContent=item.row.nums.map(n=>String(n).padStart(2,'0')+' '+animal(n)+'：'+money(amountFor(item.row,n))).join(' / ');const total=document.createElement('p');total.textContent='本组合计 '+money(rowTotal(item.row));card.append(detail,total);}
  $('previewRows').append(card);
 });
 const complete=pending.items.every(x=>x.row);$('confirmAdd').disabled=!complete;
 $('previewTotal').textContent=complete?'姓名：'+(pending.person||'未填写')+' · '+pending.items.length+' 组 · 合计 '+money(pending.items.reduce((sum,x)=>sum+rowTotal(x.row),0)):'请先选择有歧义的金额含义，再确认添加。';
}
$('add').onclick=()=>{resetPreview();try{pending={person:$('person').value.trim(),items:recognize($('input').value)};renderPreview();$('message').textContent='请核对识别结果，确认后才会保存。';}catch(e){$('message').textContent=e.message;}};
$('confirmAdd').onclick=()=>{if(!pending||pending.items.some(x=>!x.row))return;const added=pending.items.map(x=>({...x.row,person:pending.person}));if(commit([...rows,...added])){$('input').value='';resetPreview();$('message').textContent='已添加 '+added.length+' 笔，合计 '+money(added.reduce((sum,r)=>sum+rowTotal(r),0));}};
$('cancelPreview').onclick=resetPreview;
$('input').addEventListener('input',resetPreview);$('person').addEventListener('input',resetPreview);
$('undo').onclick=()=>{if(rows.length&&commit(rows.slice(0,-1)))$('message').textContent='已撤销最近一笔。';};
['all','only','sort','risk'].forEach(id=>$(id).onclick=()=>{filter=id;['all','only','sort','risk'].forEach(x=>$(x).classList.toggle('active',x===id));render();});
function page(view){
 const history=view==='history',risk=view==='risk',periodsView=view==='periods';
 $('history').classList.toggle('hidden',!history);$('ranking').classList.toggle('hidden',!risk);$('periods').classList.toggle('hidden',!periodsView);
 $('entry').classList.toggle('hidden',history||risk||periodsView);$('summary').classList.toggle('hidden',history||risk||periodsView);
 $('historyNav').classList.toggle('active',history);$('riskNav').classList.toggle('active',risk);$('periodsNav').classList.toggle('active',periodsView);$('homeNav').classList.toggle('active',!history&&!risk&&!periodsView);window.scrollTo(0,0);
}
$('personFilter').onchange=e=>{personFilter=e.target.value;render();};
$('homeNav').onclick=()=>page('home');$('historyNav').onclick=()=>page('history');$('riskNav').onclick=()=>page('risk');$('periodsNav').onclick=()=>page('periods');
$('newPeriod').onclick=newPeriod;$('newPeriod2').onclick=newPeriod;$('backPeriods').onclick=()=>{openPeriodId=null;renderPeriods();};
$('clear').onclick=()=>{if(rows.length&&confirm('清空全部记录？建议先导出备份。'))commit([]);};
$('copy').onclick=async()=>{const totals=Array(50).fill(0);rows.forEach(r=>r.nums.forEach(n=>totals[n]+=amountFor(r,n)));const text=totals.map((c,n)=>c?String(n).padStart(2,'0')+' '+money(c):'').filter(Boolean).join('\n')+'\n合计 '+money(totals.reduce((a,b)=>a+b,0));try{await navigator.clipboard.writeText(text);$('message').textContent='汇总已复制。';}catch{prompt('请长按复制汇总',text);}};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:2,records:rows,periods,currentPeriod},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='jianji-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('import').onclick=()=>$('file').click();$('file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>20000000)throw Error();const data=JSON.parse(await file.text());if(data.version===1&&valid(data.records)){if(confirm('恢复备份将替换当前记录，继续？'))commit(data.records);}else if(data.version===2&&valid(data.records)&&Array.isArray(data.periods)&&data.periods.every(p=>p&&typeof p.id==='string'&&valid(p.rows))){if(confirm('恢复备份将替换当前记录和往期记录，继续？')){periods=data.periods;currentPeriod=typeof data.currentPeriod==='string'&&data.currentPeriod?data.currentPeriod:todayId();savePeriods();saveCurrentPeriod();commit(data.records);}}else throw Error();}catch{alert('备份文件无效，请选择本工具导出的 JSON 文件。');}finally{e.target.value='';}};
render();

function payoutFor(number,records){
 const people=new Map();let amount=0;
 records.filter(r=>r.nums.includes(number)).forEach(r=>{const name=r.person||'未填写';const cents=amountFor(r,number);people.set(name,(people.get(name)||0)+cents);amount+=cents;});
 const periodTotal=records.reduce((sum,r)=>sum+rowTotal(r),0);
 return {amount,payout:amount*47,periodTotal,profit:periodTotal-amount*47,people:[...people].sort((a,b)=>b[1]-a[1])};
}
function showPayout(number,scroll=true){
 selectedNumber=number;
 $('payoutHint').classList.add('hidden');$('payoutDetails').classList.remove('hidden');
 document.querySelectorAll('#grid button').forEach(b=>b.classList.toggle('selected',Number(b.dataset.number)===number));
 const result=payoutFor(number,rows);
 $('payoutTitle').textContent=String(number).padStart(2,'0')+' '+animal(number)+' · 赔付明细';
 $('payoutTotal').textContent=money(result.payout);
 $('periodTotal').textContent=money(result.periodTotal);
 $('periodProfit').textContent=result.profit>0?'赢 +'+money(result.profit):result.profit<0?'亏 −'+money(-result.profit):'持平 0.00';
 $('periodProfit').className='payout-total'+(result.profit<0?' loss':result.profit===0?' flat':'');
 $('periodFormula').textContent=money(result.periodTotal)+' − '+money(result.payout)+' = '+money(result.profit); 
 $('payoutSummary').textContent='号码累计 '+money(result.amount)+' × 47 = '+money(result.payout);
 $('payoutPeople').replaceChildren();
 if(!result.people.length){const p=document.createElement('p');p.className='empty';p.textContent='该号码没有记录，赔付为 0。';$('payoutPeople').append(p);}
 result.people.forEach(([name,amount])=>{const row=document.createElement('div');row.className='payout-person';const left=document.createElement('div'),label=document.createElement('span'),sub=document.createElement('small'),total=document.createElement('strong');label.textContent=name;sub.textContent=money(amount)+' × 47';total.textContent=money(amount*47);left.append(label,sub);row.append(left,total);$('payoutPeople').append(row);});
 if(scroll)$('payoutCard').scrollIntoView({behavior:'smooth',block:'start'});
}
$('grid').onclick=e=>{const button=e.target.closest('button[data-number]');if(button)showPayout(Number(button.dataset.number));};


function riskData(records){
 const totals=Array(50).fill(0);records.forEach(r=>r.nums.forEach(n=>totals[n]+=amountFor(r,n)));
 const total=totals.reduce((s,c)=>s+c,0);
 return Array.from({length:49},(_,i)=>({number:i+1,amount:totals[i+1],profit:total-totals[i+1]*47}));
}
function renderRisk(){
 const data=riskData(rows);const losses=data.filter(x=>x.profit<0).length;
 $('riskStats').textContent='本期总金额 '+money(rows.reduce((sum,r)=>sum+rowTotal(r),0))+' · 亏损号码 '+losses+' 个 · 盈利号码 '+data.filter(x=>x.profit>0).length+' 个';
 data.sort((a,b)=>riskDirection*(a[riskSort]-b[riskSort])||a.number-b.number);
 $('riskRows').replaceChildren();data.forEach((r,index)=>{const tr=document.createElement('tr'),number=document.createElement('td'),btn=document.createElement('button');btn.textContent=String(r.number).padStart(2,'0')+' '+animal(r.number);btn.setAttribute('aria-label','查看 '+String(r.number).padStart(2,'0')+' 号风险明细');btn.onclick=()=>showPayout(r.number);number.append(btn);const amount=document.createElement('td');amount.textContent=money(r.amount);const profit=document.createElement('td');profit.textContent=(r.profit>0?'+':'')+money(r.profit);profit.className=r.profit<0?'negative':r.profit>0?'positive':'';const rank=document.createElement('td');rank.textContent=index+1;tr.append(number,amount,profit,rank);$('riskRows').append(tr);});
 ['number','amount','profit'].forEach(key=>{const id={number:'sortNumber',amount:'sortAmount',profit:'sortProfit'}[key];$(id).textContent={number:'号码',amount:'累计金额',profit:'开出后输赢'}[key]+(riskSort===key?(riskDirection===1?' ↑':' ↓'):' ↕');$(id).parentElement.setAttribute('aria-sort',riskSort===key?(riskDirection===1?'ascending':'descending'):'none');});
}
[['sortNumber','number'],['sortAmount','amount'],['sortProfit','profit']].forEach(([id,key])=>$(id).onclick=()=>{if(riskSort===key)riskDirection*=-1;else {riskSort=key;riskDirection=key==='amount'?-1:1;}renderRisk();});
