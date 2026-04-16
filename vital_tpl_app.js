const screens = { welcome:'s-welcome', auth:'s-auth', signup:'s-signup', mfa:'s-mfa', home:'s-home', events:'s-events', mentor:'s-mentor', resources:'s-resources', project:'s-project', admin:'s-admin' };

function goScreen(name) {
  Object.values(screens).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active');
    el.style.display = 'none';
  });

  const target = document.getElementById(screens[name]);
  const nav = document.getElementById('nav-bar');

  if (nav) {
    nav.style.display = ['welcome','auth','signup','mfa'].includes(name) ? 'none' : 'flex';
  }

  if (!target) return;
  target.style.display = name === 'mentor' ? 'flex' : 'block';
  target.classList.add('active');
}

function setActiveNav(idx) {
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
}

const state = {
  currentUserName: 'Aziz',
  verificationCode: '',
  currentUserEmail: '',
  resourceFilter: 'all',
  resourceSort: 'latest',
  eventFilter: 'all',
  currentProject: null,
  selectedEvent: null,
  eventRegistrations: JSON.parse(localStorage.getItem('eventRegistrations') || '[]')
};

function parseUserName(input) {
  if (!input) return 'Aziz';
  const name = input.trim();
  if (!name) return 'Aziz';
  return name
    .replace(/[._]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function setUserName(name) {
  state.currentUserName = name || 'Aziz';
  document.getElementById('user-greeting').textContent = `Bonjour, ${state.currentUserName} 👋`;
  document.getElementById('user-avatar').textContent = state.currentUserName.charAt(0).toUpperCase() || 'A';
}

function isPasswordValid(password) {
  return typeof password === 'string'
    && password.length >= 8
    && /[A-Z]/.test(password)
    && /\d/.test(password);
}

function showLoginError(message) {
  const el = document.getElementById('login-error');
  el.textContent = message;
  el.style.display = 'block';
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isNameValid(name) {
  return typeof name === 'string' && name.trim().split(/\s+/).filter(Boolean).length >= 2;
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function showMfaError(message) {
  const el = document.getElementById('mfa-error');
  el.textContent = message;
  el.style.display = 'block';
}

function clearMfaError() {
  const el = document.getElementById('mfa-error');
  el.textContent = '';
  el.style.display = 'none';
}

function sendVerificationEmail(email) {
  state.verificationCode = generateVerificationCode();
  state.currentUserEmail = email;
  document.getElementById('mfa-email-note').textContent = `Code envoyé à ${email}. Vérifie ta boîte mail.`;
  clearMfaError();
  console.log('Code de vérification envoyé à', email, state.verificationCode);
}

function clearLoginError() {
  const el = document.getElementById('login-error');
  el.textContent = '';
  el.style.display = 'none';
}

function getUserDatabase() {
  const raw = localStorage.getItem('vital_users');
  try {
    const users = JSON.parse(raw || '[]');
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUserDatabase(users) {
  localStorage.setItem('vital_users', JSON.stringify(users));
}

function registerUser(user) {
  const users = getUserDatabase();
  if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
    return false;
  }
  users.push(user);
  saveUserDatabase(users);
  return true;
}

function validateUser(email, password) {
  const users = getUserDatabase();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
}

function handleLogin() {
  const name = document.getElementById('login-name').value.trim();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!isNameValid(name)) {
    showLoginError('Entre ton nom complet (prénom et nom).');
    return;
  }

  if (!isEmailValid(email)) {
    showLoginError('Entre une adresse e-mail valide.');
    return;
  }

  if (!isPasswordValid(password)) {
    showLoginError('Le mot de passe doit faire au moins 8 caractères, contenir une majuscule et un chiffre.');
    return;
  }

  const user = validateUser(email, password);
  if (!user) {
    showLoginError('Compte introuvable ou mot de passe incorrect. Crée un compte si nécessaire.');
    return;
  }

  clearLoginError();
  setUserName(parseUserName(user.name));
  sendVerificationEmail(email);
  goScreen('mfa');
  setActiveNav(-1);
}

function showSignupError(message) {
  const el = document.getElementById('signup-error');
  el.textContent = message;
  el.style.display = 'block';
}

function handleRegister() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;

  if (!isNameValid(name)) {
    showSignupError('Entre ton nom complet (prénom et nom).');
    return;
  }

  if (!isEmailValid(email)) {
    showSignupError('Entre une adresse e-mail valide.');
    return;
  }

  if (!isPasswordValid(password)) {
    showSignupError('Le mot de passe doit faire au moins 8 caractères, contenir une majuscule et un chiffre.');
    return;
  }

  if (password !== confirm) {
    showSignupError('Les mots de passe ne correspondent pas.');
    return;
  }

  if (!registerUser({ name: parseUserName(name), email, password })) {
    showSignupError('Email déjà utilisé. Connecte-toi ou utilise une autre adresse.');
    return;
  }

  document.getElementById('signup-error').style.display = 'none';
  setUserName(parseUserName(name));
  sendVerificationEmail(email);
  goScreen('mfa');
  setActiveNav(-1);
}

function verifyOtp() {
  const code = Array.from(document.querySelectorAll('.otp-box'))
    .map(input => input.value.trim())
    .join('');

  if (code !== state.verificationCode) {
    showMfaError('Code incorrect. Vérifie ton email et réessaie.');
    return;
  }

  clearMfaError();
  setUserName(state.currentUserName);
  goScreen('home');
  setActiveNav(0);
}

const resourcesData = [
  { id: 1, title: 'Guide RAG', meta: 'PDF · 24 pages', type: 'doc', category: 'Documentation', description: 'Guide RAG de VITAL Tunis : workflow, indexation des données, et cas d\'usage pratique présenté à ISST Tunis Salle F1.', popularity: 82, date: '2026-04-12', tags:['Docs','RAG'], link:'#' },
  { id: 2, title: 'Intro ML', meta: '12 min · Workshop', type: 'video', category: 'AI', description: 'Vidéo de démarrage sur machine learning pour l\'équipe VITAL à Tunis. Comprend la préparation de données et le POC local.', popularity: 79, date: '2026-04-10', tags:['Video','ML'], link:'#' },
  { id: 3, title: 'API Cheatsheet', meta: 'Doc · Reference', type: 'doc', category: 'Dev', description: 'Fiche de référence API pour les endpoints internes et les bonnes pratiques REST.', popularity: 91, date: '2026-04-08', tags:['Docs','API'], link:'#' },
  { id: 4, title: 'Robotics Kit', meta: 'Projet · Open Source', type: 'project', category: 'Hardware', description: 'Projet de robotique avec architecture modulaire et capteurs intelligents.', popularity: 88, date: '2026-04-05', tags:['Projet','Robotics'], link:'#', highlights:['Structure modulaire','Pilotage ESP32','Capteurs infrarouges'],'deliverables':['Prototype mobile','Schémas circuit','Documentation utilisateur'] },
  { id: 5, title: 'Hackathon VITAL', meta: 'Video · 45 min', type: 'video', category: 'Event', description: 'Retour sur le hackathon précédent avec les meilleures pratiques et le jury.', popularity: 74, date: '2026-03-28', tags:['Video','Hackathon'], link:'#' },
  { id: 6, title: 'Cybersec 101', meta: 'Workshop · Avr 10', type: 'project', category: 'Security', description: 'Atelier sécurité : injection, authentification, chiffrement et audit.', popularity: 95, date: '2026-04-01', tags:['Projet','Security'], link:'#', highlights:['Test d\'injection SQL','Hash password','Politique d\'accès'],'deliverables':['Checklist sécurité','Template audit','Guide mitigation'] }
];

const eventsData = [
  { id: 1, title: 'Robotics Challenge', date: 'Avr 20', time: '14h00', attendees: 120, category:'challenge', color:'#00D9FF', summary:'Salle B12 · Prototype autonome', type:'Challenge', budget: 3200, meeting:'Planification circuits et tests', priority:'High' },
  { id: 2, title: 'AI Workshop', date: 'Avr 22', time: '15h00', attendees: 85, category:'workshop', color:'#9D4EDD', summary:'ML, RAG et modèle POC', type:'Workshop', budget: 1500, meeting:'Réunion préparation slides et dataset', priority:'Medium' },
  { id: 3, title: 'Hackathon VITAL', date: 'Avr 28', time: '10h00', attendees: 200, category:'hackathon', color:'#FFB020', summary:'24H Sprint · Teams et pitch', type:'Hackathon', budget: 5200, meeting:'Coordination jury et sponsors', priority:'Critical' }
];

const calendarEvents = {
  6: 'Point d\'avancement | Workshop interne',
  14: 'Réunion sprint | Équipe VITAL Tunis',
  20: 'Robotics Challenge | Salle B12',
  22: 'AI Workshop | Laboratoire RAG',
  28: 'Hackathon VITAL | Campus principal'
};

function findEventByDay(day) {
  return eventsData.find(evt => {
    const matches = evt.date.match(/\d+/);
    return matches && parseInt(matches[0], 10) === day;
  });
}

function showEventSignup(eventId) {
  const evt = eventsData.find(item => item.id === eventId);
  if (!evt) return;
  state.selectedEvent = evt;
  document.getElementById('selected-event-name').textContent = evt.title;
  document.getElementById('selected-event-time').textContent = `${evt.date} · ${evt.time}`;
  document.getElementById('selected-event-summary').textContent = evt.summary;
  const panel = document.getElementById('event-signup-panel');
  panel.style.display = 'block';
  document.getElementById('event-signup-status').textContent = '';
  document.getElementById('event-name-input').value = state.currentUserName || '';
  document.getElementById('event-email-input').value = '';
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideEventSignup() {
  const panel = document.getElementById('event-signup-panel');
  if (!panel) return;
  panel.style.display = 'none';
  state.selectedEvent = null;
}

function selectCalendarDay(day) {
  const evt = findEventByDay(day);
  if (evt) {
    showEventSignup(evt.id);
  } else {
    state.selectedEvent = null;
    document.getElementById('event-signup-panel').style.display = 'block';
    document.getElementById('selected-event-name').textContent = `Aucun événement le ${day} avril`;
    document.getElementById('selected-event-time').textContent = '';
    document.getElementById('selected-event-summary').textContent = 'Clique sur une date violette pour voir l’événement correspondant.';
    document.getElementById('event-signup-status').textContent = '';
    document.getElementById('event-name-input').value = state.currentUserName || '';
    document.getElementById('event-email-input').value = '';
  }
}

function registerForEvent() {
  if (!state.selectedEvent) return;
  const name = document.getElementById('event-name-input').value.trim();
  const email = document.getElementById('event-email-input').value.trim();
  if (!name || !email) {
    document.getElementById('event-signup-status').textContent = 'Merci de renseigner ton nom et ton email.';
    return;
  }
  const existing = state.eventRegistrations.find(reg => reg.eventId === state.selectedEvent.id && reg.email === email);
  if (existing) {
    document.getElementById('event-signup-status').textContent = 'Tu es déjà inscrit à cet événement.';
    return;
  }
  state.eventRegistrations.push({ eventId: state.selectedEvent.id, name, email, date: new Date().toISOString() });
  localStorage.setItem('eventRegistrations', JSON.stringify(state.eventRegistrations));
  state.selectedEvent.attendees += 1;
  renderEventList();
  document.getElementById('event-signup-status').textContent = `Inscription confirmée pour ${state.selectedEvent.title}.`;
}

function setResourceFilter(filter) {
  state.resourceFilter = filter;
  document.querySelectorAll('.resource-filter-btn').forEach(el => el.classList.toggle('active', el.dataset.filter === filter));
  renderResourceGrid();
}

function setResourceSort(sort) {
  state.resourceSort = sort;
  renderResourceGrid();
}

function setEventFilter(filter) {
  state.eventFilter = filter;
  document.querySelectorAll('.event-filter-btn').forEach(el => el.classList.toggle('active', el.dataset.filter === filter));
  renderEventList();
}

function renderResourceGrid() {
  const grid = document.getElementById('resource-list');
  if (!grid) return;
  let items = resourcesData.slice();
  if (state.resourceFilter !== 'all') items = items.filter(item => item.type === state.resourceFilter);
  if (state.resourceSort === 'popular') items.sort((a,b) => b.popularity - a.popularity);
  else if (state.resourceSort === 'type') items.sort((a,b) => a.type.localeCompare(b.type));
  else items.sort((a,b) => new Date(b.date) - new Date(a.date));
  grid.innerHTML = items.map(item => `
    <div class="resource-card" onclick="openResourceDetail(${item.id})">
      <div class="resource-icon" style="background:${item.color || '#1a2040'};">${item.type === 'video' ? '🎥' : item.type === 'doc' ? '📄' : '💼'}</div>
      <div class="resource-name">${item.title}</div>
      <div class="resource-meta">${item.meta}</div>
    </div>
  `).join('');
}

function openResourceDetail(id) {
  const item = resourcesData.find(res => res.id === id);
  if (!item) return;
  state.currentProject = item;
  document.getElementById('project-title').textContent = item.title;
  document.getElementById('project-subtitle').textContent = item.category + ' · ' + item.meta;
  document.getElementById('project-type').textContent = item.type.toUpperCase();
  document.getElementById('project-meta').textContent = `Ajouté le ${item.date} · Popularité ${item.popularity}%`;
  document.getElementById('project-description').textContent = item.description;
  document.getElementById('project-highlights').innerHTML = item.highlights ? `<ul style="padding-left:16px; margin:0;">${item.highlights.map(point => `<li style="margin-bottom:6px;">${point}</li>`).join('')}</ul>` : 'Aucun point supplémentaire défini.';
  document.getElementById('project-deliverables').innerHTML = item.deliverables ? `<ul style="padding-left:16px; margin:0;">${item.deliverables.map(line => `<li style="margin-bottom:6px;">${line}</li>`).join('')}</ul>` : 'Aucun livrable défini.';
  document.getElementById('project-tags').innerHTML = item.tags.map(tag => `<span class="tag${tag === item.category ? ' active' : ''}">${tag}</span>`).join('');
  goScreen('project');
}

function openProjectLink() {
  if (!state.currentProject) return;
  addBubble(`Ouverture du projet ${state.currentProject.title}...`, 'thinking');
}

function renderEventList() {
  const list = document.getElementById('event-list');
  if (!list) return;
  let items = eventsData.slice();
  if (state.eventFilter !== 'all') items = items.filter(item => item.category === state.eventFilter);
  list.innerHTML = items.map(item => `
    <div class="vcard" style="--accent:${item.color};">
      <div class="vcard-title">${item.title}</div>
      <div class="vcard-text">${item.summary}</div>
      <div class="row" style="margin-top:10px; justify-content:space-between; gap:8px;">
        <div style="font-size:11px; color:#cbd5e0;">${item.date} · ${item.time}</div>
        <button class="vbtn primary" style="font-size:11px;" onclick="showEventSignup(${item.id})">S'inscrire</button>
      </div>
      <div style="margin-top:8px; font-size:11px; color:#a0aec0;">${item.attendees} inscrits</div>
    </div>
  `).join('');
}

function buildCalendar() {
  const grid = document.getElementById('cal-grid');
  const days = ['D','L','M','M','J','V','S'];
  const eventDays = Object.keys(calendarEvents).map(Number);

  days.forEach(d => {
    const cell = document.createElement('div');
    cell.className = 'cal-day header';
    cell.textContent = d;
    grid.appendChild(cell);
  });

  for (let i = 1; i <= 30; i++) {
    const cell = document.createElement('div');
    if (i === 15) {
      cell.className = 'cal-day today';
    } else if (eventDays.includes(i)) {
      cell.className = 'cal-day event';
      cell.title = calendarEvents[i];
      cell.onclick = () => selectCalendarDay(i);
    } else {
      cell.className = 'cal-day active-month';
    }
    cell.textContent = i;
    grid.appendChild(cell);
  }
}

function initApp() {
  buildCalendar();
  renderEventList();
  renderResourceGrid();
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendChat();
    });
  }
}

document.addEventListener('DOMContentLoaded', initApp);

// AI Chat
const API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_API_KEY = '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'; // 🎯 Mets ta clé Claude ici
const SYSTEM = `Tu es le Mentor TPL ISSATKR — un assistant IA pour le club technologique TPL de l'ISSAT Kairouan. Tu connais:
- Les workshops passés: ML, Robotique, Cybersécurité, Web Dev, Arduino
- Le hackathon PROJECT VITAL (24H sprint, app mobile pour le club)
- Les critères d'évaluation: IA/Innovation (35pts), Technique/Cyber (25pts), UI/UX (20pts), MVP (10pts), Pitch (10pts)
- Tu réponds en français/darija selon le contexte, de façon concise et technique.`;

const securityIncidents = [
  { id: 1, type: 'SQL Injection', source: '/login', date: '2026-04-14', severity: 'High', description: 'Tentative d\'injection SQL sur le formulaire de connexion avec payload \"\' OR 1=1; --\".' },
  { id: 2, type: 'Brute Force', source: '/api/auth', date: '2026-04-13', severity: 'Medium', description: 'Multiple tentatives de connexion depuis la même IP sur 24h.' },
  { id: 3, type: 'Phishing', source: 'Email interne', date: '2026-04-15', severity: 'High', description: 'Tentative de phishing par email ciblant les organisateurs du club.' },
  { id: 4, type: 'XSS', source: '/forum/post', date: '2026-04-12', severity: 'Medium', description: 'Injection de script dans le champ message d\'un post utilisateur.' }
];

const datasetEntries = [
  ...securityIncidents.map(item => ({
    category: 'security',
    title: item.type,
    date: item.date,
    severity: item.severity,
    description: item.description,
    source: item.source
  })),
  ...eventsData.map(evt => ({
    category: 'event',
    title: evt.title,
    date: evt.date,
    time: evt.time,
    summary: evt.summary,
    attendees: evt.attendees,
    type: evt.type,
    budget: evt.budget,
    meeting: evt.meeting,
    priority: evt.priority
  }))
];

let chatHistory = [];
let isThinking = false;

async function sendChat() {
  if (isThinking) return;
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  if (!CLAUDE_API_KEY) {
    input.value = '';
    addBubble(msg, 'user');
    chatHistory.push({ role: 'user', content: msg });
    const reply = getOfflineAIResponse(msg, 'Aucune clé Claude fournie.');
    addBubble(reply, 'bot');
    return;
  }

  input.value = '';
  addBubble(msg, 'user');
  chatHistory.push({ role: 'user', content: msg });

  const thinkId = addBubble('Mentor يفكر...', 'thinking');
  isThinking = true;

  try {
    const payloadMessages = [
      { role: 'system', content: [{ type: 'text', text: SYSTEM }] },
      ...chatHistory.map(m => ({ role: m.role, content: [{ type: 'text', text: m.content }] }))
    ];

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLAUDE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens_to_sample: 1000,
        messages: payloadMessages,
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      document.getElementById(thinkId).remove();
      addBubble(getOfflineAIResponse(msg, `Erreur API Claude ${res.status}`), 'bot');
      console.error('Claude API error', res.status, errorText);
      isThinking = false;
      return;
    }

    const data = await res.json();
    let reply = 'Erreur de réponse.';
    if (typeof data.completion === 'string') reply = data.completion;
    else if (typeof data.output_text === 'string') reply = data.output_text;
    else if (Array.isArray(data.message?.content)) {
      const textBlock = data.message.content.find(b => b.type === 'text');
      reply = textBlock?.text || reply;
    } else if (Array.isArray(data.content)) {
      reply = data.content.find(b => b.type === 'text')?.text || reply;
    }

    document.getElementById(thinkId).remove();
    addBubble(reply, 'bot');
    chatHistory.push({ role: 'assistant', content: reply });
  } catch(e) {
    document.getElementById(thinkId).remove();
    addBubble(getOfflineAIResponse(msg, e?.message || 'Erreur réseau'), 'bot');
    console.error('Fetch error', e);
  }
  isThinking = false;
}

