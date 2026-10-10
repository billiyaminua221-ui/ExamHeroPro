import { useState, useEffect, useRef } from "react";
import {
  GraduationCap, Clock, Trophy, Check, X, ChevronRight, Sparkles, BookOpen,
  Calculator, FlaskConical, Globe, Loader2, RotateCcw, Home, BarChart3, Target,
  Crown, Lock, User, LogOut,
} from "lucide-react";

/* =====================================================================
   SETTINGS: the only part you need to edit before going live.
   Everything here is PUBLIC (it is visible in the browser), so never
   put secret keys in this file. Secrets go in Vercel (see DEPLOY_GUIDE).
   ===================================================================== */
const CONFIG = {
  USE_BACKEND: false,        // set true once Supabase + the /api folder are deployed
  SUPABASE_URL: "",          // e.g. "https://abcdxyz.supabase.co"
  SUPABASE_ANON_KEY: "",     // the public "anon" key from Supabase (safe to expose)
  API_BASE: "",              // "" = same website (correct for Vercel)
  DEV_PREVIEW_PREMIUM: true, // lets you TRY premium screens without paying. Ignored automatically when USE_BACKEND is true.
};

// Display prices only. The real prices live on the server in api/_lib.js.
const PLANS = [
  { id: "monthly", name: "Monthly", price: 1500, note: "30 days" },
  { id: "term", name: "Exam season", price: 3500, note: "90 days, save ₦1,000" },
];
const FREE_ROUNDS_PER_DAY = 3;
const TIME = 30;

const cloudReady = CONFIG.USE_BACKEND && !!CONFIG.SUPABASE_URL && !!CONFIG.SUPABASE_ANON_KEY;
const devPreview = CONFIG.DEV_PREVIEW_PREMIUM && !CONFIG.USE_BACKEND;

const C = {
  night: "#0A1330", panel: "#121D4A", panel2: "#1B2866", line: "#2A3878",
  gold: "#F2B91B", goldDeep: "#C98F0A", ivory: "#F5F5F0", mute: "#9AA6D1",
  good: "#3DDC97", bad: "#FF6B6B",
};
const FONT = '"Avenir Next", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif';

const EXAMS = {
  practice: { id: "practice", short: "Practice", name: "Free practice", blurb: "Your pace, your subject", forceTimer: false },
  waec: { id: "waec", short: "WAEC", name: "WAEC (WASSCE)", blurb: "WASSCE-style objective questions", forceTimer: false },
  neco: { id: "neco", short: "NECO", name: "NECO (SSCE)", blurb: "SSCE-style objective questions", forceTimer: false },
  jamb: { id: "jamb", short: "JAMB", name: "JAMB (UTME)", blurb: "CBT-style, 30 seconds per question", forceTimer: true },
};

/* ---------------------------------------------------------------------
   QUESTION BANK. These are original practice questions written for this
   app (not copied from official past papers). To add more, copy the shape:
   { q, options: [4 choices], a: index of correct option, why: explanation }
   --------------------------------------------------------------------- */
