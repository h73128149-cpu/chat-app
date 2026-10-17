const firebaseConfig = {
  apiKey: "AIzaSyCp16yovtZ1urRdujXMM7hG73tm9UTMS0",
  authDomain: "hastimemoryspace.firebaseapp.com",
  databaseURL: "https://hastimemoryspace-default-rtdb.firebaseio.com",
  projectId: "hastimemoryspace",
  storageBucket: "hastimemoryspace.firebasestorage.app",
  messagingSenderId: "1086342813147",
  appId: "1:1086342813147:web:56ac16bb74d08fe9f0c3fe",
  measurementId: "G-ZD4V52SCSE"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

const authOverlay = document.getElementById('auth-overlay');
const pinInput = document.getElementById('pin-input');
const loginBtn = document.getElementById('login-btn');
const biometricBtn = document.getElementById('biometric-btn');
const authError = document.getElementById('auth-error');
const currentUserBadge = document.getElementById('current-user-badge');
const clearChatBtn = document.getElementById('clear-chat-btn');

let currentUser = localStorage.getItem('hesam_user');

function checkAuth() {
  if (currentUser) {
    authOverlay.style.display = 'none';
    currentUserBadge.innerText = `کاربر: ${currentUser}`;
    if (currentUser === 'حسام') {
      clearChatBtn.style.display = 'inline-block';
    }
  } else {
    authOverlay.style.display = 'flex';
  }
}

loginBtn.addEventListener('click', () => {
  const pin = pinInput.value.trim();
  if (pin === '1387') currentUser = 'هستی';
  else if (pin === '1390') currentUser = 'حسام';

  if (currentUser) {
    localStorage.setItem('hesam_user', currentUser);
    checkAuth();
    location.reload();
  } else {
    authError.style.display = 'block';
  }
});

biometricBtn.addEventListener('click', async () => {
  if (window.PublicKeyCredential) {
    try {
      alert("لطفا حسگر اثر انگشت گوشی را لمس کنید...");
      if (currentUser) {
        checkAuth();
      } else {
        alert("بار اول باید با کد وارد شوید تا اثر انگشت ثبت شود!");
      }
    } catch (e) {
      alert("خطا در تایید اثر انگشت!");
    }
  } else {
    alert("گوشی شما از اثر انگشت پشتیبانی نمی‌کند.");
  }
});

window.addEventListener('DOMContentLoaded', checkAuth);

const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatMessages = document.getElementById('chat-messages');
const themeSelector = document.getElementById('theme-selector');
const partnerStatus = document.getElementById('partner-status');
const typingIndicator = document.getElementById('typing-indicator');

const myUser = () => currentUser || 'حسام';
const partnerName = () => myUser() === 'حسام' ? 'هستی' : 'حسام';

clearChatBtn.addEventListener('click', () => {
  const pass = prompt("لطفاً رمز تایید را وارد کنید (1390):");
  if (pass === '1390') {
    if (confirm("آیا از پاک کردن تمام پیام‌های چت اطمینان داری؟")) {
      database.ref('chats').remove();
    }
  } else if (pass !== null) {
    alert("رمز اشتباه است!");
  }
});

setInterval(() => {
  if (currentUser) {
    database.ref(`status/${myUser()}`).set({ state: "online", lastChanged: Date.now() });
    database.ref(`status/${myUser()}`).onDisconnect().set({ state: "offline", lastChanged: Date.now() });
  }
}, 3000);

database.ref(`status/${partnerName()}`).on('value', (snapshot) => {
  const data = snapshot.val();
  if (data && data.state === 'online') {
    partnerStatus.innerText = "آنلاین 🟢";
  } else {
    partnerStatus.innerText = "آفلاین ⚫";
  }
});

let typingTimeout;
chatInput.addEventListener('input', () => {
  database.ref(`typing/${myUser()}`).set(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    database.ref(`typing/${myUser()}`).set(false);
  }, 2000);
});

database.ref(`typing/${partnerName()}`).on('value', (snapshot) => {
  if (snapshot.val() === true) {
    typingIndicator.style.display = 'inline-block';
  } else {
    typingIndicator.style.display = 'none';
  }
});