function getOfflineAIResponse(question, errorDetail) {
  const q = question.toLowerCase();
  const dataAnswer = queryDataset(question);
  if (dataAnswer) {
    return dataAnswer;
  }
  const dbAnswer = querySecurityDataset(question);
  if (dbAnswer) {
    return dbAnswer + ' Pour atténuer une attaque SQL, utilise des requêtes paramétrées, protège les entrées, et limite les tentatives côté serveur.';
  }

  if (q.includes('sql') || q.includes('injection')) {
    return 'Je vois une question sur SQL/attaque. Pour protéger un formulaire, utilise des requêtes paramétrées, échappe les entrées, et limite les tentatives de connexion. Vérifie aussi le logging et les règles WAF.';
  }

  if (q.includes('cyber') || q.includes('sécurité')) {
    return 'La cybersécurité commence par la validation des entrées, le chiffrement, la gestion des sessions, et la surveillance des logs. Pense à limiter les droits et à patcher rapidement.';
  }

  if (q.includes('robot') || q.includes('arduino') || q.includes('esp32')) {
    return 'Pour un projet hardware, définis d\'abord les capteurs et les actionneurs, puis écris un code modulaire. Teste chaque composant séparément avant de tout intégrer.';
  }

  if (q.includes('ai') || q.includes('machine learning') || q.includes('ml')) {
    return 'En IA, collecte d\'abord les données, choisis un modèle simple, entraîne-le, puis évalue-le. Pour un projet rapide, utilise des modèles pré-entraînés et ajoute une interface claire.';
  }

  if (q.includes('web') || q.includes('html') || q.includes('javascript') || q.includes('css')) {
    return 'Pour une application web, structure le HTML, stylise avec CSS, et rends l\'interaction avec JavaScript. Sépare bien le front-end et le back-end pour une meilleure maintenabilité.';
  }

  if (q.includes('login') || q.includes('inscription') || q.includes('auth')) {
    return 'Pour l\'authentification, vérifie le nom, l\'email et le mot de passe côté client, puis stocke les comptes de façon sécurisée côté serveur si possible.';
  }

  return `Je ne peux pas joindre Claude depuis cette page (${errorDetail}). Mais je peux quand même répondre : ${question} — explique ton problème et je te donne un conseil technique.`;
}

