(() => {
  'use strict';
  const STORE = 'lumen-prep-v1';
  const content = document.getElementById('content');
  const toastNode = document.getElementById('toast');
  const defaults = { target: '7.0', dailyGoal: '20', sessions: [], drafts: { task1: '', task2: '' } };
  let data = load();
  let page = 'home', currentSkill = null, activeTask = 'task2', quizSubmitted = false;
  let timerId = null, timerMode = 'prepare', secondsLeft = 60, timerRunning = false;
  let toastTimeout = null;

  function load() {
    try {
      const old = JSON.parse(localStorage.getItem(STORE));
      if (!old || typeof old !== 'object') return structuredClone(defaults);
      return { ...structuredClone(defaults), ...old,
        sessions: Array.isArray(old.sessions) ? old.sessions.filter(s => s && typeof s === 'object').slice(-300) : [],
        drafts: { ...defaults.drafts, ...(old.drafts || {}) } };
    } catch (_) { return { target:'7.0', dailyGoal:'20', sessions:[], drafts:{task1:'', task2:''} }; }
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(data)); return true; } catch (_) { showToast('Storage unavailable. Your changes may not be saved.'); return false; } }
  function icon(id) { return `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`; }
  function escapeHTML(str) { return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function showToast(message) { toastNode.textContent = message; toastNode.hidden = false; clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { toastNode.hidden = true; }, 2600); }
  function localDay(date) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function todaySessions() { return data.sessions.filter(s => localDay(s.date) === localDay(new Date())).length; }
  function avgAccuracy() { const qs = data.sessions.filter(s => typeof s.correct === 'number' && s.total > 0); return qs.length ? Math.round(qs.reduce((n,s)=>n+s.correct/s.total,0)/qs.length*100) : null; }
  function streak() { const days = new Set(data.sessions.map(s=>localDay(s.date))); let count=0, d=new Date(); d.setHours(12,0,0,0); if (!days.has(localDay(d))) d.setDate(d.getDate()-1); while (days.has(localDay(d))) { count++;d.setDate(d.getDate()-1); } return count; }
  function logSession(skill, correct=null, total=null) { data.sessions.push({skill, correct, total, date:new Date().toISOString()}); data.sessions=data.sessions.slice(-300); save(); }
  function backButton() { return `<button class="back-btn" data-navigate="practice">All practice</button>`; }
  function navigate(to, skill=null) {
    if (timerId) {clearInterval(timerId);timerId=null;timerRunning=false;}
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    page=to;currentSkill=skill;quizSubmitted=false;
    document.querySelectorAll('.nav-item').forEach(el=>{
      const active=el.dataset.navigate===to || (to==='skill'&&el.dataset.navigate==='practice');
      el.classList.toggle('active',active);active?el.setAttribute('aria-current','page'):el.removeAttribute('aria-current');
    });
    render();window.scrollTo({top:0,behavior:'instant'});
  }
  function render() {
    let html = page==='home'?home():page==='practice'?practice():page==='progress'?progress():page==='profile'?profile():skillScreen();
    content.innerHTML=html;
    if (page==='skill' && currentSkill==='writing') updateWordCount();
  }

  function home() {
    const date = new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',weekday:'long'}).format(new Date());
    return `<section class="screen">
      <div class="welcome"><div class="eyebrow">${date}</div><h1 class="page-title">Your English,<br>in progress<span style="color:#70af8e">.</span></h1><p class="page-desc">A little practice every day adds up.</p></div>
      <section class="hero" aria-label="Daily study invitation"><div class="hero-tag"><span class="dot"></span>TODAY'S MISSION</div><h2>One step closer<br>to your goal.</h2><p>Build confidence with focused IELTS practice.</p><button class="hero-button" data-navigate="practice">Start practicing ${icon('arrow')}</button><span class="hero-spark" aria-hidden="true">✳</span></section>
      <div class="stat-row"><div class="stat"><strong>${escapeHTML(data.target)}</strong><small>Target band</small></div><div class="stat"><strong>${todaySessions()}</strong><small>Today’s sessions</small></div><div class="stat"><strong>${streak()}<span style="font-size:13px"> day</span></strong><small>Study streak</small></div></div>
      <div class="section-head"><h2>Explore your skills</h2><button class="text-btn" data-navigate="practice">View all ${icon('chevron')}</button></div>${skillGrid()}
      <div class="section-head"><h2>Your journey</h2></div><button class="wide-card" data-navigate="progress"><div class="circle-icon">📈</div><div><strong>Track your growth</strong><span>${data.sessions.length ? data.sessions.length + ' sessions logged' : 'Your first milestone starts today'}</span></div>${icon('chevron')}</button>
      <p class="mini-note">${icon('spark')} Real progress is built one session at a time.</p>
    </section>`;
  }
  const skills = [
    {key:'reading',title:'Reading',sub:'Passage & questions',icon:'book'},
    {key:'listening',title:'Listening',sub:'Audio comprehension',icon:'headphones'},
    {key:'writing',title:'Writing',sub:'Task 1 & Task 2',icon:'pen'},
    {key:'speaking',title:'Speaking',sub:'Cue card & timer',icon:'mic'}
  ];
  function skillGrid(){return `<div class="skill-grid">${skills.map(s=>`<button class="skill-card ${s.key}" data-skill="${s.key}"><span class="skill-icon">${icon(s.icon)}</span><strong>${s.title}</strong><span class="desc">${s.sub}</span><span class="arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`;}
  function practice(){return `<section class="screen"><div class="eyebrow">STUDY CENTER</div><h1 class="page-title">Choose your<br>next move.</h1><p class="page-desc">Four skills. One stronger version of you.</p>${skills.map((s,i)=>`<button class="practice-row ${s.key}" data-skill="${s.key}"><span class="left"><span class="icon">${icon(s.icon)}</span><span><strong>${s.title}</strong><small>${['Read closely. Think clearly.','Listen for the important details.','Turn ideas into clear arguments.','Speak with confidence.'][i]}</small></span></span><svg class="angle"><use href="#i-chevron"/></svg></button>`).join('')}<p class="mini-note">${icon('spark')} Original practice questions, created for this demo.</p></section>`;}
  function skillScreen(){ if(currentSkill==='reading')return quizScreen('reading'); if(currentSkill==='listening')return quizScreen('listening'); if(currentSkill==='writing')return writingScreen(); if(currentSkill==='speaking')return speakingScreen(); return practice(); }
  const questions={
    reading:[
      {q:'What is one benefit of urban trees mentioned in the passage?',choices:['They remove all city noise.','They help reduce heat on streets.','They eliminate the need for public transport.'],answer:1,explain:'The passage says tree cover can cool nearby streets.'},
      {q:'What can community gardens help residents do?',choices:['Avoid working with neighbours.','Replace city planning departments.','Connect with people in their neighbourhood.'],answer:2,explain:'The text describes gardens as places where neighbours meet.'},
      {q:'Why do some planners prefer drought-tolerant plants?',choices:['They require less water.','They grow only indoors.','They never require maintenance.'],answer:0,explain:'They help reduce demand for water.'},
      {q:'What does the author suggest about new parks?',choices:['They solve every urban problem.','They are useful but cannot replace wider policy changes.','They should only be built outside cities.'],answer:1,explain:'The text cautions against treating parks as a complete solution.'}
    ],
    listening:[
      {q:'On which day is the conversation club held?',choices:['Wednesday','Thursday','Friday'],answer:1,explain:'The announcement changes the day from Wednesday to Thursday.'},
      {q:'What time does the meeting start?',choices:['5:30 p.m.','6:00 p.m.','6:30 p.m.'],answer:2,explain:'The start time is 6:30 p.m.'},
      {q:'Where will the group meet?',choices:['Room 4','The main café','Room 14'],answer:0,explain:'The speaker says Room 4, next to the information desk.'},
      {q:'What should participants bring?',choices:['A ticket and headphones','A notebook and student card','A laptop and a photo'],answer:1,explain:'Participants are asked to bring a notebook and student card.'}
    ]
  };
  const passage=`Across many cities, small green spaces are becoming a major part of urban planning. Trees can make streets more comfortable during hot weather. In one neighbourhood study, shaded pavements were noticeably cooler than nearby areas without trees. Community gardens have another benefit: they offer places where residents can meet, share ideas and work together. However, new planting schemes also need careful management. Some planners select drought-tolerant plants because they use less water, especially in dry summers. Experts warn that parks alone cannot solve every urban challenge. Affordable housing, reliable transport and cleaner air policies still matter. The strongest results come when green spaces are planned as part of a broader strategy.`;
  const listeningScript=`Hello, and welcome to Westbridge Library. Our weekly conversation club takes place on Thursday this week, not Wednesday. The meeting begins at six thirty in the evening. We will meet in Room Four, next to the information desk. Entry is free, but please bring a notebook and your student card. Each session lasts approximately fifty minutes. We look forward to seeing you there.`;
  function questionMarkup(skill){return questions[skill].map((q,i)=>`<div class="question" data-question="${i}"><h4><span style="color:#8a96ad">${String(i+1).padStart(2,'0')}.</span> ${q.q}</h4>${q.choices.map((v,n)=>`<label class="choice" data-choice="${n}"><input type="radio" name="q${i}" value="${n}" ${quizSubmitted?'disabled':''}><span>${v}</span></label>`).join('')}<div class="feedback" data-feedback="${i}" hidden></div></div>`).join('');}
  function quizScreen(skill){const isReading=skill==='reading';return `<section class="screen">${backButton()}<div class="eyebrow">${isReading?'READING PRACTICE':'LISTENING PRACTICE'} · MINI SESSION</div><h1 class="page-title">${isReading?'Read between<br>the lines.':'Tune in.<br>Stay sharp.'}</h1><p class="page-desc">${isReading?'Read the passage, then answer four questions.':'Play the short announcement and answer four questions.'}</p><span class="pill">4 QUESTIONS · UNTIMED</span>
    ${isReading?`<div class="panel"><h3>Urban green spaces</h3><p class="passage">${passage}</p></div>`:`<div class="audio-box"><span class="audio-disc">${icon('headphones')}</span><h3>Library announcement</h3><p>British English · approx. 35 seconds</p><button type="button" class="secondary-btn" data-action="audio">${icon('play')} Play audio</button><button type="button" class="text-btn" data-action="transcript" style="margin:14px auto 0">Show transcript</button><p id="transcript" class="helper" style="text-align:left;background:#fff9;padding:12px;border-radius:12px" hidden>${listeningScript}</p></div><p class="helper">Audio uses your iPhone's text-to-speech voices. Availability may vary.</p>`}
    <div class="panel"><h3>Your questions</h3><div id="questions">${questionMarkup(skill)}</div></div><div id="quiz-result"></div><div class="action-row"><button class="primary-btn" id="submit-quiz" data-action="submit-quiz">Check answers ${icon('arrow')}</button><button class="secondary-btn" data-action="restart-quiz">Restart</button></div><p class="disclaimer">These are original sample questions. A mini-quiz score is not an official IELTS band score.</p></section>`;}
  function submitQuiz(){if(quizSubmitted)return; const qs=questions[currentSkill], answers=[];for(let i=0;i<qs.length;i++){const checked=document.querySelector(`input[name="q${i}"]:checked`);if(!checked){showToast('Please answer all four questions first.');return;}answers.push(Number(checked.value));}
    quizSubmitted=true;let correct=0;qs.forEach((q,i)=>{if(answers[i]===q.answer)correct++;const root=document.querySelector(`[data-question="${i}"]`);root.querySelectorAll('.choice').forEach(c=>{const n=Number(c.dataset.choice);c.classList.toggle('correct',n===q.answer);c.classList.toggle('incorrect',n===answers[i] && answers[i]!==q.answer);c.querySelector('input').disabled=true;});const feedback=root.querySelector('[data-feedback]');feedback.hidden=false;feedback.textContent=`${answers[i]===q.answer?'✓ Correct.':'Not quite.'} ${q.explain}`;});
    logSession(currentSkill,correct,qs.length);document.getElementById('quiz-result').innerHTML=`<div class="result"><div class="small-label">SESSION COMPLETE</div><div class="big">${correct} / ${qs.length}</div><p>${correct===4?'Excellent work. Keep up the consistency!':'Nice effort. Review the feedback and try again.'}</p></div>`;document.getElementById('submit-quiz').disabled=true;document.getElementById('submit-quiz').textContent='Session saved ✓';showToast('Result saved to Progress');}

  function writingScreen(){const task=activeTask==='task2';return `<section class="screen">${backButton()}<div class="eyebrow">WRITING STUDIO</div><h1 class="page-title">Make every<br>word count.</h1><p class="page-desc">Plan, write and save drafts on your device.</p><div class="task-switch" role="group" aria-label="Writing task"><button data-task="task1" class="${!task?'selected':''}" aria-pressed="${!task}">Academic Task 1</button><button data-task="task2" class="${task?'selected':''}" aria-pressed="${task}">Task 2 Essay</button></div>
    <div class="writing-prompt"><span class="small-label">${task?'TASK 2 · OPINION ESSAY':'TASK 1 · BAR CHART'}</span><p>${task?'Some people believe schools should teach practical life skills alongside traditional academic subjects. To what extent do you agree or disagree? Give reasons and relevant examples.':'The chart below shows the percentage of residents who cycled to work in four fictional districts in 2025. Summarise the main features and make comparisons where relevant.'}</p>${task?'':`<div class="data-bars">${[['North',42],['East',28],['South',36],['West',19]].map(([name,n])=>`<div class="data-bar"><span>${name}</span><div class="track"><div class="fill" style="width:${n}%"></div></div><strong>${n}%</strong></div>`).join('')}</div><p class="helper">Illustrative data created for this practice exercise.</p>`}</div>
    <div class="section-head"><h2>Your response</h2><span class="small-label">${task?'250+ words':'150+ words'}</span></div><textarea class="writing-area" id="writing-draft" spellcheck="true" placeholder="Start writing your response here..." aria-label="Your writing response">${escapeHTML(data.drafts[activeTask]||'')}</textarea><div class="writing-meta"><span id="word-count">0 words</span><span id="saved-status">Auto-saved on this device</span></div><div class="action-row"><button class="secondary-btn" data-action="copy-draft">${icon('copy')} Copy</button><button class="primary-btn" data-action="finish-writing">${icon('check')} Log practice</button></div><p class="disclaimer">Drafts save locally on this device only. No automatic IELTS marking or band prediction is provided.</p></section>`;}
  function countWords(s) {return (s.trim().match(/\S+/g)||[]).length;}
  function updateWordCount(){const text=document.getElementById('writing-draft');if(text)document.getElementById('word-count').textContent=`${countWords(text.value)} words` ;}
  function speakingScreen(){return `<section class="screen">${backButton()}<div class="eyebrow">SPEAKING STUDIO · PART 2</div><h1 class="page-title">Find your<br>voice.</h1><p class="page-desc">One minute to prepare. Two minutes to speak.</p><div class="panel"><span class="pill">CUE CARD</span><h3 style="font-size:20px;margin-top:13px">Describe a place that helps you relax.</h3><p>You should say:</p><ul class="cue-list"><li>where the place is</li><li>when you usually go there</li><li>what you do there</li><li>and why it helps you feel relaxed.</li></ul></div><div class="timer-circle" id="timer-circle"><strong id="timer-display">${timeText(secondsLeft)}</strong><span id="timer-label">${timerMode==='prepare'?'Preparation time':'Speaking time'}</span></div><div class="action-row"><button class="primary-btn" data-action="timer-toggle" id="timer-toggle">${timerRunning?'Pause timer':'Start '+(timerMode==='prepare'?'preparation':'speaking')}</button><button class="secondary-btn" data-action="timer-reset">${icon('restart')} Reset</button></div><div class="action-row"><button class="secondary-btn" data-action="timer-skip" style="flex:1">${timerMode==='prepare'?'Skip to speaking':'Finish session'}</button></div><p class="notice">This version includes a speaking timer, not audio recording or automatic evaluation. You can practise aloud independently.</p></section>`;}
  function timeText(sec){return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
  function syncTimer(){const time=document.getElementById('timer-display');if(!time)return;time.textContent=timeText(secondsLeft);document.getElementById('timer-label').textContent=timerMode==='prepare'?'Preparation time':'Speaking time';const toggle=document.getElementById('timer-toggle');toggle.textContent=timerRunning?'Pause timer':'Start '+(timerMode==='prepare'?'preparation':'speaking');document.querySelector('[data-action="timer-skip"]').textContent=timerMode==='prepare'?'Skip to speaking':'Finish session';}
  function stopTimer(){clearInterval(timerId);timerId=null;timerRunning=false;}
  function timerTick(){if(secondsLeft>0) secondsLeft--;if(secondsLeft===0){stopTimer();if(timerMode==='prepare'){timerMode='speak';secondsLeft=120;showToast('Preparation done! Start speaking.');}else{logSession('speaking');timerMode='prepare';secondsLeft=60;showToast('Speaking session saved!');}}syncTimer();}
  function timerToggle(){if(timerRunning){stopTimer();syncTimer();return;}timerRunning=true;timerId=setInterval(timerTick,1000);syncTimer();}
  function timerSkip(){stopTimer();if(timerMode==='prepare'){timerMode='speak';secondsLeft=120;showToast('Speaking time is ready.');}else{logSession('speaking');timerMode='prepare';secondsLeft=60;showToast('Speaking session saved!');}syncTimer();}

  function progress(){const acc=avgAccuracy();const pct=acc===null?0:acc;const latest=[...data.sessions].reverse().slice(0,8);const counts=skills.map(s=>({name:s.title,n:data.sessions.filter(x=>x.skill===s.key).length}));return `<section class="screen"><div class="eyebrow">STUDY INSIGHTS</div><h1 class="page-title">Your progress,<br>your pace.</h1><p class="page-desc">Every completed session counts.</p><div class="progress-big"><div><span>AVERAGE QUIZ ACCURACY</span><strong>${acc===null?'—':acc+'%'}</strong><span>${acc===null?'Complete a quiz to see results':'Reading & listening mini-quizzes'}</span></div><div class="ring" style="--pct:${pct}%"><span>${acc===null?'—':pct+'%'}</span></div></div><div class="metric-grid"><div class="metric"><strong>${data.sessions.length}</strong><span>Total sessions</span></div><div class="metric"><strong>${streak()}</strong><span>Current study streak · days</span></div></div><div class="section-head"><h2>Sessions by skill</h2></div><div class="panel" style="margin-top:0">${counts.map(item=>`<div class="data-bar" style="grid-template-columns:75px 1fr 30px;margin:15px 0"><span>${item.name}</span><div class="track"><div class="fill" style="width:${Math.round(item.n/Math.max(1,...counts.map(c=>c.n))*100)}%"></div></div><strong>${item.n}</strong></div>`).join('')}</div><div class="section-head"><h2>Recent activity</h2></div>${latest.length?latest.map(s=>`<div class="activity"><span class="badge-icon">${s.skill==='reading'?'📖':s.skill==='listening'?'🎧':s.skill==='writing'?'✍️':'🎤'}</span><span><strong>${escapeHTML(s.skill.charAt(0).toUpperCase()+s.skill.slice(1))} practice</strong><small>${new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(s.date))}</small></span><span class="score">${typeof s.correct==='number'?`${s.correct}/${s.total}`:'✓ Done'}</span></div>`).join(''):`<div class="empty">No practice sessions yet.<br>Head to Practice to start building your history.</div>`}<p class="disclaimer">Statistics are saved only in this browser on this device. Quiz accuracy is not an IELTS band score.</p></section>`;}
  function profile(){return `<section class="screen"><div class="eyebrow">YOUR STUDY SPACE</div><h1 class="page-title">Make it<br>yours.</h1><p class="page-desc">Personalise your goals and study rhythm.</p><div class="profile-card"><span class="profile-avatar">ME</span><span><strong>Independent learner</strong><small>Your IELTS preparation journey</small></span></div><div class="section-head"><h2>Study preferences</h2></div><div class="panel"><div class="settings-row"><span><strong>Target IELTS band</strong><small>Your personal goal</small></span><select id="target-select" aria-label="Target IELTS band">${['5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0'].map(x=>`<option value="${x}" ${x===data.target?'selected':''}>Band ${x}</option>`).join('')}</select></div><div class="settings-row"><span><strong>Daily study goal</strong><small>For your planning</small></span><select id="goal-select" aria-label="Daily study goal">${['10','20','30','45','60'].map(x=>`<option value="${x}" ${x===data.dailyGoal?'selected':''}>${x} min</option>`).join('')}</select></div><div class="settings-row"><span><strong>Progress storage</strong><small>Local device only, no account</small></span><span style="font-size:11px;color:#549471;font-weight:800">LOCAL</span></div></div><div class="section-head"><h2>Your data</h2></div><button class="danger" type="button" data-action="reset-data">Delete all saved practice data</button><p class="disclaimer">Lumen Prep is an independent demo study tool and is not endorsed by the owners of IELTS. Your writing drafts and practice history remain in this browser unless you clear the site data. They do not sync to other devices.</p></section>`;}

  content.addEventListener('click', async event => {
    const go=event.target.closest('[data-navigate]');if(go){navigate(go.dataset.navigate);return;}
    const skill=event.target.closest('[data-skill]');if(skill){timerMode='prepare';secondsLeft=60;navigate('skill',skill.dataset.skill);return;}
    const task=event.target.closest('[data-task]');if(task){activeTask=task.dataset.task;render();return;}
    const act=event.target.closest('[data-action]');if(!act)return;
    switch(act.dataset.action){
      case 'submit-quiz': submitQuiz();break;
      case 'restart-quiz':navigate('skill',currentSkill);break;
      case 'audio':{
        if(!('speechSynthesis' in window)){showToast('Audio is unavailable in this browser.');break;}
        speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(listeningScript);u.lang='en-GB';u.rate=.88;u.pitch=1;
        const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase()==='en-gb');if(voice)u.voice=voice;
        speechSynthesis.speak(u);showToast('Playing announcement');break;
      }
      case 'transcript':{
        const t=document.getElementById('transcript');t.hidden=!t.hidden;act.textContent=t.hidden?'Show transcript':'Hide transcript';break;
      }
      case 'copy-draft':{
        const draft=document.getElementById('writing-draft').value;
        if(!draft.trim()){showToast('Write a draft first.');break;}
        try{await navigator.clipboard.writeText(draft);showToast('Draft copied');}catch(_){showToast('Copy is unavailable. Select and copy your text.');}break;
      }
      case 'finish-writing':{
        const words=countWords(document.getElementById('writing-draft').value);
        if(words<20){showToast('Write at least 20 words before logging.');break;}
        logSession('writing');showToast(`Writing practice saved · ${words} words`);break;
      }
      case 'timer-toggle':timerToggle();break;
      case 'timer-reset':stopTimer();timerMode='prepare';secondsLeft=60;syncTimer();showToast('Timer reset');break;
      case 'timer-skip':timerSkip();break;
      case 'reset-data':{
        if(confirm('Delete all saved progress, settings and writing drafts from this device?')){
          data={target:'7.0',dailyGoal:'20',sessions:[],drafts:{task1:'',task2:''}};save();navigate('profile');showToast('Local practice data deleted');
        }break;
      }
    }
  });
  document.addEventListener('click',e=>{
    if(e.target.closest('.topbar [data-navigate], .bottom-nav [data-navigate]')){navigate(e.target.closest('[data-navigate]').dataset.navigate);}
  });
  content.addEventListener('input', e=>{
    if(e.target.id==='writing-draft') {data.drafts[activeTask]=e.target.value;save();updateWordCount();}
  });
  content.addEventListener('change',e=>{
    if(e.target.id==='target-select'){data.target=e.target.value;save();showToast('Target band updated');}
    if(e.target.id==='goal-select'){data.dailyGoal=e.target.value;save();showToast('Daily goal updated');}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(timerRunning){stopTimer();syncTimer();}if('speechSynthesis' in window)speechSynthesis.cancel();}});
  if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
  render();
})();
