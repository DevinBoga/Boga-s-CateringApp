const STORE='bogas_catering_v7';
let state = load();
let page = 'offer';
let currentOfferId = state.offers[0]?.id || null;
function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){ const saved=localStorage.getItem(STORE); if(saved) return JSON.parse(saved); return {data:clone(DEFAULT_DATA), offers:[]}; }
function save(){localStorage.setItem(STORE, JSON.stringify(state));}
function euro(n){return (Number(n)||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'});}
function kg(g){ if(g>=1000) return (g/1000).toLocaleString('de-DE',{maximumFractionDigits:2})+' kg'; return Math.round(g)+' g';}
function datePlus14(){let d=new Date(); d.setDate(d.getDate()+14); return d.toLocaleDateString('de-DE');}
function id(){return Math.random().toString(36).slice(2,10)}
function nav(){ const items=[['offer','Angebot'],['work','Arbeitsliste'],['labels','Etiketten'],['articles','Artikel']]; document.getElementById('nav').innerHTML=items.map(i=>`<button class="${page==i[0]?'active':''}" onclick="page='${i[0]}';render()">${i[1]}</button>`).join(''); }
function render(){nav(); ({offer:renderOffer,work:renderWork,labels:renderLabels,articles:renderArticles}[page])();}
function blankOffer(){ const nr = `2026-${state.data.nextOfferNumber}`; state.data.nextOfferNumber++; return {id:id(), number:nr, customer:'', eventType:'', date:'', foodTime:'', people:50, finalPeople:50, pricePerPerson:39.9, vat:19, discount:0, selected:{}, extras:[], requirements:[], notes:''};}
function getOffer(){ if(!currentOfferId){let o=blankOffer(); state.offers.unshift(o); currentOfferId=o.id; save();} return state.offers.find(o=>o.id===currentOfferId) || state.offers[0];}
function updateOffer(k,v){let o=getOffer(); o[k]=v; if(k==='people'&&!o.finalChanged)o.finalPeople=v; save(); render();}
function selectedCount(o,cat){ return (o.selected[cat.id]||[]).length;}
function toggle(catId,itemId){let o=getOffer(); o.selected[catId]=o.selected[catId]||[]; o.selected[catId]=o.selected[catId].includes(itemId)?o.selected[catId].filter(x=>x!==itemId):[...o.selected[catId],itemId]; save(); render();}
function calc(o,peopleKey='people'){ const people=Number(o[peopleKey])||0; let rows=[]; state.data.categories.forEach(cat=>{ const sel=o.selected[cat.id]||[]; const count=Math.max(1, sel.length); sel.forEach(itemId=>{ const it=cat.items.find(x=>x.id===itemId); if(!it)return; const idx=Math.min(count, (it.rules||[]).length)-1; if(it.type==='components'){(it.components||[]).forEach(c=> rows.push({category:cat.name,item:c.name,detail:it.name,per:c.grams,amount:c.grams*people,unit:'g'}));}
 else if(it.type==='portion'){ const per=Number(it.rules[idx]||0); rows.push({category:cat.name,item:it.name,detail:'',per,amount:per*people,unit:it.unit||'Portionen'});}
 else { const per=Number(it.rules[idx]||0); rows.push({category:cat.name,item:it.name,detail:'',per,amount:per*people,unit:'g'});}
 });}); return rows; }
function offerTotals(o){ const buffet=(Number(o.people)||0)*(Number(o.pricePerPerson)||0); const extras=(o.extras||[]).reduce((s,e)=>s+(Number(e.qty)||0)*(Number(e.price)||0),0); const discount=Number(o.discount)||0; const net=buffet+extras-discount; const vat=net*(Number(o.vat)||0)/100; return {buffet,extras,discount,net,vat,gross:net+vat};}
function renderOffer(){ const o=getOffer(); const t=offerTotals(o); document.getElementById('app').innerHTML=`
 <div class="card noPrint"><div class="row"><button class="btn primary" onclick="newOffer()">+ Neues Angebot</button><select onchange="currentOfferId=this.value;render()">${state.offers.map(x=>`<option value="${x.id}" ${x.id==o.id?'selected':''}>${x.number} · ${x.customer||'ohne Name'}</option>`).join('')}</select></div></div>
 <div class="card"><h2>Angebotsdaten</h2><div class="grid two"><div><label>Kundenname</label><input value="${esc(o.customer)}" oninput="quick('customer',this.value)"></div><div><label>Art der Veranstaltung</label><input placeholder="Hochzeit, Geburtstag, Firmenfeier…" value="${esc(o.eventType)}" oninput="quick('eventType',this.value)"></div><div><label>Datum</label><input type="date" value="${o.date||''}" oninput="quick('date',this.value)"></div><div><label>Uhrzeit Essen</label><input type="time" value="${o.foodTime||''}" oninput="quick('foodTime',this.value)"></div></div><label>Personenzahl Angebot</label>${stepper('people',o.people)}</div>
 <div class="card"><h2>Speisen auswählen</h2>${state.data.categories.map(cat=>`<h3>${cat.name} <span class="pill">${selectedCount(o,cat)} ausgewählt</span></h3><div class="grid two">${cat.items.map(it=>`<button class="itemBtn ${(o.selected[cat.id]||[]).includes(it.id)?'on':''}" onclick="toggle('${cat.id}','${it.id}')">${it.name}</button>`).join('')}</div>`).join('')}</div>
 <div class="card"><h2>Preise</h2><div class="grid two"><div><label>Preis pro Person netto</label><input type="number" step="0.01" value="${o.pricePerPerson}" oninput="quick('pricePerPerson',this.value)"></div><div><label>MwSt. %</label><input type="number" step="1" value="${o.vat}" oninput="quick('vat',this.value)"></div><div><label>Rabatt netto</label><input type="number" step="0.01" value="${o.discount||0}" oninput="quick('discount',this.value)"></div></div><h3>Zusatzpositionen</h3><table><tr><th>Position</th><th>Menge</th><th>EP netto</th><th></th></tr>${(o.extras||[]).map((e,i)=>`<tr><td><input value="${esc(e.name)}" oninput="extra(${i},'name',this.value)"></td><td><input type="number" value="${e.qty}" oninput="extra(${i},'qty',this.value)"></td><td><input type="number" step="0.01" value="${e.price}" oninput="extra(${i},'price',this.value)"></td><td><button class="btn danger" onclick="delExtra(${i})">×</button></td></tr>`).join('')}</table><button class="btn light" onclick="addExtra()">+ Zusatzposition</button><div class="row"><span class="pill">Netto: ${euro(t.net)}</span><span class="pill">MwSt.: ${euro(t.vat)}</span><span class="pill">Brutto: ${euro(t.gross)}</span></div></div>
 <div class="card"><h2>Was benötigen wir vor Ort?</h2>${state.data.requirements.map(r=>`<label><input style="width:auto" type="checkbox" ${o.requirements.includes(r)?'checked':''} onchange="req('${escAttr(r)}',this.checked)"> ${r}</label>`).join('')}</div>
 <div class="card"><h2>PDF-Angebot</h2><div class="row noPrint"><button class="btn green" onclick="window.print()">PDF drucken/speichern</button></div>${offerHtml(o)}</div>`; }
function stepper(key,val){return `<div class="stepper"><button class="btn light" onclick="setNum('${key}',-1)">−</button><div class="numberBox">${val}</div><button class="btn light" onclick="setNum('${key}',1)">+</button></div><input type="number" value="${val}" oninput="quick('${key}',this.value)" style="margin-top:8px">`}
function quick(k,v){let o=getOffer(); o[k]=['people','finalPeople'].includes(k)?Math.max(0,parseInt(v||0)):v; if(k==='finalPeople')o.finalChanged=true; save();}
function setNum(k,d){let o=getOffer(); o[k]=Math.max(0,(parseInt(o[k])||0)+d); if(k==='finalPeople')o.finalChanged=true; save(); render();}
function newOffer(){let o=blankOffer(); state.offers.unshift(o); currentOfferId=o.id; save(); render();}
function addExtra(){let o=getOffer(); o.extras=o.extras||[]; o.extras.push({name:'',qty:1,price:0}); save(); render();}
function extra(i,k,v){let o=getOffer(); o.extras[i][k]=k==='name'?v:Number(v); save();}
function delExtra(i){let o=getOffer(); o.extras.splice(i,1); save(); render();}
function req(r,on){let o=getOffer(); o.requirements=on?[...new Set([...o.requirements,r])]:o.requirements.filter(x=>x!==r); save(); render();}
function offerHtml(o){
 const t=offerTotals(o);
 const heute=new Date().toLocaleDateString('de-DE');
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
      <p>${esc(o.customer)||'Kunde'}<br>Deutschland</p>
    </div>
    <div class="metaBox">
      <table>
        <tr><td>Angebots-Nr.</td><td><b>A ${esc(o.number)}</b></td></tr>
        <tr><td>Datum</td><td>${heute}</td></tr>
        <tr><td>Ihr Ansprechpartner</td><td>Nicole Boga</td></tr>
      </table>
    </div>
  </div>
  <h1>Angebot A ${esc(o.number)}${o.eventType?' - '+esc(o.eventType):''}</h1>
  <p>Sehr geehrte Damen und Herren,</p>
  <p>vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte freibleibende Angebot:</p>
  <table class="offerTable">
    <thead><tr><th>Pos.</th><th>Beschreibung</th><th>Menge</th><th>Einzelpreis</th><th>Gesamtpreis</th></tr></thead>
    <tbody>
      <tr>
        <td>1.</td>
        <td><b>BBQ Buffet / Catering</b>${foodBlocks||'<br><span class="muted">Speisen noch nicht ausgewählt</span>'}</td>
        <td>${Number(o.people||0).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})}<br>Personen</td>
        <td>${euro(o.pricePerPerson)}</td>
        <td>${euro(t.buffet)}</td>
      </tr>
      ${extras.map((e,i)=>`<tr><td>${i+2}.</td><td><b>${esc(e.name)}</b></td><td>${Number(e.qty||0).toLocaleString('de-DE')}</td><td>${euro(e.price)}</td><td>${euro((e.qty||0)*(e.price||0))}</td></tr>`).join('')}
      ${req.length?`<tr><td>${extras.length+2}.</td><td><b>Was wir vor Ort benötigen</b><ul>${req.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></td><td>1,00 Stk</td><td>0,00 EUR</td><td>0,00 EUR</td></tr>`:''}
      <tr><td>${extras.length+(req.length?3:2)}.</td><td><b>Stornierung</b><br>Bitte beachten Sie folgende Kosten bei Stornierung.<br>bis 60 Tage vor Veranstaltungstermin 30%,<br>bis 30 Tage vor Veranstaltungstermin 60%,<br>bis 10 Tage vor Veranstaltungstermin 90%,<br>danach 100% des Rechnungsbetrages.</td><td>1,00</td><td>0,00 EUR</td><td>0,00 EUR</td></tr>
    </tbody>
  </table>
  <table class="sumTable">
    <tr><td>Gesamtbetrag netto</td><td>${euro(t.net)}</td></tr>
    <tr><td>Umsatzsteuer ${o.vat}%</td><td>${euro(t.vat)}</td></tr>
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