function queryDataset(question) {
  const q = question.toLowerCase();
  if (q.includes('phishing') || q.includes('hameçonnage')) {
    const phishing = securityIncidents.find(item => item.type.toLowerCase().includes('phishing'));
    if (phishing) {
      return `Dernier phishing: ${phishing.date}, source ${phishing.source}, niveau de risque ${phishing.severity}. Description: ${phishing.description}`;
    }
  }

  if (q.includes('prochain') || q.includes('plus proche') || q.includes('closest') || q.includes('next')) {
    const now = new Date(2026, 3, 16);
    const upcoming = eventsData
      .map(evt => ({
        ...evt,
        parsed: new Date(2026, 3, parseInt(evt.date.match(/\d+/)?.[0] || '0', 10))
      }))
      .filter(evt => evt.parsed >= now)
      .sort((a, b) => a.parsed - b.parsed);
    if (upcoming.length) {
      const next = upcoming[0];
      return `Le prochain événement est ${next.title} le ${next.date} à ${next.time} (${next.summary}).`;
    }
  }

  if (q.includes('risque') || q.includes('risk') || q.includes('severity') || q.includes('niveau')) {
    const relevant = datasetEntries.find(item => {
      return item.title && q.includes(item.title.toLowerCase()) || item.category && q.includes(item.category.toLowerCase());
    });
    if (relevant && relevant.severity) {
      return `D'après le dataset, ${relevant.title} a un niveau de risque ${relevant.severity}.`; 
    }
  }

  if (q.includes('budget') || q.includes('coût') || q.includes('cost')) {
    const relevant = eventsData.find(evt => q.includes(evt.title.toLowerCase()) || q.includes(evt.category));
    if (relevant) {
      return `Le budget prévu pour ${relevant.title} est de ${relevant.budget} TND.`;
    }
    return `Les événements ont ces budgets : Robotics Challenge ${eventsData[0].budget} TND, AI Workshop ${eventsData[1].budget} TND, Hackathon VITAL ${eventsData[2].budget} TND.`;
  }

  if (q.includes('meeting') || q.includes('réunion') || q.includes('coordination') || q.includes('planification')) {
    const relevant = eventsData.find(evt => q.includes(evt.title.toLowerCase()) || q.includes(evt.category));
    if (relevant) {
      return `La réunion associée à ${relevant.title} est : ${relevant.meeting}.`;
    }
    return `Les événements disposent de réunions de suivi : Robotics Challenge (circuits/tests), AI Workshop (slides/dataset), Hackathon VITAL (jury/sponsors).`;
  }

  if (q.includes('priority') || q.includes('priorité')) {
    const relevant = eventsData.find(evt => q.includes(evt.title.toLowerCase()) || q.includes(evt.category));
    if (relevant) {
      return `La priorité de ${relevant.title} est ${relevant.priority}.`;
    }
    return `Priorités : Robotics Challenge High, AI Workshop Medium, Hackathon VITAL Critical.`;
  }

  if (q.includes('date') && q.includes('event')) {
    const next = eventsData[0];
    return `Voici un événement disponible: ${next.title} le ${next.date} à ${next.time} (${next.summary}).`;
  }

  if (q.includes('dataset') || q.includes('data')) {
    return `Je peux utiliser le dataset interne du club pour répondre: ${datasetEntries.length} éléments chargés, y compris incidents de sécurité et événements.`;
  }

  return null;
}

