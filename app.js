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

function printOfferPdf(){
  const o=getOffer();
  const title=`Angebot_A_${o.number}`;
  const base=location.href.replace(/[^\/]*$/, '');
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${base}"><title>${esc(title)}</title><link rel="stylesheet" href="style.css"><style>body{background:white!important;margin:0}.printShell{padding:0;margin:0}.offerPreview{border-radius:0!important}@media print{header,nav,.noPrint,.btn{display:none!important}.printShell{padding:0!important;margin:0!important}.offerPreview{padding:0!important}}</style></head><body><main class="printShell">${offerHtml(o)}</main><script>window.onload=()=>setTimeout(()=>window.print(),250);<\/script></body></html>`;
  const w=window.open('', '_blank');
  if(!w){ alert('Pop-up wurde blockiert. Bitte Pop-ups für diese Seite erlauben.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
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