const SUBJECTS = [
  {
    id: "math", name: "Mathematics", blurb: "Algebra, geometry, sequences", icon: Calculator,
    questions: [
      { q: "What is 15% of 240?", options: ["24", "30", "36", "42"], a: 2, why: "10% of 240 is 24 and 5% is 12, so 15% is 36." },
      { q: "Solve for x: 3x + 7 = 22", options: ["3", "5", "7", "15"], a: 1, why: "Subtract 7 to get 3x = 15, then divide by 3." },
      { q: "Area of a circle with radius 7 (use π = 22/7)?", options: ["44", "154", "49", "308"], a: 1, why: "Area = πr² = 22/7 × 49 = 154." },
      { q: "What comes next: 2, 6, 18, 54, …?", options: ["108", "148", "162", "216"], a: 2, why: "Each term is multiplied by 3. 54 × 3 = 162." },
      { q: "Simplify (x² − 9) ÷ (x − 3)", options: ["x − 3", "x + 3", "x² − 3", "x + 9"], a: 1, why: "x² − 9 = (x − 3)(x + 3), so the (x − 3) cancels." },
      { q: "Probability of rolling an even number on a fair die?", options: ["1/6", "1/3", "1/2", "2/3"], a: 2, why: "Even faces are 2, 4 and 6: three out of six." },
      { q: "Sum of the interior angles of a hexagon?", options: ["540°", "720°", "900°", "1080°"], a: 1, why: "(n − 2) × 180 = 4 × 180 = 720°." },
      { q: "What is the square root of 169?", options: ["11", "12", "13", "14"], a: 2, why: "13 × 13 = 169." },
      { q: "If 2ˣ = 32, what is x?", options: ["4", "5", "6", "16"], a: 1, why: "2⁵ = 32, so x = 5." },
      { q: "Evaluate 3/4 + 2/3", options: ["5/7", "5/12", "17/12", "6/7"], a: 2, why: "Common denominator 12: 9/12 + 8/12 = 17/12." },
      { q: "A trader buys goods for ₦800 and sells for ₦1,000. What is the profit percent?", options: ["20%", "25%", "30%", "80%"], a: 1, why: "Profit is ₦200. 200/800 × 100 = 25%." },
      { q: "Find the mean of 4, 6, 8, 10 and 12.", options: ["6", "7", "8", "10"], a: 2, why: "Sum is 40. 40 ÷ 5 = 8." },
    ],
  },
  {
    id: "english", name: "English", blurb: "Vocabulary, grammar, usage", icon: BookOpen,
    questions: [
      { q: "Choose the synonym of “benevolent”.", options: ["Kind", "Hostile", "Lazy", "Nervous"], a: 0, why: "Benevolent means well-meaning and kindly." },
      { q: "Which sentence is correct?", options: ["Neither of the students have finished.", "Neither of the students has finished.", "Neither of the students are finished.", "Neither of the students were finished."], a: 1, why: "“Neither” is singular, so it takes “has”." },
      { q: "Choose the antonym of “scarce”.", options: ["Rare", "Limited", "Abundant", "Costly"], a: 2, why: "Scarce means in short supply; abundant is the opposite." },
      { q: "Which of these is a metaphor?", options: ["She runs like the wind.", "Time is a thief.", "He is as brave as a lion.", "The sun smiled down, almost."], a: 1, why: "A metaphor states one thing is another, with no “like” or “as”." },
      { q: "Pick the correct spelling.", options: ["Acommodate", "Accomodate", "Accommodate", "Acomodate"], a: 2, why: "Accommodate has double c and double m." },
      { q: "She ___ to school every day.", options: ["go", "goes", "going", "gone"], a: 1, why: "A singular third-person subject takes “goes” in the present simple." },
      { q: "What is the plural of “analysis”?", options: ["Analysises", "Analysis", "Analyses", "Analysae"], a: 2, why: "Words ending in -sis change to -ses in the plural." },
      { q: "What does “break the ice” mean?", options: ["Damage something fragile", "Start a conversation in an awkward setting", "Leave a party early", "Win an argument"], a: 1, why: "It means easing tension so people can start talking." },
      { q: "I have been living in Lagos ___ 2015.", options: ["for", "since", "from", "at"], a: 1, why: "“Since” marks a starting point in time; “for” marks a length of time." },
      { q: "Choose the synonym of “candid”.", options: ["Secretive", "Frank", "Angry", "Shy"], a: 1, why: "Candid means open and honest." },
      { q: "In “She ran quickly”, the word “quickly” is a/an:", options: ["Adjective", "Noun", "Adverb", "Pronoun"], a: 2, why: "It tells us how she ran, so it modifies a verb: an adverb." },
      { q: "“The wind whispered through the trees” is an example of:", options: ["Simile", "Personification", "Irony", "Hyperbole"], a: 1, why: "Giving a human action (whispering) to the wind is personification." },
    ],
  },
  {
    id: "science", name: "Science", blurb: "Biology, chemistry, physics", icon: FlaskConical,
    questions: [
      { q: "Which organelle is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondrion", "Golgi body"], a: 2, why: "Mitochondria release energy from food through respiration." },
      { q: "What is the chemical symbol for sodium?", options: ["So", "Na", "Sd", "S"], a: 1, why: "Na comes from the Latin name, natrium." },
      { q: "What is the SI unit of force?", options: ["Joule", "Watt", "Pascal", "Newton"], a: 3, why: "One newton is the force that gives 1 kg an acceleration of 1 m/s²." },
      { q: "Which gas do plants take in for photosynthesis?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], a: 1, why: "Plants combine CO₂ and water, using light, to make glucose." },
      { q: "Approximate speed of light in a vacuum?", options: ["3,000 km/s", "30,000 km/s", "300,000 km/s", "3,000,000 km/s"], a: 2, why: "Light travels at about 300,000 km every second." },
      { q: "What is the pH of pure, neutral water at 25°C?", options: ["0", "5", "7", "14"], a: 2, why: "pH 7 is neutral; below 7 is acidic and above 7 is basic." },
      { q: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Mars", "Earth"], a: 1, why: "Mercury orbits closest, at about 58 million km." },
      { q: "What is the atomic number of carbon?", options: ["4", "6", "8", "12"], a: 1, why: "Carbon has 6 protons, so its atomic number is 6." },
      { q: "Which blood cells help fight infection?", options: ["Red blood cells", "White blood cells", "Platelets", "Plasma"], a: 1, why: "White blood cells are the body's defence against germs." },
      { q: "A 12 V supply is connected across a 4 Ω resistor. What current flows?", options: ["0.33 A", "3 A", "8 A", "48 A"], a: 1, why: "Ohm's law: I = V ÷ R = 12 ÷ 4 = 3 A." },
      { q: "Which of these is a good conductor of electricity?", options: ["Rubber", "Glass", "Copper", "Dry wood"], a: 2, why: "Metals like copper have free electrons that carry current." },
      { q: "A stretched rubber band stores which kind of energy?", options: ["Kinetic", "Elastic potential", "Chemical", "Nuclear"], a: 1, why: "Stretching stores elastic potential energy, released when it snaps back." },
    ],
  },
  {
    id: "general", name: "General Knowledge", blurb: "World facts and history", icon: Globe,
    questions: [
      { q: "What is the capital of Nigeria?", options: ["Lagos", "Kano", "Abuja", "Ibadan"], a: 2, why: "Abuja became the capital in 1991, replacing Lagos." },
      { q: "Which is the largest continent by area?", options: ["Africa", "Asia", "North America", "Europe"], a: 1, why: "Asia covers about 44.6 million km²." },
      { q: "Who wrote “Romeo and Juliet”?", options: ["Charles Dickens", "Chinua Achebe", "William Shakespeare", "Jane Austen"], a: 2, why: "Shakespeare wrote it in the 1590s." },
      { q: "In which year did World War II end?", options: ["1918", "1939", "1945", "1963"], a: 2, why: "The war ended in 1945, with Japan's surrender in September." },
      { q: "Which is the longest river in Africa?", options: ["Congo", "Niger", "Zambezi", "Nile"], a: 3, why: "The Nile runs about 6,650 km." },
      { q: "How many continents are there?", options: ["5", "6", "7", "8"], a: 2, why: "Africa, Antarctica, Asia, Australia/Oceania, Europe, North America and South America." },
      { q: "What is the currency of Japan?", options: ["Won", "Yuan", "Yen", "Ringgit"], a: 2, why: "The Japanese yen is the national currency." },
      { q: "Which is the largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], a: 3, why: "The Pacific covers about a third of Earth's surface." },
      { q: "In what year did Nigeria become independent?", options: ["1957", "1960", "1963", "1966"], a: 1, why: "Nigeria gained independence from Britain on 1 October 1960." },
      { q: "Who was Nigeria's first Prime Minister?", options: ["Nnamdi Azikiwe", "Obafemi Awolowo", "Abubakar Tafawa Balewa", "Ahmadu Bello"], a: 2, why: "Balewa led the government at independence; Azikiwe was the ceremonial head of state." },
      { q: "The Niger and Benue rivers meet at which town?", options: ["Onitsha", "Lokoja", "Jebba", "Makurdi"], a: 1, why: "The confluence is at Lokoja, in Kogi State." },
      { q: "How many states does Nigeria have (not counting the FCT)?", options: ["30", "34", "36", "37"], a: 2, why: "Nigeria has 36 states plus the Federal Capital Territory, Abuja." },
    ],
  },
];

/* ---------------- helpers ---------------- */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const prepare = (questions, count) =>
  shuffle(questions).slice(0, count).map((item) => {
    const correctText = item.options[item.a];
    const options = shuffle(item.options);
    return { ...item, options, a: options.indexOf(correctText) };
  });

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const naira = (n) => "₦" + n.toLocaleString("en-NG");

const cleanQuestions = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter((x) => x && typeof x.q === "string" && Array.isArray(x.options) && x.options.length === 4 && Number.isInteger(x.a) && x.a >= 0 && x.a < 4)
    .map((x) => ({ q: x.q, options: x.options, a: x.a, why: x.why || "" }));

const mergeHistory = (a, b) => {
  const seen = new Set();
  return [...a, ...b]
    .filter((h) => { const k = `${h.at}|${h.name}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((x, y) => (x.at < y.at ? 1 : -1))
    .slice(0, 200);
};

const INITIAL_DATA = { history: [], daily: { date: "", rounds: 0 }, session: null, premiumUntil: null, historyOwner: null, devPremium: false };

/* ---------------- saving on the device ----------------
   Inside Claude's preview it uses window.storage; on your real website
   it uses the browser's localStorage. Either way scores survive a refresh. */
const STORE_KEY = "examhero:v2";
const store = {
  async get() {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const r = await window.storage.get(STORE_KEY);
        return r ? JSON.parse(r.value) : null;
      }
      const v = window.localStorage.getItem(STORE_KEY);
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  },
  async set(obj) {
    try {
      const text = JSON.stringify(obj);
      if (typeof window !== "undefined" && window.storage) await window.storage.set(STORE_KEY, text);
      else window.localStorage.setItem(STORE_KEY, text);
    } catch (e) { /* storage full or blocked: the app keeps working without saving */ }
  },
};

/* ---------------- AI topic questions ---------------- */
async function generateQuestions({ topic, count, exam, token }) {
  if (CONFIG.USE_BACKEND) {
    // Real site: the secret AI key stays on YOUR server (api/ai.js).
    const r = await fetch(`${CONFIG.API_BASE}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topic, count, exam }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "AI request failed");
    const list = cleanQuestions(j.questions);
    if (!list.length) throw new Error("No usable questions came back.");
    return list;
  }
  // Preview only: this direct call works INSIDE Claude's preview window and nowhere else.
  const examName = EXAMS[exam] ? EXAMS[exam].name : "secondary school";
  const prompt = `Write ${count} multiple-choice questions in the style of the ${examName} exam for Nigerian students about: "${topic}".
Each question has exactly 4 options and one correct answer. Keep explanations under 25 words.
Respond with ONLY a JSON array, no markdown: [{"q":"...","options":["A","B","C","D"],"a":0,"why":"..."}]
"a" is the zero-based index of the correct option.`;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await response.json();
  const text = data.content.map((i) => (i.type === "text" ? i.text : "")).join("");
  const list = cleanQuestions(JSON.parse(text.replace(/```json|```/g, "").trim()));
  if (!list.length) throw new Error("No valid questions");
  return list;
}

/* ---------------- accounts (Supabase over plain HTTPS) ---------------- */
const authCall = async (path, body) => {
  const r = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: CONFIG.SUPABASE_ANON_KEY },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error_description || j.msg || j.message || "Something went wrong. Try again.");
  return j;
};