function querySecurityDataset(question) {
  const q = question.toLowerCase();
  const matches = securityIncidents.filter(item => {
    if (q.includes('sql') || q.includes('injection')) return item.type.toLowerCase().includes('sql');
    if (q.includes('xss')) return item.type.toLowerCase().includes('xss');
    if (q.includes('brute')) return item.type.toLowerCase().includes('brute');
    return q.includes(item.source.toLowerCase()) || q.includes(item.type.toLowerCase()) || q.includes(item.description.toLowerCase());
  });
  if (!matches.length) return null;
  const first = matches[0];
  return `Dans la base de données, il y a ${matches.length} incident(s) liés à ta requête. Exemple: ${first.type} détecté le ${first.date} sur ${first.source} — ${first.description}`;
}

function toggleSecurityDb() {
  const panel = document.getElementById('security-db-panel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  renderSecurityDb();
}

function renderSecurityDb() {
  const table = document.getElementById('security-db-table');
  if (!table) return;
  table.innerHTML = securityIncidents.map(item =>
    `<div style="margin-bottom:12px; border-bottom:1px solid #1a2040; padding-bottom:10px;">
      <div style="font-size:12px; font-weight:700; color:#e2e8f0;">${item.type} · ${item.severity}</div>
      <div style="font-size:11px; color:#cbd5e0; margin:6px 0;">${item.description}</div>
      <div style="font-size:10px; color:#718096;">${item.date} · ${item.source}</div>
    </div>`
  ).join('');
}

async function generateHash() {
  const input = document.getElementById('hash-input');
  const result = document.getElementById('hash-result');
  const text = input.value || '';
  if (!text.trim()) {
    result.textContent = 'Entre un texte pour générer le hash.';
    return;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  result.textContent = `SHA-256: ${hashHex}`;
}

function setAdminView(detailOpen) {
  document.querySelector('#s-admin .stat-grid').style.display = detailOpen ? 'none' : 'grid';
  document.querySelectorAll('#s-admin .admin-row').forEach(row => row.style.display = detailOpen ? 'none' : 'flex');
  document.querySelector('#s-admin .vbtn.danger.full').style.display = detailOpen ? 'none' : 'block';
  document.getElementById('admin-detail').style.display = detailOpen ? 'block' : 'none';
}

function showAdminDetail(action) {
  const detail = document.getElementById('admin-detail');
  const title = document.getElementById('admin-detail-title');
  const text = document.getElementById('admin-detail-text');
  const body = document.getElementById('admin-detail-body');

  const actions = {
    users: {
      title: 'Gérer Utilisateurs',
      text: 'Version démo : les modifications nécessitent un backend réel pour gérer les rôles et les permissions.',
      body: `<div style="display:flex; flex-direction:column; gap:10px;">
        <div class="vcard" style="--accent:#9D4EDD; padding:12px;">
          <div class="vcard-title">Utilisateur : Aziz</div>
          <div class="vcard-text">Role: ADMIN · Statut: actif</div>
        </div>
        <div class="vcard" style="--accent:#00FF88; padding:12px;">
          <div class="vcard-title">Utilisateur : Sarah</div>
          <div class="vcard-text">Role: MEMBER · Statut: actif</div>
        </div>
        <div class="vcard" style="--accent:#FFB020; padding:12px;">
          <div class="vcard-title">Utilisateur : Guest</div>
          <div class="vcard-text">Role: GUEST · Statut: en attente</div>
        </div>
      </div>`
    },
    events: {
      title: 'Publier Événement',
      text: 'Version démo : ajoute un événement et enverra les données à un backend sécurisé.',
      body: `<div style="display:flex; flex-direction:column; gap:10px;">
        <div class="vcard" style="--accent:#00D9FF; padding:12px;">
          <div class="vcard-title">Robotics Challenge</div>
          <div class="vcard-text">Date: 20 Avr · Salle B12 · 120 inscrits</div>
        </div>
        <div class="vcard" style="--accent:#9D4EDD; padding:12px;">
          <div class="vcard-title">AI Workshop</div>
          <div class="vcard-text">Date: 22 Avr · 15h00 · 85 inscrits</div>
        </div>
      </div>`
    },
    analytics: {
      title: 'Analytics Dashboard',
      text: 'Version démo : métriques statiques, remplace avec ton vrai tableau de bord plus tard.',
      body: `<div class="stat-grid" style="margin-top:10px;">
        <div class="stat-card"><span class="stat-val">82%</span><span class="stat-lbl">Participation</span></div>
        <div class="stat-card"><span class="stat-val" style="color:#00FF88;">4.9/5</span><span class="stat-lbl">Satisfaction</span></div>
        <div class="stat-card"><span class="stat-val" style="color:#9D4EDD;">11</span><span class="stat-lbl">Nouveaux Projets</span></div>
      </div>`
    },
    logs: {
      title: 'Logs Sécurité',
      text: 'Historique des actions de sécurité. Ici c’est une simulation locale.',
      body: `<div style="display:flex; flex-direction:column; gap:10px;">
        <div class="vcard" style="--accent:#00FF88; padding:12px;">
          <div class="vcard-title">[12:05] Connexion réussie</div>
          <div class="vcard-text">Utilisateur: aziz@example.com · IP: 192.168.1.18</div>
        </div>
        <div class="vcard" style="--accent:#9D4EDD; padding:12px;">
          <div class="vcard-title">[12:23] Changement de rôle</div>
          <div class="vcard-text">Utilisateur: sarah@example.com · nouveau rôle: MEMBER</div>
        </div>
        <div class="vcard" style="--accent:#FFB020; padding:12px;">
          <div class="vcard-title">[12:45] Lecture logs</div>
          <div class="vcard-text">Administration: consultation de l'archive de sécurité</div>
        </div>
      </div>`
    }
  };

  const selected = actions[action] || actions.users;
  title.textContent = selected.title;
  text.textContent = selected.text;
  body.innerHTML = selected.body;
  setAdminView(true);
}

function hideAdminDetail() {
  const body = document.getElementById('admin-detail-body');
  body.innerHTML = '';
  setAdminView(false);
}

function addBubble(text, type) {
  const list = document.getElementById('chat-list');
  const div = document.createElement('div');  
  const id = 'b' + Date.now();
  div.id = id;
  div.className = 'bubble ' + type;
  div.textContent = text;
  list.appendChild(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return id;
}