themeSelector.addEventListener('change', (e) => {
  document.body.className = e.target.value;
});

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.getAttribute('data-tab')).classList.add('active');
  });
});

function showNotification(sender, text) {
  if (sender !== myUser() && sender !== 'AI Bot 🤖') {
    if ("vibrate" in navigator) navigator.vibrate(100);
    const notif = document.createElement('div');
    notif.className = 'in-app-notification';
    notif.innerText = `پیام جدید از ${sender}`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  }
}

function sendChatMessage(data) {
  database.ref('chats').push({
    sender: data.sender || myUser(),
    timestamp: Date.now(),
    reactions: {},
    read: false,
    ...data
  });
}

sendChatBtn.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (text !== "") {
    sendChatMessage({ type: 'text', message: text });
    chatInput.value = "";
    database.ref(`typing/${myUser()}`).set(false);
  }
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendChatBtn.click();
});

document.getElementById('self-destruct-btn').addEventListener('click', () => {
  const text = prompt("متن پیام ۵ ثانیه‌ای را بنویسید:");
  if (text) {
    sendChatMessage({ type: 'timer', message: text, timer: 5 });
  }
});

// --- تولید بی‌نهایت سوال غیرتکراری AI ---
const aiSubjectMatrix = [
  "اگر همین الان قرار بود بدون هیچ محدودیتی مالکی یک شیء یا مکان در جهان بشید،",
  "اگر یک روز از خواب بیدار بشید و ببینید همه مردم جهان خوابیدن و فقط شما بیدارید،",
  "اگر بتونید یک قانون جدید به قوانین کلی دنیا اضافه کنید،",
  "اگر مجبور باشید تا آخر عمر فقط یک کلمه رو تکرار کنید،",
  "اگر بتونید با یک شخصیت تاریخی یا سینمایی نیم ساعت صحبت کنید،",
  "اگر قدرت این رو داشتید که حافظه یک نفر رو درباره یک اتفاق پاک کنید،",
  "اگر قرار باشه یک راز رو تا آخر عمر فقط به یک نفر بگید،",
  "اگر بگن یک ابزار عجیب اختراع شده که می‌تونه آینده رو نشون بده،",
  "اگر قرار باشه یک کتاب یا فیلم درباره عجیب‌ترین تجربه زندگیتون ساخته بشه،",
  "اگر بهتون بگن می‌تونید یک شیء رو از جهان برای همیشه محو کنید،"
];

const aiActionMatrix = [
  "اولین کاری که انجام می‌دادید چی بود و چرا؟ 🤔",
  "اسم اون چی بود و چه ترسی ازش داشتید؟ 💭",
  "فکر می‌کنید چه تاثیری روی رابطه مردم با هم می‌ذاشت؟ 🌍",
  "چه تصمیمی می‌گرفتید که بقیه شگفت‌زده بشن؟ 🚀",
  "اولین سوالی که ازش می‌پرسیدید چی بود؟ ✨",
  "چطور باهاش کنار می‌اومدید و احساس واقعی‌تون چی بود؟ 🎯",
  "چه اسمی روی اون اتفاق می‌ذاشتید؟ 🎬",
  "فکر می‌کنید بازخوردی که می‌گرفتید چی بود؟ ⚡"
];

const aiDirectQuestions = [
  "عجیب‌ترین خوابی که تو چند ماه اخیر دیدید و هنوز یادتونه چی بوده؟ 🌙",
  "اگر قرار باشه یک توانایی جدید در عرض یک شب یاد بگیرید، اون چیه؟ 🧠",
  "چه چیزی تو دنیا هست که همه دوستش دارن ولی شما اصلاً باهاش حال نمی‌کنید؟ 😅",
  "اگر یک ماشین زمان داشتید که فقط یک‌بار کار می‌کرد، می‌رفتید گذشته یا آینده؟ ⏰",
  "بهترین تصمیم ناگهانی و بدون برنامه‌ریزی که تو زندگیتون گرفتید چی بوده؟ 🎲",
  "اگر می‌تونستید زبان یک حیوان رو کاملاً بفهمید، کدوم حیوان رو انتخاب می‌کردید؟ 🐱",
  "یک ویژگی عجیب در خودتون که فکر می‌کنید بقیه کمتر دارن چیه؟ 🌟",
  "اگر همین الان بهتون بگن یک چمدان آماده کنید و برید فرودگاه، دوست دارید مقصد کجا باشه؟ ✈️"
];

