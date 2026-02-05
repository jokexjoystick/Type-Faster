/* ---------- AUDIO ENGINE ---------- */
const SFX = {
    ctx: null,
    init: function() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    playTone: function(freq, type, duration, vol = 0.1, slide = 0) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if(slide !== 0) {
             osc.frequency.exponentialRampToValueAtTime(freq + slide, this.ctx.currentTime + duration);
        }
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    click: function() {
        this.init();
        this.playTone(600, 'square', 0.05, 0.05); // Mechanical Click
    },
    type: function() {
        this.init();
        // Randomized pitch for natural typing feel
        const pitch = 800 + Math.random() * 200;
        this.playTone(pitch, 'triangle', 0.1, 0.05);
    },
    error: function() {
        this.init();
        this.playTone(150, 'sawtooth', 0.2, 0.1, -50); // Glitch sound
    },
    waveSuccess: function() {
        this.init();
        // High-tech chord
        this.playTone(440, 'sine', 0.4, 0.1);
        setTimeout(() => this.playTone(880, 'sine', 0.4, 0.1), 50);
        setTimeout(() => this.playTone(1320, 'square', 0.3, 0.05), 100);
    },
    waveFail: function() {
        this.init();
        // Power down sound
        this.playTone(200, 'sawtooth', 0.4, 0.15, -150);
        setTimeout(() => this.playTone(180, 'square', 0.4, 0.1, -140), 50);
    }
};

/* ---------- WORDS ---------- */
const AI = {
  easy: ["neon","flux","grid","wave","core","bit","byte","run","void","null","zero","one","link","node","code","key","lock","sync","warp","echo"],
  medium: ["system","matrix","vector","pixel","laser","cyber","neural","logic","proxy","server","client","script","binary","router","buffer"],
  hard: ["encryption","mainframe","protocol","bandwidth","algorithm","processor","interface","recursive","heuristic","firewall","checksum"]
};

/* ---------- SETUP ---------- */
const keyboard = document.getElementById("keyboard");
const container = document.getElementById("text-container");
const cursor = document.getElementById("cursor");
const validKeys = "abcdefghijklmnopqrstuvwxyz,.".split("");

// Build Keyboard
validKeys.forEach((k,i)=>{
  const angle = (i-14) * 6; 
  const r = 320;
  const x = 450 + Math.sin(angle*Math.PI/180) * r;
  const y = 80 + Math.cos(angle*Math.PI/180) * r/2;
  
  const d = document.createElement("div");
  d.className = "key";
  d.dataset.key = k;
  d.textContent = k;
  d.style.left = x+"px";
  d.style.top = y+"px";
  keyboard.appendChild(d);
});

let rawText=[], cmpText=[], idx=0;
let correct=0, total=0, combo=0, start=null;
let timerInterval=null, timeLimit=60, timeLeft=60, isGameOver=false;

const circle = document.getElementById('progress-ring');
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
circle.style.strokeDasharray = `${circumference} ${circumference}`;

function setProgress(percent) {
  circle.style.strokeDashoffset = circumference - (percent / 100) * circumference;
}

/* ---------- GAME CORE ---------- */
function load(){
  SFX.click(); // Audio for Restart/Load
  document.getElementById("modal-overlay").style.display = "none";
  container.className = "";
  
  timeLimit = parseInt(document.getElementById("time-select").value);
  timeLeft = timeLimit;
  
  while(container.children.length > 1) container.removeChild(container.lastChild);
  
  const diff = document.getElementById("difficulty").value;
  let txt = "";
  for(let i=0; i<30; i++) txt += getWord(diff);
  
  rawText = txt.split("");
  cmpText = rawText.map(c=>c.toLowerCase());
  
  rawText.forEach(char => {
      const s = document.createElement("span");
      s.className = "char";
      s.textContent = char;
      container.appendChild(s);
  });
  
  idx=correct=total=combo=0;
  start=null; isGameOver=false;
  
  updateCursor();
  updateStats();
  clearInterval(timerInterval);
  setProgress(100);
}

