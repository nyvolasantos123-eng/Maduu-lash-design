(() => {
  'use strict';

  const LOCAL_SCHEDULE_KEY = 'maduScheduleV2';
  const TOKEN_KEY = 'maduAdminTokenV1';
  const IS_LOCAL_PREVIEW = location.protocol === 'file:' || ['localhost','127.0.0.1'].includes(location.hostname);
  const LOCAL_USER = 'Madu';
  const LOCAL_PASSWORD = 'Madu321';

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const pad = n => String(n).padStart(2,'0');
  const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parseDateKey = key => { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d,12); };
  const monthStart = d => new Date(d.getFullYear(), d.getMonth(), 1, 12);
  const TODAY = new Date(); TODAY.setHours(12,0,0,0);
  const MIN_MONTH = monthStart(TODAY);
  const MAX_MONTH = new Date(TODAY.getFullYear()+1,11,1,12);
  const monthFmt = new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'});
  const fullDateFmt = new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});

  let token = localStorage.getItem(TOKEN_KEY) || '';
  let schedule = { days:{} };
  let cursor = new Date(MIN_MONTH);
  let selectedDate = '';
  let draft = null;

  function showMessage(msg, type='') {
    const el = $('#editorMessage');
    el.textContent = msg;
    el.className = `admin-message ${type}`.trim();
  }

  function readLocalSchedule(){
    try { return JSON.parse(localStorage.getItem(LOCAL_SCHEDULE_KEY) || '{"days":{}}'); }
    catch { return {days:{}}; }
  }
  function writeLocalSchedule(data){ localStorage.setItem(LOCAL_SCHEDULE_KEY, JSON.stringify(data)); }

  async function api(path, options={}) {
    const headers = new Headers(options.headers || {});
    headers.set('Accept','application/json');
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type','application/json');
    if (token) headers.set('Authorization',`Bearer ${token}`);
    const res = await fetch(path,{...options,headers,cache:'no-store'});
    const payload = await res.json().catch(()=>({}));
    if (!res.ok) {
      const err = new Error(payload?.error || `Erro ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return payload;
  }

  async function login(username,password){
    if (IS_LOCAL_PREVIEW) {
      if (username === LOCAL_USER && password === LOCAL_PASSWORD) return 'local-preview-token';
      throw new Error('Login ou senha incorretos.');
    }
    const data = await api('/api/admin/login',{method:'POST',body:JSON.stringify({username,password})});
    return data.token;
  }

  async function loadSchedule(){
    if (IS_LOCAL_PREVIEW) schedule = readLocalSchedule();
    else schedule = await api('/api/schedule');
    if (!schedule?.days || typeof schedule.days !== 'object') schedule = {days:{}};
  }

  function statusFor(key){
    const d=schedule.days[key];
    if(!d) return 'unpublished';
    if(d.status==='full') return 'full';
    if(d.status==='open') {
      const available=(d.slots||[]).filter(s=>s.status==='available').length;
      return available>0?'available':'full';
    }
    return 'unpublished';
  }

  function canPrev(){return cursor.getFullYear()>MIN_MONTH.getFullYear()||cursor.getMonth()>MIN_MONTH.getMonth();}
  function canNext(){return cursor.getFullYear()<MAX_MONTH.getFullYear()||cursor.getMonth()<MAX_MONTH.getMonth();}
  function shiftMonth(delta){
    const n=new Date(cursor.getFullYear(),cursor.getMonth()+delta,1,12);
    if(n<MIN_MONTH) return new Date(MIN_MONTH);
    if(n>MAX_MONTH) return new Date(MAX_MONTH);
    return n;
  }

  function renderCalendar(){
    $('#adminCalendarTitle').textContent = monthFmt.format(cursor).replace(/^./,m=>m.toUpperCase());
    $('#adminCalendarPrev').disabled=!canPrev(); $('#adminCalendarNext').disabled=!canNext();
    const y=cursor.getFullYear(),m=cursor.getMonth(),first=new Date(y,m,1,12).getDay(),daysInMonth=new Date(y,m+1,0,12).getDate();
    const cells=[];
    for(let i=0;i<first;i++)cells.push('<span class="calendar-day calendar-empty" aria-hidden="true"></span>');
    for(let day=1;day<=daysInMonth;day++){
      const dt=new Date(y,m,day,12),key=dateKey(dt),past=dt<TODAY,status=past?'past':statusFor(key),info=schedule.days[key];
      const available=Array.isArray(info?.slots)?info.slots.filter(s=>s.status==='available').length:0;
      const extra=status==='available'?`${available} vaga${available===1?'':'s'}`:status==='full'?'Lotado':status==='unpublished'?'—':'';
      cells.push(`<button type="button" class="calendar-day ${status} ${selectedDate===key?'selected':''}" data-date="${key}" ${past?'disabled':''}><strong>${day}</strong>${extra?`<small>${extra}</small>`:''}</button>`);
    }
    $('#adminCalendarGrid').innerHTML=cells.join('');
    $$('[data-date]',$('#adminCalendarGrid')).forEach(btn=>btn.addEventListener('click',()=>selectDay(btn.dataset.date)));
  }

  function cloneDay(day){
    if(!day) return {status:'unpublished',slots:[]};
    return {status:day.status==='full'?'full':'open',slots:Array.isArray(day.slots)?day.slots.map(s=>({time:s.time,status:s.status==='occupied'?'occupied':'available'})):[]};
  }

  function selectDay(key){
    selectedDate=key;
    draft=cloneDay(schedule.days[key]);
    $('#editorDate').textContent=fullDateFmt.format(parseDateKey(key)).replace(/^./,m=>m.toUpperCase());
    $('#editorHint').textContent='Edite o status e os horários abaixo.';
    $('#editorControls').hidden=false;
    $('#dayStatus').value=draft.status;
    $('#newSlotTime').value='';
    showMessage('');
    renderEditor(); renderCalendar();
  }

  function renderEditor(){
    if(!draft)return;
    const status=$('#dayStatus').value;
    const open=status==='open';
    $('#newSlotTime').disabled=!open;
    $('#addSlotButton').disabled=!open;
    const list=$('#adminSlotList');
    if(!draft.slots.length){
      list.innerHTML=`<div class="empty-admin-slots">${open?'Nenhum horário cadastrado ainda.':'Os horários ficam ocultos enquanto o dia não estiver como “Com horários”.'}</div>`;
      return;
    }
    list.innerHTML=draft.slots
      .slice().sort((a,b)=>a.time.localeCompare(b.time))
      .map((slot,i)=>`<div class="admin-slot-row" data-index="${i}"><strong>${slot.time}</strong><button type="button" class="slot-status-toggle ${slot.status}" data-toggle-slot="${slot.time}">${slot.status==='available'?'Disponível':'Ocupado'}</button><button type="button" class="slot-remove" data-remove-slot="${slot.time}" aria-label="Remover ${slot.time}">×</button></div>`).join('');
    $$('[data-toggle-slot]',list).forEach(btn=>btn.addEventListener('click',()=>{const slot=draft.slots.find(s=>s.time===btn.dataset.toggleSlot);if(slot){slot.status=slot.status==='available'?'occupied':'available';renderEditor();}}));
    $$('[data-remove-slot]',list).forEach(btn=>btn.addEventListener('click',()=>{draft.slots=draft.slots.filter(s=>s.time!==btn.dataset.removeSlot);renderEditor();}));
  }

  function addSlot(){
    if(!draft||$('#dayStatus').value!=='open')return;
    const time=$('#newSlotTime').value;
    if(!/^\d{2}:\d{2}$/.test(time)){showMessage('Escolha um horário válido.','error');return;}
    if(draft.slots.some(s=>s.time===time)){showMessage('Esse horário já está cadastrado.','error');return;}
    draft.slots.push({time,status:'available'}); $('#newSlotTime').value=''; showMessage('Horário adicionado. Clique em “Salvar alterações”.',''); renderEditor();
  }

  async function persistDay(){
    if(!selectedDate||!draft)return;
    const status=$('#dayStatus').value;
    try{
      $('#saveDayButton').disabled=true; $('#deleteDayButton').disabled=true;
      if(status==='unpublished'){
        if(IS_LOCAL_PREVIEW){delete schedule.days[selectedDate];writeLocalSchedule(schedule);}
        else await api(`/api/admin/day?date=${encodeURIComponent(selectedDate)}`,{method:'DELETE'});
        delete schedule.days[selectedDate];
        showMessage('Dia despublicado. No site ele aparecerá em cinza.','success');
      } else {
        const normalizedSlots=draft.slots
          .filter(s=>/^\d{2}:\d{2}$/.test(s.time))
          .sort((a,b)=>a.time.localeCompare(b.time))
          .filter((s,i,arr)=>i===0||s.time!==arr[i-1].time)
          .map(s=>({time:s.time,status:s.status==='occupied'?'occupied':'available'}));
        if(status==='open'&&!normalizedSlots.length){showMessage('Para publicar como “Com horários”, adicione pelo menos um horário.','error');return;}
        const day={status,slots:normalizedSlots};
        if(IS_LOCAL_PREVIEW){schedule.days[selectedDate]=day;writeLocalSchedule(schedule);}
        else await api('/api/admin/day',{method:'PUT',body:JSON.stringify({date:selectedDate,...day})});
        schedule.days[selectedDate]=day; draft=cloneDay(day);
        showMessage(status==='full'?'Dia salvo como lotado.':'Horários salvos e publicados.','success');
      }
      renderCalendar(); renderEditor();
    }catch(err){
      if(err.status===401){logout();$('#loginError').textContent='Sua sessão expirou. Entre novamente.';return;}
      showMessage(err.message||'Não foi possível salvar.','error');
    }finally{$('#saveDayButton').disabled=false;$('#deleteDayButton').disabled=false;}
  }

  async function refresh(){
    try{await loadSchedule();renderCalendar();if(selectedDate)selectDay(selectedDate);showMessage('Agenda atualizada.','success');}
    catch(err){showMessage(err.message||'Não foi possível atualizar.','error');}
  }

  function showDashboard(){
    $('#loginView').hidden=true; $('#dashboardView').hidden=false; $('#logoutButton').hidden=false;
    loadSchedule().then(()=>renderCalendar()).catch(err=>showMessage(err.message||'Erro ao carregar agenda.','error'));
  }
  function showLogin(){
    $('#loginView').hidden=false; $('#dashboardView').hidden=true; $('#logoutButton').hidden=true;
  }
  function logout(){token='';localStorage.removeItem(TOKEN_KEY);showLogin();}

  function init(){
    if(IS_LOCAL_PREVIEW)$('#localModeWarning').hidden=false;
    $('#loginForm').addEventListener('submit',async e=>{
      e.preventDefault(); $('#loginError').textContent='';
      const user=$('#adminUser').value.trim(),pass=$('#adminPassword').value;
      const submit=e.submitter; if(submit)submit.disabled=true;
      try{token=await login(user,pass);localStorage.setItem(TOKEN_KEY,token);showDashboard();}
      catch(err){$('#loginError').textContent=err.message||'Não foi possível entrar.';}
      finally{if(submit)submit.disabled=false;}
    });
    $('#logoutButton').addEventListener('click',logout);
    $('#refreshButton').addEventListener('click',refresh);
    $('#adminCalendarPrev').addEventListener('click',()=>{cursor=shiftMonth(-1);renderCalendar();});
    $('#adminCalendarNext').addEventListener('click',()=>{cursor=shiftMonth(1);renderCalendar();});
    $('#dayStatus').addEventListener('change',()=>{if(draft){draft.status=$('#dayStatus').value;renderEditor();}});
    $('#addSlotButton').addEventListener('click',addSlot);
    $('#newSlotTime').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addSlot();}});
    $('#saveDayButton').addEventListener('click',persistDay);
    $('#deleteDayButton').addEventListener('click',()=>{if(!draft)return;$('#dayStatus').value='unpublished';draft.status='unpublished';persistDay();});

    if(token)showDashboard();else showLogin();
  }
  init();
})();