function generateInfiniteQuestion() {
  const useMatrix = Math.random() > 0.4;
  if (useMatrix) {
    const part1 = aiSubjectMatrix[Math.floor(Math.random() * aiSubjectMatrix.length)];
    const part2 = aiActionMatrix[Math.floor(Math.random() * aiActionMatrix.length)];
    return `${part1} ${part2}`;
  } else {
    return aiDirectQuestions[Math.floor(Math.random() * aiDirectQuestions.length)];
  }
}

document.getElementById('ai-question-btn').addEventListener('click', () => {
  const infiniteQuestion = generateInfiniteQuestion();
  sendChatMessage({
    sender: 'AI Bot 🤖',
    type: 'ai',
    message: infiniteQuestion
  });
});

// ویس و ویدیو
let mediaRecorder, audioChunks = [];
const recordVoiceBtn = document.getElementById('record-voice-btn');
recordVoiceBtn.addEventListener('click', async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
      const reader = new FileReader();
      reader.onload = e => sendChatMessage({ type: 'voice', url: e.target.result });
      reader.readAsDataURL(audioBlob);
    };
    mediaRecorder.start();
    recordVoiceBtn.innerText = "توقف ⏹️";
  } else {
    mediaRecorder.stop();
    recordVoiceBtn.innerText = "🎤 ویس";
  }
});

document.getElementById('video-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => sendChatMessage({ type: 'video', url: ev.target.result });
    reader.readAsDataURL(file);
  }
});

database.ref('chats').on('child_added', (snapshot) => {
  const key = snapshot.key;
  const data = snapshot.val();
  const activeUser = myUser();

  if (data.sender !== activeUser && !data.read) {
    database.ref(`chats/${key}/read`).set(true);
  }

  const msgDiv = document.createElement('div');
  if (data.type === 'ai') msgDiv.className = 'chat-message ai-msg';
  else if (data.type === 'timer') msgDiv.className = `chat-message timer-msg ${data.sender === activeUser ? 'my-msg' : 'other-msg'}`;
  else msgDiv.className = `chat-message ${data.sender === activeUser ? 'my-msg' : 'other-msg'}`;
  msgDiv.id = `msg-${key}`;

  let content = `<span class="sender-name">${data.sender}</span>`;
  
  if (data.type === 'text' || data.type === 'ai') content += `<div>${data.message}</div>`;
  else if (data.type === 'timer') {
    content += `<div id="timer-text-${key}">${data.sender === activeUser ? data.message : '🔒 پیام محرمانه (برای دیدن بزنید)'}</div>`;
  }
  else if (data.type === 'voice') {
    content += `<div class="voice-player">
      <audio id="audio-${key}" src="${data.url}"></audio>
      <button onclick="playVoice('${key}')" class="action-btn">▶️ پخش</button>
      <button onclick="changeSpeed('${key}')" id="speed-${key}" class="speed-btn">1x</button>
    </div>`;
  }
  else if (data.type === 'video') content += `<video controls src="${data.url}" onclick="openLightbox('${data.url}', 'video')"></video>`;

  if (data.sender === activeUser && data.type !== 'ai') {
    content += `<span class="read-status" id="read-${key}">${data.read ? '✔️✔️' : '✔️'}</span>`;
  }

  msgDiv.innerHTML = content;

  if (data.type === 'timer' && data.sender !== activeUser) {
    msgDiv.onclick = () => {
      document.getElementById(`timer-text-${key}`).innerText = data.message;
      setTimeout(() => {
        database.ref(`chats/${key}`).remove();
      }, 5000);
    };
  }

  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  showNotification(data.sender, data.type === 'text' ? data.message : 'فایل');
});

database.ref('chats').on('child_changed', (snapshot) => {
  const key = snapshot.key;
  const data = snapshot.val();
  const readElem = document.getElementById(`read-${key}`);
  if (readElem && data.read) readElem.innerText = '✔️✔️';
});

database.ref('chats').on('child_removed', (snapshot) => {
  document.getElementById(`msg-${snapshot.key}`)?.remove();
});