function getWord(level){
    const list = AI[level];
    return list[Math.random() * list.length | 0] + " ";
}

function startTimer(){
  timerInterval = setInterval(() => {
    timeLeft--;
    setProgress((timeLeft/timeLimit)*100);
    if(timeLeft <= 0) finish();
  }, 1000);
}

function finish(){
  clearInterval(timerInterval);
  isGameOver = true;
  const mins = timeLimit / 60;
  document.getElementById("final-wpm").textContent = Math.round((correct/5)/mins||0);
  document.getElementById("final-acc").textContent = Math.round((correct/Math.max(total,1))*100)+"%";
  document.getElementById("modal-overlay").style.display = "flex";
  SFX.waveFail(); // End game sound
}

/* ---------- FX ENGINE ---------- */
function spawnParticles(count){
    const charEl = container.children[idx+1];
    if(!charEl) return;
    const rect = charEl.getBoundingClientRect();
    
    for(let i=0; i<count; i++){
        const p = document.createElement("div");
        p.className = "particle";
        const tx = (Math.random() - 0.5) * 50;
        const ty = (Math.random() - 0.5) * 50;
        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        p.style.left = (rect.left + rect.width/2) + "px";
        p.style.top = (rect.top + rect.height/2) + "px";
        p.style.width = Math.random() * 4 + 2 + "px";
        p.style.height = p.style.width;
        p.style.background = `hsl(${Math.random()*60 + 120}, 100%, 50%)`;
        
        document.body.appendChild(p);
        setTimeout(()=>p.remove(), 600);
    }
}

function triggerEnergyWave(){
    SFX.waveSuccess(); // Audio for Word Complete
    keyboard.classList.remove("shock");
    keyboard.classList.remove("shock-error"); 
    void keyboard.offsetWidth; 
    keyboard.classList.add("shock");

    const kbRect = keyboard.getBoundingClientRect();
    const centerX = kbRect.width / 2;
    const centerY = kbRect.height + 50; 

    [...keyboard.children].forEach(key => {
        const kLeft = parseFloat(key.style.left);
        const kTop = parseFloat(key.style.top);
        const dist = Math.sqrt(Math.pow(kLeft - centerX, 2) + Math.pow(kTop - centerY, 2));
        const delay = dist * 0.5; 
        
        setTimeout(() => {
            key.classList.remove("ripple");
            key.classList.remove("ripple-error");
            void key.offsetWidth;
            key.classList.add("ripple");
        }, delay);
    });
}

function triggerErrorWave(){
    SFX.waveFail(); // Audio for Word Fail
    keyboard.classList.remove("shock");
    keyboard.classList.remove("shock-error");
    void keyboard.offsetWidth; 
    keyboard.classList.add("shock-error"); 

    const kbRect = keyboard.getBoundingClientRect();
    const centerX = kbRect.width / 2;
    const centerY = kbRect.height + 50; 

    [...keyboard.children].forEach(key => {
        const kLeft = parseFloat(key.style.left);
        const kTop = parseFloat(key.style.top);
        const dist = Math.sqrt(Math.pow(kLeft - centerX, 2) + Math.pow(kTop - centerY, 2));
        const delay = dist * 0.4; 
        
        setTimeout(() => {
            key.classList.remove("ripple");
            key.classList.remove("ripple-error");
            void key.offsetWidth;
            key.classList.add("ripple-error"); 
        }, delay);
    });
}

function shakeScreen(){
    container.classList.remove("shake");
    void container.offsetWidth;
    container.classList.add("shake");
    container.style.borderColor = "var(--bad)";
    setTimeout(()=> container.style.borderColor = "rgba(255,255,255,0.1)", 400);
}

function flashWordError(){
    shakeScreen();
    for(let i = 0; i <= idx; i++){
        const el = container.children[i+1];
        if(el){
            el.classList.remove("error-flash");
            void el.offsetWidth;
            el.classList.add("error-flash");
        }
    }
}

function triggerKey(key, status){
    const k = [...keyboard.children].find(x=>x.dataset.key===key);
    if(k){
        k.className = `key ${status}`;
        setTimeout(()=> k.className = "key", 150);
    }
}