const toSession = (j) => ({
  access_token: j.access_token,
  refresh_token: j.refresh_token,
  expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
  user: { id: j.user.id, email: j.user.email },
});

const rest = (path, token, opts = {}) =>
  fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: CONFIG.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

/* ---------------- small UI pieces (your original design) ---------------- */
const Mark = ({ size = 44 }) => (
  <div
    style={{
      width: size, height: size, borderRadius: size * 0.28, background: C.panel,
      border: `2px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}
  >
    <GraduationCap size={size * 0.55} color={C.gold} strokeWidth={2.2} />
  </div>
);

const Ring = ({ pct, size = 150 }) => {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={C.line} strokeWidth="10" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke={C.gold} strokeWidth="10" fill="none" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 900ms ease-out" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill={C.ivory} fontSize="38" fontWeight="800" fontFamily={FONT}>
        {pct}%
      </text>
    </svg>
  );
};

const Card = ({ children, style }) => (
  <div style={{ padding: 18, borderRadius: 16, background: C.panel, marginBottom: 14, ...style }}>{children}</div>
);

const Perk = ({ text, on }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14, lineHeight: 1.4, color: on ? C.ivory : C.mute, marginBottom: 6 }}>
    <Check size={16} color={on ? C.gold : C.mute} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{text}</span>
  </div>
);

/* ===================================================================== */
export default function ExamHeroPro() {
  const [screen, setScreen] = useState("home");
  const [exam, setExam] = useState("practice");
  const [count, setCount] = useState(5);
  const [timed, setTimed] = useState(true);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gate, setGate] = useState(null);

  const [session, setSession] = useState(null); // {name, subjectId, examId, items, timed}
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [left, setLeft] = useState(TIME);

  // saved data
  const [data, setData] = useState(INITIAL_DATA);
  const dataRef = useRef(INITIAL_DATA); // always the latest saved data, even inside async code
  const commit = (fn) => { const nd = typeof fn === "function" ? fn(dataRef.current) : fn; dataRef.current = nd; setData(nd); };
  const [premiumOk, setPremiumOk] = useState(false); // true only after the SERVER confirmed the subscription this session
  const deadlineRef = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const sessionRef = useRef(null);

  // account screen
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const history = data.history;
  const user = data.session ? data.session.user : null;
  // Premium counts only if the server confirmed it in this session (editing browser storage can't unlock it).
  const premium =
    (premiumOk && !!data.premiumUntil && new Date(data.premiumUntil) > new Date()) || (devPreview && data.devPremium);
  const roundsToday = data.daily.date === todayKey() ? data.daily.rounds : 0;

  const item = session ? session.items[idx] : null;
  const revealed = picked !== null;

  /* ----- load saved data once ----- */
  useEffect(() => {
    (async () => {
      const saved = await store.get();
      if (saved) {
        sessionRef.current = saved.session || null;
        commit((d) => ({ ...d, ...saved, history: Array.isArray(saved.history) ? saved.history : [] }));
      }
      setLoaded(true);
    })();
  }, []);

  /* ----- save whenever data changes ----- */
  useEffect(() => {
    if (loaded) store.set(data);
  }, [data, loaded]);

  /* ----- after load: finish a payment return, then pull cloud data ----- */
  useEffect(() => {
    if (!loaded || !cloudReady || !sessionRef.current) return;
    (async () => {
      const ref = new URLSearchParams(window.location.search).get("reference");
      if (ref) {
        setScreen("account");
        setMsg("Checking your payment…");
        await verifyPayment(ref);
        window.history.replaceState({}, "", window.location.pathname);
      }
      try { await syncDown(); } catch (e) { /* offline: keep local data */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  /* ----- 30-second countdown (uses the clock, so it stays honest if the app was in the background) ----- */
  useEffect(() => {
    if (screen !== "quiz" || !session || !session.timed || revealed) return;
    let done = false;
    let id;
    const tick = () => {
      if (done) return;
      const l = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setLeft(l);
      if (l <= 0) {
        done = true;
        clearInterval(id);
        setPicked(-1);
        setAnswers((a) => [...a, -1]);
      }
    };
    id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => { done = true; clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [screen, session, revealed, idx]);

  /* ----- account helpers ----- */
  const updateSession = (s) => {
    sessionRef.current = s;
    commit((d) => ({ ...d, session: s }));
  };

  const getToken = async () => {
    const s = sessionRef.current;
    if (!s) return null;
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    try {
      const j = await authCall("token?grant_type=refresh_token", { refresh_token: s.refresh_token });
      const ns = toSession(j);
      updateSession(ns);
      return ns.access_token;
    } catch (e) {
      updateSession(null);
      setPremiumOk(false);
      commit((d) => ({ ...d, premiumUntil: null }));
      return null;
    }
  };

  // Pulls this student's cloud scores and subscription. Returns the merged score list (null if the cloud couldn't be read).
  const syncDown = async () => {
    const token = await getToken();
    const s = sessionRef.current;
    if (!token || !s) return null;
    const [p, sub] = await Promise.all([
      rest(`progress?select=data&user_id=eq.${s.user.id}`, token),
      rest(`subscriptions?select=premium_until&user_id=eq.${s.user.id}`, token),
    ]);
    let merged = null;
    if (p.ok) {
      const pj = await p.json();
      const cloudHistory = pj[0] && pj[0].data && Array.isArray(pj[0].data.history) ? pj[0].data.history : [];
      merged = mergeHistory(dataRef.current.history, cloudHistory);
      commit((d) => ({ ...d, history: merged, historyOwner: s.user.id }));
    }
    if (sub.ok) {
      const sj = await sub.json();
      commit((d) => ({ ...d, premiumUntil: sj[0] ? sj[0].premium_until : null }));
      setPremiumOk(true);
    }
    return merged;
  };

  // Saves scores to the cloud. It reads the cloud copy first, so it can never erase scores saved from another phone.
  const syncUp = async (hist) => {
    if (!cloudReady || !sessionRef.current) return false;
    try {
      const token = await getToken();
      const s = sessionRef.current;
      if (!token || !s) return false;
      const r = await rest(`progress?select=data&user_id=eq.${s.user.id}`, token);
      if (!r.ok) return false; // can't see the cloud copy, so don't risk overwriting it
      const rows = await r.json();
      const cloud = rows[0] && rows[0].data && Array.isArray(rows[0].data.history) ? rows[0].data.history : [];
      const merged = mergeHistory(hist, cloud);
      const w = await rest("progress?on_conflict=user_id", token, {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: s.user.id, data: { history: merged }, updated_at: new Date().toISOString() }),
      });
      if (!w.ok) return false;
      commit((d) => ({ ...d, history: mergeHistory(d.history, merged) }));
      return true;
    } catch (e) { return false; }
  };

  // Scores left on this phone by a different student are dropped when someone else signs in.
  const adoptAccount = (userId) =>
    commit((d) => (d.historyOwner && d.historyOwner !== userId ? { ...d, history: [], historyOwner: userId } : { ...d, historyOwner: userId }));

  const afterLogin = async (sess) => {
    adoptAccount(sess.user.id);
    const merged = await syncDown();
    if (merged && merged.length) await syncUp(merged);
  };

  const signUp = async () => {
    if (!email.trim() || password.length < 6) { setMsg("Enter your email and a password of at least 6 characters."); return; }
    setBusy(true); setMsg("");
    try {
      const j = await authCall("signup", { email: email.trim(), password });
      if (j.access_token) {
        const ns = toSession(j);
        updateSession(ns);
        setPassword("");
        setMsg("Account created. You're signed in.");
        await afterLogin(ns);
      } else {
        setMsg("Account created. Check your email and confirm it, then tap Sign in.");
      }
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  const signIn = async () => {
    if (!email.trim() || !password) { setMsg("Enter your email and password."); return; }
    setBusy(true); setMsg("");
    try {
      const j = await authCall("token?grant_type=password", { email: email.trim(), password });
      const ns = toSession(j);
      updateSession(ns);
      setPassword("");
      setMsg("Signed in.");
      await afterLogin(ns);
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  const signOut = async () => {
    setBusy(true);
    const saved = await syncUp(dataRef.current.history); // last save before leaving
    updateSession(null);
    setPremiumOk(false);
    if (saved) {
      commit((d) => ({ ...d, premiumUntil: null, history: [], historyOwner: null }));
      setMsg("Signed out. Your scores are saved in your account and cleared from this phone.");
    } else {
      commit((d) => ({ ...d, premiumUntil: null }));
      setMsg("Signed out. There was no internet, so your newest scores will sync the next time you sign in.");
    }
    setBusy(false);
  };

  const pay = async (planId) => {
    if (!cloudReady) { setMsg("Payments are not connected yet. Follow DEPLOY_GUIDE.md to switch them on."); return; }
    if (!user) { setMsg("Create an account or sign in first, so your payment is linked to you."); return; }
    setBusy(true); setMsg("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      const r = await fetch(`${CONFIG.API_BASE}/api/paystack-init`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not start payment.");
      window.location.href = j.authorization_url; // Paystack's secure payment page
    } catch (e) { setMsg(e.message); setBusy(false); }
  };

  const verifyPayment = async (reference) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in to finish activating Premium.");
      const r = await fetch(`${CONFIG.API_BASE}/api/paystack-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not confirm payment.");
      commit((d) => ({ ...d, premiumUntil: j.premium_until }));
      setPremiumOk(true);
      setMsg("Payment confirmed. Premium is active.");
    } catch (e) { setMsg(e.message); }
  };

  /* ----- starting practice ----- */
  const start = (name, subjectId, items, examId, timedFlag) => {
    setSession({ name, subjectId, examId, items, timed: timedFlag });
    setIdx(0);
    setPicked(null);
    setAnswers([]);
    setLeft(TIME); deadlineRef.current = Date.now() + TIME * 1000;
    setScreen("quiz");
  };

  const openUpgrade = () => { setGate(null); setScreen("account"); };

  const countRound = () =>
    commit((d) => ({ ...d, daily: { date: todayKey(), rounds: (d.daily.date === todayKey() ? d.daily.rounds : 0) + 1 } }));

  const startSubject = (s) => {
    if (!premium && roundsToday >= FREE_ROUNDS_PER_DAY) {
      setGate({ title: "Daily limit reached", text: `Free accounts get ${FREE_ROUNDS_PER_DAY} practice rounds a day. Come back tomorrow, or go Premium for unlimited rounds.` });
      return;
    }
    const n = premium ? count : 5;
    const label = exam === "practice" ? s.name : `${EXAMS[exam].short} ${s.name}`;
    countRound();
    start(label, s.id, prepare(s.questions, n), exam, EXAMS[exam].forceTimer || timed);
  };

  const startCustom = async () => {
    const t = topic.trim();
    if (!t || loading) return;
    if (!premium) {
      setGate({ title: "Premium feature", text: "AI topic practice writes fresh questions on any topic you type. It's included with Premium." });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = CONFIG.USE_BACKEND ? await getToken() : null;
      if (CONFIG.USE_BACKEND && !token) throw new Error("Please sign in again to use AI practice.");
      const qs = await generateQuestions({ topic: t, count: CONFIG.USE_BACKEND ? 8 : 5, exam, token });
      const label = exam === "practice" ? t : `${EXAMS[exam].short}: ${t}`;
      start(label, "custom", prepare(qs, qs.length), exam, EXAMS[exam].forceTimer || timed);
    } catch (e) {
      setError(e && e.message && CONFIG.USE_BACKEND ? e.message : "Couldn't build questions for that topic. Check your connection or try a more specific topic.");
    } finally {
      setLoading(false);
    }
  };

  const choose = (i) => {
    if (revealed) return;
    setPicked(i);
    setAnswers((a) => [...a, i]);
  };

  const next = () => {
    if (idx + 1 < session.items.length) {
      setIdx(idx + 1);
      setPicked(null);
      setLeft(TIME); deadlineRef.current = Date.now() + TIME * 1000;
    } else {
      const score = answers.filter((a, i) => a === session.items[i].a).length;
      const record = { name: session.name, subjectId: session.subjectId, examId: session.examId, score, total: session.items.length, at: new Date().toISOString() };
      const newHistory = mergeHistory([record], history);
      commit((d) => ({ ...d, history: newHistory }));
      syncUp(newHistory);
      setScreen("result");
    }
  };

  /* ----- shared styles ----- */
  const base = { minHeight: "100vh", background: C.night, color: C.ivory, fontFamily: FONT, display: "flex", justifyContent: "center" };
  const shell = { width: "100%", maxWidth: 480, padding: "20px 18px 96px", position: "relative", boxSizing: "border-box" };
  const pill = (active) => ({
    padding: "9px 16px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
    border: `1.5px solid ${active ? C.gold : C.line}`, background: active ? C.gold : "transparent", color: active ? C.night : C.ivory,
  });
  const primaryBtn = (disabled) => ({
    width: "100%", padding: 15, borderRadius: 12, border: "none", fontWeight: 800, fontSize: 16, fontFamily: FONT,
    background: disabled ? C.line : C.gold, color: disabled ? C.mute : C.night, cursor: disabled ? "default" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  });
  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "14px", borderRadius: 12, border: `1.5px solid ${C.line}`,
    background: C.night, color: C.ivory, fontSize: 16, fontFamily: FONT, outline: "none", marginBottom: 10,
  };

  const globalCss = (
    <style>{`@keyframes eh-spin { to { transform: rotate(360deg); } } @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } } button:focus-visible, input:focus-visible { outline: 3px solid ${C.gold}; outline-offset: 2px; }`}</style>
  );

  /* ---------- QUIZ ---------- */
  if (screen === "quiz" && item) {
    const timeUp = picked === -1;
    return (
      <div style={base}>
        <div style={shell}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button onClick={() => setScreen("home")} aria-label="Quit practice" style={{ background: "none", border: "none", color: C.mute, cursor: "pointer", padding: 6 }}>
              <X size={24} />
            </button>
            <div style={{ fontSize: 14, color: C.mute, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
              {session.name}
            </div>
            {session.timed ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: left <= 8 && !revealed ? C.bad : C.gold, fontWeight: 800, fontSize: 16, minWidth: 54, justifyContent: "flex-end" }}>
                <Clock size={16} /> {left}s
              </div>
            ) : (
              <div style={{ minWidth: 54 }} />
            )}
          </div>

          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            {session.items.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < idx ? C.gold : i === idx ? C.goldDeep : C.line }} />
            ))}
          </div>
          <div style={{ fontSize: 13, color: C.mute, marginBottom: 22 }}>
            Question {idx + 1} of {session.items.length}
          </div>

          <h2 style={{ fontSize: 24, lineHeight: 1.3, fontWeight: 800, margin: "0 0 24px", letterSpacing: -0.3 }}>{item.q}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {item.options.map((opt, i) => {
              const isCorrect = i === item.a;
              const isPicked = i === picked;
              let border = C.line, bg = C.panel, opacity = 1;
              if (revealed) {
                if (isCorrect) { border = C.good; bg = "rgba(61,220,151,0.12)"; }
                else if (isPicked) { border = C.bad; bg = "rgba(255,107,107,0.12)"; }
                else opacity = 0.5;
              }
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={revealed}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "15px 16px", borderRadius: 14,
                    border: `2px solid ${border}`, background: bg, color: C.ivory, opacity, fontSize: 16, fontWeight: 600,
                    fontFamily: FONT, cursor: revealed ? "default" : "pointer", transition: "border-color 150ms, background 150ms, opacity 150ms",
                  }}
                >
                  <span
                    style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: revealed && isCorrect ? C.good : revealed && isPicked ? C.bad : C.panel2,
                      color: revealed && (isCorrect || isPicked) ? C.night : C.mute, fontSize: 13, fontWeight: 800,
                    }}
                  >
                    {revealed && isCorrect ? <Check size={16} strokeWidth={3} /> : revealed && isPicked ? <X size={16} strokeWidth={3} /> : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {revealed && (
            <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: C.panel, borderLeft: `4px solid ${picked === item.a ? C.good : C.bad}` }}>
              <div style={{ fontWeight: 800, marginBottom: 4, color: picked === item.a ? C.good : C.bad }}>
                {picked === item.a ? "Correct" : timeUp ? "Time's up" : "Not quite"}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.5 }}>
                {picked !== item.a && <>The answer is <b>{item.options[item.a]}</b>. </>}
                {item.why}
              </div>
            </div>
          )}

          {revealed && (
            <button
              onClick={next}
              style={{ ...primaryBtn(false), marginTop: 18, borderRadius: 14, fontSize: 17, gap: 6 }}
            >
              {idx + 1 < session.items.length ? "Next question" : "See my score"} <ChevronRight size={20} />
            </button>
          )}
        </div>
        {globalCss}
      </div>
    );
  }

  /* ---------- RESULT ---------- */
  if (screen === "result" && session) {
    const score = answers.filter((a, i) => a === session.items[i].a).length;
    const total = session.items.length;
    const pct = Math.round((score / total) * 100);
    const verdict = pct >= 80 ? "You're exam ready on this topic." : pct >= 50 ? "Solid base. Review the misses below." : "Needs more practice. Start with the misses below.";
    const missed = session.items.map((it, i) => ({ it, a: answers[i] })).filter((x) => x.a !== x.it.a);

    return (
      <div style={base}>
        <div style={shell}>
          <div style={{ textAlign: "center", paddingTop: 12 }}>
            <Trophy size={30} color={C.gold} />
            <div style={{ margin: "10px 0 6px", display: "flex", justifyContent: "center" }}><Ring pct={pct} /></div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.3 }}>{score} of {total} correct</div>
            <div style={{ color: C.mute, marginTop: 6, fontSize: 15 }}>{verdict}</div>
            <div style={{ color: C.mute, marginTop: 4, fontSize: 13 }}>Saved to your progress</div>
          </div>

          <div style={{ display: "flex", gap: 10, margin: "24px 0" }}>
            <button
              onClick={() => start(session.name, session.subjectId, prepare(session.items, session.items.length), session.examId, session.timed)}
              style={{ ...primaryBtn(false), flex: 1, borderRadius: 14, gap: 8 }}
            >
              <RotateCcw size={18} /> Try again
            </button>
            <button
              onClick={() => setScreen("home")}
              style={{ flex: 1, padding: 15, borderRadius: 14, border: `2px solid ${C.line}`, background: "transparent", color: C.ivory, fontWeight: 800, fontSize: 16, fontFamily: FONT, cursor: "pointer" }}
            >
              Back home
            </button>
          </div>

          {!premium && (
            <button onClick={openUpgrade} style={{ width: "100%", textAlign: "left", padding: 14, borderRadius: 14, border: `1.5px solid ${C.gold}`, background: C.panel, color: C.ivory, fontFamily: FONT, cursor: "pointer", marginBottom: 18, display: "flex", gap: 10, alignItems: "center" }}>
              <Crown size={22} color={C.gold} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, lineHeight: 1.4 }}><b>Want longer rounds and AI practice?</b> See Premium from {naira(PLANS[0].price)}/month.</span>
            </button>
          )}

          {missed.length > 0 ? (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px" }}>Review your misses</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {missed.map(({ it, a }, k) => (
                  <div key={k} style={{ padding: 16, borderRadius: 14, background: C.panel }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{it.q}</div>
                    <div style={{ fontSize: 14, color: C.bad, marginBottom: 2 }}>Your answer: {a === -1 ? "No answer (time ran out)" : it.options[a]}</div>
                    <div style={{ fontSize: 14, color: C.good, marginBottom: 8 }}>Correct: {it.options[it.a]}</div>
                    {it.why && <div style={{ fontSize: 14, color: C.mute, lineHeight: 1.5 }}>{it.why}</div>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: 18, borderRadius: 14, background: C.panel, textAlign: "center", color: C.mute }}>
              No misses this round. Try a new subject{premium ? " or a longer set" : ""}.
            </div>
          )}
        </div>
        {globalCss}
      </div>
    );
  }

  /* ---------- bottom navigation ---------- */
  const nav = (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", background: "linear-gradient(transparent, rgba(10,19,48,0.97) 35%)", paddingTop: 20, zIndex: 5 }}>
      <div style={{ width: "100%", maxWidth: 480, display: "flex", padding: "8px 18px 16px", gap: 8, boxSizing: "border-box" }}>
        {[
          { id: "home", label: "Practice", icon: Home },
          { id: "progress", label: "Progress", icon: BarChart3 },
          { id: "account", label: premium ? "Premium" : "Account", icon: premium ? Crown : User },
        ].map((t) => {
          const active = screen === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setScreen(t.id)}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 14, border: `1.5px solid ${active ? C.gold : C.line}`,
                background: active ? C.panel2 : C.panel, color: active ? C.gold : C.mute, fontWeight: 700, fontSize: 13.5,
                fontFamily: FONT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Icon size={17} /> {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ---------- PROGRESS ---------- */
  if (screen === "progress") {
    const totalAnswered = history.reduce((s, h) => s + h.total, 0);
    const totalCorrect = history.reduce((s, h) => s + h.score, 0);
    const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const bar = (label, rows) => {
      if (!rows.length) return null;
      const c = rows.reduce((x, r) => x + r.score, 0);
      const t = rows.reduce((x, r) => x + r.total, 0);
      const p = Math.round((c / t) * 100);
      return (
        <div key={label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 5 }}>
            <span style={{ fontWeight: 700 }}>{label}</span>
            <span style={{ color: C.mute }}>{p}% ({c}/{t})</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: C.line }}>
            <div style={{ width: `${p}%`, height: "100%", borderRadius: 4, background: p >= 70 ? C.good : C.gold }} />
          </div>
        </div>
      );
    };

    return (
      <div style={base}>
        <div style={shell}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "6px 0 18px", letterSpacing: -0.4 }}>Your progress</h1>

          {history.length === 0 ? (
            <div style={{ padding: 22, borderRadius: 16, background: C.panel, textAlign: "center" }}>
              <Target size={30} color={C.gold} />
              <div style={{ fontWeight: 800, fontSize: 18, margin: "10px 0 6px" }}>No sessions yet</div>
              <div style={{ color: C.mute, fontSize: 15, lineHeight: 1.5, marginBottom: 16 }}>Finish a practice round and your scores will show up here.</div>
              <button onClick={() => setScreen("home")} style={{ ...pill(true), border: "none" }}>Start practising</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {[{ label: "Sessions", value: history.length }, { label: "Questions", value: totalAnswered }, { label: "Accuracy", value: `${accuracy}%` }].map((s) => (
                  <div key={s.label} style={{ flex: 1, padding: "14px 10px", borderRadius: 14, background: C.panel, textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: C.gold }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: C.mute }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 10px" }}>Accuracy by subject</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {[...SUBJECTS, { id: "custom", name: "AI topics" }].map((s) => bar(s.name, history.filter((h) => h.subjectId === s.id)))}
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
                Accuracy by exam {!premium && <Lock size={15} color={C.mute} />}
              </h3>
              {premium ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  {Object.values(EXAMS).map((e) => bar(e.name, history.filter((h) => (h.examId || "practice") === e.id)))}
                </div>
              ) : (
                <button onClick={openUpgrade} style={{ width: "100%", padding: 16, borderRadius: 14, border: `1.5px dashed ${C.line}`, background: "transparent", color: C.mute, fontFamily: FONT, fontSize: 14, cursor: "pointer", marginBottom: 24 }}>
                  See how you score in WAEC, NECO and JAMB mode. Premium feature.
                </button>
              )}

              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 10px" }}>Recent sessions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.slice(0, 10).map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderRadius: 12, background: C.panel }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{h.name}</div>
                      <div style={{ fontSize: 12, color: C.mute }}>
                        {new Date(h.at).toLocaleDateString([], { day: "numeric", month: "short" })}, {new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: h.score / h.total >= 0.7 ? C.good : C.gold }}>{h.score}/{h.total}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: C.mute, marginTop: 18 }}>
                {user ? "Saved on this device and synced to your account." : "Saved on this device. Create an account to keep it across phones."}
              </p>
            </>
          )}
        </div>
        {nav}
        {globalCss}
      </div>
    );
  }

  /* ---------- ACCOUNT + PREMIUM ---------- */
  if (screen === "account") {
    return (
      <div style={base}>
        <div style={shell}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "6px 0 18px", letterSpacing: -0.4 }}>{premium ? "Premium" : "Account"}</h1>

          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <User size={20} color={C.gold} />
              <div style={{ fontWeight: 800, fontSize: 17 }}>{user ? "Signed in" : cloudReady ? "Sign in to sync" : "Saved on this device"}</div>
            </div>
            {!cloudReady && (
              <div style={{ color: C.mute, fontSize: 14, lineHeight: 1.5 }}>
                Your scores are saved in this browser. Accounts, cross-device sync and payments switch on after you connect the backend. The steps are in DEPLOY_GUIDE.md.
              </div>
            )}
            {cloudReady && user && (
              <>
                <div style={{ fontSize: 15, marginBottom: 12, wordBreak: "break-all" }}>{user.email}</div>
                <button onClick={signOut} style={{ ...pill(false), display: "flex", alignItems: "center", gap: 6 }}><LogOut size={15} /> Sign out</button>
              </>
            )}
            {cloudReady && !user && (
              <>
                <input type="email" aria-label="Email address" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" style={inputStyle} />
                <input type="password" aria-label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") signIn(); }} placeholder="Password (6+ characters)" style={inputStyle} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={signIn} disabled={busy} style={{ ...primaryBtn(busy), flex: 1 }}>Sign in</button>
                  <button onClick={signUp} disabled={busy} style={{ flex: 1, padding: 15, borderRadius: 12, border: `2px solid ${C.line}`, background: "transparent", color: C.ivory, fontWeight: 800, fontSize: 16, fontFamily: FONT, cursor: "pointer" }}>Create account</button>
                </div>
              </>
            )}
            {msg && <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.45, color: C.gold }}>{msg}</div>}
          </Card>

          <Card style={{ border: `1.5px solid ${C.gold}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Crown size={20} color={C.gold} />
              <div style={{ fontWeight: 800, fontSize: 18 }}>ExamHero Premium</div>
            </div>
            <div style={{ color: premium ? C.good : C.mute, fontSize: 14, marginBottom: 14 }}>
              {premium
                ? data.premiumUntil && new Date(data.premiumUntil) > new Date()
                  ? `Active until ${new Date(data.premiumUntil).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })}`
                  : "Preview mode is on (no payment taken)"
                : "You're on the Free plan"}
            </div>

            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Free</div>
            <Perk on text={`${FREE_ROUNDS_PER_DAY} practice rounds a day, 5 questions each`} />
            <Perk on text="WAEC, NECO and JAMB modes (5-question rounds)" />
            <Perk on text="Explanation after every answer" />
            <Perk on text="Progress saved, plus account sync" />
            <div style={{ fontWeight: 700, fontSize: 14, margin: "12px 0 6px", color: C.gold }}>Premium adds</div>
            <Perk on text="Unlimited practice rounds" />
            <Perk on text="Longer rounds: 8 or 12 questions" />
            <Perk on text="AI topic practice on any topic" />
            <Perk on text="Accuracy breakdown by WAEC, NECO and JAMB" />

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pay(p.id)}
                  disabled={busy}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 14, border: `2px solid ${C.gold}`, background: p.id === "term" ? C.gold : "transparent", color: p.id === "term" ? C.night : C.ivory, fontFamily: FONT, cursor: "pointer", textAlign: "left" }}
                >
                  <span>
                    <span style={{ display: "block", fontWeight: 800, fontSize: 16 }}>{p.name}</span>
                    <span style={{ display: "block", fontSize: 12.5, opacity: 0.8 }}>{p.note}</span>
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{naira(p.price)}</span>
                </button>
              ))}
            </div>
            {!cloudReady && (
              <div style={{ marginTop: 12, fontSize: 13, color: C.mute, lineHeight: 1.45 }}>
                Payments are not connected yet, so these buttons won't charge anyone. Paystack is set up in DEPLOY_GUIDE.md.
              </div>
            )}
            {devPreview && (
              <button onClick={() => commit((d) => ({ ...d, devPremium: !d.devPremium }))} style={{ ...pill(data.devPremium), marginTop: 14, width: "100%", borderRadius: 12, borderStyle: "dashed" }}>
                {data.devPremium ? "Turn off Premium preview" : "Preview Premium without paying (testing only)"}
              </button>
            )}
          </Card>
        </div>
        {nav}
        {globalCss}
      </div>
    );
  }

  /* ---------- HOME ---------- */
  return (
    <div style={base}>
      <div style={shell}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <Mark />
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>
              Exam<span style={{ color: C.gold }}>Hero</span>
              <span style={{ marginLeft: 6, padding: "2px 7px", borderRadius: 6, background: C.gold, color: C.night, fontSize: 12, fontWeight: 800, verticalAlign: "middle" }}>PRO</span>
            </div>
            <div style={{ fontSize: 13, color: C.mute, marginTop: 4 }}>Study smart, pass any exam</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          {Object.values(EXAMS).map((e) => (
            <button key={e.id} onClick={() => setExam(e.id)} style={pill(exam === e.id)}>{e.short}</button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: C.mute, marginBottom: 18 }}>{EXAMS[exam].blurb}</div>

        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 12px", letterSpacing: -0.3 }}>Pick a subject</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SUBJECTS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => startSubject(s)}
                style={{ textAlign: "left", padding: 16, borderRadius: 16, border: `1.5px solid ${C.line}`, background: C.panel, color: C.ivory, cursor: "pointer", fontFamily: FONT, display: "flex", flexDirection: "column", gap: 10 }}
              >
                <span style={{ width: 40, height: 40, borderRadius: 12, background: C.panel2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={22} color={C.gold} />
                </span>
                <span>
                  <span style={{ display: "block", fontWeight: 800, fontSize: 16 }}>{s.name}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: C.mute, marginTop: 3, lineHeight: 1.35 }}>{s.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "20px 0 4px" }}>
          <span style={{ fontSize: 14, color: C.mute, fontWeight: 600 }}>Questions</span>
          {[5, 8, 12].map((n) => {
            const locked = !premium && n > 5;
            return (
              <button
                key={n}
                onClick={() => (locked ? setGate({ title: "Premium feature", text: "Longer rounds of 8 and 12 questions are part of Premium." }) : setCount(n))}
                style={{ ...pill((premium ? count : 5) === n), display: "flex", alignItems: "center", gap: 4, opacity: locked ? 0.7 : 1 }}
              >
                {n} {locked && <Lock size={12} />}
              </button>
            );
          })}
          <span style={{ flex: 1 }} />
          {EXAMS[exam].forceTimer ? (
            <span style={{ ...pill(true), display: "flex", alignItems: "center", gap: 6, cursor: "default" }}><Clock size={15} /> 30s timer (JAMB)</span>
          ) : (
            <button onClick={() => setTimed(!timed)} style={{ ...pill(timed), display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={15} /> {timed ? "30s timer on" : "Timer off"}
            </button>
          )}
        </div>
        {!premium && (
          <div style={{ fontSize: 12.5, color: C.mute, marginTop: 6 }}>
            Free rounds left today: {Math.max(0, FREE_ROUNDS_PER_DAY - roundsToday)} of {FREE_ROUNDS_PER_DAY}
          </div>
        )}

        <div style={{ marginTop: 22, padding: 18, borderRadius: 18, background: `linear-gradient(160deg, ${C.panel2}, ${C.panel})`, border: `1.5px solid ${C.gold}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Sparkles size={20} color={C.gold} />
            <div style={{ fontWeight: 800, fontSize: 18 }}>Practise any topic</div>
            {!premium && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: C.gold, display: "flex", alignItems: "center", gap: 4 }}><Crown size={14} /> Premium</span>}
          </div>
          <div style={{ color: C.mute, fontSize: 14, lineHeight: 1.45, marginBottom: 12 }}>
            Type the topic you're studying and get fresh questions with explanations, in {exam === "practice" ? "general exam" : EXAMS[exam].short} style.
            <span style={{ display: "block", marginTop: 6, fontSize: 12.5 }}>AI can make mistakes. Check important answers in your textbook.</span>
          </div>
          <input
            aria-label="Topic to practise"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") startCustom(); }}
            placeholder="e.g. Biology: genetics"
            style={{ ...inputStyle, marginBottom: 0 }}
          />
          {error && <div style={{ color: C.bad, fontSize: 13, marginTop: 8, lineHeight: 1.4 }}>{error}</div>}
          <button onClick={startCustom} disabled={!topic.trim() || loading} style={{ ...primaryBtn(!topic.trim() || loading), marginTop: 12 }}>
            {loading ? (<><Loader2 size={18} style={{ animation: "eh-spin 1s linear infinite" }} /> Writing your questions…</>) : "Generate questions"}
          </button>
        </div>

        {!premium && (
          <button onClick={openUpgrade} style={{ marginTop: 14, width: "100%", textAlign: "left", padding: 14, borderRadius: 14, border: `1.5px solid ${C.line}`, background: C.panel, color: C.ivory, fontFamily: FONT, cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}>
            <Crown size={22} color={C.gold} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, lineHeight: 1.4 }}><b>Go Premium from {naira(PLANS[0].price)}/month.</b> Unlimited rounds, longer rounds and AI practice.</span>
          </button>
        )}
      </div>

      {gate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,10,28,0.8)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 20 }} onClick={() => setGate(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: C.panel, borderRadius: "22px 22px 0 0", padding: "24px 20px 28px", border: `1.5px solid ${C.gold}`, borderBottom: "none", boxSizing: "border-box" }}>
            <Crown size={28} color={C.gold} />
            <div style={{ fontSize: 21, fontWeight: 800, margin: "8px 0" }}>{gate.title}</div>
            <div style={{ color: C.mute, fontSize: 15, lineHeight: 1.5, marginBottom: 18 }}>{gate.text}</div>
            <button onClick={openUpgrade} style={primaryBtn(false)}>See Premium</button>
            <button onClick={() => setGate(null)} style={{ marginTop: 10, width: "100%", padding: 12, background: "none", border: "none", color: C.mute, fontSize: 15, fontFamily: FONT, cursor: "pointer" }}>Maybe later</button>
          </div>
        </div>
      )}

      {nav}
      {globalCss}
    </div>
  );
}
