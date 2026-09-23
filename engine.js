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

/* Расписание пробных уроков. Одна площадка — Гагарина 93.
   Совпадает с RASPISANIE на лендинге пробного урока: правится в обоих местах. */
var RASP = {
  3: [{d:1,t:"10:30\u201311:30"},{d:3,t:"15:30\u201316:30"},{d:5,t:"10:30\u201311:30"},{d:6,t:"14:30\u201315:30"}],
  4: [{d:2,t:"10:30\u201311:30"},{d:4,t:"15:30\u201316:30"},{d:6,t:"10:30\u201311:30"},{d:6,t:"16:30\u201317:30"}],
  5: [{d:1,t:"15:30\u201316:30"},{d:3,t:"10:30\u201311:30"},{d:5,t:"15:30\u201316:30"},{d:6,t:"12:30\u201313:30"}],
  6: [{d:2,t:"15:30\u201316:30"},{d:4,t:"10:30\u201311:30"},{d:6,t:"11:30\u201312:30"},{d:6,t:"15:30\u201316:30"}]
};
var DNI = {
  ru:{1:"Понедельник",2:"Вторник",3:"Среда",4:"Четверг",5:"Пятница",6:"Суббота"},
  kz:{1:"Дүйсенбі",2:"Сейсенбі",3:"Сәрсенбі",4:"Бейсенбі",5:"Жұма",6:"Сенбі"}
};
var PRICE = 2490;

/* Блок записи живёт внутри тёмного .cta, поэтому поля там светлые.
   Стили держим здесь, чтобы правка была в одном файле. */
var BK_CSS = ""
+ ".cta .bk{margin-top:26px;border-top:1px solid rgba(252,252,250,.25);padding-top:22px}"
+ ".cta .bk .field{margin-bottom:18px}"
+ ".cta .bk label{color:rgba(252,252,250,.6)}"
+ ".cta .bk input,.cta .bk select{color:#FCFCFA;border-bottom-color:rgba(252,252,250,.45)}"
+ ".cta .bk select{background-image:linear-gradient(45deg,transparent 50%,#FCFCFA 50%),linear-gradient(135deg,#FCFCFA 50%,transparent 50%)}"
+ ".cta .bk select option{color:#0A1A0D;background:#FCFCFA}"
+ ".cta .bk input:focus,.cta .bk select:focus{border-bottom-color:var(--lime);box-shadow:0 2px 0 -1px var(--lime)}"
+ ".cta .bk .field.bad input{border-bottom-color:#E3A87A}"
+ ".cta .bk .note{color:rgba(252,252,250,.6)}"
+ ".bk-row{display:grid;grid-template-columns:1fr 1fr;gap:18px}"
+ "@media(max-width:520px){.bk-row{grid-template-columns:1fr;gap:0}}"
+ ".bk-h{font-family:\"JetBrains Mono\",monospace;font-size:11px;font-weight:700;letter-spacing:.16em;"
+ "text-transform:uppercase;color:rgba(252,252,250,.6);margin:6px 0 12px}"
+ ".slots{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}"
+ "@media(max-width:520px){.slots{grid-template-columns:1fr}}"
+ ".slot{display:block;width:100%;text-align:left;font:inherit;font-size:15px;color:#FCFCFA;background:transparent;"
+ "border:1.5px solid rgba(252,252,250,.35);border-radius:0;padding:13px 14px;cursor:pointer;transition:.15s}"
+ ".slot b{display:block;font-weight:600}"
+ ".slot span{display:block;font-family:\"JetBrains Mono\",monospace;font-size:13px;color:rgba(252,252,250,.65);margin-top:3px}"
+ ".slot:hover{border-color:#FCFCFA}"
+ ".slot[aria-pressed=\"true\"]{background:var(--lime);border-color:var(--lime);color:#0A1A0D}"
+ ".slot[aria-pressed=\"true\"] span{color:rgba(10,26,13,.7)}"
+ ".bk-err{color:#E3A87A;font-size:13px;margin:10px 0 0;display:none}"
+ ".bk-err.on{display:block}"
+ ".bk-done{display:none;margin-top:26px;border-top:1px solid rgba(252,252,250,.25);padding-top:22px}"
+ ".bk-done.on{display:block}"
+ ".bk-ok{font-size:17px;color:#FCFCFA;margin:0;line-height:1.5}"
+ ".bk-done .btn{margin-top:18px}";

function bkStyle(){
  if(document.getElementById("zd-bk-css")) return;
  var st = document.createElement("style");
  st.id = "zd-bk-css";
  st.textContent = BK_CSS;
  document.head.appendChild(st);
}