function updateCursor(){
    const charEl = container.children[idx+1]; 
    if(charEl){
        cursor.style.display = "block";
        cursor.style.transform = `translate(${charEl.offsetLeft}px, ${charEl.offsetTop}px)`;
        cursor.style.width = charEl.offsetWidth + "px";
        cursor.style.height = charEl.offsetHeight + "px";
        if(idx === 0) cursor.style.boxShadow = "0 0 15px var(--accent2)";
    }
}

/* ---------- INPUT LOGIC ---------- */
document.addEventListener("keydown", e => {
  SFX.init(); // Ensure audio context starts on first interaction
  if(isGameOver) return;
  const k = e.key;

  if(idx >= cmpText.length && k !== "Backspace") return;

  // SPACE TRIGGER
  if(k === " "){
      e.preventDefault();
      
      const isAtSpace = cmpText[idx] === " ";
      let hasErrors = false;
      
      for(let i=0; i<idx; i++){
          if(container.children[i+1].classList.contains("wrong")) hasErrors = true;
      }

      if(isAtSpace && !hasErrors){
          correct++; total++; combo++;
          spawnParticles(5);
          triggerEnergyWave(); // Audio handled inside this function
          
          const removeCount = idx + 1;
          rawText.splice(0, removeCount);
          cmpText.splice(0, removeCount);
          
          for(let i=0; i<removeCount; i++) container.removeChild(container.children[1]);
          
          const newChars = getWord(document.getElementById("difficulty").value).split("");
          rawText.push(...newChars);
          cmpText = rawText.map(c=>c.toLowerCase());
          
          newChars.forEach(c => {
              const s = document.createElement("span");
              s.className = "char";
              s.textContent = c;
              container.appendChild(s);
          });
          
          idx = 0;
          updateCursor();
          updateStats();
      } else {
          flashWordError();
          triggerErrorWave(); // Audio handled inside this function
          combo = 0;
          updateStats();
      }
      return;
  }

  const lowerK = k.toLowerCase();
  if(validKeys.includes(lowerK) || (k===" " && cmpText[idx]===" ")){
      if(!start) { start=Date.now(); startTimer(); }
      
      const span = container.children[idx+1];
      if(!span) return; 

      total++;
      
      if(lowerK === cmpText[idx]){
          SFX.type(); // Correct Key Audio
          span.classList.add("correct");
          correct++; combo++;
          spawnParticles(2);
          triggerKey(lowerK, "hit");
                    if(combo > 10 && combo % 10 === 0) {
              const statBox = document.getElementById("combo").parentNode;
              statBox.style.transform = "scale(1.5)";
              setTimeout(()=>statBox.style.transform="scale(1)", 200);
          }
      } else {
          SFX.error(); // Wrong Key Audio
          span.classList.add("wrong");
          combo=0;
          shakeScreen();
          triggerKey(lowerK, "miss");
      }
      
      idx++;
      updateCursor();
      updateStats();
  }
  
  if(k === "Backspace" && idx > 0){
      SFX.type(); // Backspace sound
      idx--;
      const span = container.children[idx+1];
      
      if(span.classList.contains("correct")) correct--;
      if(span.classList.contains("correct") || span.classList.contains("wrong")) total--;
      
      span.className = "char";
      
      updateCursor();
      updateStats();
  }
});

function updateStats(){
    const mins = start ? (Date.now()-start)/60000 : 0;
    document.getElementById("wpm").textContent = start ? Math.round((correct/5)/(mins || 0.0001)) : 0;
    document.getElementById("acc").textContent = Math.round((correct/Math.max(total,1))*100)+"%";
    document.getElementById("combo").textContent = combo;
}

// Add Button Sound Listeners
["restart", "difficulty", "time-select"].forEach(id => {
    document.getElementById(id).addEventListener("click", () => SFX.click());
});
document.querySelector(".modal button").addEventListener("click", () => SFX.click());

document.getElementById("restart").onclick = load;
document.getElementById("difficulty").onchange = load;
document.getElementById("time-select").onchange = load;

load();
  
