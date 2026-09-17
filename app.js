(() => {
  'use strict';

  const WHATSAPP_NUMBER = '5511988018010';
  const LOCAL_SCHEDULE_KEY = 'maduScheduleV2';
  const IS_LOCAL_PREVIEW = location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname);

  const services = [
    { id:'volume-brasileiro', category:'lashes', name:'Volume Brasileiro', application:120, maintenance:100, days:20, image:'06-volume-brasileiro', code:'VB' },
    { id:'volume-egipcio', category:'lashes', name:'Volume Egípcio', application:140, maintenance:110, days:20, image:'08-volume-egipcio', code:'VE' },
    { id:'volume-shine', category:'lashes', name:'Volume Shine', application:130, maintenance:100, days:20, image:'05-volume-shine', code:'VS' },
    { id:'volume-foxy', category:'lashes', name:'Volume Foxy', application:150, maintenance:110, days:20, image:'03-volume-foxy', code:'VF' },
    { id:'mega-brasileiro', category:'lashes', name:'Volume Mega Brasileiro', application:150, maintenance:120, days:30, image:'07-mega-brasileiro', code:'MB' },
    { id:'mega-foxy', category:'lashes', name:'Volume Mega Foxy', application:170, maintenance:120, days:30, image:'04-mega-foxy', code:'MF' },
    { id:'mega-egipcio', category:'lashes', name:'Volume Mega Egípcio', application:180, maintenance:130, days:30, image:'02-mega-egipcio', code:'ME' },
    { id:'design-sobrancelha', category:'brows', name:'Design de Sobrancelha', price:20, image:'09-design-sobrancelha', code:'DS', imageNote:'Imagem de referência: Design de sobrancelha sem henna' },
    { id:'design-henna', category:'brows', name:'Design com Henna', price:40, image:'01-design-henna', code:'DH' },
    { id:'remocao-aplicacao', category:'extras', name:'Remoção + Nova Aplicação', price:20, code:'RA', noPhoto:true, note:'Adicional para remoção quando houver nova aplicação.' },
    { id:'remocao-outra', category:'extras', name:'Remoção de Outra Profissional', price:40, code:'RO', noPhoto:true, note:'Serviço de remoção de trabalho realizado por outra profissional.' }
  ];

  const gallery = [
    { title:'Design com Henna', category:'brows', image:'01-design-henna', meta:'Sobrancelhas' },
    { title:'Volume Mega Egípcio', category:'lashes', image:'02-mega-egipcio', meta:'Referência de durabilidade: 30 dias' },
    { title:'Volume Foxy', category:'lashes', image:'03-volume-foxy', meta:'Referência de durabilidade: 20 dias' },
    { title:'Volume Mega Foxy', category:'lashes', image:'04-mega-foxy', meta:'Referência de durabilidade: 30 dias' },
    { title:'Volume Shine', category:'lashes', image:'05-volume-shine', meta:'Referência de durabilidade: 20 dias' },
    { title:'Volume Brasileiro', category:'lashes', image:'06-volume-brasileiro', meta:'Referência de durabilidade: 20 dias' },
    { title:'Volume Mega Brasileiro', category:'lashes', image:'07-mega-brasileiro', meta:'Referência de durabilidade: 30 dias' },
    { title:'Volume Egípcio', category:'lashes', image:'08-volume-egipcio', meta:'Referência de durabilidade: 20 dias' }
  ];

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const money = value => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(value);
  const escapeHTML = str => String(str ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const imageSrc = (key, width=640) => `assets/images/${key}-${width}.webp`;
  const pad = n => String(n).padStart(2, '0');
  const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parseDateKey = key => { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d,12); };
  const monthStart = d => new Date(d.getFullYear(), d.getMonth(), 1, 12);
  const TODAY = new Date(); TODAY.setHours(12,0,0,0);
  const MIN_MONTH = monthStart(TODAY);
  const MAX_MONTH = new Date(TODAY.getFullYear()+1, 11, 1, 12);
  const monthFmt = new Intl.DateTimeFormat('pt-BR', { month:'long', year:'numeric' });
  const fullDateFmt = new Intl.DateTimeFormat('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

  function renderServices() {
    const makeCard = s => {
      const photo = s.noPhoto
        ? `<div class="service-placeholder"><span aria-hidden="true">✧</span></div>`
        : `<div class="service-photo"><img src="${imageSrc(s.image,640)}" srcset="${imageSrc(s.image,640)} 640w, ${imageSrc(s.image,1200)} 1200w" sizes="(max-width:480px) 92vw, (max-width:760px) 46vw, 31vw" alt="Resultado de ${escapeHTML(s.name)} realizado pela Madu Lash Design" loading="lazy" decoding="async" />${s.days ? `<span class="duration-tag">Referência: ${s.days} dias</span>` : ''}</div>`;
      const price = s.category === 'lashes'
        ? `<div class="price-pair"><div class="price-box"><small>Aplicação</small><strong>${money(s.application)}</strong></div><div class="price-box"><small>Manutenção</small><strong>${money(s.maintenance)}</strong></div></div>`
        : `<div class="price-pair single-price"><div class="price-box"><small>Valor</small><strong>${money(s.price)}</strong></div></div>`;
      const note = s.note || s.imageNote || (s.days ? `Foto enviada para este procedimento. Referência informada de ${s.days} dias.` : 'Selecione este serviço para continuar o agendamento.');
      return `<article class="service-card reveal ${s.noPhoto ? 'text-service' : ''}" data-service-card="${s.id}">${photo}<div class="service-body"><div class="service-title-row"><h4>${escapeHTML(s.name)}</h4><span class="service-code">${s.code}</span></div>${price}<p class="service-note">${escapeHTML(note)}</p><button class="btn btn-secondary book-service" type="button" data-service="${s.id}">${s.category === 'extras' ? 'Adicionar ao agendamento' : 'Agendar este serviço'} <span>→</span></button></div></article>`;
    };
    $('#lashServices').innerHTML = services.filter(s => s.category === 'lashes').map(makeCard).join('');
    $('#browServices').innerHTML = services.filter(s => s.category === 'brows').map(makeCard).join('');
    $('#extraServices').innerHTML = services.filter(s => s.category === 'extras').map(makeCard).join('');
  }

  function renderGallery() {
    $('#galleryGrid').innerHTML = gallery.map((g,i) => `<button class="gallery-item reveal" type="button" data-gallery-index="${i}" data-category="${g.category}" aria-label="Ampliar ${escapeHTML(g.title)}"><img src="${imageSrc(g.image,640)}" srcset="${imageSrc(g.image,640)} 640w, ${imageSrc(g.image,1200)} 1200w" sizes="(max-width:760px) 46vw, 25vw" alt="${escapeHTML(g.title)} - trabalho da Madu Lash Design" loading="lazy" decoding="async" /><span class="gallery-overlay"><small>RESULTADO REAL</small><strong>${escapeHTML(g.title)}</strong></span></button>`).join('');
  }

  function populateServiceSelect() {
    const select = $('#serviceSelect');
    const lashOptions = services.filter(s => s.category === 'lashes').map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('');
    const browOptions = services.filter(s => s.category === 'brows').map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('');
    select.insertAdjacentHTML('beforeend', `<optgroup label="Extensão de cílios">${lashOptions}</optgroup><optgroup label="Sobrancelhas">${browOptions}</optgroup>`);
  }

  function butterflies() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    const count = lowPower ? 2 : (innerWidth < 760 ? 3 : 5);
    const layer = $('#butterflyLayer');
    for (let i=0;i<count;i++) {
      const el = document.createElement('span');
      el.className = 'butterfly';
      el.innerHTML = '<svg viewBox="0 0 64 46" aria-hidden="true"><path d="M31 24C24 6 8 3 5 12c-3 9 7 18 23 17M33 24C40 6 56 3 59 12c3 9-7 18-23 17M30 27c-9 2-15 7-13 12 2 5 10 2 15-8M34 27c9 2 15 7 13 12-2 5-10 2-15-8M32 18v17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      el.style.top = `${10 + Math.random()*76}%`;
      el.style.setProperty('--duration', `${18 + Math.random()*16}s`);
      el.style.setProperty('--delay', `${Math.random()*-20}s`);
      layer.appendChild(el);
    }
  }

  function revealSetup() {
    const items = $$('.reveal');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('in-view')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } }), { threshold:.09, rootMargin:'0px 0px -30px 0px' });
    items.forEach(el => io.observe(el));
  }

  let audioCtx = null, ambientTimer = null, soundOn = false, chordIndex = 0;
  const gospelProgression = [[261.63,329.63,392,523.25],[246.94,369.99,493.88,587.33],[220,329.63,440,523.25],[174.61,349.23,440,523.25]];
  function playSoftChord() {
    if (!audioCtx || !soundOn) return;
    const t = audioCtx.currentTime, chord = gospelProgression[chordIndex++ % gospelProgression.length];
    chord.forEach((freq, idx) => {
      const osc=audioCtx.createOscillator(), gain=audioCtx.createGain(), filter=audioCtx.createBiquadFilter();
      osc.type=idx===0?'sine':(idx===chord.length-1?'triangle':'sine'); osc.frequency.value=idx===0?freq/2:freq;
      filter.type='lowpass'; filter.frequency.value=idx===0?680:1350;
      gain.gain.setValueAtTime(.0001,t); gain.gain.exponentialRampToValueAtTime(idx===0?.012:.017,t+.35+idx*.04); gain.gain.exponentialRampToValueAtTime(.0001,t+3.8);
      osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); osc.start(t+idx*.06); osc.stop(t+4.1);
    });
  }
  async function setSound(next) {
    soundOn=next; const btn=$('#soundButton');
    if(next){
      const AudioCtor=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtor){soundOn=false;btn.classList.remove('on');btn.setAttribute('aria-label','Instrumental não suportado neste navegador');$('#soundIcon').textContent='♪';return;}
      if(!audioCtx) audioCtx=new AudioCtor(); if(audioCtx.state==='suspended') await audioCtx.resume(); clearInterval(ambientTimer); playSoftChord(); ambientTimer=setInterval(playSoftChord,4300);
      btn.classList.add('on'); btn.setAttribute('aria-label','Pausar instrumental'); $('#soundIcon').textContent='♫';
    } else { clearInterval(ambientTimer); ambientTimer=null; btn.classList.remove('on'); btn.setAttribute('aria-label','Ativar instrumental'); $('#soundIcon').textContent='♪'; }
  }

  function welcome() {
    const modal=$('#welcomeModal'); let savedName='';
    try{savedName=localStorage.getItem('maduVisitorName')||'';}catch{}
    if(savedName){updateGreeting(savedName);$('#nameInput').value=savedName;return;}
    modal.hidden=false; setTimeout(()=>$('#welcomeName').focus({preventScroll:true}),120);
    const enter=async withSound=>{const name=$('#welcomeName').value.trim();if(!name){$('#welcomeError').textContent='Informe seu nome para continuarmos.';return;}try{localStorage.setItem('maduVisitorName',name);}catch{} updateGreeting(name);$('#nameInput').value=name;modal.hidden=true;await setSound(withSound);};
    $('#enterSound').addEventListener('click',()=>enter(true)); $('#enterSilent').addEventListener('click',()=>enter(false)); $('#welcomeName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();enter(false);}});
  }
  function updateGreeting(name){const first=name.split(/\s+/)[0];$('#personalGreeting').textContent=`Olá, ${first}. Seja bem-vinda ♡`;}

  function navigation(){const btn=$('#menuButton'),nav=$('#mobileNav');btn.addEventListener('click',()=>{const open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));nav.hidden=open;});$$('a',nav).forEach(a=>a.addEventListener('click',()=>{nav.hidden=true;btn.setAttribute('aria-expanded','false');}));}

  let lightboxIndex=0, visibleGallery=gallery.map((_,i)=>i);
  function openLightbox(index){lightboxIndex=index;const g=gallery[index];$('#lightboxImage').src=imageSrc(g.image,1200);$('#lightboxImage').alt=`${g.title} - trabalho da Madu Lash Design`;$('#lightboxTitle').textContent=g.title;$('#lightboxMeta').textContent=g.meta;$('#lightbox').hidden=false;}
  function moveLightbox(dir){const pos=visibleGallery.indexOf(lightboxIndex), nextPos=(pos+dir+visibleGallery.length)%visibleGallery.length;openLightbox(visibleGallery[nextPos]);}
  function gallerySetup(){
    $$('.gallery-item').forEach(item=>item.addEventListener('click',()=>openLightbox(Number(item.dataset.galleryIndex))));
    $$('.filter-chip').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter-chip').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const filter=btn.dataset.filter;visibleGallery=[];$$('.gallery-item').forEach(item=>{const show=filter==='all'||item.dataset.category===filter;item.classList.toggle('is-hidden',!show);if(show) visibleGallery.push(Number(item.dataset.galleryIndex));});}));
    $('#lightboxClose').addEventListener('click',()=>$('#lightbox').hidden=true); $('#lightboxPrev').addEventListener('click',()=>moveLightbox(-1)); $('#lightboxNext').addEventListener('click',()=>moveLightbox(1));
    $('#lightbox').addEventListener('click',e=>{if(e.target===$('#lightbox'))$('#lightbox').hidden=true;}); document.addEventListener('keydown',e=>{if($('#lightbox').hidden)return;if(e.key==='Escape')$('#lightbox').hidden=true;if(e.key==='ArrowLeft')moveLightbox(-1);if(e.key==='ArrowRight')moveLightbox(1);});
  }

  // -------- Agenda pública / banco online --------
  let scheduleDays = {};
  let scheduleOnline = false;
  let publicCursor = new Date(MIN_MONTH);
  let bookingCursor = new Date(MIN_MONTH);
  let publicSelectedDate = '';

  function localScheduleRead(){try{return JSON.parse(localStorage.getItem(LOCAL_SCHEDULE_KEY)||'{"days":{}}');}catch{return {days:{}};}}
  async function loadSchedule({quiet=false}={}){
    let payload={days:{}};
    try{
      if(IS_LOCAL_PREVIEW){payload=localScheduleRead();scheduleOnline=false;}
      else{
        const res=await fetch('/api/schedule',{headers:{Accept:'application/json'},cache:'no-store'});
        if(!res.ok) throw new Error(`Agenda HTTP ${res.status}`);
        payload=await res.json(); scheduleOnline=true;
      }
      scheduleDays=payload?.days&&typeof payload.days==='object'?payload.days:{};
      if($('#calendarConnectionNote')){$('#calendarConnectionNote').hidden=true;$('#calendarConnectionNote').textContent='';}
    }catch(err){
      scheduleDays={}; scheduleOnline=false;
      if($('#calendarConnectionNote')){$('#calendarConnectionNote').hidden=false;$('#calendarConnectionNote').textContent='Não foi possível consultar a agenda agora. Tente novamente em instantes.';}
      if(!quiet) console.error(err);
    }
    renderAllCalendars();
  }

  function availableSlots(day){return Array.isArray(day?.slots)?day.slots.filter(s=>s&&s.status==='available'&&/^\d{2}:\d{2}$/.test(s.time)).sort((a,b)=>a.time.localeCompare(b.time)):[];}
  function publicDayStatus(key){
    const d=scheduleDays[key];
    if(!d) return 'unpublished';
    if(d.status==='full') return 'full';
    if(d.status==='open'&&availableSlots(d).length>0) return 'available';
    return d.status==='open'?'full':'unpublished';
  }
  function isPastKey(key){return parseDateKey(key)<TODAY;}
  function clampMonth(d){if(d<MIN_MONTH)return new Date(MIN_MONTH);if(d>MAX_MONTH)return new Date(MAX_MONTH);return d;}
  function shiftMonth(d,delta){return clampMonth(new Date(d.getFullYear(),d.getMonth()+delta,1,12));}
  function canPrev(cursor){return cursor.getFullYear()>MIN_MONTH.getFullYear()||cursor.getMonth()>MIN_MONTH.getMonth();}
  function canNext(cursor){return cursor.getFullYear()<MAX_MONTH.getFullYear()||cursor.getMonth()<MAX_MONTH.getMonth();}

  function renderCalendar({cursor,grid,title,prev,next,selected='',onDayClick}){
    if(!grid||!title)return;
    title.textContent=monthFmt.format(cursor).replace(/^./,m=>m.toUpperCase());
    if(prev)prev.disabled=!canPrev(cursor); if(next)next.disabled=!canNext(cursor);
    const y=cursor.getFullYear(),m=cursor.getMonth(),first=new Date(y,m,1,12).getDay(),days=new Date(y,m+1,0,12).getDate();
    const cells=[]; for(let i=0;i<first;i++)cells.push('<span class="calendar-day calendar-empty" aria-hidden="true"></span>');
    for(let day=1;day<=days;day++){
      const d=new Date(y,m,day,12),key=dateKey(d),past=d<TODAY,status=past?'past':publicDayStatus(key),info=scheduleDays[key];
      const count=status==='available'?availableSlots(info).length:0;
      const aria=status==='available'?`${day}, ${count} horário${count===1?'':'s'} disponível${count===1?'':'is'}`:status==='full'?`${day}, sem vagas`:status==='past'?`${day}, data passada`:`${day}, agenda não publicada`;
      const disabled=past?'disabled':'';
      cells.push(`<button class="calendar-day ${status} ${selected===key?'selected':''}" type="button" data-date="${key}" ${disabled} aria-label="${aria}"><strong>${day}</strong>${status==='available'?`<small>${count} vaga${count===1?'':'s'}</small>`:status==='full'?'<small>Lotado</small>':status==='unpublished'?'<small>—</small>':''}</button>`);
    }
    grid.innerHTML=cells.join('');
    $$('[data-date]',grid).forEach(btn=>btn.addEventListener('click',()=>onDayClick?.(btn.dataset.date,publicDayStatus(btn.dataset.date))));
  }

  function renderPublicCalendar(){
    renderCalendar({cursor:publicCursor,grid:$('#calendarGrid'),title:$('#calendarTitle'),prev:$('#calendarPrev'),next:$('#calendarNext'),selected:publicSelectedDate,onDayClick:selectPublicDay});
  }
  function selectPublicDay(key,status){
    publicSelectedDate=key; renderPublicCalendar();
    const title=$('#slotTitle'),help=$('#slotHelp'),list=$('#slotList'),d=scheduleDays[key];
    title.textContent=fullDateFmt.format(parseDateKey(key)).replace(/^./,m=>m.toUpperCase()); list.innerHTML='';
    if(status==='available'){
      help.textContent='Horários disponíveis publicados pela Madu:';
      list.innerHTML=availableSlots(d).map(s=>`<button type="button" class="slot-pill" data-public-slot="${s.time}">${s.time}</button>`).join('');
      $$('[data-public-slot]',list).forEach(btn=>btn.addEventListener('click',()=>{form.selectedDate=key;form.selectedTime=btn.dataset.publicSlot;bookingCursor=monthStart(parseDateKey(key));showStep(2);setTimeout(()=>selectBookingDay(key,'available'),100);}));
    } else if(status==='full'){help.textContent='Este dia está sem vagas no momento.';list.innerHTML='<div class="slot-state full-state">Agenda lotada neste dia.</div>';}
    else {help.textContent='A agenda deste dia ainda não foi publicada.';list.innerHTML='<div class="slot-state neutral-state">Aguarde a abertura da agenda.</div>';}
  }

  function renderBookingCalendar(){
    renderCalendar({cursor:bookingCursor,grid:$('#bookingCalendarGrid'),title:$('#bookingCalendarTitle'),prev:$('#bookingCalendarPrev'),next:$('#bookingCalendarNext'),selected:form.selectedDate,onDayClick:selectBookingDay});
    renderChosenSlot();
  }
  function selectBookingDay(key,status){
    const title=$('#bookingSlotTitle'),help=$('#bookingSlotHelp'),list=$('#bookingSlotList'),day=scheduleDays[key];
    title.textContent=fullDateFmt.format(parseDateKey(key)).replace(/^./,m=>m.toUpperCase()); list.innerHTML='';
    if(status==='available'){
      help.textContent='Escolha um dos horários disponíveis:';
      list.innerHTML=availableSlots(day).map(s=>`<button type="button" class="slot-pill ${form.selectedDate===key&&form.selectedTime===s.time?'selected':''}" data-booking-slot="${s.time}">${s.time}</button>`).join('');
      $$('[data-booking-slot]',list).forEach(btn=>btn.addEventListener('click',()=>{form.selectedDate=key;form.selectedTime=btn.dataset.bookingSlot;bookingCursor=monthStart(parseDateKey(key));clearErrors();renderBookingCalendar();selectBookingDay(key,'available');renderChosenSlot();}));
    } else if(status==='full'){help.textContent='Este dia está lotado.';list.innerHTML='<div class="slot-state full-state">Sem horários disponíveis.</div>';if(form.selectedDate===key){form.selectedDate='';form.selectedTime='';renderChosenSlot();}}
    else {help.textContent='A agenda deste dia ainda não foi publicada.';list.innerHTML='<div class="slot-state neutral-state">Escolha um dia branco.</div>';if(form.selectedDate===key){form.selectedDate='';form.selectedTime='';renderChosenSlot();}}
  }
  function renderChosenSlot(){
    const wrap=$('#chosenSlot'); if(!wrap)return;
    if(form.selectedDate&&form.selectedTime){wrap.hidden=false;$('#chosenSlotText').textContent=`${new Intl.DateTimeFormat('pt-BR').format(parseDateKey(form.selectedDate))} às ${form.selectedTime}`;}
    else{wrap.hidden=true;$('#chosenSlotText').textContent='—';}
  }
  function renderAllCalendars(){renderPublicCalendar();renderBookingCalendar();if(publicSelectedDate)selectPublicDay(publicSelectedDate,publicDayStatus(publicSelectedDate));if(form.selectedDate)selectBookingDay(form.selectedDate,publicDayStatus(form.selectedDate));}

  function agendaSetup(){
    $('#calendarPrev').addEventListener('click',()=>{publicCursor=shiftMonth(publicCursor,-1);publicSelectedDate='';renderPublicCalendar();$('#slotTitle').textContent='Escolha um dia';$('#slotHelp').textContent='Os horários disponíveis aparecerão aqui.';$('#slotList').innerHTML='';});
    $('#calendarNext').addEventListener('click',()=>{publicCursor=shiftMonth(publicCursor,1);publicSelectedDate='';renderPublicCalendar();$('#slotTitle').textContent='Escolha um dia';$('#slotHelp').textContent='Os horários disponíveis aparecerão aqui.';$('#slotList').innerHTML='';});
    $('#bookingCalendarPrev').addEventListener('click',()=>{bookingCursor=shiftMonth(bookingCursor,-1);renderBookingCalendar();});
    $('#bookingCalendarNext').addEventListener('click',()=>{bookingCursor=shiftMonth(bookingCursor,1);renderBookingCalendar();});
    $('#changeChosenSlot').addEventListener('click',()=>{form.selectedDate='';form.selectedTime='';renderBookingCalendar();$('#bookingSlotTitle').textContent='Escolha uma data';$('#bookingSlotHelp').textContent='Depois toque em um dos horários disponíveis.';$('#bookingSlotList').innerHTML='';});
    loadSchedule();
    // Atualiza a leitura periodicamente enquanto a página estiver aberta.
    setInterval(()=>loadSchedule({quiet:true}),120000);
  }

  // -------- Formulário de agendamento --------
  const form={step:1,total:null,selectedDate:'',selectedTime:''};
  function getService(id=$('#serviceSelect').value){return services.find(s=>s.id===id);}
  function checked(name){return $(`input[name="${name}"]:checked`)?.value||'';}
  function removalPrice(){const v=$('#removalSelect').value;return v==='removal-application'?20:v==='other-professional'?40:0;}
  function removalLabel(){const v=$('#removalSelect').value;return v==='removal-application'?'Remoção + nova aplicação':v==='other-professional'?'Remoção de outra profissional':'Não';}
  function browAddonPrice(){const v=$('#browAddonSelect').value;return v==='design'?20:v==='henna'?40:0;}
  function browAddonLabel(){const v=$('#browAddonSelect').value;return v==='design'?'Design de sobrancelha':v==='henna'?'Design com henna':'Não';}

  function updateTypeVisibility(){
    const s=getService(),isLash=s?.category==='lashes';
    $('#appointmentTypeWrap').hidden=!isLash; $('#removalWrap').hidden=Boolean(s&&!isLash); $('#browAddonWrap').hidden=Boolean(s&&!isLash);
    if(!isLash){$$('input[name="appointmentType"]').forEach(r=>r.checked=false);$('#removalSelect').value='none';$('#browAddonSelect').value='none';}
    updatePrice();
  }
  function updatePrice(){
    const s=getService(),box=$('#livePrice strong'); if(!s){box.textContent='Selecione um serviço';form.total=null;return;}
    let base=0;if(s.category==='lashes'){const type=checked('appointmentType');if(!type){box.textContent='Escolha aplicação ou manutenção';form.total=null;return;}base=type==='Aplicação'?s.application:s.maintenance;}else base=s.price;
    form.total=base+removalPrice()+browAddonPrice(); const extras=[];if(removalPrice())extras.push('remoção');if(browAddonPrice())extras.push('sobrancelha');box.textContent=`${money(form.total)}${extras.length?` (com ${extras.join(' + ')})`:''}`;
  }
  function clearErrors(){$$('.field-error').forEach(e=>e.textContent='');$('#formGlobalError').textContent='';}
  function errorFor(key,msg){const el=$(`[data-error-for="${key}"]`);if(el)el.textContent=msg;}
  function validateStep(step){
    clearErrors();let ok=true;
    if(step===1){const s=getService();if(!s){errorFor('serviceSelect','Escolha o serviço que deseja realizar.');ok=false;}if(s?.category==='lashes'&&!checked('appointmentType')){errorFor('appointmentType','Escolha aplicação ou manutenção.');ok=false;}}
    if(step===2){const currentStatus=form.selectedDate?publicDayStatus(form.selectedDate):'';const stillAvailable=currentStatus==='available'&&availableSlots(scheduleDays[form.selectedDate]).some(s=>s.time===form.selectedTime);if(!form.selectedDate||!form.selectedTime||!stillAvailable){form.selectedDate='';form.selectedTime='';renderChosenSlot();errorFor('publishedSlot','Escolha um dia branco e um horário disponível na agenda.');ok=false;}}
    if(step===3){if(!$('#nameInput').value.trim()){errorFor('nameInput','Informe seu nome para continuarmos.');ok=false;}if(!checked('firstTime')){errorFor('firstTime','Informe se é sua primeira vez.');ok=false;}}
    if(step===4){if(!checked('allergy')){errorFor('allergy','Informe se possui alergia ou sensibilidade.');ok=false;}}
    if(!ok)$('#formGlobalError').textContent='Confira os campos indicados antes de continuar.';return ok;
  }
  function formatDate(key){return key?new Intl.DateTimeFormat('pt-BR').format(parseDateKey(key)):'—';}
  function summaryData(){const s=getService(),type=s?.category==='lashes'?checked('appointmentType'):'Não se aplica',allergy=checked('allergy');return {name:$('#nameInput').value.trim(),phone:$('#phoneInput').value.trim(),service:s?.name||'',type,date:formatDate(form.selectedDate),time:form.selectedTime,removal:removalLabel(),browAddon:s?.category==='lashes'?browAddonLabel():'Não se aplica',firstTime:checked('firstTime'),allergy,allergyDetails:$('#allergyDetails').value.trim(),notes:$('#notesInput').value.trim(),total:(updatePrice(),form.total)};}
  function renderSummary(){const d=summaryData();$('#bookingSummary').innerHTML=`<div class="summary-row"><span>Nome</span><strong>${escapeHTML(d.name)}</strong></div><div class="summary-row"><span>Procedimento</span><strong>${escapeHTML(d.service)}</strong></div><div class="summary-row"><span>Aplicação/manutenção</span><strong>${escapeHTML(d.type)}</strong></div><div class="summary-row"><span>Data</span><strong>${escapeHTML(d.date)}</strong></div><div class="summary-row"><span>Horário</span><strong>${escapeHTML(d.time)}</strong></div><div class="summary-row"><span>Remoção</span><strong>${escapeHTML(d.removal)}</strong></div><div class="summary-row"><span>Sobrancelha junto</span><strong>${escapeHTML(d.browAddon)}</strong></div><div class="summary-row"><span>Primeira vez</span><strong>${escapeHTML(d.firstTime)}</strong></div><div class="summary-row"><span>Alergia/sensibilidade</span><strong>${escapeHTML(d.allergy)}${d.allergyDetails?` — ${escapeHTML(d.allergyDetails)}`:''}</strong></div><div class="summary-total summary-row"><span>Valor informado</span><strong>${d.total!=null?money(d.total):'A confirmar'}</strong></div>`;}
  function showStep(step,shouldScroll=true){
    form.step=step;$$('.form-step').forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===step));const names=['Procedimento','Agenda disponível','Seus dados','Cuidados','Conferência'];$('#stepText').textContent=`Passo ${step} de 5`;$('#stepTitle').textContent=names[step-1];$('#progressBar').style.width=`${step*20}%`;$('#prevStep').hidden=step===1;$('#nextStep').hidden=step===5;$('#whatsappSubmit').hidden=step!==5;
    if(step===2){loadSchedule({quiet:true});if(form.selectedDate){bookingCursor=monthStart(parseDateKey(form.selectedDate));}renderBookingCalendar();}
    if(step===5)renderSummary();if(shouldScroll)$('#bookingForm').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function selectService(id){
    const s=services.find(x=>x.id===id);
    if(s?.category==='extras'){$('#removalSelect').value=id==='remocao-aplicacao'?'removal-application':'other-professional';updatePrice();showStep(1,false);$('#agendamento').scrollIntoView({behavior:'smooth',block:'start'});return;}
    $('#serviceSelect').value=id;updateTypeVisibility();if(s?.category==='lashes')$$('input[name="appointmentType"]').forEach(r=>r.checked=false);form.selectedDate='';form.selectedTime='';showStep(1,false);$('#agendamento').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function buildWhatsAppMessage(){const d=summaryData();return ['✨ Olá Madu! Vim pelo site e gostaria de realizar um agendamento.','',`👤 Nome: ${d.name}`,d.phone?`📱 Telefone: ${d.phone}`:null,`💆 Serviço: ${d.service}`,`✨ Aplicação ou manutenção: ${d.type}`,`🗓️ Data escolhida na agenda: ${d.date}`,`⏰ Horário publicado escolhido: ${d.time}`,`🧼 Remoção: ${d.removal}`,`✧ Sobrancelha junto: ${d.browAddon}`,`🌷 É a primeira vez: ${d.firstTime}`,`🧴 Alergia ou sensibilidade: ${d.allergy}${d.allergyDetails?` — ${d.allergyDetails}`:''}`,`💰 Valor conforme seleção no site: ${d.total!=null?money(d.total):'A confirmar'}`,'',`💬 Observação: ${d.notes||'Nenhuma observação.'}`,'','Gostaria de confirmar este horário.'].filter(v=>v!==null).join('\n');}
  function buildWhatsAppURL(){const params=new URLSearchParams({phone:WHATSAPP_NUMBER,text:buildWhatsAppMessage(),type:'phone_number',app_absent:'0'});return `https://api.whatsapp.com/send/?${params.toString()}`;}
  function bookingSetup(){
    $('#serviceSelect').addEventListener('change',()=>{updateTypeVisibility();form.selectedDate='';form.selectedTime='';renderChosenSlot();});$$('input[name="appointmentType"]').forEach(r=>r.addEventListener('change',updatePrice));$('#removalSelect').addEventListener('change',updatePrice);$('#browAddonSelect').addEventListener('change',updatePrice);
    $$('input[name="allergy"]').forEach(r=>r.addEventListener('change',()=>{const v=checked('allergy');$('#allergyDetailsWrap').hidden=v!=='Sim';if(v!=='Sim')$('#allergyDetails').value='';}));
    $('#nextStep').addEventListener('click',()=>{if(validateStep(form.step))showStep(Math.min(5,form.step+1));});$('#prevStep').addEventListener('click',()=>showStep(Math.max(1,form.step-1)));
    $('#bookingForm').addEventListener('submit',e=>{e.preventDefault();let invalid=null;for(const step of [1,2,3,4]){if(!validateStep(step)){invalid=step;break;}}if(invalid){showStep(invalid);return;}const win=window.open(buildWhatsAppURL(),'_blank');if(win)win.opener=null;else location.href=buildWhatsAppURL();});
    document.addEventListener('click',e=>{const btn=e.target.closest('.book-service');if(btn)selectService(btn.dataset.service);});
  }

  function whatsappWidget(){const btn=$('#whatsappFloat'),menu=$('#whatsappMenu');btn.addEventListener('click',()=>{const open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));menu.hidden=open;});document.addEventListener('click',e=>{if(!e.target.closest('.whatsapp-widget')){menu.hidden=true;btn.setAttribute('aria-expanded','false');}});}

  function init(){
    renderServices();renderGallery();populateServiceSelect();navigation();butterflies();agendaSetup();bookingSetup();gallerySetup();whatsappWidget();$('#year').textContent=new Date().getFullYear();$('#soundButton').addEventListener('click',()=>setSound(!soundOn));revealSetup();welcome();
    const loader=$('#loader');const finish=()=>setTimeout(()=>loader.classList.add('done'),80);if(document.readyState==='complete')finish();else addEventListener('load',finish,{once:true});
  }
  init();
})();
