'use strict';
// ---------- Planned: the cards you've set aside for an adventure, sorted like a stack of printed cards ----------
// Module (Rime of the Frostmaiden…) > Chapter > Area > cards. Only the DM sees this tab. Each card is an item from
// the library, with an optional note of where it is; "Hand out" gives a copy to a player (or the stash) and marks it found.
// Kept in S.plan, so it syncs to your Drive with everything else; which folders are open is per device (S.ui.planOpen).

function planData(){
  if(!S.plan||!Array.isArray(S.plan.mods))S.plan={mods:[]};
  for(const m of S.plan.mods){m.ch=m.ch||[];for(const c of m.ch){c.areas=c.areas||[];for(const a of c.areas)a.cards=a.cards||[]}}
  return S.plan;
}
const planOpen=id=>!!(S.ui.planOpen||{})[id];
function setPlanOpen(id,on){S.ui.planOpen=Object.assign({},S.ui.planOpen||{});if(on)S.ui.planOpen[id]=1;else delete S.ui.planOpen[id]}
// Find any folder or card by id: { list, i, node, kind, parent }
function planFind(id){
  for(const m of planData().mods){
    if(m.id===id)return{list:S.plan.mods,node:m,kind:'mod'};
    for(const c of m.ch){
      if(c.id===id)return{list:m.ch,node:c,kind:'ch',parent:m};
      for(const a of c.areas){
        if(a.id===id)return{list:c.areas,node:a,kind:'area',parent:c,mod:m};
        const k=a.cards.find(x=>x.id===id);if(k)return{list:a.cards,node:k,kind:'card',parent:a};
      }
    }
  }
  return null;
}
const PLAN_WORD={mod:'module',ch:'chapter',area:'area',card:'card'};
// Every area as "Module › Chapter › Area", for moving cards and for adding from the Items tab
function planAreas(){const out=[];for(const m of planData().mods)for(const c of m.ch)for(const a of c.areas)out.push({id:a.id,label:`${m.name} › ${c.name} › ${a.name}`});return out}
const foundCount=cards=>cards.filter(k=>k.given).length;
const areaCards=c=>c.areas.reduce((n,a)=>n+a.cards.length,0);
const areaFound=c=>c.areas.reduce((n,a)=>n+foundCount(a.cards),0);

function planView(){
  const P=planData();
  const head=(node,kind,count,extra)=>`<summary class="pl-sum"><span class="pl-name">${esc(node.name)}</span>${count}<span class="grow"></span>
    <span class="pl-btns">${extra||''}<button class="sm" data-pmv="${node.id}:-1" aria-label="Move ${esc(node.name)} up">↑</button><button class="sm" data-pmv="${node.id}:1" aria-label="Move ${esc(node.name)} down">↓</button><button class="sm" data-pren="${node.id}">Rename</button><button class="sm bad" data-pdel="${node.id}" aria-label="Delete ${esc(node.name)}">✕</button></span></summary>`;
  const tally=(f,n)=>n?`<span class="tag">${f} of ${n} found</span>`:'';
  const card=k=>{
    const i=byId[k.item];const nm=i?i.name:'(not in your library)';
    return `<div class="copy pl-card ${k.given?'pl-given':''}">
      <div class="row"><b class="grow"><a href="#" data-open="${esc(k.item)}" style="color:inherit">${esc(nm)}</a></b>${i?`<span class="mu" style="font-size:13px">${esc(i.rarity||'')}${needsAtt(i)?' · attunement':''}</span>`:''}</div>
      ${k.note?`<div class="mu pl-note">${esc(k.note)}</div>`:''}
      <div class="row" style="margin-top:6px">${k.given
        ?`<span class="att">✓ Found${k.to?` · given to ${esc(holderName(k.to))}`:''}</span><span class="grow"></span><button class="sm" data-pundo="${k.id}">Not found yet</button>`
        :`${i?`<select class="sm" data-pto="${k.id}" style="padding:3px">${holderOpts('stash')}</select><button class="sm pri" data-pgive="${k.id}">Hand out</button><button class="sm" data-pfound="${k.id}" title="Mark it found without giving a copy">Found</button>`:''}<span class="grow"></span>`}
        <button class="sm" data-pmv="${k.id}:-1" aria-label="Move up">↑</button><button class="sm" data-pmv="${k.id}:1" aria-label="Move down">↓</button><button class="sm" data-pnote="${k.id}">Note</button><button class="sm" data-pmove="${k.id}">Move…</button><button class="sm bad" data-pdel="${k.id}" aria-label="Remove ${esc(nm)}">✕</button></div></div>`;
  };
  const area=a=>`<details class="pl-area" data-pid="${a.id}" ${planOpen(a.id)?'open':''}>${head(a,'area',tally(foundCount(a.cards),a.cards.length),a.cards.length?`<button class="sm" data-pprint="${a.id}">+ Print</button>`:'')}
    <div class="pl-body">${a.cards.map(card).join('')||'<p class="mu">No cards here yet.</p>'}<button class="sm" data-padd="${a.id}">+ Add a card</button></div></details>`;
  const chap=c=>`<details class="pl-ch" data-pid="${c.id}" ${planOpen(c.id)?'open':''}>${head(c,'ch',tally(areaFound(c),areaCards(c)))}
    <div class="pl-body">${c.areas.map(area).join('')||'<p class="mu">No areas yet.</p>'}<button class="sm" data-pnew="area:${c.id}">+ Add an area</button></div></details>`;
  const mod=m=>`<details class="pl-mod card" data-pid="${m.id}" ${planOpen(m.id)?'open':''}>${head(m,'mod','')}
    <div class="pl-body">${m.ch.map(chap).join('')||'<p class="mu">No chapters yet.</p>'}<button class="sm" data-pnew="ch:${m.id}">+ Add a chapter</button></div></details>`;
  return `<div class="card"><div class="row"><h2 class="grow" style="margin:0">Planned</h2><button class="pri" data-pnew="mod:">+ Add a module</button></div>
    <p class="mu" style="margin:6px 0 0">Set aside the cards for an adventure: a folder for each module, then its chapters, then the areas in each chapter. When the party finds one, hand it out from here. Only you see this tab.</p></div>
    ${P.mods.map(mod).join('')||'<p class="mu">Nothing planned yet. Start with + Add a module.</p>'}`;
}

