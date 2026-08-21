/* =========================================================
   Zerdeli · диагностика готовности к НИШ
   Движок. Ничего предметного здесь нет — предметы лежат
   в subjects/*.json, настройки в config.json.
   ========================================================= */
(function () {
"use strict";

/* адрес папки, из которой загружен этот файл */
var SELF = document.currentScript && document.currentScript.src;
var BASE = SELF ? SELF.replace(/[^/]+$/, "") : "./";

var MOUNT = document.getElementById("zd-app");
if (!MOUNT) return;                       // на странице нет теста — выходим молча

var MARKUP = "<div class=\"shell\"><header class=\"mast\"><div class=\"brand\">Zerdeli Education<span data-t=\"mastSub\"></span></div><div class=\"langs\"><button type=\"button\" data-lang=\"ru\" aria-pressed=\"true\">RU</button><button type=\"button\" data-lang=\"kz\" aria-pressed=\"false\">KZ</button></div></header><section class=\"screen on\" id=\"s-intro\"><p class=\"eyebrow\" data-t=\"introEyebrow\"></p><h1 data-t=\"introTitle\"></h1><p class=\"lede\" data-t=\"introLede\"></p><div class=\"facts\"><div class=\"fact\"><b class=\"mono\" id=\"f-count\">20</b><span data-t=\"factCount\"></span></div><div class=\"fact\"><b class=\"mono\" id=\"f-time\">25</b><span data-t=\"factTime\"></span></div><div class=\"fact\"><b class=\"mono\">5</b><span data-t=\"factBlocks\"></span></div></div><div class=\"strip\"><p class=\"strip-h\" data-t=\"whoHead\"></p><div class=\"field\" id=\"fld-child\"><label for=\"i-child\" data-t=\"labChild\"></label><input id=\"i-child\" type=\"text\" autocomplete=\"off\" spellcheck=\"false\"><p class=\"err\" data-t=\"errChild\"></p></div><div class=\"field\"><label for=\"i-grade\" data-t=\"labGrade\"></label><select id=\"i-grade\"><option value=\"3\">3</option><option value=\"4\">4</option><option value=\"5\" selected>5</option><option value=\"6\">6</option></select></div><p class=\"note\" data-t=\"gradeNote\"></p><button class=\"btn\" id=\"go-handoff\" style=\"margin-top:26px\" data-t=\"btnNext\"></button></div></section><section class=\"screen\" id=\"s-handoff\"><p class=\"eyebrow\" data-t=\"handoffEyebrow\"></p><h1 data-t=\"handoffTitle\"></h1><p class=\"lede\" data-t=\"handoffLede\"></p><ul class=\"rules\" id=\"rules\"></ul><button class=\"btn\" id=\"go-test\" style=\"margin-top:28px\" data-t=\"btnStart\"></button><p class=\"note\" style=\"margin-top:14px\" data-t=\"handoffNote\"></p></section><section class=\"screen\" id=\"s-test\"><div class=\"bar\"><div class=\"bar-top\"><div class=\"counter\"><span data-t=\"wordTask\"></span>&nbsp;<b class=\"mono\" id=\"c-now\">01</b> / <span class=\"mono\" id=\"c-all\">20</span></div><div class=\"clock mono\" id=\"clock\">25:00</div></div><div class=\"sheet\" id=\"sheet\"></div></div><div id=\"q-wrap\"></div><div class=\"btn-row\"><button class=\"btn skip\" id=\"q-skip\" data-t=\"btnSkip\"></button><button class=\"btn\" id=\"q-next\" disabled data-t=\"btnNext\"></button></div></section><section class=\"screen\" id=\"s-lead\"><p class=\"eyebrow\" data-t=\"leadEyebrow\"></p><h1 data-t=\"leadTitle\"></h1><p class=\"lede\" data-t=\"leadLede\"></p><div class=\"strip\" style=\"margin-top:36px\"><div class=\"field\" id=\"fld-name\"><label for=\"i-name\" data-t=\"labParent\"></label><input id=\"i-name\" type=\"text\" autocomplete=\"name\"><p class=\"err\" data-t=\"errName\"></p></div><div class=\"field\" id=\"fld-phone\"><label for=\"i-phone\" data-t=\"labPhone\"></label><input id=\"i-phone\" type=\"tel\" inputmode=\"tel\" autocomplete=\"tel\" placeholder=\"+7 (___) ___-__-__\"><p class=\"err\" data-t=\"errPhone\"></p></div><button class=\"btn\" id=\"go-result\" data-t=\"btnResult\"></button><p class=\"note\" style=\"margin-top:14px\" data-t=\"leadNote\"></p></div></section><section class=\"screen\" id=\"s-result\"><p class=\"eyebrow\" id=\"r-eyebrow\"></p><h1 data-t=\"resTitle\"></h1><div class=\"verdict\"><div class=\"big mono\"><span id=\"r-score\">0</span><s>/<span id=\"r-total\">20</span></s></div><div class=\"verdict-side\"><span class=\"level\" id=\"r-level\"></span><p id=\"r-leveltxt\"></p></div></div><p class=\"note\" style=\"margin-top:12px\" data-t=\"resFine\"></p><div class=\"strip\"><p class=\"strip-h\" data-t=\"sheetHead\"></p><div class=\"sheet\" id=\"r-sheet\"></div><div class=\"sheet-legend\"><span><em class=\"f\"></em><i style=\"font-style:normal\" data-t=\"legOk\"></i></span><span><em class=\"x\"></em><i style=\"font-style:normal\" data-t=\"legNo\"></i></span><span><em class=\"m\"></em><i style=\"font-style:normal\" data-t=\"legMiss\"></i></span></div></div><div class=\"strip\"><p class=\"strip-h\" data-t=\"blocksHead\"></p><div class=\"blocks\" id=\"r-blocks\"></div></div><div class=\"strip\"><p class=\"strip-h\" data-t=\"gapsHead\"></p><div id=\"r-gaps\"></div></div><div class=\"strip\"><p class=\"strip-h\" data-t=\"timeHead\"></p><div class=\"tgrid\" id=\"r-time\"></div><p class=\"note\" style=\"margin-top:14px\" id=\"r-timetxt\"></p></div><div id=\"r-more\"></div><div class=\"cta\"><h2 data-t=\"ctaTitle\"></h2><p data-t=\"ctaText\"></p><a class=\"btn\" id=\"cta-main\" href=\"#\" data-t=\"ctaBtn\"></a><button class=\"btn ghost\" id=\"cta-print\" data-t=\"ctaPrint\"></button></div><div class=\"foot\"><span data-t=\"footLeft\"></span><span class=\"mono\" id=\"foot-id\"></span></div></section></div>";

function get(path) {
  return fetch(BASE + path, { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error(path + " → " + r.status);
    return r.json();
  });
}

function fail(msg) {
  MOUNT.innerHTML =
    '<div class="shell"><div class="strip" style="margin-top:60px">' +
    '<p class="strip-h">Тест не загрузился</p>' +
    '<p class="note">' + msg + '</p></div></div>';
}

var wanted = new URLSearchParams(location.search).get("subject") || "";

Promise.all([get("config.json"), get("subjects.json")])
  .then(function (res) {
    var cfg = res[0], reg = res[1];
    var list = reg.subjects.filter(function (s) { return s.ready; });
    if (!list.length) throw new Error("нет ни одного готового предмета");

    var pick = list.filter(function (s) { return s.id === wanted; })[0] || list[0];

    return get("subjects/" + pick.file).then(function (bank) {
      window.__ZD_CFG__ = {
        subject:  pick.id,
        askCount: bank.recommendedOnlineCount || cfg.askCount || 20,
        endpoint: cfg.endpoint || "",
        whatsapp: cfg.whatsapp || "",
        ctaUrl:   cfg.ctaUrl || "/",
        ctaUrlKz: cfg.ctaUrlKz || cfg.ctaUrl || "/"
      };
      window.__ZD_BANKS__ = {};
      window.__ZD_BANKS__[pick.id] = bank;
      window.__ZD_REG__ = reg.subjects;
      window.__ZD_PICK__ = pick;

      MOUNT.innerHTML = MARKUP;
      boot();
    });
  })
  .catch(function (e) {
    fail("Обновите страницу. Если не помогло — напишите нам, мы починим. (" + e.message + ")");
  });

function boot() {
  /* =========================================================
     Zerdeli · диагностика готовности к НИШ
     Данные предметов лежат в SUBJECTS. Чтобы добавить предмет —
     положите рядом ещё один объект того же формата.
     ========================================================= */


  const CONFIG = window.__ZD_CFG__;

  const SUBJECTS = window.__ZD_BANKS__;

  /* ---------- строки интерфейса ---------- */
  const T = {
  ru:{
    mastSub:"Алматы",
    introEyebrow:"НИШ · математика · 5 класс",
    introTitle:"Проверим, готов ли ребёнок к формату экзамена",
    introLede:"Задачи взяты из вступительного экзамена НИШ. После теста вы увидите не только балл, а полную картину: какие темы проседают, где ребёнок теряет баллы на ровном месте и сколько времени у него уходит на каждый тип задач.",
    factCount:"задач формата НИШ",
    factTime:"минут на весь тест",
    factBlocks:"тем в разборе",
    whoHead:"Кто решает",
    labChild:"Имя ребёнка",
    labGrade:"Класс",
    errChild:"Впишите имя — оно будет в разборе",
    gradeNote:"Задачи составлены по программе 5 класса. Для 3–4 класса тест будет заметно трудным — это нормально, разбор всё равно покажет, что уже есть, а что впереди.",
    btnNext:"Дальше",

    handoffEyebrow:"Шаг 2 из 3",
    handoffTitle:"Дальше решает ребёнок",
    handoffLede:"Передайте телефон ребёнку. Таймер запустится, как только он нажмёт «Начать».",
    rules:[
      ["01","Двадцать задач, двадцать пять минут. Время идёт на весь тест сразу, не на каждую задачу."],
      ["02","Вернуться к предыдущей задаче нельзя — как на настоящем экзамене."],
      ["03","Считать в уме или на черновике. Калькулятор ломает весь смысл: он покажет чужой результат."],
      ["04","Задача не идёт — лучше пропустить и вернуть время на остальные."]
    ],
    btnStart:"Начать",
    handoffNote:"Если ребёнок не успеет — тест закроется сам, и разбор всё равно будет.",

    wordTask:"Задача",
    wordNorm:"норма",
    wordOf:"из",
    btnSkip:"Пропустить",
    btnFinish:"Завершить",
    timeUp:"Время вышло",

    leadEyebrow:"Шаг 3 из 3",
    leadTitle:"Разбор готов",
    leadLede:"Оставьте телефон — пришлём разбор в WhatsApp, чтобы он остался у вас под рукой и его можно было показать учителю.",
    labParent:"Ваше имя",
    labPhone:"Телефон",
    errName:"Впишите имя",
    errPhone:"Проверьте номер: 11 цифр, начиная с 7",
    btnResult:"Показать разбор",
    leadNote:"Разбор откроется сразу на этом экране. Мы позвоним один раз — предложить бесплатную диагностику в центре.",

    resTitle:"Разбор",
    resFine:"Оценка по 20 задачам из банка в 40. Это срез на сегодня, а не приговор: через месяц занятий картина меняется.",
    sheetHead:"Бланк ответов",
    legOk:"верно",
    legNo:"неверно",
    legMiss:"пропущено",
    blocksHead:"По темам",
    gapsHead:"Где теряются баллы",
    timeHead:"Время",
    tTotal:"всего",
    tAvg:"на задачу",
    tSlow:"дольше нормы",
    tFast:"слишком быстро",
    timeTextSlow:"Задачи, на которые ушло заметно больше нормы, — это темы, где ребёнок считает, но медленно. На экзамене такая задача съедает время двух других.",
    timeTextFast:"Ответы быстрее 15 секунд — почти наверняка угадывание. Балл за них случайный, и на экзамене он не повторится.",
    timeTextOk:"Темп ровный: ребёнок распределяет время по задачам, а не застревает на одной.",
    gapNoneTitle:"Явных провалов нет",
    gapNoneText:"По каждой теме ребёнок решает больше половины. Дальше растёт не знание тем, а скорость и устойчивость к непривычным формулировкам — это и есть разница между «сдал» и «прошёл на грант».",
    ctaTitle:"Что этот тест не увидел",
    ctaText:"Экран показывает результат. Он не показывает, как ребёнок думает: на чём останавливается, что переспрашивает, где сдаётся раньше времени. Это видно только на живой работе. Диагностика в центре бесплатная — приходите с этим разбором.",
    ctaBtn:"Записаться на диагностику",
    ctaPrint:"Сохранить разбор в PDF",
    footLeft:"Zerdeli Education · Алматы",
    levelsKz:null
  },
  kz:{
    mastSub:"Алматы",
    introEyebrow:"НЗМ · математика · 5 сынып",
    introTitle:"Бала емтихан форматына дайын ба — тексерейік",
    introLede:"Тапсырмалар НЗМ-нің қабылдау емтиханынан алынған. Тесттен кейін тек ұпайды емес, толық көріністі көресіз: қай тақырып ақсайды, бала қай жерде бос орында балл жоғалтады және әр тапсырма түріне қанша уақыт жұмсайды.",
    factCount:"НЗМ форматындағы тапсырма",
    factTime:"минут — бүкіл тестке",
    factBlocks:"тақырып бойынша талдау",
    whoHead:"Кім шығарады",
    labChild:"Баланың аты",
    labGrade:"Сынып",
    errChild:"Атын жазыңыз — талдауда көрсетіледі",
    gradeNote:"Тапсырмалар 5 сынып бағдарламасы бойынша жасалған. 3–4 сынып үшін тест ауырлау болады — бұл қалыпты жағдай, талдау бәрібір не игерілгенін, не алда тұрғанын көрсетеді.",
    btnNext:"Әрі қарай",

    handoffEyebrow:"3 қадамның 2-сі",
    handoffTitle:"Әрі қарай баланың кезегі",
    handoffLede:"Телефонды балаға беріңіз. «Бастау» дегенде таймер қосылады.",
    rules:[
      ["01","Жиырма тапсырма, жиырма бес минут. Уақыт бүкіл тестке беріледі, әр тапсырмаға бөлек емес."],
      ["02","Алдыңғы тапсырмаға қайта оралуға болмайды — нағыз емтихандағыдай."],
      ["03","Есептеу ауызша не жобада. Калькулятор бүкіл мәнін жояды: ол баланың емес, өзінің нәтижесін көрсетеді."],
      ["04","Тапсырма шықпай жатса — өткізіп жіберген дұрыс, уақыт қалғанына керек."]
    ],
    btnStart:"Бастау",
    handoffNote:"Бала үлгермей қалса, тест өзі жабылады — талдау бәрібір шығады.",

    wordTask:"Тапсырма",
    wordNorm:"нормасы",
    wordOf:"тапсырмадан",
    btnSkip:"Өткізу",
    btnFinish:"Аяқтау",
    timeUp:"Уақыт бітті",

    leadEyebrow:"3 қадамның 3-сі",
    leadTitle:"Талдау дайын",
    leadLede:"Телефон нөміріңізді қалдырыңыз — талдауды WhatsApp-қа жібереміз, қолыңызда тұрсын әрі мұғалімге көрсете аласыз.",
    labParent:"Атыңыз",
    labPhone:"Телефон",
    errName:"Атыңызды жазыңыз",
    errPhone:"Нөмірді тексеріңіз: 7-ден басталатын 11 сан",
    btnResult:"Талдауды көрсету",
    leadNote:"Талдау осы экранда бірден ашылады. Бір рет қана хабарласамыз — орталықтағы тегін диагностикаға шақыру үшін.",

    resTitle:"Талдау",
    resFine:"Бағалау 40 тапсырманың 20-сы бойынша. Бұл — бүгінгі қима, түпкілікті үкім емес: бір айлық сабақтан кейін көрініс өзгереді.",
    sheetHead:"Жауап парағы",
    legOk:"дұрыс",
    legNo:"қате",
    legMiss:"өткізілген",
    blocksHead:"Тақырыптар бойынша",
    gapsHead:"Балл қай жерде жоғалады",
    timeHead:"Уақыт",
    tTotal:"барлығы",
    tAvg:"бір тапсырмаға",
    tSlow:"нормадан ұзақ",
    tFast:"тым тез",
    timeTextSlow:"Нормадан әлдеқайда көп уақыт кеткен тапсырмалар — бала шығарады, бірақ баяу. Емтиханда мұндай бір есеп екі есептің уақытын жеп қояды.",
    timeTextFast:"15 секундтан жылдам берілген жауаптар — көбіне болжам. Ондай ұпай кездейсоқ, емтиханда қайталанбайды.",
    timeTextOk:"Қарқыны бірқалыпты: бала уақытты тапсырмаларға бөліп үлестіреді, біреуіне тұрып қалмайды.",
    gapNoneTitle:"Айқын олқылық жоқ",
    gapNoneText:"Әр тақырып бойынша бала жартысынан көбін шығарады. Бұдан әрі өсетіні — тақырып білімі емес, жылдамдық пен бейтаныс тұжырымдамаға төзімділік. «Тапсырды» мен «грантқа өтті» дегеннің айырмасы дәл осында.",
    ctaTitle:"Бұл тест көрмеген нәрсе",
    ctaText:"Экран нәтижені көрсетеді. Ал баланың қалай ойлайтынын көрсетпейді: қай жерде тоқтайды, нені қайта сұрайды, қашан ерте бас тартады. Мұны тек тірі жұмыс үстінде байқауға болады. Орталықтағы диагностика тегін — осы талдаумен келіңіз.",
    ctaBtn:"Диагностикаға жазылу",
    ctaPrint:"Талдауды PDF-ке сақтау",
    footLeft:"Zerdeli Education · Алматы",
    levelsKz:null
  }
  };

  /* уровни: казахские подписи (в банке задач лежит только русская) */
  const LEVEL_KZ = {
    bastauysh:"Негіз бар, бірақ олқылықтары байқалады",
    senimdi:"Шығарады, бірақ формат пен уақыттан балл жоғалтады",
    kushti:"Олимпиада форматына дайын"
  };

  /* чертёж к задаче 31 — восстановлен по описанию из банка */

  /* ================= движок ================= */

  const LETTERS = "ABCDEFGHIJ";

  const CMP = {
    ru:["Значение А больше","Значение В больше","Значения равны","Данных недостаточно"],
    kz:["А мәні үлкен","В мәні үлкен","Мәндер тең","Дерек жеткіліксіз"]
  };

  /* строка может быть текстом, парой {ru,kz} или {latex,ru,kz} */
  function loc(v, lg){
    if(v === null || v === undefined) return "";
    if(typeof v === "string") return frText(v);
    var out = v.latex ? tex(v.latex) : "";
    var s = v[lg] !== undefined ? v[lg] : (v.ru !== undefined ? v.ru : "");
    if(s) out += (out ? " " : "") + frText(String(s));
    return out;
  }

  /* сравнение столбцов A/B — свой формат, приводим к общему */
  function prep(q){
    if(q.a && q.b){
      q._cmp = true;
      q._ci = (D.fixedOptions || ["A","B","C","D"]).indexOf(q.correct);
    } else {
      q._cmp = false;
      q._ci = q.correct;
    }
    return q;
  }

  const $ = s => document.querySelector(s);
  const D = SUBJECTS[CONFIG.subject];
  const _q=new URLSearchParams(location.search).get("lang");
  let lang = (_q==="kz"||_q==="ru") ? _q : (localStorage.getItem("zd_lang") || "ru");
  let lastResult = null;
  let pool = [], idx = 0, answers = [], qStart = 0, endAt = 0, tick = null, picked = null, keepTime = false;

  /* ---- отрисовка LaTeX-подмножества, которое есть в банке ---- */
  function readGroup(str,i){
    while(str[i]===" ") i++;
    if(str[i]!=="{") return {body:str[i]||"", end:i+1};
    let depth=0, start=i+1, j=i;
    for(;j<str.length;j++){ if(str[j]==="{")depth++; else if(str[j]==="}"){depth--; if(!depth)break;} }
    return {body:str.slice(start,j), end:j+1};
  }
  function parseFrac(str){
    let out="", i=0;
    while(i<str.length){
      const t = str.startsWith("\\tfrac",i) ? 6 : (str.startsWith("\\frac",i) ? 5 : 0);
      if(t){
        let j=i+t;
        const a=readGroup(str,j); j=a.end;
        const b=readGroup(str,j); j=b.end;
        out+=`<span class="fr"><span class="fr-n">${parseFrac(a.body)}</span><span class="fr-d">${parseFrac(b.body)}</span></span>`;
        i=j; continue;
      }
      out+=str[i]; i++;
    }
    return out;
  }
  function tex(src){
    return parseFrac(src)
      .replace(/\\left\(/g,"(").replace(/\\right\)/g,")")
      .replace(/\{,\}/g,",")
      .replace(/\\cdot/g,"·")
      .replace(/\\quad/g,'<span class="sp-q"></span>')
      .replace(/\\,/g,'<span class="sp-t"></span>')
      .replace(/\\ /g," ")
      .replace(/ - /g," \u2212 ");
  }
  function fr(n,d){ return `<span class="fr"><span class="fr-n">${n}</span><span class="fr-d">${d}</span></span>`; }
  function frText(s){
    return String(s)
      .replace(/(\d+)\s+(\d+)\/(\d+)/g, (m,w,n,d)=> w + fr(n,d))
      .replace(/(\d+)\/(\d+)/g, (m,n,d)=> fr(n,d));
  }

  /* ---- подбор задач: пропорционально блокам, без битых ---- */
  function buildPool(){
    const ok = D.questions.filter(q => q.correct !== null && q.correct !== undefined
                                     && (!q.image || q.svg));
    const byBlock = {};
    ok.forEach(q => (byBlock[q.block] = byBlock[q.block] || []).push(q));
    const keys = Object.keys(byBlock);
    const share = keys.map(k => ({k, n: byBlock[k].length}));
    const want = CONFIG.askCount;
    let take = share.map(s => ({k:s.k, n: Math.floor(s.n / ok.length * want)}));
    let rest = want - take.reduce((a,b)=>a+b.n,0);
    take.sort((a,b)=>b.n-a.n);
    for(let i=0; rest>0; i=(i+1)%take.length){ take[i].n++; rest--; }
    let res = [];
    take.forEach(t=>{
      const arr = byBlock[t.k].slice().sort(()=>Math.random()-.5);
      // задачи без пометки needsCheck идут первыми
      arr.sort((a,b)=> (a.needsCheck?1:0) - (b.needsCheck?1:0));
      res = res.concat(arr.slice(0, Math.min(t.n, arr.length)));
    });
    return res.sort(()=>Math.random()-.5).slice(0, want).map(prep);
  }

  /* ---- язык ---- */
  function applyLang(){
    const t = T[lang];
    document.documentElement.lang = lang === "kz" ? "kk" : "ru";
    document.querySelectorAll("[data-t]").forEach(el=>{
      const v = t[el.dataset.t];
      if(typeof v === "string") el.textContent = v;
    });
    document.querySelectorAll(".langs button").forEach(b=>
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    var extra = D.instructions
      ? '<li><b>!</b><span style="white-space:pre-line">' + loc(D.instructions, lang) + '</span></li>'
      : "";
    $("#rules").innerHTML = extra + t.rules.map(function(r){ return "<li><b>"+r[0]+"</b><span>"+r[1]+"</span></li>"; }).join("");
    var eb = $("#s-intro .eyebrow");
    if(eb) eb.textContent = (lang==="kz"?"НЗМ":"НИШ") + " · " + D.subject[lang] + " · " + D.class + (lang==="kz"?" сынып":" класс");
    var fb = document.querySelectorAll(".fact b")[2];
    if(fb) fb.textContent = Object.keys(D.blocks).length;
    document.documentElement.style.setProperty("--cols", CONFIG.askCount);
    $("#f-count").textContent = CONFIG.askCount;
    $("#f-time").textContent = Math.round(D.timeLimitSec / 60);
    $("#c-all").textContent = String(CONFIG.askCount).padStart(2,"0");
    $("#cta-main").href = lang === "kz" ? CONFIG.ctaUrlKz : CONFIG.ctaUrl;
    if($("#s-result").classList.contains("on") && lastResult) render(lastResult);
    if(!$("#s-test").classList.contains("on")) return;
    keepTime = true; drawQuestion();
  }
  document.querySelectorAll(".langs button").forEach(b=>b.addEventListener("click",()=>{
    lang = b.dataset.lang; localStorage.setItem("zd_lang", lang); applyLang();
  }));

  function show(id){
    document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("on", s.id === id));
    window.scrollTo({top:0, behavior:"instant"});
  }

  /* ---- шаг 1 ---- */
  $("#go-handoff").addEventListener("click", ()=>{
    const name = $("#i-child").value.trim();
    $("#fld-child").classList.toggle("bad", !name);
    if(!name) return $("#i-child").focus();
    show("s-handoff");
  });

  /* ---- шаг 2 → тест ---- */
  $("#go-test").addEventListener("click", ()=>{
    pool = buildPool();
    answers = pool.map(()=>({pick:null, ms:0}));
    idx = 0;
    endAt = Date.now() + D.timeLimitSec * 1000;
    show("s-test");
    drawSheet();
    drawQuestion();
    tick = setInterval(clockTick, 250);
    clockTick();
  });

  function clockTick(){
    const left = Math.max(0, Math.round((endAt - Date.now())/1000));
    const m = String(Math.floor(left/60)).padStart(2,"0");
    const s = String(left%60).padStart(2,"0");
    const c = $("#clock");
    c.textContent = `${m}:${s}`;
    c.classList.toggle("low", left <= 120);
    if(left === 0){ clearInterval(tick); finish(true); }
  }

  function drawSheet(){
    $("#sheet").innerHTML = pool.map(()=>"<i></i>").join("");
  }
  function markSheet(){
    const cells = $("#sheet").children;
    for(let i=0;i<cells.length;i++){
      cells[i].className = i === idx ? "now" : (answers[i].pick !== null ? "done" : (answers[i].ms ? "miss" : ""));
    }
  }

  function drawQuestion(){
    const q = pool[idx], t = T[lang];
    picked = answers[idx].pick;

    var head = "", body = "", opts;

    var p = (q.passage && D.passages) ? D.passages[q.passage] : null;
    if(p){
      head = '<div class="psg"><div class="psg-t">' + p.title + '</div>'
           + (p.instruction ? '<div class="psg-i">' + loc(p.instruction, lang) + '</div>' : "")
           + p.text.split(/\n\n+/).map(function(x){ return "<p>" + x + "</p>"; }).join("")
           + '</div>';
    }

    if(q._cmp){
      body = (q.context ? '<p class="qtext">' + loc(q.context, lang) + '</p>' : "")
           + (q.svg ? '<div class="qfig">' + q.svg + '</div>' : "")
           + '<div class="cmp"><div class="cmp-c"><div class="cmp-h">А</div><div class="cmp-v">' + loc(q.a, lang) + '</div></div>'
           + '<div class="cmp-c"><div class="cmp-h">В</div><div class="cmp-v">' + loc(q.b, lang) + '</div></div></div>';
      opts = CMP[lang];
    } else {
      body = '<p class="qtext">' + loc(q.text, lang) + '</p>'
           + (q.latex ? '<div class="qmath">' + tex(q.latex) + '</div>' : "")
           + (q.svg ? '<div class="qfig">' + q.svg + '</div>' : "");
      opts = q.options.map(function(o){ return loc(o, lang); });
    }

    const buttons = opts.map(function(o,i){
      return '<button class="opt" type="button" data-i="' + i + '" aria-pressed="' + (picked===i) + '">'
           + '<kbd>' + LETTERS[i] + '</kbd><span>' + o + '</span></button>';
    }).join("");

    $("#q-wrap").innerHTML = '<p class="qtag">' + D.blocks[q.block][lang] + '</p>'
      + head + body + '<div class="opts">' + buttons + '</div>';

    $("#q-wrap").querySelectorAll(".opt").forEach(b=>b.addEventListener("click",()=>{
      picked = +b.dataset.i; answers[idx].pick = picked;
      $("#q-wrap").querySelectorAll(".opt").forEach(x=>x.setAttribute("aria-pressed", String(+x.dataset.i === picked)));
      $("#q-next").disabled = false;
    }));
    $("#c-now").textContent = String(idx+1).padStart(2,"0");
    $("#q-next").disabled = picked === null;
    $("#q-next").textContent = idx === pool.length-1 ? t.btnFinish : t.btnNext;
    $("#q-skip").textContent = t.btnSkip;
    if(!keepTime) qStart = Date.now();
    keepTime = false;
    markSheet();
  }

  function step(){
    answers[idx].pick = picked;
    answers[idx].ms = Date.now() - qStart;
    if(idx === pool.length - 1) return finish(false);
    idx++; drawQuestion();
  }
  $("#q-next").addEventListener("click", step);
  $("#q-skip").addEventListener("click", ()=>{ picked = null; answers[idx].pick = null; step(); });

  document.addEventListener("keydown", e=>{
    if(!$("#s-test").classList.contains("on")) return;
    const map = {"1":0,"2":1,"3":2,"4":3,"5":4,"6":5,
      "a":0,"b":1,"c":2,"d":3,"e":4,"f":5,
      "ф":0,"и":1,"с":2,"в":3,"у":4,"а":5};
    const k = e.key.toLowerCase();
    if(k in map){ const b = $("#q-wrap").querySelectorAll(".opt")[map[k]]; if(b){ b.click(); e.preventDefault(); } }
    else if(e.key === "Enter" && !$("#q-next").disabled){ step(); e.preventDefault(); }
  });

  function finish(byTime){
    clearInterval(tick);
    if(byTime){ answers[idx].pick = picked; answers[idx].ms = Date.now() - qStart; }
    show("s-lead");
    if(byTime) $("#s-lead").querySelector(".eyebrow").textContent = T[lang].timeUp;
  }

  /* ---- телефон ---- */
  const phone = $("#i-phone");
  phone.addEventListener("input", ()=>{
    let d = phone.value.replace(/\D/g,"");
    if(d.startsWith("8")) d = "7" + d.slice(1);
    if(!d.startsWith("7")) d = "7" + d;
    d = d.slice(0,11);
    let out = "+7";
    if(d.length>1) out += " (" + d.slice(1,4);
    if(d.length>=5) out += ") " + d.slice(4,7);
    if(d.length>=8) out += "-" + d.slice(7,9);
    if(d.length>=10) out += "-" + d.slice(9,11);
    phone.value = out;
  });

  $("#go-result").addEventListener("click", ()=>{
    const name = $("#i-name").value.trim();
    const digits = phone.value.replace(/\D/g,"");
    const okName = !!name, okPhone = digits.length === 11 && digits[0] === "7";
    $("#fld-name").classList.toggle("bad", !okName);
    $("#fld-phone").classList.toggle("bad", !okPhone);
    if(!okName) return $("#i-name").focus();
    if(!okPhone) return phone.focus();
    const r = analyse(); lastResult = r;
    try{ localStorage.setItem("zd_phone", digits); localStorage.setItem("zd_parent", name); }catch(e){}
    remember(r);
    send(name, digits, r);
    render(r);
    show("s-result");
  });

  /* ---- анализ ---- */
  function analyse(){
    const total = pool.length;
    let correct = 0, slow = 0, fast = 0, ms = 0;
    const blocks = {};
    pool.forEach((q,i)=>{
      const a = answers[i], ok = a.pick === q._ci, norm = D.blocks[q.block].timeNormSec * 1000;
      if(ok) correct++;
      ms += a.ms;
      if(a.ms > norm * 1.6) slow++;
      if(a.ms < 15000 && !ok && a.pick !== null) fast++;
      const b = blocks[q.block] = blocks[q.block] || {ask:0, ok:0, ms:0, norm:0};
      b.ask++; b.ms += a.ms; b.norm += norm; if(ok) b.ok++;
    });
    const pct = correct / total;
    const top = D.levels[D.levels.length-1].max || D.totalQuestions || pool.length;
    const lv = D.levels.find(l => pct*top >= l.min && pct*top <= l.max) || D.levels[0];
    const rank = Object.keys(blocks)
      .map(k=>({k, ...blocks[k], pct: blocks[k].ok / blocks[k].ask}))
      .sort((a,b)=> a.pct - b.pct || b.ask - a.ask);
    return {total, correct, pct, lv, blocks, rank, slow, fast, ms};
  }

  function fmt(sec){
    const m = Math.floor(sec/60), s = Math.round(sec%60);
    return m ? `${m}:${String(s).padStart(2,"0")}` : `${s}с`;
  }

  function render(r){
    const t = T[lang], child = $("#i-child").value.trim(), grade = $("#i-grade").value;
    $("#r-eyebrow").textContent = `${child} · ${grade} ${lang==="kz"?"сынып":"класс"} · ${D.subject[lang]}`;
    document.title = `${t.resTitle} · ${child} · ${D.subject[lang]}`;
    $("#r-score").textContent = r.correct;
    $("#r-total").textContent = r.total;
    $("#r-level").textContent = r.lv.name;
    $("#r-leveltxt").textContent = lang === "kz" ? (LEVEL_KZ[r.lv.id] || r.lv.ru) : r.lv.ru;
    const dt = new Date(), pad = n => String(n).padStart(2,"0");
    $("#foot-id").textContent = `${pad(dt.getDate())}.${pad(dt.getMonth()+1)}.${dt.getFullYear()}`;

    /* бланк */
    $("#r-sheet").innerHTML = pool.map(()=>"<i></i>").join("");
    const cells = $("#r-sheet").children;
    pool.forEach((q,i)=>{
      const a = answers[i], cls = a.pick === null ? "miss" : (a.pick === q._ci ? "ok" : "no");
      setTimeout(()=>{ cells[i].className = cls; }, 40*i);
    });

    /* темы */
    $("#r-blocks").innerHTML = r.rank.map(b=>{
      const B = D.blocks[b.k], p = Math.round(b.pct*100), weak = b.pct < .7;
      const over = Math.round((b.ms/1000 - b.norm/1000));
      const time = over > 20
        ? `${t.tSlow}: <b>+${fmt(over)}</b>`
        : `${t.tAvg} ${fmt(b.ms/1000/b.ask)} · ${t.wordNorm} ${fmt(b.norm/1000/b.ask)}`;
      return `<div class="brow">
        <div class="brow-h"><strong>${B[lang]}</strong><span><b>${b.ok}</b>/${b.ask}</span></div>
        <div class="track ${weak?"weak":""}"><i data-w="${p}"></i></div>
        <div class="brow-t">${time}</div></div>`;
    }).join("");
    requestAnimationFrame(()=>$("#r-blocks").querySelectorAll(".track i")
      .forEach(el=> el.style.width = el.dataset.w + "%"));

    /* пробелы */
    const weak = r.rank.filter(b => b.pct < .7).slice(0,3);
    $("#r-gaps").innerHTML = weak.length
      ? weak.map(b=>`<div class="gap"><h3>${D.blocks[b.k][lang]} — ${b.ok} ${t.wordOf} ${b.ask}</h3>
          <p>${D.blocks[b.k].gapText[lang]}</p></div>`).join("")
      : `<div class="gap good"><h3>${t.gapNoneTitle}</h3><p>${t.gapNoneText}</p></div>`;

    /* время */
    const used = r.ms/1000;
    $("#r-time").innerHTML = `
      <div class="tcell"><b class="mono">${fmt(used)}</b><span>${t.tTotal}</span></div>
      <div class="tcell"><b class="mono">${fmt(used/r.total)}</b><span>${t.tAvg}</span></div>
      <div class="tcell"><b class="mono ${r.slow?"warn":""}">${r.slow}</b><span>${t.tSlow}</span></div>
      <div class="tcell"><b class="mono ${r.fast?"warn":""}">${r.fast}</b><span>${t.tFast}</span></div>`;
    var fine = document.querySelector('[data-t="resFine"]');
    if(fine) fine.textContent = lang === "kz"
      ? "Бағалау " + (D.totalQuestions || r.total) + " тапсырманың " + r.total + "-сы бойынша. Бұл — бүгінгі қима, түпкілікті үкім емес: бір айлық сабақтан кейін көрініс өзгереді."
      : "Оценка по " + r.total + " задачам из банка в " + (D.totalQuestions || r.total) + ". Это срез на сегодня, а не приговор: через месяц занятий картина меняется.";
    $("#r-timetxt").textContent = r.fast >= 2 ? t.timeTextFast : (r.slow >= 3 ? t.timeTextSlow : t.timeTextOk);
    afterResult(lang);
  }

  $("#cta-print").addEventListener("click", ()=>window.print());

  /* ---- отправка заявки ---- */
  function send(name, digits, r){
    const payload = {
      date: new Date().toISOString(),
      parent: name, phone: "+"+digits,
      child: $("#i-child").value.trim(), grade: $("#i-grade").value,
      lang, subject: CONFIG.subject,
      score: r.correct, total: r.total, level: r.lv.name,
      blocks: r.rank.map(b=>`${b.k} ${b.ok}/${b.ask}`).join("; "),
      timeSec: Math.round(r.ms/1000),
      page: location.pathname
    };
    try{ localStorage.setItem("zd_last_result", JSON.stringify(payload)); }catch(e){}
    if(!CONFIG.endpoint) return;
    fetch(CONFIG.endpoint, {method:"POST", mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"}, body: JSON.stringify(payload)}).catch(()=>{});
  }

  try{
    var kp = localStorage.getItem("zd_phone"), kn = localStorage.getItem("zd_parent");
    if(kn) $("#i-name").value = kn;
    if(kp){ $("#i-phone").value = kp; $("#i-phone").dispatchEvent(new Event("input")); }
  }catch(e){}

  applyLang();

/* ---------- пройденные предметы ---------- */

var STORE = "zd_progress";

function progress() {
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; }
  catch (e) { return {}; }
}

function remember(r) {
  var p = progress();
  p[window.__ZD_PICK__.id] = {
    name: window.__ZD_PICK__.name,
    correct: r.correct,
    total: r.total,
    level: r.lv.name,
    date: Date.now()
  };
  try { localStorage.setItem(STORE, JSON.stringify(p)); } catch (e) {}
}

function label(s, lang) {
  return lang === "kz" ? (s.nameKz || s.name) : s.name;
}

/* сводка по всем пройденным предметам + что осталось */
function afterResult(lang) {
  var done = progress();
  var ids = Object.keys(done);
  var reg = window.__ZD_REG__;
  var host = document.getElementById("r-more");
  if (!host) return;

  var t = lang === "kz"
    ? { sum: "Барлық пәндер бойынша", left: "Қалған пәндер", go: "Бастау",
        soon: "дайындалып жатыр", none: "Барлық дайын пәндер өтілді" }
    : { sum: "По всем предметам", left: "Что осталось пройти", go: "Начать",
        soon: "готовим", none: "Все готовые предметы пройдены" };

  var html = "";

  if (ids.length > 1) {
    html += '<div class="strip"><p class="strip-h">' + t.sum + "</p><div class=\"blocks\">";
    ids.forEach(function (id) {
      var d = done[id], p = Math.round((d.correct / d.total) * 100);
      html += '<div class="brow"><div class="brow-h"><strong>' + d.name +
              '</strong><span><b>' + d.correct + "</b>/" + d.total + "</span></div>" +
              '<div class="track"><i style="width:' + p + '%"></i></div></div>';
    });
    html += "</div></div>";
  }

  var rest = reg.filter(function (s) { return !done[s.id]; });
  if (rest.length) {
    html += '<div class="strip"><p class="strip-h">' + t.left + '</p><div class="dgsubs">';
    rest.forEach(function (s) {
      if (s.ready) {
        html += '<div class="dgsub"><div><div class="dgsubname">' + label(s, lang) +
                '</div><div class="dgsubmeta">' + (s.meta ? s.meta[lang] || "" : "") +
                '</div></div><a class="dgsubgo" href="?subject=' + s.id +
                (lang === "kz" ? "&lang=kz" : "") + '">' + t.go + "</a></div>";
      } else {
        html += '<div class="dgsubsoon"><div class="dgsubsoonname">' + label(s, lang) +
                '</div><div class="dgsubsoonmeta">' + t.soon + "</div></div>";
      }
    });
    html += "</div></div>";
  } else {
    html += '<p class="note" style="margin-top:26px">' + t.none + "</p>";
  }

  host.innerHTML = html;
}

} /* boot */
})();
