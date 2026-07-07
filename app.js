const STORE='bogas_catering_v9';
let state = load();
let page = 'offer';
let currentOfferId = state.offers[0]?.id || null;
function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){ const saved=localStorage.getItem(STORE); let obj=saved?JSON.parse(saved):{data:clone(DEFAULT_DATA), offers:[]}; migrate(obj); return obj; }
function migrate(obj){ (obj.offers||[]).forEach(o=>{ if(!o.priceType)o.priceType='gross'; if(!o.vat)o.vat=7; (o.extras||[]).forEach(e=>{ if(!e.priceType)e.priceType='gross'; if(!e.vat)e.vat=19; }); }); }
function save(){localStorage.setItem(STORE, JSON.stringify(state));}
function euro(n){return (Number(n)||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'});}
function kg(g){ if(g>=1000) return (g/1000).toLocaleString('de-DE',{maximumFractionDigits:2})+' kg'; return Math.round(g)+' g';}
function datePlus14(){let d=new Date(); d.setDate(d.getDate()+14); return d.toLocaleDateString('de-DE');}
function id(){return Math.random().toString(36).slice(2,10)}
function nav(){ const items=[['offer','Angebot'],['work','Arbeitsliste'],['labels','Etiketten'],['articles','Artikel']]; document.getElementById('nav').innerHTML=items.map(i=>`<button class="${page==i[0]?'active':''}" onclick="page='${i[0]}';render()">${i[1]}</button>`).join(''); }
function render(){nav(); ({offer:renderOffer,work:renderWork,labels:renderLabels,articles:renderArticles}[page])();}
function blankOffer(){ const nr = `2026-${state.data.nextOfferNumber}`; state.data.nextOfferNumber++; return {id:id(), number:nr, customer:'', customerStreet:'', customerZipCity:'', eventType:'', cateringMode:'custom', cateringStreet:'', cateringZipCity:'', date:'', foodTime:'', people:50, finalPeople:50, pricePerPerson:39.9, priceType:'gross', vat:7, discount:0, discountType:'net', selected:{}, extras:[], requirements:[], notes:''};}
function getOffer(){ if(!currentOfferId){let o=blankOffer(); state.offers.unshift(o); currentOfferId=o.id; save();} return state.offers.find(o=>o.id===currentOfferId) || state.offers[0];}
function updateOffer(k,v){let o=getOffer(); o[k]=v; if(k==='people'&&!o.finalChanged)o.finalPeople=v; save(); render();}
function selectedCount(o,cat){ return (o.selected[cat.id]||[]).length;}
function toggle(catId,itemId){let o=getOffer(); o.selected[catId]=o.selected[catId]||[]; o.selected[catId]=o.selected[catId].includes(itemId)?o.selected[catId].filter(x=>x!==itemId):[...o.selected[catId],itemId]; save(); render();}
function calc(o,peopleKey='people'){ const people=Number(o[peopleKey])||0; let rows=[]; state.data.categories.forEach(cat=>{ const sel=o.selected[cat.id]||[]; const count=Math.max(1, sel.length); sel.forEach(itemId=>{ const it=cat.items.find(x=>x.id===itemId); if(!it)return; const idx=Math.min(count, (it.rules||[]).length)-1; if(it.type==='components'){(it.components||[]).forEach(c=> rows.push({category:cat.name,item:c.name,detail:it.name,per:c.grams,amount:c.grams*people,unit:'g'}));}
 else if(it.type==='portion'){ const per=Number(it.rules[idx]||0); rows.push({category:cat.name,item:it.name,detail:'',per,amount:per*people,unit:it.unit||'Portionen'});}
 else { const per=Number(it.rules[idx]||0); rows.push({category:cat.name,item:it.name,detail:'',per,amount:per*people,unit:'g'});}
 });}); return rows; }

function priceCalc(amount, vat, type){
  amount = Number(amount)||0; vat = Number(vat)||0;
  if(type==='net') return {net:amount, vat:amount*vat/100, gross:amount*(1+vat/100)};
  const net = vat? amount/(1+vat/100) : amount;
  return {net, vat:amount-net, gross:amount};
}
function offerTotals(o){
  const positions=[];
  const buffetInput=(Number(o.people)||0)*(Number(o.pricePerPerson)||0);
  const b=priceCalc(buffetInput, o.vat||7, o.priceType||'gross');
  positions.push({name:'BBQ Buffet / Catering', qty:Number(o.people)||0, unit:'Personen', inputUnit:Number(o.pricePerPerson)||0, type:o.priceType||'gross', vatRate:Number(o.vat)||0, net:b.net, vat:b.vat, gross:b.gross});
  (o.extras||[]).filter(e=>e.name).forEach(e=>{
    const input=(Number(e.qty)||0)*(Number(e.price)||0);
    const c=priceCalc(input, e.vat||19, e.priceType||'gross');
    positions.push({name:e.name, qty:Number(e.qty)||0, unit:e.unit||'', inputUnit:Number(e.price)||0, type:e.priceType||'gross', vatRate:Number(e.vat)||0, net:c.net, vat:c.vat, gross:c.gross});
  });
  const discount=Number(o.discount)||0;
  if(discount>0){ positions.push({name:'Rabatt', qty:1, inputUnit:-discount, type:o.discountType||'net', vatRate:0, net:-(o.discountType==='gross'?discount:discount), vat:0, gross:-(o.discountType==='gross'?discount:discount)}); }
  const net=positions.reduce((s,p)=>s+p.net,0);
  const gross=positions.reduce((s,p)=>s+p.gross,0);
  const vat=positions.reduce((s,p)=>s+p.vat,0);
  const vat7=positions.filter(p=>Number(p.vatRate)===7).reduce((s,p)=>s+p.vat,0);
  const vat19=positions.filter(p=>Number(p.vatRate)===19).reduce((s,p)=>s+p.vat,0);
  return {positions, buffetNet:b.net, buffetVat:b.vat, buffetGross:b.gross, discount, net, vat, gross, vat7, vat19};
}
function priceTypeSelect(path, value){ return `<select onchange="${path}=this.value;save();render()"><option value="gross" ${value==='gross'?'selected':''}>Brutto</option><option value="net" ${value==='net'?'selected':''}>Netto</option></select>`; }
function vatSelect(path, value){ return `<select onchange="${path}=Number(this.value);save();render()"><option value="7" ${Number(value)===7?'selected':''}>7 %</option><option value="19" ${Number(value)===19?'selected':''}>19 %</option><option value="0" ${Number(value)===0?'selected':''}>0 %</option></select>`; }
function posDisplay(p){ return p.type==='net' ? {unit:p.inputUnit, total:p.net, label:'netto'} : {unit:p.inputUnit, total:p.gross, label:'brutto'}; }

function renderOffer(){ const o=getOffer(); const t=offerTotals(o); document.getElementById('app').innerHTML=`
 <div class="card noPrint"><div class="row"><button class="btn primary" onclick="newOffer()">+ Neues Angebot</button><select onchange="currentOfferId=this.value;render()">${state.offers.map(x=>`<option value="${x.id}" ${x.id==o.id?'selected':''}>${x.number} · ${x.customer||'ohne Name'}</option>`).join('')}</select></div></div>
 <div class="card"><h2>Angebotsdaten</h2><div class="grid two"><div><label>Kundenname</label><input value="${esc(o.customer)}" oninput="quick('customer',this.value)"></div><div><label>Art der Veranstaltung</label><input placeholder="Hochzeit, Geburtstag, Firmenfeier…" value="${esc(o.eventType)}" oninput="quick('eventType',this.value)"></div><div><label>Rechnungsanschrift Straße / Hausnummer</label><input placeholder="Musterstraße 1" value="${esc(o.customerStreet||'')}" oninput="quick('customerStreet',this.value)"></div><div><label>Rechnungsanschrift PLZ / Ort</label><input placeholder="28879 Grasberg" value="${esc(o.customerZipCity||'')}" oninput="quick('customerZipCity',this.value)"></div><div><label>Datum</label><input type="date" value="${o.date||''}" oninput="quick('date',this.value)"></div><div><label>Uhrzeit Essen</label><input type="time" value="${o.foodTime||''}" oninput="quick('foodTime',this.value)"></div></div><label>Personenzahl Angebot</label>${stepper('people',o.people)}</div>
 <div class="card"><h2>Catering-Ort</h2><div class="checkRow"><label><input type="checkbox" ${(o.cateringMode||'custom')==='billing'?'checked':''} onclick="setCateringMode('billing', this.checked)"> Catering bei Rechnungsanschrift</label><label><input type="checkbox" ${(o.cateringMode||'custom')==='house'?'checked':''} onclick="setCateringMode('house', this.checked)"> Catering im Haus</label></div><div id="cateringAddressFields" class="${(o.cateringMode||'custom')==='custom'?'':'hidden'}"><div class="grid two"><div><label>Catering-Adresse Straße / Hausnummer</label><input placeholder="Straße und Hausnummer" value="${esc(o.cateringStreet||'')}" oninput="quick('cateringStreet',this.value)"></div><div><label>Catering-Adresse PLZ / Ort</label><input placeholder="PLZ und Ort" value="${esc(o.cateringZipCity||'')}" oninput="quick('cateringZipCity',this.value)"></div></div></div>${(o.cateringMode||'custom')==='custom'?'':`<p class="muted">${(o.cateringMode||'custom')==='billing'?'Der Catering-Ort ist die Rechnungsanschrift.':'Der Catering-Ort ist bei Boga’s im Haus.'}</p>`}</div>
 <div class="card"><h2>Speisen auswählen</h2>${state.data.categories.map(cat=>`<h3>${cat.name} <span class="pill">${selectedCount(o,cat)} ausgewählt</span></h3><div class="grid two">${cat.items.map(it=>`<button class="itemBtn ${(o.selected[cat.id]||[]).includes(it.id)?'on':''}" onclick="toggle('${cat.id}','${it.id}')">${it.name}</button>`).join('')}</div>`).join('')}</div>
 <div class="card"><h2>Preise</h2>
  <h3>Buffet / Catering</h3>
  <div class="grid four">
    <div><label>Preis pro Person</label><input type="number" step="0.01" value="${o.pricePerPerson}" oninput="quick('pricePerPerson',this.value)"></div>
    <div><label>Preisart</label><select onchange="quick('priceType',this.value);render()"><option value="gross" ${o.priceType==='gross'?'selected':''}>Brutto</option><option value="net" ${o.priceType==='net'?'selected':''}>Netto</option></select></div>
    <div><label>MwSt.</label><select onchange="quick('vat',Number(this.value));render()"><option value="7" ${Number(o.vat)===7?'selected':''}>7 %</option><option value="19" ${Number(o.vat)===19?'selected':''}>19 %</option><option value="0" ${Number(o.vat)===0?'selected':''}>0 %</option></select></div>
    <div><label>Rabatt</label><input type="number" step="0.01" value="${o.discount||0}" oninput="quick('discount',this.value)"></div>
  </div>
  <h3>Zusatzpositionen</h3>
  <table><tr><th>Position</th><th>Menge</th><th>EP</th><th>Preisart</th><th>MwSt.</th><th></th></tr>${(o.extras||[]).map((e,i)=>`<tr><td><input value="${esc(e.name)}" oninput="extra(${i},'name',this.value)"></td><td><input type="number" value="${e.qty}" oninput="extra(${i},'qty',this.value)"></td><td><input type="number" step="0.01" value="${e.price}" oninput="extra(${i},'price',this.value)"></td><td><select onchange="extra(${i},'priceType',this.value);render()"><option value="gross" ${(e.priceType||'gross')==='gross'?'selected':''}>Brutto</option><option value="net" ${e.priceType==='net'?'selected':''}>Netto</option></select></td><td><select onchange="extra(${i},'vat',Number(this.value));render()"><option value="7" ${Number(e.vat||19)===7?'selected':''}>7 %</option><option value="19" ${Number(e.vat||19)===19?'selected':''}>19 %</option><option value="0" ${Number(e.vat||19)===0?'selected':''}>0 %</option></select></td><td><button class="btn danger" onclick="delExtra(${i})">×</button></td></tr>`).join('')}</table>
  <button class="btn light" onclick="addExtra()">+ Zusatzposition</button>
  <div class="row"><span class="pill">Netto: ${euro(t.net)}</span><span class="pill">MwSt. 7%: ${euro(t.vat7)}</span><span class="pill">MwSt. 19%: ${euro(t.vat19)}</span><span class="pill">Brutto: ${euro(t.gross)}</span></div>
  <p class="muted small">Du kannst pro Position wählen, ob dein eingegebener Preis netto oder brutto gemeint ist. Das Angebot rechnet automatisch um.</p>
 </div>
 <div class="card"><h2>Was benötigen wir vor Ort?</h2>${state.data.requirements.map(r=>`<label><input style="width:auto" type="checkbox" ${o.requirements.includes(r)?'checked':''} onchange="req('${escAttr(r)}',this.checked)"> ${r}</label>`).join('')}</div>
 <div class="card"><h2>PDF-Angebot</h2><div class="row noPrint"><button class="btn green" onclick="printOfferPdf()">PDF-Angebot generieren</button></div>${offerHtml(o)}</div>`; }
function stepper(key,val){return `<div class="stepper"><button class="btn light" onclick="setNum('${key}',-1)">−</button><div class="numberBox">${val}</div><button class="btn light" onclick="setNum('${key}',1)">+</button></div><input type="number" value="${val}" oninput="quick('${key}',this.value)" style="margin-top:8px">`}
function quick(k,v){let o=getOffer(); o[k]=['people','finalPeople'].includes(k)?Math.max(0,parseInt(v||0)):v; if(k==='finalPeople')o.finalChanged=true; save();}
function setCateringMode(mode, checked=true){
  const o=getOffer();
  o.cateringMode = checked ? (mode || 'custom') : 'custom';
  if(o.cateringMode !== 'custom'){
    o.cateringStreet = '';
    o.cateringZipCity = '';
  }
  save();
  render();
}
function setNum(k,d){let o=getOffer(); o[k]=Math.max(0,(parseInt(o[k])||0)+d); if(k==='finalPeople')o.finalChanged=true; save(); render();}
function newOffer(){let o=blankOffer(); state.offers.unshift(o); currentOfferId=o.id; save(); render();}
function addExtra(){let o=getOffer(); o.extras=o.extras||[]; o.extras.push({name:'',qty:1,price:0,priceType:'gross',vat:19}); save(); render();}
function extra(i,k,v){let o=getOffer(); o.extras[i][k]=['name','priceType','unit'].includes(k)?v:Number(v); save();}
function delExtra(i){let o=getOffer(); o.extras.splice(i,1); save(); render();}
function req(r,on){let o=getOffer(); o.requirements=on?[...new Set([...o.requirements,r])]:o.requirements.filter(x=>x!==r); save(); render();}
function offerHtml(o){
 const t=offerTotals(o);
 const heute=new Date().toLocaleDateString('de-DE');
 const billingAddress=[o.customerStreet,o.customerZipCity].filter(Boolean).map(esc).join('<br>') || 'Deutschland';
 const cateringAddress = (o.cateringMode==='billing') ? 'Catering bei Rechnungsanschrift' : (o.cateringMode==='house') ? 'Catering im Haus' : [o.cateringStreet,o.cateringZipCity].filter(Boolean).map(esc).join('<br>');
 const foodBlocks=state.data.categories.map(cat=>{
  const sel=o.selected[cat.id]||[]; if(!sel.length)return '';
  const lis=sel.map(id=>cat.items.find(x=>x.id===id)?.name).filter(Boolean).map(n=>`<li>${esc(n)}</li>`).join('');
  return `<div class="foodBlock"><b>${cat.name}</b><ul>${lis}</ul></div>`;
 }).join('');
 const extras=(o.extras||[]).filter(e=>e.name);
 const req=o.requirements||[];
 return `<div class="offerPreview oldOffer">
  <div class="letterLogo"><img src="${window.BOGAS_LOGO}" alt="Boga's Meetbar"></div>
  <div class="letterTop">
    <div class="recipient">
      <div class="senderLine">Boga's MEETBAR · Neu - Dannenberger Str 30 · 28879 Grasberg</div>
      <p>${esc(o.customer)||'Kunde'}<br>${billingAddress}</p>
    </div>
    <div class="metaBox">
      <table>
        <tr><td>Angebots-Nr.</td><td><b>A ${esc(o.number)}</b></td></tr>
        <tr><td>Datum</td><td>${heute}</td></tr>
        <tr><td>Catering-Ort</td><td>${cateringAddress||'-'}</td></tr>
        <tr><td>Ihr Ansprechpartner</td><td>Nicole Boga</td></tr>
      </table>
    </div>
  </div>
  <h1>Angebot A ${esc(o.number)}${o.eventType?' - '+esc(o.eventType):''}</h1>
  <p>Sehr geehrte Damen und Herren,</p>
  <p>vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte freibleibende Angebot:</p>
  <p class="eventLine"><b>Veranstaltungsdatum:</b> ${fmtDate(o.date)}${o.foodTime?' · Essen um '+esc(o.foodTime)+' Uhr':''}<br><b>Catering-Ort:</b> ${cateringAddress||'-'}</p>
  <table class="offerTable">
    <thead><tr><th>Pos.</th><th>Beschreibung</th><th>Menge</th><th>Einzelpreis</th><th>Gesamtpreis</th></tr></thead>
    <tbody>
      <tr>
        <td>1.</td>
        <td><b>BBQ Buffet / Catering</b>${foodBlocks||'<br><span class="muted">Speisen noch nicht ausgewählt</span>'}</td>
        <td>${Number(o.people||0).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})}<br>Personen</td>
        <td>${euro(o.pricePerPerson)}<br><span class="mini">${(o.priceType||'gross')==='gross'?'brutto':'netto'} · ${o.vat}%</span></td>
        <td>${euro((o.priceType||'gross')==='gross'?t.buffetGross:t.buffetNet)}<br><span class="mini">${(o.priceType||'gross')==='gross'?'brutto':'netto'}</span></td>
      </tr>
      ${extras.map((e,i)=>{ const pc=priceCalc((Number(e.qty)||0)*(Number(e.price)||0), e.vat||19, e.priceType||'gross'); const total=(e.priceType||'gross')==='gross'?pc.gross:pc.net; return `<tr><td>${i+2}.</td><td><b>${esc(e.name)}</b></td><td>${Number(e.qty||0).toLocaleString('de-DE')}</td><td>${euro(e.price)}<br><span class="mini">${(e.priceType||'gross')==='gross'?'brutto':'netto'} · ${e.vat||19}%</span></td><td>${euro(total)}<br><span class="mini">${(e.priceType||'gross')==='gross'?'brutto':'netto'}</span></td></tr>`}).join('')}
      ${req.length?`<tr><td>${extras.length+2}.</td><td><b>Was wir vor Ort benötigen</b><ul>${req.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></td><td>1,00 Stk</td><td>0,00 EUR</td><td>0,00 EUR</td></tr>`:''}
      <tr><td>${extras.length+(req.length?3:2)}.</td><td><b>Stornierung</b><br>Bitte beachten Sie folgende Kosten bei Stornierung.<br>bis 60 Tage vor Veranstaltungstermin 30%,<br>bis 30 Tage vor Veranstaltungstermin 60%,<br>bis 10 Tage vor Veranstaltungstermin 90%,<br>danach 100% des Rechnungsbetrages.</td><td>1,00</td><td>0,00 EUR</td><td>0,00 EUR</td></tr>
    </tbody>
  </table>
  <table class="sumTable">
    <tr><td>Gesamtbetrag netto</td><td>${euro(t.net)}</td></tr>
    <tr><td>Umsatzsteuer 7%</td><td>${euro(t.vat7)}</td></tr>
    <tr><td>Umsatzsteuer 19%</td><td>${euro(t.vat19)}</td></tr>
    <tr class="bold"><td>Gesamtbetrag brutto</td><td>${euro(t.gross)}</td></tr>
  </table>
  <div class="closing">
    <p>Das Angebot ist bis zum ${datePlus14()} gültig.</p>
    <p>Bitte vergessen Sie nicht Ihre Dienstleister, wie zum Beispiel DJ, Fotograf und weitere. Unsere Mitarbeiter planen wir, für Sie kostenlos, mit ein.</p>
    <p>Unsere Rechnung können Sie zum Teil unter Haushaltsnahe Dienstleistungen in der Steuererklärung absetzen, da wir alles für Sie vor Ort zubereiten.</p>
    <p>Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.<br>Wir bedanken uns sehr für Ihr Vertrauen.</p>
    <p>Mit freundlichen Grüßen<br>Nicole Boga</p>
  </div>
  <div class="letterFooter">
    <div><b>Boga's MEETBAR</b><br>Neu - Dannenberger Str 30<br>28879 Grasberg<br>Deutschland</div>
    <div>Tel. +49 15120433597<br>E-Mail meet@bogas-meetbar.de<br>Web www.bogas-meetbar.de</div>
    <div>USt.-ID DE356166658<br>Steuer-Nr. 36/105/04694<br>Geschäftsführung Nicole Boga</div>
    <div>Bank Finom<br>IBAN DE49100180000995185120<br>BIC FNOMDEB2</div>
  </div>
 </div>`;
}

function getCateringAddress(o){
  if(!o) return '-';
  if((o.cateringMode||'custom')==='billing'){
    return [o.customerStreet,o.customerZipCity].filter(Boolean).join(', ') || 'Catering bei Rechnungsanschrift';
  }
  if((o.cateringMode||'custom')==='house'){
    return "Catering im Haus";
  }
  return [o.cateringStreet,o.cateringZipCity].filter(Boolean).join(', ') || '-';
}

function printOfferPdf(){
  try{
    const o=getOffer();
    const bytes = buildOfferPdf(o);
    const blob = new Blob([bytes],{type:'application/pdf'});
    const url = URL.createObjectURL(blob);
    const fileName = `Angebot_A_${o.number}.pdf`;
    const a=document.createElement('a');
    a.href=url;
    a.download=fileName;
    a.target='_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // iPhone/Safari ignoriert manchmal download=. Dann öffnen wir die PDF zusätzlich direkt.
    setTimeout(()=>{
      if(/iPhone|iPad|iPod|Safari/i.test(navigator.userAgent)){
        window.open(url,'_blank');
      }
    },150);
    setTimeout(()=>URL.revokeObjectURL(url),15000);
  }catch(err){
    console.error(err);
    alert('PDF konnte nicht erzeugt werden: '+(err && err.message ? err.message : err));
  }
}

function pdfHex(str){
  str=String(str??'');
  let hex='FEFF';
  for(let i=0;i<str.length;i++){ const c=str.charCodeAt(i); hex += ('0000'+c.toString(16).toUpperCase()).slice(-4); }
  return '<'+hex+'>';
}
function pdfMoney(n){ return (Number(n)||0).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' EUR'; }
function pdfNum(n){ return (Number(n)||0).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function pdfEscapeContent(s){ return String(s).replace(/[\\()]/g,'\\$&'); }
function wrapPdfText(text, maxChars){
  const out=[];
  String(text||'').split(/\n/).forEach(par=>{
    let words=par.split(/\s+/).filter(Boolean), line='';
    if(!words.length){ out.push(''); return; }
    words.forEach(w=>{ if((line+' '+w).trim().length>maxChars){ out.push(line); line=w; } else line=(line+' '+w).trim(); });
    if(line) out.push(line);
  });
  return out;
}
function buildOfferPdf(o){
  const W=595, H=842, M=50, bottom=90;
  const t=offerTotals(o);
  const cateringAddress=getCateringAddress(o);
  const requirements=(o.requirements||[]).map(r=>{ if(typeof r==='string') return r; const found=state.data.requirements.find(x=>x.id===r); return found?.label || found || ''; }).filter(Boolean);
  let pages=[], ops=[], y=H-44, pageNo=1;
  function op(s){ops.push(s)}
  function text(x, yy, str, size=10, font='F1'){
    op(`BT /${font} ${size} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td ${pdfHex(str)} Tj ET`);
  }
  function line(x1,y1,x2,y2){op(`${x1} ${y1} m ${x2} ${y2} l S`)}
  function rect(x,y,w,h,fill=false){op(`${x} ${y} ${w} ${h} re ${fill?'f':'S'}`)}
  function grey(v){op(`${v} g`)}
  function black(){op('0 g')}
  function newPage(){ if(ops.length) finishPage(); ops=[]; y=H-44; drawHeader(); }
  function finishPage(){ drawFooter(); pages.push(ops.join('\n')); pageNo++; }
  function ensure(h){ if(y-h<bottom){ finishPage(); ops=[]; y=H-44; drawHeader(true); } }
  function drawHeader(repeat=false){
    text(235,H-54,"Boga's",34,'F2');
    text(247,H-80,'- MEETBAR -',18,'F1');
    line(50,H-100,545,H-100);
    y=H-128;
    if(repeat){
      grey(0.92); rect(50,y-18,495,24,true); black();
      text(55,y-10,'Pos.',10,'F2'); text(95,y-10,'Beschreibung',10,'F2'); text(350,y-10,'Menge',10,'F2'); text(425,y-10,'Einzelpreis',10,'F2'); text(505,y-10,'Gesamtpreis',10,'F2');
      y-=34;
    }
  }
  function drawFooter(){
    const fy=38;
    grey(0.75); line(50,fy+42,545,fy+42); black();
    text(50,fy+28,"Boga's MEETBAR",7,'F2'); text(50,fy+17,'Neu - Dannenberger Str 30',7); text(50,fy+7,'28879 Grasberg · Deutschland',7);
    text(185,fy+28,'Tel. +49 15120433597',7); text(185,fy+17,'meet@bogas-meetbar.de',7); text(185,fy+7,'www.bogas-meetbar.de',7);
    text(325,fy+28,'USt.-ID DE356166658',7); text(325,fy+17,'Steuer-Nr. 36/105/04694',7); text(325,fy+7,'Geschäftsführung Nicole Boga',7);
    text(455,fy+28,'Bank Finom',7); text(455,fy+17,'IBAN DE49100180000995185120',7); text(455,fy+7,'BIC FNOMDEB2',7);
    text(522,fy+52, String(pageNo), 8);
  }
  function para(str, size=10, gap=14, x=M, max=92){
    const lines=wrapPdfText(str,max); ensure(lines.length*gap+4); lines.forEach(l=>{text(x,y,l,size); y-=gap;}); y-=4;
  }
  function row(pos, descLines, qtyLines, epLines, totalLines){
    const desc=descLines.flatMap(x=>wrapPdfText(x,42));
    const h=Math.max(desc.length, qtyLines.length, epLines.length, totalLines.length)*13+12;
    ensure(h);
    text(55,y,pos,10); text(95,y,desc[0]||'',10,'F2');
    for(let i=1;i<desc.length;i++) text(95,y-i*13,desc[i],9);
    qtyLines.forEach((l,i)=>text(350,y-i*13,l,9));
    epLines.forEach((l,i)=>text(425,y-i*13,l,9));
    totalLines.forEach((l,i)=>text(505,y-i*13,l,9));
    y-=h;
  }
  function foodLines(){
    const lines=[];
    state.data.categories.forEach(cat=>{
      const sel=o.selected[cat.id]||[]; if(!sel.length) return;
      lines.push(cat.name);
      sel.forEach(id=>{ const it=cat.items.find(x=>x.id===id); if(it) lines.push('• '+it.name); });
      lines.push('');
    });
    return lines.length?lines:['Speisen noch nicht ausgewählt'];
  }

  newPage();
  text(50,y,"Boga's MEETBAR · Neu - Dannenberger Str 30 · 28879 Grasberg",8,'F2');
  y-=45;
  (o.customer?[o.customer,o.customerStreet,o.customerZipCity].filter(Boolean):['']).forEach(l=>{text(50,y,l,13); y-=17;});
  const metaY=H-150;
  text(355,metaY,'Angebots-Nr.',12); text(465,metaY,'A '+o.number,12,'F2');
  text(355,metaY-26,'Datum',12); text(465,metaY-26,new Date().toLocaleDateString('de-DE'),12);
  text(355,metaY-52,'Catering-Ort',12); wrapPdfText(cateringAddress||'-',18).slice(0,2).forEach((l,i)=>text(465,metaY-52-i*14,l,10));
  text(355,metaY-86,'Ihr Ansprechpartner',12); text(465,metaY-86,'Nicole Boga',12);
  y=H-330;
  text(50,y,`Angebot A ${o.number}${o.eventType?' - '+o.eventType:''}`,17,'F2'); y-=42;
  para('Sehr geehrte Damen und Herren,',11,15,50,92);
  para('vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte freibleibende Angebot:',11,15,50,92);
  grey(0.94); rect(50,y-30,495,38,true); black();
  text(60,y-12,'Veranstaltungsdatum:',10,'F2'); text(190,y-12,`${fmtDate(o.date)}${o.foodTime?' · Essen um '+o.foodTime+' Uhr':''}`,10);
  text(60,y-26,'Catering-Ort:',10,'F2'); text(190,y-26,cateringAddress||'-',10); y-=58;
  grey(0.9); rect(50,y-18,495,24,true); black();
  text(55,y-10,'Pos.',10,'F2'); text(95,y-10,'Beschreibung',10,'F2'); text(350,y-10,'Menge',10,'F2'); text(425,y-10,'Einzelpreis',10,'F2'); text(505,y-10,'Gesamtpreis',10,'F2');
  y-=34;
  row('1.', ['BBQ Buffet / Catering', ...foodLines()], [pdfNum(o.people),'Personen'], [pdfMoney(o.pricePerPerson), `${(o.priceType||'gross')==='gross'?'brutto':'netto'} · ${o.vat}%`], [pdfMoney((o.priceType||'gross')==='gross'?t.buffetGross:t.buffetNet), (o.priceType||'gross')==='gross'?'brutto':'netto']);
  let pos=2;
  (o.extras||[]).filter(e=>e.name).forEach(e=>{
    const pc=priceCalc((Number(e.qty)||0)*(Number(e.price)||0), e.vat||19, e.priceType||'gross');
    const total=(e.priceType||'gross')==='gross'?pc.gross:pc.net;
    row(String(pos++)+'.', [e.name], [String(e.qty||0), e.unit||''], [pdfMoney(e.price), `${(e.priceType||'gross')==='gross'?'brutto':'netto'} · ${e.vat||19}%`], [pdfMoney(total), (e.priceType||'gross')==='gross'?'brutto':'netto']);
  });
  if(requirements.length){ row(String(pos++)+'.', ['Was wir vor Ort benötigen', ...requirements.map(r=>'• '+r)], ['1,00 Stk'], ['0,00 EUR'], ['0,00 EUR']); }
  row(String(pos++)+'.', ['Stornierung','Bitte beachten Sie folgende Kosten bei Stornierung.','bis 60 Tage vor Veranstaltungstermin 30%,','bis 30 Tage vor Veranstaltungstermin 60%,','bis 10 Tage vor Veranstaltungstermin 90%,','danach 100% des Rechnungsbetrages.'], ['1,00'], ['0,00 EUR'], ['0,00 EUR']);
  ensure(105);
  const sx=300, sw=245; grey(0.92); rect(sx,y-18,sw,24,true); black(); text(sx+10,y-10,'Gesamtbetrag netto',10,'F2'); text(485,y-10,pdfMoney(t.net),10,'F2'); y-=27;
  text(sx+10,y,'Umsatzsteuer 7%',10); text(485,y,pdfMoney(t.vat7),10); y-=24;
  text(sx+10,y,'Umsatzsteuer 19%',10); text(485,y,pdfMoney(t.vat19),10); y-=24;
  grey(0.92); rect(sx,y-10,sw,24,true); black(); text(sx+10,y-2,'Gesamtbetrag brutto',10,'F2'); text(485,y-2,pdfMoney(t.gross),10,'F2'); y-=46;
  para(`Das Angebot ist bis zum ${datePlus14()} gültig.`,10,13,50,96);
  para('Bitte vergessen Sie nicht Ihre Dienstleister, wie zum Beispiel DJ, Fotograf und weitere. Unsere Mitarbeiter planen wir, für Sie kostenlos, mit ein.',10,13,50,96);
  para('Unsere Rechnung können Sie zum Teil unter Haushaltsnahe Dienstleistungen in der Steuererklärung absetzen, da wir alles für Sie vor Ort zubereiten.',10,13,50,96);
  para('Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.\nWir bedanken uns sehr für Ihr Vertrauen.',10,13,50,96);
  para('Mit freundlichen Grüßen\nNicole Boga',10,13,50,96);
  finishPage();

  const enc = new TextEncoder();
  const objects=[];
  function add(obj){objects.push(obj); return objects.length;}
  const font1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const font2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds=[];
  pages.forEach(content=>{
    const stream=`<< /Length ${enc.encode(content).length} >>\nstream\n${content}\nendstream`;
    const contentId=add(stream);
    const pageId=add(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  const pagesId=add(`<< /Type /Pages /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] /Count ${pageIds.length} >>`);
  // patch parent refs
  objects.forEach((obj,i)=>{ if(String(obj).includes('/Parent 0 0 R')) objects[i]=String(obj).replace('/Parent 0 0 R',`/Parent ${pagesId} 0 R`); });
  const catalogId=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let pdf='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', offsets=[0];
  objects.forEach((obj,i)=>{ offsets[i+1]=enc.encode(pdf).length; pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`; });
  const xref=enc.encode(pdf).length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<=objects.length;i++) pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return enc.encode(pdf);
}

function renderWork(){ const o=getOffer(); const rows=calc(o,'finalPeople'); document.getElementById('app').innerHTML=`<div class="card"><h2>Arbeitsliste aus Angebot ${o.number}</h2><p class="muted">Hier kann die Personenzahl nach Zusage nochmal angepasst werden. Küche und Etiketten rechnen mit dieser finalen Zahl.</p><label>Finale Personenzahl</label>${stepper('finalPeople',o.finalPeople)}<div class="row noPrint"><button class="btn green" onclick="downloadCsv()">CSV herunterladen</button><button class="btn" onclick="window.print()">PDF/Drucken</button></div></div><div class="card"><h2>Küchenliste · ${esc(o.customer)}</h2><table><tr><th>Kategorie</th><th>Komponente</th><th>Pro Person</th><th>Menge</th></tr>${rows.map(r=>`<tr><td>${r.category}</td><td>${r.item}</td><td>${r.per} ${r.unit==='g'?'g':r.unit}</td><td><b>${r.unit==='g'?kg(r.amount):Math.ceil(r.amount)+' '+r.unit}</b></td></tr>`).join('')}</table></div>`;}
function renderLabels(){ const o=getOffer(); const rows=calc(o,'finalPeople'); document.getElementById('app').innerHTML=`<div class="card noPrint"><h2>Produktionsetiketten</h2><button class="btn green" onclick="window.print()">Etiketten als PDF drucken</button></div><div class="labelGrid">${rows.map(r=>`<div class="prodLabel"><b>${esc(o.customer)||'Kunde'}</b><br><span class="small">${esc(o.eventType)} · ${fmtDate(o.date)} · ${o.finalPeople} Personen</span><hr><b>${r.item}</b><br>${r.detail?`<span class="small">${r.detail}</span><br>`:''}<div style="font-size:24px;font-weight:900;margin-top:8px">${r.unit==='g'?kg(r.amount):Math.ceil(r.amount)+' '+r.unit}</div><span class="small">${r.category}</span></div>`).join('')}</div>`;}
function renderArticles(){ document.getElementById('app').innerHTML=`<div class="card"><h2>Artikelverwaltung</h2><p class="muted">Änderungen werden auf diesem Gerät gespeichert. Danach kannst du die Konfiguration exportieren und auf anderen Geräten importieren.</p><div class="row"><button class="btn light" onclick="exportConfig()">Konfiguration exportieren</button><label class="btn light">Importieren<input type="file" accept="application/json" class="hidden" onchange="importConfig(this.files[0])"></label><button class="btn danger" onclick="resetConfig()">Zurücksetzen</button></div></div>${state.data.categories.map(cat=>`<div class="card"><h2>${cat.name}</h2><table><tr><th>Name</th><th>Regeln</th><th></th></tr>${cat.items.map((it,i)=>`<tr><td><input value="${esc(it.name)}" oninput="editItem('${cat.id}',${i},'name',this.value)"></td><td><input value="${(it.rules||[]).join(',')}" oninput="editRules('${cat.id}',${i},this.value)"><div class="small muted">Gramm/Portion bei 1,2,3... ausgewählten Artikeln</div></td><td><button class="btn danger" onclick="deleteItem('${cat.id}',${i})">×</button></td></tr>`).join('')}</table><h3>Neuer Artikel</h3><div class="grid two"><input id="new-${cat.id}" placeholder="Name"><input id="rules-${cat.id}" placeholder="z.B. 360,180,120"></div><button class="btn green" onclick="addItem('${cat.id}')">+ Artikel hinzufügen</button></div>`).join('')}`;}
function addItem(catId){const cat=state.data.categories.find(c=>c.id===catId); const name=document.getElementById('new-'+catId).value.trim(); const rules=document.getElementById('rules-'+catId).value.split(',').map(x=>Number(x.trim())).filter(x=>!isNaN(x)); if(!name||!rules.length){alert('Bitte Name und Regeln eintragen.');return;} cat.items.push({id:id(), name, type:'simple', priceMode:'included', rules}); save(); render();}
function editItem(catId,i,k,v){state.data.categories.find(c=>c.id===catId).items[i][k]=v; save();}
function editRules(catId,i,v){const arr=v.split(',').map(x=>Number(x.trim())).filter(x=>!isNaN(x)); state.data.categories.find(c=>c.id===catId).items[i].rules=arr; save();}
function deleteItem(catId,i){if(confirm('Artikel löschen?')){state.data.categories.find(c=>c.id===catId).items.splice(i,1); save(); render();}}
function exportConfig(){download('bogas-konfiguration.json', JSON.stringify(state.data,null,2),'application/json');}
function importConfig(file){if(!file)return; const r=new FileReader(); r.onload=()=>{state.data=JSON.parse(r.result); save(); render();}; r.readAsText(file);}
function resetConfig(){if(confirm('Alle Artikel auf Standard zurücksetzen?')){state.data=clone(DEFAULT_DATA); save(); render();}}
function downloadCsv(){const o=getOffer(); const rows=calc(o,'finalPeople'); const csv=['Kategorie;Komponente;Pro Person;Menge'].concat(rows.map(r=>`${r.category};${r.item};${r.per} ${r.unit==='g'?'g':r.unit};${r.unit==='g'?kg(r.amount):Math.ceil(r.amount)+' '+r.unit}`)).join('\n'); download(`Kuechenliste_${o.number}.csv`,csv,'text/csv');}
function download(name,text,type){const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function fmtDate(d){return d?new Date(d+'T00:00:00').toLocaleDateString('de-DE'):'-'}
function esc(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function escAttr(s){return esc(s).replace(/'/g,'&#39;')}
render();