function planAsk(label,cur){const v=prompt(label,cur||'');return v==null?null:v.trim()}
function bindPlan(){
  const A=$('#app'),on=(sel,fn)=>A.querySelectorAll(sel).forEach(e=>e.onclick=ev=>{ev.preventDefault();ev.stopPropagation();fn(e,ev)});
  // remember which folders are open (on this device)
  A.querySelectorAll('details[data-pid]').forEach(d=>d.ontoggle=()=>{setPlanOpen(d.dataset.pid,d.open);try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}});
  on('[data-pnew]',e=>{
    const[kind,pid]=e.dataset.pnew.split(':');
    const name=planAsk(kind==='mod'?'Module name (e.g. Rime of the Frostmaiden)':kind==='ch'?'Chapter name (e.g. Chapter 2: Icewind Dale)':'Area name (e.g. Bryn Shander, or Area 3: The Cellar)');
    if(!name)return;
    const node={id:uid(),name};
    if(kind==='mod'){node.ch=[];planData().mods.push(node)}
    else if(kind==='ch'){node.areas=[];planFind(pid).node.ch.push(node);setPlanOpen(pid,1)}
    else{node.cards=[];planFind(pid).node.areas.push(node);setPlanOpen(pid,1)}
    setPlanOpen(node.id,1);save();render();
  });
  on('[data-pren]',e=>{const f=planFind(e.dataset.pren);if(!f)return;const n=planAsk(`New name for this ${PLAN_WORD[f.kind]}`,f.node.name);if(!n)return;f.node.name=n;save();render()});
  on('[data-pdel]',e=>{
    const f=planFind(e.dataset.pdel);if(!f)return;
    const what=f.kind==='card'?'this card from the plan':`${f.node.name} and everything in it`;
    if(!confirm(`Remove ${what}? Items you've already handed out stay with the players.`))return;
    f.list.splice(f.list.indexOf(f.node),1);save();render();
  });
  on('[data-pmv]',e=>{const[id,d]=e.dataset.pmv.split(':');const f=planFind(id);if(!f)return;const i=f.list.indexOf(f.node),j=i+Number(d);if(j<0||j>=f.list.length)return;[f.list[i],f.list[j]]=[f.list[j],f.list[i]];save();render()});
  on('[data-pnote]',e=>{const f=planFind(e.dataset.pnote);if(!f)return;const n=planAsk('Note: where it is, who has it, how to find it',f.node.note);if(n==null)return;if(n)f.node.note=n;else delete f.node.note;save();render()});
  on('[data-pmove]',e=>{const f=planFind(e.dataset.pmove);if(!f)return;planPickArea(`Move ${byId[f.node.item]?.name||'this card'} to…`,f.parent.id,id=>{const to=planFind(id);if(!to||to.node===f.parent)return;f.list.splice(f.list.indexOf(f.node),1);to.node.cards.push(f.node);setPlanOpen(id,1);setPlanOpen(to.parent.id,1);setPlanOpen(to.mod.id,1);save();render()})});
  on('[data-padd]',e=>planAddCards(e.dataset.padd));
  on('[data-pprint]',e=>{const f=planFind(e.dataset.pprint);if(!f)return;let n=0;for(const k of f.node.cards)if(byId[k.item]&&!S.printQ.includes(k.item)){S.printQ.push(k.item);n++}save();render();alert(n?`${n} card${n===1?'':'s'} added to the print queue.`:'Those cards are already in the print queue.')});
  on('[data-pgive]',e=>{
    const f=planFind(e.dataset.pgive);if(!f)return;const i=byId[f.node.item];if(!i)return;
    const to=A.querySelector(`[data-pto="${e.dataset.pgive}"]`).value;
    chooseFor(i,null,ch=>{addCopy(i.id,to,ch);f.node.given=Date.now();f.node.to=to;save();render()});
  });
  on('[data-pfound]',e=>{const f=planFind(e.dataset.pfound);if(!f)return;f.node.given=Date.now();delete f.node.to;save();render()});
  on('[data-pundo]',e=>{const f=planFind(e.dataset.pundo);if(!f)return;if(f.node.to&&!confirm(`Mark it not found yet? The copy you gave to ${holderName(f.node.to)} stays with them; remove it on the Party tab if you need to.`))return;delete f.node.given;delete f.node.to;save();render()});
  on('[data-open]',e=>{S.ui.sel=e.dataset.open;S.ui.tab='items';save();render()});
}