var MOUNT = document.getElementById("zd-app");
if (!MOUNT) return;                       // на странице нет теста — выходим молча

var MARKUP = "<div class=\"shell\"><header class=\"mast\"><div class=\"brand\">Zerdeli Education<span data-t=\"mastSub\"></span></div><div class=\"langs\"><button type=\"button\" data-lang=\"ru\" aria-pressed=\"true\">RU</button><button type=\"button\" data-lang=\"kz\" aria-pressed=\"false\">KZ</button></div></header><section class=\"screen on\" id=\"s-intro\"><p class=\"eyebrow\" data-t=\"introEyebrow\"></p><h1 data-t=\"introTitle\"></h1><p class=\"lede\" data-t=\"introLede\"></p><div class=\"facts\"><div class=\"fact\"><b class=\"mono\" id=\"f-count\">20</b><span data-t=\"factCount\"></span></div><div class=\"fact\"><b class=\"mono\" id=\"f-time\">25</b><span data-t=\"factTime\"></span></div><div class=\"fact\"><b class=\"mono\">5</b><span data-t=\"factBlocks\"></span></div></div><div class=\"strip\"><p class=\"strip-h\" data-t=\"whoHead\"></p><div class=\"field\" id=\"fld-child\"><label for=\"i-child\" data-t=\"labChild\"></label><input id=\"i-child\" type=\"text\" autocomplete=\"off\" spellcheck=\"false\"><p class=\"err\" data-t=\"errChild\"></p></div><div class=\"field\"><label for=\"i-grade\" data-t=\"labGrade\"></label><select id=\"i-grade\"><option value=\"5\" selected>5</option><option value=\"6\">6</option></select></div><p class=\"note\" data-t=\"gradeNote\"></p><button class=\"btn\" id=\"go-handoff\" style=\"margin-top:26px\" data-t=\"btnNext\"></button></div></section><section class=\"screen\" id=\"s-handoff\"><p class=\"eyebrow\" data-t=\"handoffEyebrow\"></p><h1 data-t=\"handoffTitle\"></h1><p class=\"lede\" data-t=\"handoffLede\"></p><ul class=\"rules\" id=\"rules\"></ul><button class=\"btn\" id=\"go-test\" style=\"margin-top:28px\" data-t=\"btnStart\"></button><p class=\"note\" style=\"margin-top:14px\" data-t=\"handoffNote\"></p></section><section class=\"screen\" id=\"s-test\"><div class=\"bar\"><div class=\"bar-top\"><div class=\"counter\"><span data-t=\"wordTask\"></span>&nbsp;<b class=\"mono\" id=\"c-now\">01</b> / <span class=\"mono\" id=\"c-all\">20</span></div><div class=\"clock mono\" id=\"clock\">25:00</div></div><div class=\"sheet\" id=\"sheet\"></div></div><div id=\"q-wrap\"></div><div class=\"btn-row\"><button class=\"btn skip\" id=\"q-skip\" data-t=\"btnSkip\"></button><button class=\"btn\" id=\"q-next\" disabled data-t=\"btnNext\"></button></div></section><section class=\"screen\" id=\"s-lead\"><p class=\"eyebrow\" data-t=\"leadEyebrow\"></p><h1 data-t=\"leadTitle\"></h1><p class=\"lede\" data-t=\"leadLede\"></p><div class=\"strip\" style=\"margin-top:36px\"><div class=\"field\" id=\"fld-name\"><label for=\"i-name\" data-t=\"labParent\"></label><input id=\"i-name\" type=\"text\" autocomplete=\"name\"><p class=\"err\" data-t=\"errName\"></p></div><div class=\"field\" id=\"fld-phone\"><label for=\"i-phone\" data-t=\"labPhone\"></label><input id=\"i-phone\" type=\"tel\" inputmode=\"tel\" autocomplete=\"tel\" placeholder=\"+7 (___) ___-__-__\"><p class=\"err\" data-t=\"errPhone\"></p></div><button class=\"btn\" id=\"go-result\" data-t=\"btnResult\"></button><p class=\"note\" style=\"margin-top:14px\" data-t=\"leadNote\"></p></div></section><section class=\"screen\" id=\"s-result\"><p class=\"eyebrow\" id=\"r-eyebrow\"></p><h1 data-t=\"resTitle\"></h1><div class=\"verdict\"><div class=\"big mono\"><span id=\"r-score\">0</span><s>/<span id=\"r-total\">20</span></s></div><div class=\"verdict-side\"><span class=\"level\" id=\"r-level\"></span><p id=\"r-leveltxt\"></p></div></div><p class=\"note\" style=\"margin-top:12px\" data-t=\"resFine\"></p><div class=\"strip\"><p class=\"strip-h\" data-t=\"sheetHead\"></p><div class=\"sheet\" id=\"r-sheet\"></div><div class=\"sheet-legend\"><span><em class=\"f\"></em><i style=\"font-style:normal\" data-t=\"legOk\"></i></span><span><em class=\"x\"></em><i style=\"font-style:normal\" data-t=\"legNo\"></i></span><span><em class=\"m\"></em><i style=\"font-style:normal\" data-t=\"legMiss\"></i></span></div></div><div class=\"strip\"><p class=\"strip-h\" data-t=\"blocksHead\"></p><div class=\"blocks\" id=\"r-blocks\"></div></div><div class=\"strip\"><p class=\"strip-h\" data-t=\"gapsHead\"></p><div id=\"r-gaps\"></div></div><div class=\"strip\"><p class=\"strip-h\" data-t=\"timeHead\"></p><div class=\"tgrid\" id=\"r-time\"></div><p class=\"note\" style=\"margin-top:14px\" id=\"r-timetxt\"></p></div><div id=\"r-more\"></div><div class=\"cta\"><h2 data-t=\"ctaTitle\"></h2><p data-t=\"ctaText\"></p><div class=\"bk\" id=\"bk\"><p class=\"bk-h\" data-t=\"bkHead\"></p><div class=\"bk-row\"><div class=\"field\"><label for=\"bk-grade\" data-t=\"bkClass\"></label><select id=\"bk-grade\"></select></div><div class=\"field\"><label for=\"bk-lang\" data-t=\"bkLangL\"></label><select id=\"bk-lang\"><option value=\"kz\">Қазақша</option><option value=\"ru\">Русский</option></select></div></div><p class=\"bk-h\" data-t=\"bkSlot\"></p><div class=\"slots\" id=\"bk-slots\"></div><p class=\"bk-err\" id=\"bk-slot-err\" data-t=\"bkSlotErr\"></p><div class=\"field\" id=\"bk-fld-phone\" style=\"margin-top:22px\"><label for=\"bk-phone\" data-t=\"bkPhone\"></label><input id=\"bk-phone\" type=\"tel\" inputmode=\"tel\" autocomplete=\"tel\" placeholder=\"+7 (___) ___-__-__\"><p class=\"err\" data-t=\"errPhone\"></p></div><button class=\"btn\" id=\"bk-go\" data-t=\"bkBtn\"></button><p class=\"note\" style=\"margin-top:14px\" data-t=\"bkNote\"></p></div><div class=\"bk-done\" id=\"bk-done\"><p class=\"bk-ok\" id=\"bk-ok\"></p><a class=\"btn\" id=\"bk-wa\" href=\"#\" target=\"_blank\" rel=\"noopener\" data-t=\"bkWa\"></a></div><button class=\"btn ghost\" id=\"cta-print\" data-t=\"ctaPrint\"></button></div><div class=\"foot\"><span data-t=\"footLeft\"></span><span class=\"mono\" id=\"foot-id\"></span></div></section></div>";

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

      bkStyle();
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
    gradeNote:"Задания составлены по программе 5 класса — той, что спрашивают на вступительном экзамене. Шестикласснику темы покажутся знакомыми, и тем важнее, сколько он успеет за отведённое время.",
    btnNext:"Дальше",

    handoffEyebrow:"Шаг 2 из 3",
    handoffTitle:"Дальше решает ребёнок",
    handoffLede:"Передайте телефон ребёнку. Таймер запустится, как только он нажмёт «Начать».",
    rules:[
      ["01","Двадцать задач, двадцать пять минут. Время идёт на весь тест сразу, не на каждую задачу."],
      ["02","Вернуться к предыдущей задаче нельзя — как на настоящем экзамене."],
      ["03","Считать в уме или на черновике. Калькулятор ломает весь смысл: он покажет чужой результат."],
      ["04","Задача не идёт — лучше пропустить и вернуть время на остальные."],
      ["05","Если свернуть тест и уйти в другое приложение — это записывается и попадёт в разбор."]
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
    againNote:"Этот предмет уже проходили {d}",
    againFine:"Повторный проход не показываем: балл со второй попытки завышен — часть заданий уже знакома. Ниже результат первого раза.",
    againTitle:"Хотите проверить ещё раз?",
    againText:"Возьмите другой предмет — их шесть, и вместе они дают куда более полную картину, чем повтор одного и того же. Если нужен именно этот предмет заново, напишите нам, откроем.",
    awayHead:"Выходил из теста",
    awayNone:"не выходил ни разу — тест пройден в один заход",
    awayOne:"Ребёнок сворачивал тест. Само по себе это не обвинение: мог отвлечься кто-то из домашних. Но если выходов много и они длинные — стоит спросить, чем он занимался в это время.",
    awayRule:"Если свернуть тест и уйти в другое приложение — это записывается и попадёт в разбор.",
    timeTextOk:"Темп ровный: ребёнок распределяет время по задачам, а не застревает на одной.",
    gapNoneTitle:"Явных провалов нет",
    gapNoneText:"По каждой теме ребёнок решает больше половины. Дальше растёт не знание тем, а скорость и устойчивость к непривычным формулировкам — это и есть разница между «сдал» и «прошёл на грант».",
    ctaTitle:"Что этот тест не увидел",
    ctaText:"Экран показывает результат. Он не показывает, как ребёнок учится: что схватывает с первого раза, а что приходится объяснять дважды. Это видно за один час живой работы. Пробный урок — 60 минут: тест, занятие по теме своего класса, снова тест. Уходите с листом «было — стало» и картой пробелов на руках. 2 490 ₸, Гагарина 93, угол Құрманғазы.",
    ctaBtn:"Записаться на пробный урок — 2 490 ₸",
    ctaPrint:"Сохранить разбор в PDF",
    bkHead:"Записаться на пробный урок — 2 490 ₸",
    bkClass:"Класс ребёнка",
    bkLangL:"Язык группы",
    bkSlot:"День и время",
    bkSlotErr:"Выберите день и время",
    bkPhone:"Телефон для счёта",
    bkBtn:"Записаться — выставим счёт",
    bkNote:"Гагарина 93, угол Құрманғазы. Менеджер выставит счёт на 2 490 ₸ и подтвердит место в WhatsApp. Оплата закрепляет место: в группе 15 мест.",
    bkOk:"Заявка принята. Менеджер выставит счёт на 2 490 ₸ и подтвердит место в WhatsApp.",
    bkFail:"Заявка могла не уйти. Напишите нам в WhatsApp — запишем вручную.",
    bkWa:"Написать в WhatsApp",
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
    gradeNote:"Тапсырмалар 5 сынып бағдарламасы бойынша — қабылдау емтиханында сұралатын бағдарлама. 6 сынып оқушысына тақырыптар таныс көрінеді, сондықтан берілген уақытта нешеуін үлгеретіні маңыздырақ.",
    btnNext:"Әрі қарай",

    handoffEyebrow:"3 қадамның 2-сі",
    handoffTitle:"Әрі қарай баланың кезегі",
    handoffLede:"Телефонды балаға беріңіз. «Бастау» дегенде таймер қосылады.",
    rules:[
      ["01","Жиырма тапсырма, жиырма бес минут. Уақыт бүкіл тестке беріледі, әр тапсырмаға бөлек емес."],
      ["02","Алдыңғы тапсырмаға қайта оралуға болмайды — нағыз емтихандағыдай."],
      ["03","Есептеу ауызша не жобада. Калькулятор бүкіл мәнін жояды: ол баланың емес, өзінің нәтижесін көрсетеді."],
      ["04","Тапсырма шықпай жатса — өткізіп жіберген дұрыс, уақыт қалғанына керек."],
      ["05","Тестті жинап, басқа қосымшаға шықса — бұл жазылады және талдауда көрінеді."]
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
    againNote:"Бұл пән {d} өтілген",
    againFine:"Қайталап өткенді көрсетпейміз: екінші реткі ұпай жоғары шығады, тапсырмалардың бір бөлігі таныс. Төменде бірінші реткі нәтиже.",
    againTitle:"Тағы тексергіңіз келе ме?",
    againText:"Басқа пәнді алыңыз — олар алтау, бірігіп бір пәнді қайталағаннан әлдеқайда толық көрініс береді. Дәл осы пән қайта керек болса — бізге жазыңыз, ашып береміз.",
    awayHead:"Тесттен шыққаны",
    awayNone:"бір рет те шықпады — тест бір отырыста өтті",
    awayOne:"Бала тестті жинап қойған. Бұл әлі айып емес: үйдегілер алаңдатуы мүмкін. Бірақ шығу саны көп әрі ұзақ болса — сол уақытта немен айналысқанын сұраған жөн.",
    awayRule:"Тестті жинап, басқа қосымшаға шықса — бұл жазылады және талдауда көрінеді.",
    timeTextOk:"Қарқыны бірқалыпты: бала уақытты тапсырмаларға бөліп үлестіреді, біреуіне тұрып қалмайды.",
    gapNoneTitle:"Айқын олқылық жоқ",
    gapNoneText:"Әр тақырып бойынша бала жартысынан көбін шығарады. Бұдан әрі өсетіні — тақырып білімі емес, жылдамдық пен бейтаныс тұжырымдамаға төзімділік. «Тапсырды» мен «грантқа өтті» дегеннің айырмасы дәл осында.",
    ctaTitle:"Бұл тест көрмеген нәрсе",
    ctaText:"Экран нәтижені көрсетеді. Ал баланың қалай үйренетінін көрсетпейді: нені бірден ұғады, нені екі рет түсіндіру керек. Мұны бір сағаттық тірі жұмыстан көресіз. Сынақ сабақ — 60 минут: тест, өз сыныбының тақырыбы бойынша сабақ, тағы тест. Қолыңызға «болды — болды» парағы мен олқылықтар картасы тиеді. 2 490 ₸, Гагарин 93, Құрманғазы қиылысы.",
    ctaBtn:"Сынақ сабаққа жазылу — 2 490 ₸",
    ctaPrint:"Талдауды PDF-ке сақтау",
    bkHead:"Сынақ сабаққа жазылу — 2 490 ₸",
    bkClass:"Баланың сыныбы",
    bkLangL:"Топ тілі",
    bkSlot:"Күні мен уақыты",
    bkSlotErr:"Күні мен уақытын таңдаңыз",
    bkPhone:"Шот үшін телефон",
    bkBtn:"Жазылу — шот жібереміз",
    bkNote:"Гагарин 93, Құрманғазы қиылысы. Менеджер 2 490 ₸ шот жібереді, орынды WhatsApp арқылы растайды. Төлем орынды бекітеді: топта 15 орын.",
    bkOk:"Өтінім қабылданды. Менеджер 2 490 ₸ шот жібереді және орынды WhatsApp арқылы растайды.",
    bkFail:"Өтінім кетпеген болуы мүмкін. WhatsApp-қа жазыңыз — қолмен жазып қоямыз.",
    bkWa:"WhatsApp-қа жазу",
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
    /* формула может быть своей для каждого языка: latexKz имеет приоритет */
    var f = (lg === "kz" && v.latexKz) ? v.latexKz : v.latex;
    var out = f ? tex(f) : "";
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
  let awayCount = 0, awayMs = 0, awayAt = 0, watching = false;
  let pool = [], idx = 0, answers = [], qStart = 0, endAt = 0, tick = null, picked = null, keepTime = false;

  /* ---- отрисовка LaTeX-подмножества, которое есть в банке ---- */
  function readGroup(str,i){
    while(str[i]===" ") i++;
    if(str[i]!=="{") return {body:str[i]||"", end:i+1};
    let depth=0, start=i+1, j=i;
    for(;j<str.length;j++){ if(str[j]==="{")depth++; else if(str[j]==="}"){depth--; if(!depth)break;} }
    return {body:str.slice(start,j), end:j+1};
  }
  function parseTex(str){
    let out="", i=0;
    while(i<str.length){
      /* \underbrace{выражение}_{подпись} */
      if(str.startsWith("\\underbrace",i)){
        let j=i+11;
        const a=readGroup(str,j); j=a.end;
        let lab="";
        if(str[j]==="_"){ const b=readGroup(str,j+1); lab=b.body; j=b.end; }
        out += '<span class="ub"><span class="ub-x">' + parseTex(a.body) + '</span>'
             + '<span class="ub-l">' + parseTex(lab) + '</span></span>';
        i=j; continue;
      }
      /* \frac{}{} и \tfrac{}{} */
      const t = str.startsWith("\\tfrac",i) ? 6 : (str.startsWith("\\frac",i) ? 5 : 0);
      if(t){
        let j=i+t;
        const a=readGroup(str,j); j=a.end;
        const b=readGroup(str,j); j=b.end;
        out += '<span class="fr"><span class="fr-n">' + parseTex(a.body) + '</span>'
             + '<span class="fr-d">' + parseTex(b.body) + '</span></span>';
        i=j; continue;
      }
      /* \text{обычные слова} */
      if(str.startsWith("\\text",i)){
        const a=readGroup(str,i+5);
        out += a.body;
        i=a.end; continue;
      }
      /* степень и индекс: x^2, ^{12}, _{100} */
      if(str[i]==="^" || str[i]==="_"){
        const tag = str[i]==="^" ? "sup" : "sub";
        const a=readGroup(str,i+1);
        out += "<"+tag+">" + parseTex(a.body) + "</"+tag+">";
        i=a.end; continue;
      }
      out+=str[i]; i++;
    }
    return out;
  }
  function tex(src){
    return parseTex(src)
      .replace(/\\left\(/g,'<span class="par">(</span>')
      .replace(/\\right\)/g,'<span class="par">)</span>')
      .replace(/\{,\}/g,",")
      .replace(/\\cdots/g,"\u22EF")
      .replace(/\\cdot/g,"\u00B7")
      .replace(/\\times/g,"\u00D7")
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
    var cm = $("#cta-main");
    if(cm) cm.href = lang === "kz" ? CONFIG.ctaUrlKz : CONFIG.ctaUrl;
    bkSlots();
    subjectPicker(lang);
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
    awayCount = 0; awayMs = 0; awayAt = 0;
    watchAway(true);
    tick = setInterval(clockTick, 250);
    clockTick();
  });

  function watchAway(on){
    if(on === watching) return;
    watching = on;
    if(on){
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("blur", onAway);
      window.addEventListener("focus", onBack);
    } else {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onAway);
      window.removeEventListener("focus", onBack);
      onBack();
    }
  }
  function onAway(){
    if(awayAt) return;
    awayAt = Date.now(); awayCount++;
  }
  function onVis(){
    if(document.visibilityState === "hidden") onAway(); else onBack();
  }
  function onBack(){
    if(!awayAt) return;
    awayMs += Date.now() - awayAt;
    awayAt = 0;
  }

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
    watchAway(false);
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
    const btn = $("#go-result");
    btn.disabled = true;
    askPrevious(digits, function(prev){
      btn.disabled = false;
      if(prev){ renderPrevious(prev); show("s-result"); return; }
      const r = analyse(); lastResult = r;
    try{ localStorage.setItem("zd_phone", digits); localStorage.setItem("zd_parent", name); }catch(e){}
    remember(r);
      send(name, digits, r);
      render(r);
      show("s-result");
    });
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
    return {total, correct, pct, lv, blocks, rank, slow, fast, ms, away: awayCount, awaySec: Math.round(awayMs/1000)};
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
      <div class="tcell"><b class="mono ${r.fast?"warn":""}">${r.fast}</b><span>${t.tFast}</span></div>
      <div class="tcell"><b class="mono ${r.away?"warn":""}">${r.away}</b><span>${t.awayHead}${r.away ? " · " + fmt(r.awaySec) : ""}</span></div>`;
    var fine = document.querySelector('[data-t="resFine"]');
    if(fine) fine.textContent = lang === "kz"
      ? "Бағалау " + (D.totalQuestions || r.total) + " тапсырманың " + r.total + "-сы бойынша. Бұл — бүгінгі қима, түпкілікті үкім емес: бір айлық сабақтан кейін көрініс өзгереді."
      : "Оценка по " + r.total + " задачам из банка в " + (D.totalQuestions || r.total) + ". Это срез на сегодня, а не приговор: через месяц занятий картина меняется.";
    afterResult(lang);
    bkInit();
    $("#r-timetxt").textContent = r.away
      ? t.awayOne
      : (r.fast >= 2 ? t.timeTextFast : (r.slow >= 3 ? t.timeTextSlow : t.timeTextOk));
  }

  $("#cta-print").addEventListener("click", ()=>window.print());

  /* ---- запись на пробный урок ----
     Форма живёт на экране разбора: родитель уже видит, где провалы,
     и здесь же выбирает день. Телефон подставляем тот, что он дал
     перед результатом, — его же менеджер берёт для счёта. */
  var bkReady = false, bkPick = null, bkLangTouched = false;

  function bkMask(el){
    el.addEventListener("input", function(){
      var d = el.value.replace(/\D/g,"");
      if(d.charAt(0) === "8") d = "7" + d.slice(1);
      if(d.charAt(0) !== "7") d = "7" + d;
      d = d.slice(0,11);
      var out = "+7";
      if(d.length>1) out += " (" + d.slice(1,4);
      if(d.length>=5) out += ") " + d.slice(4,7);
      if(d.length>=8) out += "-" + d.slice(7,9);
      if(d.length>=10) out += "-" + d.slice(9,11);
      el.value = out;
      $("#bk-fld-phone").classList.remove("bad");
    });
  }

  /* Список классов — только те, где урок реально идёт.
     Класс из теста подставляем, но менять его можно. */
  function bkGrades(){
    var sel = $("#bk-grade");
    if(!sel || sel.options.length) return;
    var cur = $("#i-grade") ? $("#i-grade").value : "5";
    var html = "";
    for(var g = 3; g <= 6; g++){
      html += '<option value="' + g + '"' + (String(g) === String(cur) ? " selected" : "") + ">" + g + "</option>";
    }
    sel.innerHTML = html;
  }

  function bkSlots(){
    var box = $("#bk-slots");
    if(!box) return;
    var lgSel = $("#bk-lang");
    if(lgSel && !bkLangTouched) lgSel.value = lang;
    var g = ($("#bk-grade") && $("#bk-grade").value) || "5";
    var list = RASP[g] || [];
    box.innerHTML = list.map(function(sl, i){
      return '<button type="button" class="slot" data-i="' + i + '" aria-pressed="'
        + (bkPick === i) + '"><b>' + DNI[lang][sl.d] + "</b><span>" + sl.t + "</span></button>";
    }).join("");
    box.querySelectorAll(".slot").forEach(function(b){
      b.addEventListener("click", function(){
        bkPick = Number(b.dataset.i);
        box.querySelectorAll(".slot").forEach(function(x){
          x.setAttribute("aria-pressed", String(Number(x.dataset.i) === bkPick));
        });
        var e = $("#bk-slot-err");
        if(e) e.classList.remove("on");
      });
    });
  }

  function bkInit(){
    if(bkReady){ bkSlots(); return; }
    bkReady = true;
    bkGrades();
    var lg = $("#bk-lang");
    if(lg){
      lg.value = lang;
      lg.addEventListener("change", function(){ bkLangTouched = true; });
    }
    var ph = $("#bk-phone"), src = $("#i-phone");
    if(ph){
      bkMask(ph);
      if(src && src.value) ph.value = src.value;
    }
    var gr = $("#bk-grade");
    if(gr) gr.addEventListener("change", function(){ bkPick = null; bkSlots(); });
    var go = $("#bk-go");
    if(go) go.addEventListener("click", bkSend);
    bkSlots();
  }

  function bkSend(){
    var ph = $("#bk-phone");
    var digits = ph.value.replace(/\D/g,"");
    var okPhone = digits.length === 11 && digits.charAt(0) === "7";
    $("#bk-fld-phone").classList.toggle("bad", !okPhone);
    if(bkPick === null){
      $("#bk-slot-err").classList.add("on");
      return $("#bk-slots").scrollIntoView({block:"center", behavior:"smooth"});
    }
    if(!okPhone) return ph.focus();

    var g = $("#bk-grade").value;
    var sl = (RASP[g] || [])[bkPick] || {d:0, t:""};
    var groupLang = $("#bk-lang").value;
    var child = $("#i-child").value.trim();
    var parent = $("#i-name").value.trim();
    var t = T[lang];

    /* Поля намеренно названы не так, как у результата теста:
       иначе приёмник принял бы запись за ещё один результат. */
    var payload = {
      form: "probny-urok",
      date: new Date().toISOString(),
      parent: parent,
      phone: "+" + digits,
      child: child,
      gradeUrok: g,
      day: DNI.ru[sl.d],
      time: sl.t,
      groupLang: groupLang === "kz" ? "казахская" : "русская",
      price: PRICE,
      fromSubject: CONFIG.subject,
      fromScore: lastResult ? lastResult.correct : "",
      fromAsked: lastResult ? lastResult.total : "",
      lang: lang,
      page: location.pathname
    };

    var go = $("#bk-go");
    go.disabled = true;

    var msg = (lang === "kz"
        ? "Сәлеметсіз бе! Сынақ сабаққа жазылғым келеді."
        : "Здравствуйте! Хочу записаться на пробный урок.")
      + "\n" + (child || parent) + ", " + g + (lang === "kz" ? " сынып" : " класс")
      + "\n" + DNI[lang][sl.d] + ", " + sl.t
      + "\n" + (groupLang === "kz"
        ? (lang === "kz" ? "қазақ тобы" : "казахская группа")
        : (lang === "kz" ? "орыс тобы" : "русская группа"))
      + "\n+" + digits;
    var wa = $("#bk-wa");
    if(wa && CONFIG.whatsapp){
      wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
    }

    function done(ok){
      $("#bk-ok").textContent = ok ? t.bkOk : t.bkFail;
      $("#bk").style.display = "none";
      $("#bk-done").classList.add("on");
      $("#bk-done").scrollIntoView({block:"center", behavior:"smooth"});
    }

    if(!CONFIG.endpoint){ done(false); return; }
    fetch(CONFIG.endpoint, {method:"POST", mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"}, body: JSON.stringify(payload)})
      .then(function(){ done(true); })
      .catch(function(){ done(false); });
  }

  /* ---- отправка заявки ---- */
  /* Спрашиваем таблицу, проходил ли этот номер этот предмет.
     Ответ приходит вызовом функции — так обходится запрет браузера
     на чтение чужих ответов. Любая заминка = пускаем дальше. */
  function askPrevious(digits, done){
    if(!CONFIG.endpoint) return done(null);
    var fn = "zdcb" + Date.now();
    var el = document.createElement("script");
    var over = false;
    function finishOnce(res){
      if(over) return;
      over = true;
      clearTimeout(timer);
      try{ delete window[fn]; }catch(e){ window[fn] = undefined; }
      if(el.parentNode) el.parentNode.removeChild(el);
      done(res);
    }
    var timer = setTimeout(function(){ finishOnce(null); }, 6000);
    window[fn] = function(res){ finishOnce(res && res.found ? res : null); };
    el.onerror = function(){ finishOnce(null); };
    el.src = CONFIG.endpoint
      + "?mode=check&phone=" + encodeURIComponent(digits)
      + "&subject=" + encodeURIComponent(CONFIG.subject)
      + "&cb=" + fn;
    document.head.appendChild(el);
  }

  /* Экран для тех, кто уже проходил этот предмет */
  function renderPrevious(p){
    const t = T[lang], child = $("#i-child").value.trim(), grade = $("#i-grade").value;
    $("#r-eyebrow").textContent = child + " \u00b7 " + grade + " " + (lang==="kz"?"сынып":"класс") + " \u00b7 " + D.subject[lang];
    $("#r-score").textContent = p.score;
    $("#r-total").textContent = p.total;
    $("#r-level").textContent = p.level || "";
    $("#r-leveltxt").textContent = t.againNote.replace("{d}", p.date || "");
    var fine = document.querySelector('[data-t="resFine"]');
    if(fine) fine.textContent = t.againFine;

    $("#r-sheet").innerHTML = "";
    var sheetHead = document.querySelectorAll(".strip-h")[0];
    $("#r-sheet").closest(".strip").style.display = "none";

    $("#r-blocks").innerHTML = '<div class="brow"><div class="brow-h"><strong>'
      + (p.blocks || "") + '</strong></div></div>';
    $("#r-gaps").innerHTML = '<div class="gap good"><h3>' + t.againTitle + '</h3><p>'
      + t.againText + '</p></div>';
    $("#r-time").innerHTML = '<div class="tcell"><b class="mono">' + (p.minutes || "\u2014")
      + '</b><span>' + t.tTotal + ', ' + (lang==="kz"?"минут":"минут") + '</span></div>'
      + '<div class="tcell"><b class="mono">' + (p.pct || "") + '%</b><span>'
      + (lang==="kz"?"дұрыс жауап":"верных ответов") + '</span></div>';
    $("#r-timetxt").textContent = "";
    const dt = new Date(), pad = n => String(n).padStart(2,"0");
    $("#foot-id").textContent = pad(dt.getDate()) + "." + pad(dt.getMonth()+1) + "." + dt.getFullYear();
    afterResult(lang);
    bkInit();
  }

  function send(name, digits, r){
    const payload = {
      date: new Date().toISOString(),
      parent: name, phone: "+"+digits,
      child: $("#i-child").value.trim(), grade: $("#i-grade").value,
      lang, subject: CONFIG.subject,
      score: r.correct, total: r.total, level: r.lv.name,
      blocks: r.rank.map(b=>`${b.k} ${b.ok}/${b.ask}`).join("; "),
      timeSec: Math.round(r.ms/1000),
      away: r.away, awaySec: r.awaySec,
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

/* ---------- выбор предмета на первом экране ---------- */

function subjectPicker(lang){
  var ready = (window.__ZD_REG__ || []).filter(function(s){ return s.ready; });
  var anchor = document.getElementById("fld-child");
  if(!anchor) return;

  var old = document.getElementById("zd-subj-field");
  if(old) old.parentNode.removeChild(old);
  if(ready.length < 2) return;

  var here = window.__ZD_PICK__.id;
  var wrap = document.createElement("div");
  wrap.className = "field";
  wrap.id = "zd-subj-field";
  wrap.innerHTML =
    '<label for="zd-subj">' + (lang === "kz" ? "Пән" : "Предмет") + '</label>' +
    '<select id="zd-subj">' +
      ready.map(function(s){
        return '<option value="' + s.id + '"' + (s.id === here ? " selected" : "") + '>' +
               label(s, lang) + '</option>';
      }).join("") +
    '</select>';

  anchor.parentNode.insertBefore(wrap, anchor);
  document.getElementById("zd-subj").addEventListener("change", function(){
    location.search = "?subject=" + this.value + (lang === "kz" ? "&lang=kz" : "");
  });
}

} /* boot */
})();
