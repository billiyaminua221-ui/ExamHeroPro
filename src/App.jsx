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
      { q: "Express 0.375 as a fraction in its lowest terms.", options: ["37/100", "3/8", "3/5", "375/100"], a: 1, why: "0.375 = 375/1000. Divide top and bottom by 125 to get 3/8." },
      { q: "Simplify 2³ × 2⁴ ÷ 2⁵", options: ["4", "2", "8", "16"], a: 0, why: "Add the powers when multiplying: 2⁷. Subtract when dividing: 2⁷ ÷ 2⁵ = 2² = 4." },
      { q: "Solve for x: 5x − 3 = 2x + 12", options: ["3", "4", "6", "5"], a: 3, why: "Collect terms: 3x = 15, so x = 5." },
      { q: "Factorise x² + 5x + 6", options: ["(x + 1)(x + 6)", "(x − 2)(x − 3)", "(x + 2)(x + 3)", "(x + 5)(x + 1)"], a: 2, why: "Find two numbers that multiply to 6 and add to 5: 2 and 3." },
      { q: "Solve x² − 7x + 12 = 0", options: ["x = −3 or x = −4", "x = 3 or x = 4", "x = 2 or x = 6", "x = 1 or x = 12"], a: 1, why: "Factorise: (x − 3)(x − 4) = 0." },
      { q: "Find the simple interest on ₦20,000 for 3 years at 5% per annum.", options: ["₦3,000", "₦1,000", "₦2,000", "₦4,000"], a: 0, why: "I = PRT ÷ 100 = 20,000 × 5 × 3 ÷ 100 = ₦3,000." },
      { q: "Find the LCM of 12 and 18.", options: ["6", "72", "216", "36"], a: 3, why: "12 = 2² × 3 and 18 = 2 × 3². LCM = 2² × 3² = 36." },
      { q: "Find the HCF of 24 and 36.", options: ["6", "8", "12", "72"], a: 2, why: "24 = 2³ × 3 and 36 = 2² × 3². HCF = 2² × 3 = 12." },
      { q: "What is the perimeter of a rectangle 12 cm long and 8 cm wide?", options: ["20 cm", "40 cm", "96 cm", "80 cm"], a: 1, why: "Perimeter = 2(12 + 8) = 40 cm." },
      { q: "Find the area of a triangle with base 10 cm and height 6 cm.", options: ["30 cm²", "60 cm²", "16 cm²", "15 cm²"], a: 0, why: "Area = ½ × base × height = ½ × 10 × 6 = 30 cm²." },
      { q: "A right-angled triangle has two shorter sides of 6 cm and 8 cm. How long is the hypotenuse?", options: ["14 cm", "12 cm", "9 cm", "10 cm"], a: 3, why: "6² + 8² = 36 + 64 = 100, and √100 = 10." },
      { q: "Convert 101₂ (base two) to base ten.", options: ["3", "4", "5", "6"], a: 2, why: "1 × 4 + 0 × 2 + 1 × 1 = 5." },
      { q: "Express 45 in base two.", options: ["110101₂", "101101₂", "101011₂", "100111₂"], a: 1, why: "45 = 32 + 8 + 4 + 1, which is 101101 in binary." },
      { q: "Find the median of 3, 7, 9, 5 and 11.", options: ["7", "5", "9", "8"], a: 0, why: "Arrange them: 3, 5, 7, 9, 11. The middle value is 7." },
      { q: "Find the mode of 2, 3, 3, 4, 5, 3, 6, 2.", options: ["2", "4", "6", "3"], a: 3, why: "3 appears three times, more than any other number." },
      { q: "If y = 3x − 2, find y when x = 4.", options: ["14", "12", "10", "6"], a: 2, why: "y = 3(4) − 2 = 12 − 2 = 10." },
      { q: "Find the gradient of the line through (1, 2) and (3, 8).", options: ["2", "3", "4", "6"], a: 1, why: "Gradient = (8 − 2) ÷ (3 − 1) = 6 ÷ 2 = 3." },
      { q: "Simplify √50", options: ["5√2", "25√2", "10√5", "2√5"], a: 0, why: "√50 = √(25 × 2) = 5√2." },
      { q: "Evaluate log₁₀ 1000", options: ["2", "10", "100", "3"], a: 3, why: "10³ = 1000, so the logarithm is 3." },
      { q: "Find the values of x for which 2x + 3 > 11.", options: ["x > 7", "x < 4", "x > 4", "x > 14"], a: 2, why: "Subtract 3: 2x > 8. Divide by 2: x > 4." },
      { q: "A car covers 150 km in 2½ hours. What is its average speed?", options: ["50 km/h", "60 km/h", "75 km/h", "375 km/h"], a: 1, why: "Speed = distance ÷ time = 150 ÷ 2.5 = 60 km/h." },
      { q: "₦900 is shared between two people in the ratio 4 : 5. How much does the bigger share get?", options: ["₦500", "₦400", "₦450", "₦540"], a: 0, why: "The ratio has 9 parts. Each part is ₦100, so 5 parts is ₦500." },
      { q: "Two angles on a straight line are x° and (2x + 30)°. Find x.", options: ["40", "60", "70", "50"], a: 3, why: "They add up to 180°: 3x + 30 = 180, so x = 50." },
      { q: "The interior angles of a polygon add up to 1080°. How many sides does it have?", options: ["6", "7", "8", "10"], a: 2, why: "(n − 2) × 180 = 1080, so n − 2 = 6 and n = 8." },
      { q: "What is the volume of a cuboid measuring 5 cm by 4 cm by 3 cm?", options: ["12 cm³", "60 cm³", "47 cm³", "120 cm³"], a: 1, why: "Volume = 5 × 4 × 3 = 60 cm³." },
      { q: "A shirt costing ₦5,000 is sold at a 20% discount. What is the selling price?", options: ["₦4,000", "₦4,500", "₦3,500", "₦1,000"], a: 0, why: "20% of 5,000 is ₦1,000. 5,000 − 1,000 = ₦4,000." },
      { q: "A bag has 3 red and 5 blue balls. What is the probability of picking a red ball?", options: ["3/5", "5/8", "1/3", "3/8"], a: 3, why: "There are 8 balls in all and 3 are red: 3/8." },
      { q: "What is the value of sin 30°?", options: ["√3/2", "1", "1/2", "√2/2"], a: 2, why: "sin 30° = 1/2, a standard value worth memorising." },
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
      { q: "Choose the word closest in meaning to “ephemeral”.", options: ["Lasting", "Short-lived", "Ancient", "Powerful"], a: 1, why: "Ephemeral describes something that lasts only a very short time." },
      { q: "Choose the antonym of “verbose”.", options: ["Concise", "Wordy", "Loud", "Careful"], a: 0, why: "Verbose means using too many words; concise means brief and clear." },
      { q: "Choose the word closest in meaning to “meticulous”.", options: ["Careless", "Hasty", "Rude", "Thorough"], a: 3, why: "A meticulous person pays very careful attention to detail." },
      { q: "Choose the word closest in meaning to “abandon”.", options: ["Protect", "Adopt", "Desert", "Gather"], a: 2, why: "To abandon is to leave someone or something behind completely." },
      { q: "Choose the antonym of “reluctant”.", options: ["Unwilling", "Willing", "Hesitant", "Afraid"], a: 1, why: "Reluctant means unwilling; willing is the opposite." },
      { q: "Each of the girls ___ a bag.", options: ["has", "have", "are having", "were having"], a: 0, why: "“Each” is singular, so it takes “has”." },
      { q: "The news ___ shocking.", options: ["are", "were", "have been", "is"], a: 3, why: "“News” looks plural but is uncountable and singular." },
      { q: "By the time we arrived, the film ___.", options: ["started", "has started", "had started", "was starting"], a: 2, why: "The past perfect shows an action completed before another past action." },
      { q: "She is allergic ___ dust.", options: ["of", "to", "with", "at"], a: 1, why: "The correct phrase is “allergic to”." },
      { q: "He is very good ___ mathematics.", options: ["at", "in", "on", "with"], a: 0, why: "We say “good at” a subject or skill." },
      { q: "I prefer tea ___ coffee.", options: ["than", "over", "from", "to"], a: 3, why: "“Prefer” is followed by “to”, not “than”." },
      { q: "Neither the teacher nor the students ___ present.", options: ["was", "is", "were", "has been"], a: 2, why: "The verb agrees with the nearer subject, “students”, which is plural." },
      { q: "The prize was shared between ___ and me.", options: ["he", "him", "his", "himself"], a: 1, why: "After the preposition “between” we use the object form “him”." },
      { q: "Pick the correctly spelled word meaning “needed”.", options: ["Necessary", "Neccessary", "Necesary", "Nesessary"], a: 0, why: "Necessary has one c and two s's." },
      { q: "Pick the correctly spelled word meaning “to divide into parts”.", options: ["Seperate", "Separete", "Seprate", "Separate"], a: 3, why: "Remember “a rat” in sepARATe." },
      { q: "Their house is over ___.", options: ["their", "they're", "there", "thare"], a: 2, why: "“There” shows place. “Their” shows ownership and “they're” means they are." },
      { q: "“He is as strong as an ox” is an example of:", options: ["Metaphor", "Simile", "Irony", "Personification"], a: 1, why: "A simile compares two things using “as” or “like”." },
      { q: "“Sally sells seashells by the seashore” is an example of:", options: ["Alliteration", "Oxymoron", "Onomatopoeia", "Hyperbole"], a: 0, why: "Alliteration repeats the same starting sound in nearby words." },
      { q: "“I have told you a million times” is an example of:", options: ["Simile", "Irony", "Euphemism", "Hyperbole"], a: 3, why: "Hyperbole is deliberate exaggeration for effect." },
      { q: "Which of these words is onomatopoeic?", options: ["Table", "Run", "Buzz", "Blue"], a: 2, why: "Onomatopoeic words imitate the sound they describe." },
      { q: "What does “let the cat out of the bag” mean?", options: ["Free an animal", "Reveal a secret", "Make a mistake", "Start a fight"], a: 1, why: "It means to give away something that was meant to stay secret." },
      { q: "What does “a blessing in disguise” mean?", options: ["Something good that seemed bad at first", "A hidden danger", "A religious ceremony", "A disguised visitor"], a: 0, why: "A blessing in disguise is a good thing that first looked like bad luck." },
      { q: "What does “bury the hatchet” mean?", options: ["Hide a weapon", "Start a quarrel", "Dig a hole", "Make peace"], a: 3, why: "It means to end a quarrel and become friends again." },
      { q: "What does “once in a blue moon” mean?", options: ["Every month", "At night", "Very rarely", "Very often"], a: 2, why: "It describes something that happens very seldom." },
      { q: "In “The quick brown fox jumps”, the word “quick” is a/an:", options: ["Adverb", "Adjective", "Noun", "Verb"], a: 1, why: "“Quick” describes the noun “fox”, so it is an adjective." },
      { q: "“Close the door, please.” is what type of sentence?", options: ["Imperative", "Declarative", "Interrogative", "Exclamatory"], a: 0, why: "An imperative sentence gives a command or request." },
      { q: "Change to the passive voice: “The boy kicked the ball.”", options: ["The ball kicked the boy.", "The boy was kicked by the ball.", "The ball is kicked by the boy.", "The ball was kicked by the boy."], a: 3, why: "In the passive, the object (the ball) becomes the subject and the verb takes “was” plus the past participle." },
      { q: "Report this speech: He said, “I am tired.”", options: ["He said that I am tired.", "He said that he were tired.", "He said that he was tired.", "He said me was tired."], a: 2, why: "In reported speech the present tense moves back to the past and “I” becomes “he”." },
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
      { q: "Which organ produces insulin?", options: ["Liver", "Pancreas", "Kidney", "Stomach"], a: 1, why: "The pancreas makes insulin, which controls blood sugar." },
      { q: "What is the basic unit of heredity?", options: ["Gene", "Cell", "Tissue", "Organ"], a: 0, why: "A gene is a section of DNA that carries the instructions for a trait." },
      { q: "Which blood group is called the universal donor for red blood cells?", options: ["AB positive", "A positive", "B negative", "O negative"], a: 3, why: "O negative red cells carry no A, B or Rhesus markers, so most patients can receive them." },
      { q: "In which part of a plant cell does photosynthesis take place?", options: ["Mitochondrion", "Nucleus", "Chloroplast", "Vacuole"], a: 2, why: "Chloroplasts contain chlorophyll, which captures light energy." },
      { q: "A lack of which vitamin causes scurvy?", options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"], a: 1, why: "Vitamin C is needed to make collagen; without it gums bleed and wounds heal slowly." },
      { q: "Which insect transmits the malaria parasite to humans?", options: ["Female Anopheles mosquito", "Housefly", "Tsetse fly", "Cockroach"], a: 0, why: "Only the female Anopheles mosquito carries Plasmodium, the malaria parasite." },
      { q: "Which part of the brain controls balance and coordination?", options: ["Cerebrum", "Medulla oblongata", "Pituitary gland", "Cerebellum"], a: 3, why: "The cerebellum coordinates movement and keeps the body balanced." },
      { q: "The movement of water through a semi-permeable membrane from a dilute to a concentrated solution is called:", options: ["Transpiration", "Respiration", "Osmosis", "Digestion"], a: 2, why: "Osmosis is the diffusion of water across a semi-permeable membrane." },
      { q: "Enzymes are mostly made of:", options: ["Starch", "Protein", "Fat", "Cellulose"], a: 1, why: "Almost all enzymes are proteins that speed up chemical reactions." },
      { q: "Iodine solution turns blue-black when it meets:", options: ["Starch", "Glucose", "Protein", "Fat"], a: 0, why: "The iodine test is used to detect starch." },
      { q: "Which of these is an alkali metal?", options: ["Calcium", "Iron", "Copper", "Sodium"], a: 3, why: "Sodium is in Group 1 of the periodic table, the alkali metals." },
      { q: "What is the valency of oxygen?", options: ["1", "3", "2", "4"], a: 2, why: "Oxygen has 6 outer electrons and needs 2 more to be stable, so its valency is 2." },
      { q: "Which gas turns lime water milky?", options: ["Oxygen", "Carbon dioxide", "Hydrogen", "Nitrogen"], a: 1, why: "CO₂ reacts with lime water to form white calcium carbonate." },
      { q: "Which is the lightest gas?", options: ["Hydrogen", "Helium", "Oxygen", "Nitrogen"], a: 0, why: "Hydrogen is the lightest element and the lightest gas." },
      { q: "Rusting of iron needs:", options: ["Water only", "Oxygen only", "Nitrogen and water", "Both oxygen and water"], a: 3, why: "Iron rusts when it is exposed to oxygen and moisture together." },
      { q: "Which acid is found in vinegar?", options: ["Citric acid", "Sulphuric acid", "Ethanoic acid", "Hydrochloric acid"], a: 2, why: "Vinegar contains ethanoic (acetic) acid." },
      { q: "Separating a liquid from a mixture using differences in boiling point is called:", options: ["Filtration", "Distillation", "Evaporation", "Chromatography"], a: 1, why: "Distillation boils the liquid off and then condenses it again." },
      { q: "Which of these is a noble gas?", options: ["Argon", "Nitrogen", "Chlorine", "Oxygen"], a: 0, why: "Argon is in Group 0 and is very unreactive." },
      { q: "Hardness of water is mainly caused by salts of:", options: ["Sodium and potassium", "Iron and copper", "Carbon and sulphur", "Calcium and magnesium"], a: 3, why: "Dissolved calcium and magnesium salts make water hard." },
      { q: "Which gas makes up most of the air we breathe?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"], a: 2, why: "Air is about 78% nitrogen and 21% oxygen." },
      { q: "What is the SI unit of power?", options: ["Joule", "Watt", "Newton", "Pascal"], a: 1, why: "One watt is one joule of energy per second." },
      { q: "A car covers 120 m in 10 s at constant speed. What is its speed?", options: ["12 m/s", "1.2 m/s", "110 m/s", "1200 m/s"], a: 0, why: "Speed = distance ÷ time = 120 ÷ 10 = 12 m/s." },
      { q: "What force gives a 5 kg mass an acceleration of 4 m/s²?", options: ["9 N", "1.25 N", "80 N", "20 N"], a: 3, why: "F = ma = 5 × 4 = 20 N." },
      { q: "Which of these is a vector quantity?", options: ["Speed", "Mass", "Velocity", "Time"], a: 2, why: "A vector has both size and direction. Velocity does; speed does not." },
      { q: "What is the SI unit of frequency?", options: ["Decibel", "Hertz", "Watt", "Ohm"], a: 1, why: "One hertz is one cycle per second." },
      { q: "In which of these does light travel fastest?", options: ["Vacuum", "Water", "Glass", "Air"], a: 0, why: "Light is fastest in a vacuum and slows down in any material." },
      { q: "The reflection of sound is called:", options: ["Refraction", "Resonance", "Diffraction", "Echo"], a: 3, why: "A sound reflected from a hard surface and heard again is an echo." },
      { q: "What energy changes happen in a working battery-powered torch?", options: ["Heat → light → sound", "Light → electrical → chemical", "Chemical → electrical → light", "Sound → electrical → heat"], a: 2, why: "The battery stores chemical energy, which becomes electrical energy and then light (and some heat)." },
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
      { q: "Who wrote the novel “Things Fall Apart”?", options: ["Wole Soyinka", "Chinua Achebe", "Chimamanda Adichie", "Ngũgĩ wa Thiong'o"], a: 1, why: "Achebe published it in 1958." },
      { q: "Who was the first African to win the Nobel Prize in Literature?", options: ["Wole Soyinka", "Chinua Achebe", "Nadine Gordimer", "Naguib Mahfouz"], a: 0, why: "Soyinka won in 1986." },
      { q: "What is Nigeria's currency called?", options: ["Cedi", "Rand", "Shilling", "Naira"], a: 3, why: "The naira replaced the Nigerian pound in 1973." },
      { q: "Which is the most populous city in Nigeria?", options: ["Abuja", "Kano", "Lagos", "Port Harcourt"], a: 2, why: "Lagos is the country's largest city and main commercial centre." },
      { q: "The Kainji Dam is built on which river?", options: ["River Benue", "River Niger", "River Kaduna", "River Ogun"], a: 1, why: "Kainji Dam is in Niger State, on the River Niger." },
      { q: "What is the highest mountain in Nigeria?", options: ["Chappal Waddi", "Zuma Rock", "Mount Patti", "Obudu Plateau"], a: 0, why: "Chappal Waddi in Taraba State rises about 2,419 m." },
      { q: "In which year did Nigeria become a republic?", options: ["1960", "1966", "1979", "1963"], a: 3, why: "On 1 October 1963 Nigeria cut its last constitutional ties with the British Crown." },
      { q: "Who was the first Nigerian Governor-General?", options: ["Tafawa Balewa", "Obafemi Awolowo", "Nnamdi Azikiwe", "Ahmadu Bello"], a: 2, why: "He took over from the last British governor-general in November 1960 and became President in 1963." },
      { q: "In which year were Northern and Southern Nigeria amalgamated?", options: ["1900", "1914", "1960", "1922"], a: 1, why: "The amalgamation took place in 1914." },
      { q: "Who oversaw the amalgamation of Nigeria in 1914?", options: ["Lord Lugard", "Sir Hugh Clifford", "Sir Arthur Richards", "Lord Mountbatten"], a: 0, why: "Frederick Lugard became the first Governor-General of the amalgamated Nigeria." },
      { q: "Which country is called the “Land of the Rising Sun”?", options: ["China", "Thailand", "Egypt", "Japan"], a: 3, why: "Japan's name means “origin of the sun”." },
      { q: "What is the smallest continent by area?", options: ["Europe", "Antarctica", "Australia (Oceania)", "South America"], a: 2, why: "Australia/Oceania is the smallest of the continents." },
      { q: "Which is the largest country in Africa by area?", options: ["Nigeria", "Algeria", "Egypt", "Ethiopia"], a: 1, why: "Algeria has been Africa's largest country since South Sudan separated from Sudan." },
      { q: "What is the capital of Ghana?", options: ["Accra", "Kumasi", "Tamale", "Lomé"], a: 0, why: "Accra is on the Gulf of Guinea coast." },
      { q: "What is the capital of Kenya?", options: ["Mombasa", "Kampala", "Dodoma", "Nairobi"], a: 3, why: "Nairobi is Kenya's capital and largest city." },
      { q: "What is the capital of Egypt?", options: ["Alexandria", "Giza", "Cairo", "Luxor"], a: 2, why: "Cairo sits on the River Nile." },
      { q: "Who was the first person to walk on the Moon?", options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"], a: 1, why: "Armstrong stepped onto the Moon on 20 July 1969." },
      { q: "In which city is the headquarters of the African Union?", options: ["Addis Ababa", "Abuja", "Nairobi", "Accra"], a: 0, why: "The AU is based in Addis Ababa, Ethiopia." },
      { q: "In which city is the headquarters of ECOWAS?", options: ["Lagos", "Dakar", "Accra", "Abuja"], a: 3, why: "The ECOWAS Commission is in Abuja, Nigeria." },
      { q: "Who discovered penicillin?", options: ["Louis Pasteur", "Robert Koch", "Alexander Fleming", "Edward Jenner"], a: 2, why: "Fleming noticed the mould's germ-killing effect in 1928." },
      { q: "The Great Wall is found in which country?", options: ["India", "China", "Mongolia", "Japan"], a: 1, why: "The Great Wall stretches across northern China." },
      { q: "In which city is the Eiffel Tower?", options: ["Paris", "London", "Rome", "Madrid"], a: 0, why: "It was built for the 1889 World's Fair." },
      { q: "Who invented the telephone?", options: ["Thomas Edison", "Guglielmo Marconi", "Nikola Tesla", "Alexander Graham Bell"], a: 3, why: "Bell was granted the patent in 1876." },
      { q: "How many players does one football team have on the pitch?", options: ["9", "10", "11", "12"], a: 2, why: "Each side plays with eleven players, including the goalkeeper." },
      { q: "In which year did Nigeria win Olympic gold in men's football?", options: ["1992", "1996", "2000", "1988"], a: 1, why: "Nigeria beat Argentina in the Atlanta final." },
      { q: "The Durbar festival is most closely linked with which part of Nigeria?", options: ["The North", "The South-West", "The South-East", "The Niger Delta"], a: 0, why: "Durbar is a horse-riding festival of the emirates, for example in Kano and Katsina." },
      { q: "Which animals appear on Nigeria's coat of arms?", options: ["Two lions", "Two eagles", "Two elephants", "Two horses"], a: 3, why: "Two white horses support the shield, and an eagle sits on top." },
      { q: "What are the colours of the Nigerian flag?", options: ["Green and yellow", "Red and white", "Green and white", "Blue and green"], a: 2, why: "The flag has three vertical bands: green, white, green." },
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

// Picks questions this student hasn't seen yet. When the whole bank has been used, a fresh cycle starts.
const pickFresh = (questions, n, seenList) => {
  const seen = new Set(seenList);
  let picked = shuffle(questions.filter((q) => !seen.has(q.q))).slice(0, n);
  let nextSeen = [...seenList, ...picked.map((q) => q.q)];
  if (picked.length < n) {
    const used = new Set(picked.map((q) => q.q));
    const refill = shuffle(questions.filter((q) => !used.has(q.q))).slice(0, n - picked.length);
    picked = [...picked, ...refill];
    nextSeen = picked.map((q) => q.q); // a new cycle begins
  }
  return { items: prepare(picked, picked.length), seen: nextSeen };
};

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

const INITIAL_DATA = { history: [], daily: { date: "", rounds: 0 }, session: null, premiumUntil: null, historyOwner: null, devPremium: false, seen: {} };

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
  const [authMode, setAuthMode] = useState("signin"); // "signin" | "forgot" | "reset"
  const [resetToken, setResetToken] = useState(null); // kept in memory only, never saved
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

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

  /* ----- links from emails: password reset and email confirmation ----- */
  useEffect(() => {
    if (!cloudReady) return;
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const type = h.get("type");
    if (!h.get("access_token") && !h.get("error")) return;
    if (type === "recovery" && h.get("access_token")) {
      setResetToken(h.get("access_token"));
      setAuthMode("reset");
      setScreen("account");
    } else if (h.get("error")) {
      setAuthMode("forgot");
      setScreen("account");
      setMsg("That link has expired or was already used. To reset your password, enter your email below to get a new link.");
    } else {
      setScreen("account");
      setMsg("Email confirmed. You can sign in now.");
    }
    // remove the secret token from the address bar
    window.history.replaceState({}, "", window.location.pathname + window.location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const sendReset = async () => {
    if (!email.trim()) { setMsg("Type the email you signed up with."); return; }
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(window.location.origin)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: CONFIG.SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.msg || j.error_description || j.message || "Could not send the email. Try again later.");
      }
      // Same message whether or not the email has an account, so nobody can use this to find out who has one.
      setMsg("If that email has an account, a reset link is on its way. Check your inbox and spam folder. The link works once and expires soon.");
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  const saveNewPassword = async () => {
    if (newPassword.length < 6) { setMsg("Choose a password of at least 6 characters."); return; }
    if (newPassword !== newPassword2) { setMsg("The two passwords don't match."); return; }
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${resetToken}` },
        body: JSON.stringify({ password: newPassword }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.msg || j.error_description || j.message || "Could not change the password. The link may have expired: ask for a new one.");
      setResetToken(null); setNewPassword(""); setNewPassword2("");
      setAuthMode("signin");
      setMsg("Password changed. Sign in with your new password.");
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
    const { items, seen } = pickFresh(s.questions, n, (dataRef.current.seen && dataRef.current.seen[s.id]) || []);
    commit((d) => ({ ...d, seen: { ...(d.seen || {}), [s.id]: seen } }));
    start(label, s.id, items, exam, EXAMS[exam].forceTimer || timed);
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

          {cloudReady && authMode === "reset" && resetToken && (
            <Card style={{ border: `1.5px solid ${C.gold}` }}>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Set a new password</div>
              <div style={{ color: C.mute, fontSize: 14, lineHeight: 1.45, marginBottom: 12 }}>Choose a new password for your account.</div>
              <input type="password" aria-label="New password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (6+ characters)" style={inputStyle} />
              <input type="password" aria-label="Repeat new password" autoComplete="new-password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveNewPassword(); }} placeholder="Repeat the new password" style={inputStyle} />
              <button onClick={saveNewPassword} disabled={busy} style={primaryBtn(busy)}>Save new password</button>
              {msg && <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.45, color: C.gold }}>{msg}</div>}
            </Card>
          )}

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
            {cloudReady && !user && authMode === "forgot" && (
              <>
                <div style={{ color: C.mute, fontSize: 14, lineHeight: 1.45, marginBottom: 12 }}>Enter the email you signed up with and we'll send you a link to choose a new password.</div>
                <input type="email" aria-label="Email address" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendReset(); }} placeholder="Email address" style={inputStyle} />
                <button onClick={sendReset} disabled={busy} style={primaryBtn(busy)}>Send reset link</button>
                <button onClick={() => { setAuthMode("signin"); setMsg(""); }} style={{ marginTop: 10, width: "100%", padding: 10, background: "none", border: "none", color: C.mute, fontSize: 14, fontFamily: FONT, cursor: "pointer" }}>Back to sign in</button>
              </>
            )}
            {cloudReady && !user && authMode !== "forgot" && authMode !== "reset" && (
              <>
                <input type="email" aria-label="Email address" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" style={inputStyle} />
                <input type="password" aria-label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") signIn(); }} placeholder="Password (6+ characters)" style={inputStyle} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={signIn} disabled={busy} style={{ ...primaryBtn(busy), flex: 1 }}>Sign in</button>
                  <button onClick={signUp} disabled={busy} style={{ flex: 1, padding: 15, borderRadius: 12, border: `2px solid ${C.line}`, background: "transparent", color: C.ivory, fontWeight: 800, fontSize: 16, fontFamily: FONT, cursor: "pointer" }}>Create account</button>
                </div>
                <button onClick={() => { setAuthMode("forgot"); setMsg(""); }} style={{ marginTop: 10, width: "100%", padding: 10, background: "none", border: "none", color: C.gold, fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>Forgot password?</button>
              </>
            )}
            {msg && !(authMode === "reset" && resetToken) && <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.45, color: C.gold }}>{msg}</div>}
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