// Pick an area (for moving a card, or adding an item from the Items tab)
function planPickArea(title,cur,done,withNote){
  const as=planAreas();
  if(!as.length)return alert('Make a module, a chapter and an area on the Planned tab first.');
  modal(`<h2>${esc(title)}</h2><label>Area</label><select id="parea">${as.map(a=>`<option value="${a.id}" ${a.id===(cur||S.ui.planLast)?'selected':''}>${esc(a.label)}</option>`).join('')}</select>
    ${withNote?'<label style="margin-top:8px">Note (optional)</label><input id="pnote" placeholder="e.g. in the chest under the altar">':''}
    <div class="row" style="margin-top:12px"><span class="grow"></span><button id="pcancel">Cancel</button><button class="pri" id="pok">OK</button></div>`,m=>{
    $('#pcancel',m).onclick=closeModal;
    $('#pok',m).onclick=()=>{const id=$('#parea',m).value,note=withNote?$('#pnote',m).value.trim():'';S.ui.planLast=id;closeModal();done(id,note)};
  });
}
// Add cards to an area: search the library, tap items to add them
function planAddCards(areaId){
  const f=planFind(areaId);if(!f)return;
  let q='';const added=[];
  const list=m=>{const t=q.toLowerCase();const L=ITEMS.filter(i=>!t||i.name.toLowerCase().includes(t)).slice(0,60);
    $('#plist',m).innerHTML=L.map(i=>`<div class="li" data-pick="${esc(i.id)}"><span>${esc(i.name)}<br><small>${esc(i.rarity||'')}${needsAtt(i)?' · attunement':''}</small></span>${f.node.cards.some(k=>k.item===i.id)?'<span class="att">✓</span>':''}</div>`).join('')||'<div class="li mu">Nothing found</div>'};
  modal(`<h2>Add cards to ${esc(f.node.name)}</h2><input id="pq" placeholder="Search your items…" autocomplete="off"><label style="margin-top:8px">Note for the next card (optional)</label><input id="pnote" placeholder="e.g. in the chest under the altar">
    <div class="list" id="plist" style="max-height:45vh;margin-top:8px"></div><p class="mu" id="padded" style="margin:8px 0 0"></p>
    <div class="row" style="margin-top:10px"><span class="grow"></span><button class="pri" id="pdone">Done</button></div>`,m=>{
    list(m);$('#pq',m).focus();
    $('#pq',m).oninput=e=>{q=e.target.value;list(m)};
    $('#plist',m).onclick=e=>{const d=e.target.closest('[data-pick]');if(!d)return;const note=$('#pnote',m).value.trim();
      const k={id:uid(),item:d.dataset.pick};if(note)k.note=note;f.node.cards.push(k);added.push(byId[k.item].name);$('#pnote',m).value='';
      $('#padded',m).textContent='Added: '+added.join(', ');save();list(m)};
    $('#pdone',m).onclick=()=>{closeModal();setPlanOpen(areaId,1);render()};
  });
}
// From an item's page on the Items tab
function planAddItem(itemId){planPickArea(`Plan ${byId[itemId]?.name||'this item'} for…`,'',(id,note)=>{const to=planFind(id);if(!to)return;const k={id:uid(),item:itemId};if(note)k.note=note;to.node.cards.push(k);setPlanOpen(id,1);setPlanOpen(to.parent.id,1);setPlanOpen(to.mod.id,1);save();render();alert(`Added to ${to.node.name}.`)},true)}