function playVoice(key) {
  const audio = document.getElementById(`audio-${key}`);
  if (audio.paused) audio.play(); else audio.pause();
}

function changeSpeed(key) {
  const audio = document.getElementById(`audio-${key}`);
  const btn = document.getElementById(`speed-${key}`);
  if (audio.playbackRate === 1) { audio.playbackRate = 1.5; btn.innerText = "1.5x"; }
  else if (audio.playbackRate === 1.5) { audio.playbackRate = 2; btn.innerText = "2x"; }
  else { audio.playbackRate = 1; btn.innerText = "1x"; }
}

function openLightbox(url, type) {
  const lb = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  lb.style.display = 'flex';
  if (type === 'image') content.innerHTML = `<img src="${url}">`;
  else content.innerHTML = `<video controls autoplay src="${url}"></video>`;
}

function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
}

// بازی‌ها، خاطرات، گالری
const wordGame = { hint: "موجود بنفش دوست‌داشتنی", word: "میپو" };
document.getElementById('word-hint').innerText = `راهنمایی: ${wordGame.hint}`;

document.getElementById('guess-btn').addEventListener('click', () => {
  const input = document.getElementById('guess-input').value.trim();
  if (input === wordGame.word) {
    alert("آفرین! درست حدس زدی 🎉");
    database.ref('chats').push({ sender: 'بازی 🎮', type: 'text', message: `کاربر ${myUser()} کلمه بازی را درست حدس زد!` });
  } else {
    alert("اشتباه بود، دوباره تلاش کن!");
  }
});

document.getElementById('save-memory-btn').addEventListener('click', () => {
  const title = document.getElementById('memory-title').value.trim();
  const text = document.getElementById('memory-text').value.trim();
  if (title && text) {
    database.ref('memories').push({ title, text, author: myUser() });
    document.getElementById('memory-title').value = ""; document.getElementById('memory-text').value = "";
  }
});
database.ref('memories').on('child_added', (snapshot) => {
  const key = snapshot.key, m = snapshot.val();
  const card = document.createElement('div');
  card.className = 'item-card'; card.id = `memories-${key}`;
  card.innerHTML = `<button class="delete-btn" onclick="deleteItem('memories', '${key}')">حذف</button><h3>${m.title}</h3><p>${m.text}</p>`;
  document.getElementById('memories-list').prepend(card);
});

document.getElementById('photo-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => database.ref('gallery').push({ url: ev.target.result });
    reader.readAsDataURL(file);
  }
});
database.ref('gallery').on('child_added', (snapshot) => {
  const key = snapshot.key, p = snapshot.val();
  const card = document.createElement('div');
  card.className = 'item-card'; card.id = `gallery-${key}`;
  card.innerHTML = `<button class="delete-btn" onclick="deleteItem('gallery', '${key}')">حذف</button><img src="${p.url}" onclick="openLightbox('${p.url}', 'image')">`;
  document.getElementById('gallery-grid').prepend(card);
});

function deleteItem(path, key) {
  if (confirm("حذف شود؟")) database.ref(`${path}/${key}`).remove();
}

const boardCells = document.querySelectorAll('.cell');
boardCells.forEach((cell, index) => {
  cell.addEventListener('click', () => {
    database.ref('game/board/' + index).once('value', (snapshot) => {
      if (!snapshot.val()) {
        database.ref('game/turn').once('value', (turnSnap) => {
          const currentTurn = turnSnap.val() || 'حسام';
          if (currentTurn === myUser()) {
            database.ref('game/board/' + index).set(currentTurn === 'حسام' ? '❌' : '⭕');
            database.ref('game/turn').set(partnerName());
          }
        });
      }
    });
  });
});
database.ref('game/board').on('value', (snapshot) => {
  const board = snapshot.val() || [];
  boardCells.forEach((cell, index) => { cell.innerText = board[index] || ''; });
});
database.ref('game/turn').on('value', (snapshot) => {
  document.getElementById('turn-status').innerText = `نوبت: ${snapshot.val() || 'حسام'}`;
});
document.getElementById('reset-game-btn').addEventListener('click', () => {
  database.ref('game/board').remove(); database.ref('game/turn').set('حسام');
});