import { useEffect, useMemo, useState } from "react";
import { ArrowUp, CheckCircle2, Menu, MoreVertical, PencilLine, Settings2, Sparkles, WifiOff } from "lucide-react";
import { analyzeOffline, type OfflineResult } from "@/lib/life-rescue-offline";
import { saveLifeRescueHistory } from "@/lib/life-rescue-history";
import { useSidebar } from "@/components/ui/sidebar";

type Result = OfflineResult;

type Message = {
  role: "user" | "engine";
  text: string;
};

type Language = "tr" | "en";

const uiText = {
  tr: {
    newProblem: "Yeni problem", menu: "Menüyü aç", whatHappened: "Ne oldu?",
    intro: "Anlat derdini. Önce seni anlayacağım, sonra birlikte en mantıklı çıkış yolunu bulacağız.",
    placeholder: "Şu an neyi çözmeye çalışıyorsun?", details: "Ayrıntılar", send: "Gönder",
    topic: "Konu", goal: "Hedef", auto: "Otomatik belirle", urgency: "Aciliyet",
    budget: "Bütçe (TL)", timeToday: "Bugün ayırabileceğin zaman", optional: "İsteğe bağlı",
    hours: "Saat", offline: "Temel karar motoru cihazında çalışır.",
    answer: "Cevabını yaz...", you: "Sen", engine: "Life Rescue",
    understand: "Önce seni anlayacağım, sonra çözüm çıkaracağım.",
    tableClear: "Tamam, tablo netleşti.", plan: "Kurtarma planı", hide: "Gizle", show: "Göster",
    thinking: "Şimdi verdiğin bilgileri bir araya getirip sana uygulanabilir, öncelik sırasına konmuş bir çıkış yolu çıkarıyorum.",
    minutes: "dk", greeting: "Merhaba. Buradayım. Önce neyi çözmeye çalıştığını anlat; hemen sonuca atlamadan durumu birlikte netleştirelim.",
    suggestions: ["Param yetmiyor", "Faturaları yetiştiremiyorum", "Bir karar veremiyorum", "Zamanım yetmiyor"],
  },
  en: {
    newProblem: "New problem", menu: "Open menu", whatHappened: "What happened?",
    intro: "Tell me what's going on. I'll understand the situation first, then we'll work out a practical way forward.",
    placeholder: "What are you trying to solve right now?", details: "Details", send: "Send",
    topic: "Topic", goal: "Goal", auto: "Auto-detect", urgency: "Urgency",
    budget: "Budget", timeToday: "Time available today", optional: "Optional",
    hours: "Hours", offline: "The core decision engine runs on your device.",
    answer: "Type your answer...", you: "You", engine: "Life Rescue",
    understand: "I'll understand the situation first, then work out a solution.",
    tableClear: "Okay, I have enough of the picture.", plan: "Rescue plan", hide: "Hide", show: "Show",
    thinking: "Okay. I have enough context now. I'm putting it together into a practical, prioritized way forward.",
    minutes: "min", greeting: "Hello. I'm here. Tell me what you're trying to solve, and we'll understand the situation before jumping to a solution.",
    suggestions: ["I don't have enough money", "I can't keep up with my bills", "I can't decide", "I don't have enough time"],
  },
} as const;

const categoriesEn: Record<string, string> = {
  "": uiText.en.auto, money: "Money", home: "Home", family: "Family", work: "Work",
  vehicle: "Vehicle", time: "Time", bills: "Bills", travel: "Travel", moving: "Moving", decision: "Decision",
};
const goalsEn: Record<string, string> = {
  "": uiText.en.auto, find_money: "Find money", reduce_cost: "Reduce cost", save_time: "Save time",
  prioritize: "Prioritize", make_decision: "Make a decision", cancel: "Cancel", organize: "Organize", solve: "Solve",
};

function translateKnown(text: string, lang: Language): string {
  if (lang === "tr") return text;
  const exact: Record<string, string> = {
    "Önce şunu anlayalım: Bu para tam olarak neye lazım? Kira, fatura, borç, market, çocuk masrafı veya başka bir şey mi?": "First, what exactly is this money needed for? Rent, bills, debt, groceries, child expenses, or something else?",
    "Şu an elinde veya hesabında gerçekten kullanabileceğin yaklaşık ne kadar para var?": "How much money do you actually have available to use right now?",
    "Önümüzdeki birkaç gün içinde ödenmesi gereken neler var? Mümkünse tek tek yaz: örneğin kira 10.000 TL, elektrik 1.000 TL gibi.": "What needs to be paid in the next few days? List them one by one if you can, for example: rent 10,000 TL, electricity 1,000 TL.",
    "Bu ödemelerin hangileri gerçekten ertelenemez? Son tarihlerini de mümkün olduğunca yaz.": "Which of these payments truly cannot be delayed? Include their due dates if you can.",
    "Tamam, şimdi seçenekleri değerlendirebiliriz: erteleme, taksitlendirme, masraf azaltma, mevcut parayı yeniden dağıtma veya ek para bulma gibi hangi seçenekleri uygulama şansın var?": "Now we can look at the options: which of these can you realistically use—delaying, installments, cutting costs, reallocating available money, or finding additional money?",
    "Bu seçenekler arasında senin için en önemli ölçüt ne: gecikme riskini azaltmak, toplam maliyeti düşürmek, bugün nakit bulmak veya başka bir şey?": "What matters most to you among these options: reducing late-payment risk, lowering total cost, finding cash today, or something else?",
    "Önce seçenekleri masaya koyalım. Şu anda gerçekten değerlendirdiğin seçenekler neler?": "Let's put the options on the table first. What options are you actually considering?",
    "Bu seçeneklerin her biri için bildiğin önemli farklar neler: fiyat, zaman, risk, kolaylık veya başka bir şey?": "What important differences do you know between the options: price, time, risk, convenience, or something else?",
    "Senin için kesinlikle vazgeçilmez olan şey ne? Örneğin bütçeyi aşmamak, hızlı çözmek veya riski düşük tutmak.": "What is absolutely non-negotiable for you—for example, staying within budget, solving it quickly, or keeping risk low?",
    "Her seçeneğin en kötü durumda doğurabileceği sonuç ne olur?": "What is the worst-case consequence of each option?",
    "Şimdi bu bilgilerle seçenekleri senin önceliklerine göre sıralayabiliriz. En çok hangi sonucu korumak istiyorsun?": "Now we can compare the options based on your priorities. Which outcome do you most want to protect?",
    "Önce yetiştirmeye çalıştığın işleri çıkaralım. Şu anda önünde hangi işler veya sorumluluklar var?": "Let's list what you're trying to get done first. What tasks or responsibilities are in front of you right now?",
    "Bunların hangileri gerçekten bugün veya belirli bir tarihe kadar yapılmak zorunda?": "Which of these truly must be done today or by a specific date?",
    "Her iş yaklaşık ne kadar zaman alıyor ve hangilerini erteleyebilir, bölebilir veya başka birine devredebilirsin?": "How long does each task take, and which ones can be delayed, split up, or delegated?",
    "Seni en çok zorlayan kısıt ne: toplam zaman, enerji, başka insanların beklemesi veya başka bir şey?": "What is your biggest constraint: total time, energy, other people waiting on you, or something else?",
    "Şimdi işleri son tarih, sonuç ve harcanacak zamana göre önceliklendirebiliriz. Önceliğin neyi korumak?": "Now we can prioritize the tasks by deadline, impact, and time required. What do you most want to protect?",
    "Önce mevcut yükü çıkaralım. Şu anda senden beklenen işler veya görevler neler?": "Let's map the current workload first. What tasks or responsibilities are expected from you right now?",
    "Bunlardan hangilerinin kesin son tarihi var ve hangilerinin sonucu daha kritik?": "Which have hard deadlines, and which have more serious consequences?",
    "Hangilerini erteleyebilir, bölebilir veya devredebilirsin?": "Which can you delay, split, or delegate?",
    "İş yükünü etkileyen kısıtların neler: vardiya, süre, ekip, para veya başka bir şey?": "What constraints affect your workload: shifts, time, team capacity, money, or something else?",
    "Şimdi görevleri etkisi, aciliyeti ve maliyeti üzerinden önceliklendirelim. Senin için korunması gereken en önemli sonuç hangisi?": "Now let's prioritize the tasks by impact, urgency, and cost. Which outcome is most important to protect?",
    "Önce sorunun tamamını anlayalım. Araçta tam olarak ne oluyor ve şu anda araç kullanılabiliyor mu?": "Let's understand the vehicle problem first. What exactly is happening, and can the vehicle still be used?",
    "Şu ana kadar bildiğin çözüm seçenekleri neler: tamir, parça değişimi, servis, beklemek veya geçici başka bir ulaşım çözümü?": "What solutions do you know about so far: repair, part replacement, service, waiting, or temporary transport?",
    "Her seçeneğin yaklaşık maliyeti ve ne kadar süreceği hakkında ne biliyorsun?": "What do you know about the approximate cost and time for each option?",
    "Aracı kullanmaya devam etmek güvenlik veya daha büyük hasar açısından bir risk oluşturuyor mu?": "Does continuing to drive create a safety risk or risk of greater damage?",
    "Şimdi seçenekleri güvenlik, maliyet, süre ve zorunluluk açısından önceliklendirebiliriz. Hangisini korumamız gerekiyor?": "Now we can prioritize the options by safety, cost, time, and necessity. What do we need to protect first?",
    "Önce yolculuğun seçeneklerini çıkaralım. Nereye, hangi tarihte ve hangi amaçla gitmen gerekiyor?": "Let's map the travel options first. Where do you need to go, when, and why?",
    "Hangi ulaşım veya konaklama seçeneklerini değerlendiriyorsun?": "Which transport or accommodation options are you considering?",
    "Her seçeneğin yaklaşık toplam maliyeti ve zaman farkı ne kadar?": "What is the approximate total cost and time difference for each option?",
    "Tarih veya saat konusunda ne kadar esneksin? Değiştirilemeyecek bir zorunluluk var mı?": "How flexible are you on the date or time? Is there a fixed requirement that cannot change?",
    "Şimdi seçenekleri toplam maliyet, süre, risk ve esneklik açısından önceliklendirebiliriz. Senin için hangisi daha önemli?": "Now we can prioritize the options by total cost, time, risk, and flexibility. Which matters most to you?",
    "Önce taşınma tablosunu çıkaralım. Taşınman gereken tarih ve şu an değerlendirdiğin seçenekler neler?": "Let's map the move first. What is the move date, and what options are you considering?",
    "Ev, nakliye, depozito, eşya ve ulaşım tarafında hangi seçeneklerin var?": "What options do you have for the home, moving service, deposit, belongings, and transport?",
    "Her seçeneğin yaklaşık maliyeti ve ne kadar zaman istediği hakkında ne biliyorsun?": "What do you know about the approximate cost and time required for each option?",
    "Kesin olarak değişmeyecek kısıtların neler: tarih, bütçe, ev, iş veya aile durumu?": "What constraints definitely cannot change: date, budget, housing, work, or family circumstances?",
    "Şimdi seçenekleri zorunluluk, maliyet, süre ve risk açısından önceliklendirebiliriz. Öncelikle neyi güvenceye almalıyız?": "Now we can prioritize the options by necessity, cost, time, and risk. What must we secure first?",
    "Önce sorunun kapsamını çıkaralım. Evde tam olarak ne oldu ve hangi şeyler etkileniyor?": "Let's define the scope of the problem first. What exactly happened at home, and what is affected?",
    "Şu anda düşündüğün çözüm seçenekleri neler: tamir, değiştirme, geçici çözüm, servis çağırma veya başka bir şey?": "What solutions are you considering: repair, replacement, a temporary fix, calling a service, or something else?",
    "Bu seçeneklerin yaklaşık maliyeti, süresi ve varsa ek riskleri hakkında ne biliyorsun?": "What do you know about the approximate cost, time, and additional risks of these options?",
    "Su, elektrik, gaz, yapısal hasar veya daha büyük bir zarara dönüşme riski var mı?": "Is there a risk involving water, electricity, gas, structural damage, or further damage?",
    "Şimdi seçenekleri güvenlik, aciliyet, maliyet ve kalıcılık açısından önceliklendirebiliriz. Önce hangi sonucu korumalıyız?": "Now we can prioritize the options by safety, urgency, cost, and durability. What outcome should we protect first?",
    "Önce durumu anlayalım. Şu anda aile içinde çözmeye çalıştığın konu tam olarak ne?": "Let's understand the situation first. What exactly are you trying to solve within the family?",
    "Şu ana kadar düşündüğün veya uygulayabileceğin seçenekler neler?": "What options have you considered or could realistically use?",
    "Her seçeneğin aile üzerindeki zaman, para, düzen veya ilişki açısından etkisi ne olur?": "How would each option affect the family in terms of time, money, routine, or relationships?",
    "Kesinlikle korunması gereken bir ihtiyaç, sınır veya son tarih var mı?": "Is there a need, boundary, or deadline that absolutely must be protected?",
    "Şimdi seçenekleri etkilerine ve aciliyetlerine göre önceliklendirebiliriz. Önce neyi güvenceye almalıyız?": "Now we can prioritize the options by impact and urgency. What should we secure first?",
    "Önce durumu tam olarak anlayalım. Şu anda çözmeye çalıştığın problem nedir ve seni en çok zorlayan kısmı hangisi?": "Let's understand the situation fully first. What problem are you trying to solve, and what part is putting the most pressure on you?",
    "Şu ana kadar düşündüğün, denediğin veya kullanabileceğin seçenekler neler?": "What options have you considered, tried, or could use?",
    "Bu seçeneklerin her biri için bildiğin önemli farklar neler: para, zaman, risk, kolaylık veya başka bir şey?": "What important differences do you know between the options: money, time, risk, convenience, or something else?",
    "Seni sınırlayan kesin bir şey var mı: bütçe, son tarih, başka bir kişinin kararı, mevcut kaynaklar veya başka bir kısıt?": "Is there a firm constraint: budget, deadline, another person's decision, available resources, or something else?",
    "Şimdi seçenekleri sonuç, aciliyet, maliyet ve risk açısından karşılaştırabiliriz. Senin için en önemli kriter hangisi?": "Now we can compare the options by outcome, urgency, cost, and risk. Which criterion matters most to you?",
    "Önce tabloyu sadeleştirelim. Sonucu en çok değiştirecek noktayı bulup planı buna göre şekillendireceğim.": "Let's simplify the situation first. We'll find what changes the outcome most and build the plan around it.",
    "Burada önce gelir, zorunlu gider ve yaklaşan ödemeyi aynı tabloya koyup gerçek açığı bulacağız.": "We'll put income, mandatory expenses and upcoming payments into one picture and find the real gap.",
    "Önce güvenlik riskini ayıracağız; ardından tamir ve alternatif ulaşım maliyetini birlikte değerlendireceğiz.": "We'll separate any safety risk first, then compare repair and alternative transport costs.",
    "Önce tarih ve zorunlu varış saatini sabitleyeceğiz; sonra toplam seyahat maliyetini ve B planını çıkaracağız.": "We'll lock down the date and required arrival time first, then work out the total travel cost and a backup plan.",
    "Önce taşınma tarihini ve zorunlu ödemeleri sabitleyeceğiz; sonra nakit ve zaman baskısını azaltacağız.": "We'll lock down the move date and mandatory payments first, then reduce the cash and time pressure.",
    "Önce güvenlik ve daha büyük hasar riskini kontrol edeceğiz; sonra tamir, değişim veya geçici çözümü karşılaştıracağız.": "We'll check safety and the risk of further damage first, then compare repair, replacement and temporary solutions.",
  };
  return exact[text] ?? text;
}

const categories = [
  ["", "Otomatik belirle"],
  ["money", "Para"],
  ["home", "Ev"],
  ["family", "Aile"],
  ["work", "İş"],
  ["vehicle", "Araç"],
  ["time", "Zaman"],
  ["bills", "Faturalar"],
  ["travel", "Seyahat"],
  ["moving", "Taşınma"],
  ["decision", "Karar"],
];

const goals = [
  ["", "Otomatik belirle"],
  ["find_money", "Para bul"],
  ["reduce_cost", "Masrafı azalt"],
  ["save_time", "Zaman kazan"],
  ["prioritize", "Önceliklendir"],
  ["make_decision", "Karar ver"],
  ["cancel", "İptal et"],
  ["organize", "Düzenle"],
  ["solve", "Çöz"],
];

const categoryLabels: Record<string, string> = {
  money: "Para",
  home: "Ev",
  family: "Aile",
  work: "İş",
  vehicle: "Araç",
  time: "Zaman",
  bills: "Faturalar",
  travel: "Seyahat",
  moving: "Taşınma",
  decision: "Karar",
};

const goalLabels: Record<string, string> = {
  find_money: "Para bul",
  reduce_cost: "Masrafı azalt",
  save_time: "Zaman kazan",
  prioritize: "Önceliklendir",
  make_decision: "Karar ver",
  cancel: "İptal et",
  organize: "Düzenle",
  solve: "Çöz",
};

function getOptions(
  category: string,
  goal: string,
  urgency: number,
  budget: string,
  availableHours: string,
  language: Language,
) {
  return {
    category: category || undefined,
    goal: goal || undefined,
    urgency,
    budget: budget === "" ? undefined : Number(budget),
    availableHours: availableHours === "" ? undefined : Number(availableHours),
  };
}

export default function LifeRescue() {
  const [problem, setProblem] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("");
  const [urgency, setUrgency] = useState(5);
  const [budget, setBudget] = useState("");
  const [availableHours, setAvailableHours] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationContext, setConversationContext] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "tr";
    return window.localStorage.getItem("agt_life_rescue_language") === "en" ? "en" : "tr";
  });
  const { toggleSidebar } = useSidebar();
  const copy = uiText[language];

  const suggestions = copy.suggestions;

  useEffect(() => {
    window.localStorage.setItem("agt_life_rescue_language", language);
  }, [language]);

  useEffect(() => {
    const resetFromMenu = () => reset();
    window.addEventListener("life-rescue-new-problem", resetFromMenu);
    return () => window.removeEventListener("life-rescue-new-problem", resetFromMenu);
  }, []);

  function extractMoney(text: string) {
    const normalized = text.toLocaleLowerCase("tr-TR");
    const values: number[] = [];
    const explicit = normalized.matchAll(/(\d{1,3}(?:[. ]\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:tl|₺|lira|try)/gi);
    for (const match of explicit) {
      const value = Number(match[1].replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
      if (Number.isFinite(value)) values.push(value);
    }
    const thousands = normalized.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:bin|k)\b/gi);
    for (const match of thousands) {
      const value = Number(match[1].replace(",", ".")) * 1000;
      if (Number.isFinite(value)) values.push(value);
    }
    return values;
  }

  function lastUserAnswer(context: string) {
    const parts = context.split(/\nKullanıcı:\s*/).filter(Boolean);
    return parts[parts.length - 1]?.trim() ?? "";
  }

  function extractPaymentLabels(answerText: string) {
    return answerText
      .split(/[,;\n]|\s+ve\s+|\s+ile\s+/i)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  function getNextQuestion(currentCategory: string, context: string, uiLanguage: Language = language): string | null {
    const normalized = context.toLocaleLowerCase("tr-TR");
    const has = (...patterns: RegExp[]) => patterns.some((pattern) => pattern.test(normalized));

    if (currentCategory === "money" || currentCategory === "bills" || has(/para|maaş|borç|ödeme|fatura/)) {
      if (!has(/kira|fatura|borç|maaş|market|alışveriş|çocuk|çocuğ|ev|araba|araç|taksit|kredi|vergi|sigorta|ilaç|sağlık|okul|eğitim|seyahat|bilet|taşın|nakliye/)) {
        return uiLanguage === "en"
          ? "What exactly do you need the money for? Tell me the main expenses, one by one if possible."
          : "Önce paranın nereye gideceğini netleştirelim. Kira, fatura, borç, market, çocuk masrafı veya başka neler var? Mümkünse tek tek yaz.";
      }
      if (!has(/elimde|elinde|cebimde|hesabımda|param var|para var|\d+\s*(?:tl|₺|lira)|hiç|yok/)) {
        return uiLanguage === "en"
          ? "How much money do you actually have available right now, including your bank account?"
          : "Şu an elinde veya hesabında gerçekten kullanabileceğin yaklaşık ne kadar para var?";
      }
      if (!has(/ödenmesi|ödenecek|ödemem|ödemeler|kira\s*\d|fatura\s*\d|kredi\s*\d|borç\s*\d|taksit\s*\d|\d+\s*(?:tl|₺|lira)/)) {
        return uiLanguage === "en"
          ? "What payments are coming up? List each one with its amount if you know it."
          : "Önümüzdeki günlerde ödenmesi gereken neler var? Mümkünse tutarlarıyla birlikte tek tek yaz.";
      }
      if (!has(/son tarih|vade|yarın|bugün|ayın|tarih|gecik|deadline|due/)) {
        return uiLanguage === "en"
          ? "Which payments cannot be delayed, and when are they due? If you don't know an exact date, say roughly when."
          : "Bu ödemelerin hangileri gerçekten ertelenemez ve son tarihleri ne? Kesin tarihi bilmiyorsan yaklaşık zamanı söyle.";
      }
      if (!has(/ertele|taksit|azalt|kes|iptal|ek para|para bul|sat|borç al|avans|ek gelir|alternatif|delay|installment|cut|cancel|extra money|sell|advance/)) {
        return uiLanguage === "en"
          ? "Now let's look at the real options. What could you actually do: delay or split a payment, cut an expense, find extra money, borrow, sell something, or another route?"
          : "Şimdi seçenekleri gerçekten masaya koyalım. Uygulayabileceğin yollar neler: ödeme erteleme veya taksit, masraf kısma, ek para bulma, borç alma, bir şey satma ya da başka bir yol?";
      }
      return uiLanguage === "en"
        ? "Now I can prioritize them. What matters most to you: avoiding the most serious consequence, keeping essential needs covered, minimizing total cost, or finding cash fastest?"
        : "Artık önceliklendirebiliriz. Senin için hangisi daha önemli: en ciddi sonucu önlemek, temel ihtiyaçları korumak, toplam maliyeti düşürmek veya en hızlı şekilde nakit bulmak?";
    }

    if (currentCategory === "decision" || has(/karar|seç|hangisi|option|choose|decision/)) {
      if (!has(/seçenek|alternatif|a mı|b mi|şunu|bunu|arasında/)) return uiLanguage === "en"
        ? "What are the actual options you're deciding between? List them plainly."
        : "Önce seçenekleri net görelim. Gerçekte hangi seçenekler arasında karar veriyorsun? Tek tek yaz.";
      if (!has(/fiyat|maliyet|süre|zaman|risk|kolay|özellik|avantaj|dezavantaj/)) return uiLanguage === "en"
        ? "What do you know about the differences between these options—cost, time, risk, quality, or anything else?"
        : "Bu seçenekler arasındaki bildiğin farklar neler: fiyat, zaman, risk, kalite, kolaylık veya başka bir şey?";
      if (!has(/bütçe|para|son tarih|acil|önemli|vazgeçilmez|öncelik|kriter/)) return uiLanguage === "en"
        ? "What is non-negotiable for you: budget, deadline, speed, safety, quality, or something else?"
        : "Senin için vazgeçilmez olan ne: bütçe, son tarih, hız, güvenlik, kalite veya başka bir şey?";
      if (!has(/en kötü|risk|sonuç|kayb|zarar|worst|consequence/)) return uiLanguage === "en"
        ? "If each option goes badly, what is the consequence you most want to avoid?"
        : "Her seçenek kötü giderse ortaya çıkabilecek sonuçlardan hangisinden özellikle kaçınmak istiyorsun?";
      return uiLanguage === "en"
        ? "I have the options and your constraints. Which outcome should the final decision protect first?"
        : "Seçenekleri ve kısıtlarını artık görüyorum. Son kararın öncelikle hangi sonucu korumasını istiyorsun?";
    }

    if (currentCategory === "time" || has(/zaman|yetiş|süre|yoğun|vakit|deadline/)) {
      if (!has(/iş|görev|sorumluluk|yapmam|yetiştirmem|task/)) return uiLanguage === "en"
        ? "What exactly are you trying to get done? List the tasks or responsibilities."
        : "Önce yükü çıkaralım. Şu anda yetiştirmeye çalıştığın işler veya sorumluluklar neler?";
      if (!has(/bugün|yarın|son tarih|deadline|tarih|saat|süre/)) return uiLanguage === "en"
        ? "Which of these have a hard deadline or a specific time?"
        : "Bunların hangilerinin kesin son tarihi veya belirli bir saati var?";
      if (!has(/dakika|saat|uzun|kısa|sürüyor/)) return uiLanguage === "en"
        ? "Roughly how long does each important task take, and what can be delayed or delegated?"
        : "Önemli işlerin her biri yaklaşık ne kadar sürüyor? Hangisini erteleyebilir, bölebilir veya devredebilirsin?";
      return uiLanguage === "en"
        ? "What should we protect first: the hardest deadline, the biggest consequence, or your available energy?"
        : "Önceliği neye göre kuralım: en yakın son tarih, en ağır sonuç veya elindeki enerji/zaman?";
    }

    if (currentCategory === "vehicle" || has(/araç|araba|motor|lastik|akü|servis|vehicle|car/)) {
      if (!has(/ne oldu|arıza|bozuk|çalışm|ses|ışık|sorun/)) return uiLanguage === "en"
        ? "What exactly is wrong with the vehicle, and can you safely use it right now?"
        : "Araçta tam olarak ne oldu ve şu an güvenli şekilde kullanabiliyor musun?";
      if (!has(/tamir|servis|değiş|bekle|geçici|alternatif|seçenek/)) return uiLanguage === "en"
        ? "What solutions are you considering: repair, replacement, service, waiting, or alternative transport?"
        : "Şu an düşündüğün çözüm yolları neler: tamir, parça değişimi, servis, beklemek veya alternatif ulaşım?";
      if (!has(/tl|₺|lira|maliyet|fiyat|kaç para|saat|gün/)) return uiLanguage === "en"
        ? "What do you know about the cost and time for each option?"
        : "Bu seçeneklerin yaklaşık maliyeti ve ne kadar süreceği hakkında ne biliyorsun?";
      return uiLanguage === "en"
        ? "Which outcome matters most: safety, getting mobile quickly, minimizing cost, or preventing further damage?"
        : "Hangisini önce korumalıyız: güvenlik, hızlıca yeniden hareket edebilmek, maliyeti düşürmek veya daha büyük hasarı önlemek?";
    }

    if (currentCategory === "travel" || has(/seyahat|uçuş|uçak|bilet|yolculuk|otel|travel|flight/)) {
      if (!has(/nereye|gidece|varış|destinasyon|şehir|ülke/)) return uiLanguage === "en"
        ? "Where are you going, on what date, and what is the reason for the trip?"
        : "Nereye, hangi tarihte ve hangi amaçla gitmen gerekiyor?";
      if (!has(/uçak|otobüs|tren|araba|otel|konak|bilet|seçenek/)) return uiLanguage === "en"
        ? "What transport and accommodation options are you actually considering?"
        : "Gerçekte hangi ulaşım ve konaklama seçeneklerini değerlendiriyorsun?";
      if (!has(/tl|₺|lira|maliyet|fiyat|süre|saat|gün/)) return uiLanguage === "en"
        ? "What do you know about the total cost and time of each option?"
        : "Her seçeneğin toplam maliyeti ve zaman farkı hakkında ne biliyorsun?";
      return uiLanguage === "en"
        ? "What must not change: the date, arrival time, budget, or something else?"
        : "Hangisi değişemez: tarih, varış saati, bütçe veya başka bir zorunluluk?";
    }

    if (currentCategory === "moving" || has(/taşın|ev değiş|nakliye|depozito|moving/)) {
      if (!has(/tarih|ne zaman|gün/)) return uiLanguage === "en"
        ? "When do you have to move?"
        : "Taşınman gereken kesin veya yaklaşık tarih ne?";
      if (!has(/ev|nakliye|depozito|eşya|taşıma|seçenek/)) return uiLanguage === "en"
        ? "What options do you have for the home, mover, deposit, and belongings?"
        : "Ev, nakliye, depozito ve eşyalar konusunda hangi seçeneklerin var?";
      if (!has(/tl|₺|lira|maliyet|fiyat|bütçe/)) return uiLanguage === "en"
        ? "What do you know about the total moving cost?"
        : "Toplam taşınma maliyeti hakkında şu an ne biliyorsun?";
      return uiLanguage === "en"
        ? "What must be protected first: the move date, cash, housing, work, or family stability?"
        : "Önce neyi güvenceye almalıyız: taşınma tarihi, nakit, ev, iş veya aile düzeni?";
    }

    if (currentCategory === "home" || has(/ev|tamir|bozuk|eşya|tesisat|home|repair/)) {
      if (!has(/ne oldu|bozuk|arız|sorun|çalışm|kırık/)) return uiLanguage === "en"
        ? "What exactly happened at home, and what is affected?"
        : "Evde tam olarak ne oldu ve hangi şeyler etkilendi?";
      if (!has(/tamir|değiş|servis|geçici|seçenek/)) return uiLanguage === "en"
        ? "What solutions are you considering: repair, replacement, service, or a temporary fix?"
        : "Hangi çözüm yollarını düşünüyorsun: tamir, değişim, servis veya geçici çözüm?";
      if (!has(/tl|₺|lira|maliyet|fiyat/)) return uiLanguage === "en"
        ? "What do you know about the cost, time, and risks of each option?"
        : "Her seçeneğin maliyeti, süresi ve riskleri hakkında ne biliyorsun?";
      return uiLanguage === "en"
        ? "What should we protect first: safety, preventing further damage, cost, or speed?"
        : "Önce neyi koruyalım: güvenlik, daha büyük hasarı önlemek, maliyet veya hız?";
    }

    if (currentCategory === "family" || has(/aile|eş|çocuk|çocuğ|bebek|family/)) {
      if (!has(/sorun|konu|ihtiyaç|çöz/)) return uiLanguage === "en"
        ? "What exactly are you trying to solve within the family?"
        : "Aile içinde tam olarak hangi konuyu çözmeye çalışıyorsun?";
      if (!has(/seçenek|yapabil|dened|düşün/)) return uiLanguage === "en"
        ? "What options have you considered or could realistically use?"
        : "Şu ana kadar düşündüğün veya gerçekten uygulayabileceğin seçenekler neler?";
      if (!has(/para|zaman|düzen|ilişki|etki|maliyet/)) return uiLanguage === "en"
        ? "How would each option affect money, time, routine, or relationships?"
        : "Bu seçeneklerin para, zaman, düzen veya ilişkiler üzerindeki etkileri neler?";
      return uiLanguage === "en"
        ? "What must be protected first: a basic need, a boundary, safety, or a deadline?"
        : "Önce neyi güvenceye almalıyız: temel ihtiyaç, bir sınır, güvenlik veya son tarih?";
    }

    if (!has(/sorun|problem|mesele|ne oldu|çöz/)) return uiLanguage === "en"
      ? "What exactly is happening, and what part is putting the most pressure on you?"
      : "Tam olarak ne oluyor ve seni en çok zorlayan kısmı hangisi?";
    if (!has(/seçenek|alternatif|yapabil|dened|düşün/)) return uiLanguage === "en"
      ? "What options have you already considered, tried, or could realistically use?"
      : "Şu ana kadar düşündüğün, denediğin veya gerçekten uygulayabileceğin seçenekler neler?";
    if (!has(/para|zaman|risk|maliyet|fiyat|kolay|sonuç|etki/)) return uiLanguage === "en"
      ? "What important differences are there between those options—money, time, risk, or impact?"
      : "Bu seçenekler arasında sonucu değiştirecek farklar neler: para, zaman, risk, maliyet veya etki?";
    return uiLanguage === "en"
      ? "What constraint or outcome must the final plan protect first?"
      : "Son planın öncelikle koruması gereken kısıt veya sonuç ne?";
  }

  function conversationBridge(category: string, context: string, answerText: string) {
    const answer = answerText.trim();
    const normalized = answer.toLocaleLowerCase("tr-TR");
    const amounts = extractMoney(answer);
    const total = amounts.reduce((sum, value) => sum + value, 0);
    const emptyAnswer = /^(hiç|yok|yoktu|bilmiyorum|emin değilim|none|nothing|don't know|not sure)$/i.test(normalized);

    if (category === "money" || category === "bills") {
      if (amounts.length >= 2) {
        const labels = extractPaymentLabels(answer);
        const names = labels.length ? " (" + labels.join(", ") + ")" : "";
        return language === "en"
          ? "I have the numbers. The items you mentioned" + names + " add up to about " + total.toLocaleString("en-US") + " TL. I won't prioritize them yet; first I'll separate what is due, what can move, and what happens if each one is late."
          : "Rakamları aldım. Belirttiğin kalemler" + names + " toplam yaklaşık " + total.toLocaleString("tr-TR") + " TL ediyor. Henüz öncelik sıralamıyorum; önce hangisinin ne zaman ödeneceğini, hangisinin hareket ettirilebileceğini ve gecikince ne olacağını ayıracağım.";
      }
      if (emptyAnswer) {
        return language === "en"
          ? "Okay, so there is no usable cash available right now. That's important. I won't assume you can pay something you don't have; let's map the obligations first and then look at realistic ways to create room."
          : "Tamam, şu an kullanabileceğin nakit yok. Bu önemli bir bilgi. Elinde olmayan parayı varmış gibi kabul etmeyeceğim; önce zorunlu ödemeleri çıkaracağız, sonra gerçekten uygulanabilecek hareket alanlarını arayacağız.";
      }
      if (/çok|bir sürü|birçok|fazla|many|a lot/i.test(normalized)) {
        return language === "en"
          ? "I understand. When several expenses are hitting at once, trying to solve them all together usually makes the picture worse. Let's list the obligations one by one and then rank them by deadline and consequence."
          : "Anladım. Birçok gider aynı anda üstüne geliyorsa hepsini tek seferde çözmeye çalışmak tabloyu daha da karıştırır. Önce zorunlu ödemeleri tek tek çıkaralım; sonra son tarih ve sonuçlarına göre sıralayalım.";
      }
      if (amounts.length === 1) {
        return language === "en"
          ? "I noted " + amounts[0].toLocaleString("en-US") + " TL. I'll keep that as a real constraint and compare it with the obligations you give me next."
          : amounts[0].toLocaleString("tr-TR") + " TL'yi not ettim. Bunu gerçek bir kısıt olarak tutacağım ve şimdi söyleyeceğin zorunlu ödemelerle karşılaştıracağım.";
      }
    }

    if (category === "decision") {
      if (/a mı|b mi|arasında|seçenek|alternatif|option|choose/i.test(normalized)) {
        return language === "en"
          ? "Good. I have the options. I won't pick one just because it sounds better; next I'll compare the trade-offs against what matters to you."
          : "Güzel, seçenekleri artık görüyorum. Sadece kulağa daha iyi geliyor diye birini seçmeyeceğim; şimdi bunları senin için önemli ölçütlerle karşılaştıracağım.";
      }
      if (emptyAnswer) {
        return language === "en" ? "That's okay. If you're unsure, we'll identify the missing information instead of guessing." : "Sorun değil. Emin değilsen tahmin yürütmek yerine kararı değiştirecek eksik bilgiyi bulacağız.";
      }
    }

    if (category === "time") {
      const short = answer.length > 80 ? answer.slice(0, 77) + "..." : answer;
      return language === "en"
        ? "I have \"" + short + "\". I'll use it to separate hard deadlines from work that can move."
        : "\"" + short + "\" bilgisini aldım. Şimdi kesin son tarihleri, ertelenebilecek işleri ve gerçekten zaman kazandıracak noktaları ayıracağım.";
    }

    if (category === "vehicle") {
      return language === "en"
        ? "I have the vehicle situation. Before cost, I'm checking whether it is safe to use and which repair/transport options are actually available."
        : "Araç durumunu aldım. Maliyete geçmeden önce güvenli kullanılıp kullanılamadığını ve gerçekten hangi tamir/ulaşım seçeneklerinin bulunduğunu ayıracağım.";
    }

    if (category === "travel") {
      return language === "en"
        ? "Got it. I'm keeping the date and arrival requirement as hard constraints; next we'll compare the real options and total cost."
        : "Anladım. Tarihi ve varış zorunluluğunu sabit kısıt olarak tutuyorum; şimdi gerçek seçenekleri ve toplam maliyeti karşılaştıracağız.";
    }

    if (category === "moving") {
      return language === "en"
        ? "I have that. A move is a chain of costs and deadlines, so I'll separate the fixed commitments from the parts we can change."
        : "Bunu aldım. Taşınma tek bir masraf değil, birbirine bağlı bir zaman ve ödeme zinciri; sabit zorunluluklarla değiştirebileceğimiz kısımları ayıracağım.";
    }

    if (category === "home") {
      return language === "en"
        ? "I understand the home problem. I'm checking safety and further-damage risk before we optimize price."
        : "Evdeki sorunu anladım. Fiyatı optimize etmeden önce güvenlik ve daha büyük hasar riskini kontrol edeceğim.";
    }

    if (category === "family") {
      return language === "en"
        ? "I have the family constraint. I'll keep the people affected and the practical limits in view while we compare the options."
        : "Aile tarafındaki kısıtı aldım. Seçenekleri karşılaştırırken etkilenen kişileri ve gerçek hayattaki sınırları göz önünde tutacağım.";
    }

    if (category === "work") {
      return language === "en"
        ? "I have the work pressure. Next I'll separate what is truly urgent from what only feels urgent."
        : "İş tarafındaki baskıyı aldım. Şimdi gerçekten acil olanla sadece acil gibi görünen işleri birbirinden ayıracağım.";
    }

    if (emptyAnswer) {
      return language === "en"
        ? "No problem. If you don't know yet, we'll find out what information is worth getting before making a decision."
        : "Sorun değil. Henüz bilmiyorsan tahmin etmeyeceğiz; önce hangi bilginin kararı gerçekten değiştireceğini bulacağız.";
    }

    const short = answer.length > 90 ? answer.slice(0, 87) + "..." : answer;
    return language === "en"
      ? "I noted \"" + short + "\". I'll use it as a real constraint and keep narrowing the situation before suggesting anything."
      : "\"" + short + "\" dediğini not ettim. Bunu gerçek bir kısıt olarak tutacağım; bir şey önermeden önce tabloyu biraz daha netleştireceğim.";
  }

  function getOptions() {
    return {
      category: category || undefined,
      goal: goal || undefined,
      urgency,
      budget: budget === "" ? undefined : Number(budget),
      availableHours: availableHours === "" ? undefined : Number(availableHours),
      language,
    };
  }

  function runAnalysis(context: string) {
    const localResult = analyzeOffline(context, getOptions());
    setResult(localResult);
    return localResult;
  }

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    if (!messages.length) return;

    const userMessages = messages.filter((message) => message.role === "user").map((message) => message.text);
    const context = conversationContext || userMessages.join("\nKullanıcı: ");
    if (!context) return;

    const localResult = analyzeOffline(context, {
      category: category || undefined,
      goal: goal || undefined,
      urgency,
      budget: budget === "" ? undefined : Number(budget),
      availableHours: availableHours === "" ? undefined : Number(availableHours),
      language: nextLanguage,
    });

    setResult(localResult);
    const nextQuestion = getNextQuestion(localResult.category, context, nextLanguage);
    const translatedDiagnosis = localResult.diagnosis;
    setMessages([
      ...userMessages.map((text) => ({ role: "user" as const, text })),
      { role: "engine", text: translatedDiagnosis },
      ...(nextQuestion ? [{ role: "engine" as const, text: nextQuestion }] : []),
    ]);
  }

  function start(textOverride?: string) {
    const text = (textOverride ?? problem).trim();
    if (text.length < 3) return;

    const normalized = text.toLocaleLowerCase("tr-TR").replace(/[!?.,]/g, "").trim();
    const isGreeting = /^(merhaba|selam|hey|sa|selaam|hello|hi|hey there|good morning|good evening|iyi akşamlar|günaydın|iyi günler)$/.test(normalized);

    if (isGreeting) {
      setProblem("");
      setAnswer("");
      setQuestionIndex(0);
      setShowPlan(false);
      setConversationContext("");
      setResult(null);
      setMessages([
        { role: "user", text },
        { role: "engine", text: copy.greeting },
      ]);
      return;
    }

    const localResult = runAnalysis(text);
    const firstQuestion = getNextQuestion(localResult.category, text);

    setProblem("");
    setAnswer("");
    setQuestionIndex(0);
    setShowPlan(false);
    setConversationContext(text);
    setMessages([
      { role: "user", text },
      { role: "engine", text: localResult.diagnosis },
      { role: "engine", text: firstQuestion ?? (language === "en" ? "Tell me anything else that could change the decision." : "Kararı değiştirebilecek başka bir ayrıntı varsa onu da anlat.") },
    ]);
  }

  function finishConversation(context: string, localResult: Result) {
    setShowPlan(true);
    saveLifeRescueHistory({
      problem: context.split("\nKullanıcı:")[0],
      category: localResult.category,
      goal: localResult.goal,
      diagnosis: localResult.diagnosis,
      objective: localResult.plan.objective,
    });
  }

  function continueConversation() {
    const text = answer.trim();
    if (!text || !result) return;

    const nextContext = conversationContext
      ? conversationContext + "\nKullanıcı: " + text
      : text;
    const nextIndex = questionIndex + 1;
    const localResult = runAnalysis(nextContext);
    const nextQuestion = getNextQuestion(localResult.category, nextContext);

    setConversationContext(nextContext);
    setAnswer("");

    if (nextQuestion && nextIndex < 8) {
      setQuestionIndex(nextIndex);
      const bridge = conversationBridge(result.category, nextContext, text);

      setMessages((prev) => [
        ...prev,
        { role: "user", text },
        { role: "engine", text: bridge + "\n\n" + nextQuestion },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "engine",
        text: copy.thinking,
      },
    ]);
    finishConversation(nextContext, localResult);
  }

  function reset() {
    setProblem("");
    setAnswer("");
    setResult(null);
    setMessages([]);
    setConversationContext("");
    setQuestionIndex(0);
    setCategory("");
    setGoal("");
    setUrgency(5);
    setBudget("");
    setAvailableHours("");
    setShowSettings(false);
    setShowPlan(false);
  }

  function sendFromComposer() {
    const text = answer.trim();
    if (!text) return;
    if (result) {
      continueConversation();
      return;
    }
    if (conversationStarted) {
      start(text);
      return;
    }
    setProblem(text);
    window.setTimeout(() => start(text), 0);
  }

  const conversationStarted = messages.length > 0;
  const questions = result ? getQuestionSet(result.category, conversationContext).map((q) => translateKnown(q, language)) : [];
  const isReadyForPlan = showPlan && result;

  return (
    <main className="h-[100dvh] w-full overflow-y-auto overscroll-contain bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-4 pb-28 pt-[calc(env(safe-area-inset-top)+5.2rem)] md:px-6">
        <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.65rem)] shadow-sm backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={copy.menu}
              title={copy.menu}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card sm:h-10 sm:w-10"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 shrink-0" />
              <span className="hidden truncate text-sm font-bold tracking-wide sm:inline">AGT LIFE RESCUE</span>
              <span className="text-sm font-bold tracking-wide sm:hidden">AGT LIFE</span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <div className="inline-flex rounded-full border bg-card p-0.5" role="group" aria-label="Language">
                <button type="button" onClick={() => changeLanguage("tr")} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${language === "tr" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>TR</button>
                <button type="button" onClick={() => changeLanguage("en")} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
              </div>

              <button
                type="button"
                onClick={reset}
                aria-label={copy.newProblem}
                title={copy.newProblem}
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-card sm:h-10 sm:w-10"
              >
                <PencilLine className="h-5 w-5" />
              </button>

              <button
                type="button"
                aria-label={copy.details}
                title={copy.details}
                onClick={() => setShowSettings((value) => !value)}
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-card sm:h-10 sm:w-10"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
          {!conversationStarted && (
            <>
              <h1 className="mt-8 text-4xl font-bold tracking-tight md:text-5xl">{copy.whatHappened}</h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                {copy.intro}
              </p>
            </>
          )}
        </header>

        {!conversationStarted ? (
          <section className="flex flex-1 flex-col justify-center pb-10 pt-10">
            <div className="rounded-3xl border bg-card p-3 shadow-sm">
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") start();
                }}
                placeholder={copy.placeholder}
                className="min-h-36 w-full resize-none bg-transparent px-3 py-3 text-lg leading-7 outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowSettings((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  <Settings2 className="h-4 w-4" />
                  Ayrıntılar
                </button>
                <button
                  type="button"
                  onClick={() => start()}
                  disabled={problem.trim().length < 3}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                  Gönder
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button key={item} type="button" onClick={() => start(item)}
                  className="rounded-full border bg-card px-3 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
                  {item}
                </button>
              ))}
            </div>

            {showSettings && (
              <div className="mt-4 rounded-2xl border bg-card p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1.5 block text-muted-foreground">{copy.topic}</span>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border bg-background px-3 py-3">
                      {categories.map(([value, label]) => <option key={value} value={value}>{language === "en" ? categoriesEn[value] : label}</option>)}
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1.5 block text-muted-foreground">{copy.goal}</span>
                    <select value={goal} onChange={(e) => setGoal(e.target.value)}
                      className="w-full rounded-xl border bg-background px-3 py-3">
                      {goals.map(([value, label]) => <option key={value} value={value}>{language === "en" ? goalsEn[value] : label}</option>)}
                    </select>
                  </label>
                  <label className="rounded-xl border px-3 py-2 sm:col-span-2">
                    <span className="block text-xs text-muted-foreground">{copy.urgency}: {urgency}/10</span>
                    <input className="mt-1 w-full" type="range" min="1" max="10" value={urgency}
                      onChange={(e) => setUrgency(Number(e.target.value))} />
                  </label>
                  <label className="rounded-xl border px-3 py-2">
                    <span className="block text-xs text-muted-foreground">{copy.budget}</span>
                    <input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min="0"
                      placeholder={copy.optional} className="mt-1 w-full bg-transparent outline-none" />
                  </label>
                  <label className="rounded-xl border px-3 py-2">
                    <span className="block text-xs text-muted-foreground">{copy.timeToday}</span>
                    <input value={availableHours} onChange={(e) => setAvailableHours(e.target.value)} type="number"
                      min="0" step="0.5" placeholder={copy.hours} className="mt-1 w-full bg-transparent outline-none" />
                  </label>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <WifiOff className="h-3.5 w-3.5" />
              Temel karar motoru cihazında çalışır.
            </div>
          </section>
        ) : (
          <section className="min-h-0 flex-1 py-5 md:py-8">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={message.role === "user" ? "max-w-[88%]" : "max-w-[94%]"}>
                    <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {message.role === "user" ? copy.you : copy.engine}
                    </div>
                    <div className={message.role === "user"
                      ? "rounded-3xl rounded-tr-md bg-primary px-4 py-3.5 text-primary-foreground"
                      : "rounded-3xl rounded-tl-md border bg-card px-4 py-4"}>
                      <p className="text-[15px] leading-7">{message.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {isReadyForPlan && result && (
                <div className="rounded-3xl border bg-card p-4 md:p-5">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-semibold">{copy.tableClear}</span>
                  </div>
                  <p className="mt-3 text-base leading-7">{result.diagnosis}</p>

                  <button
                    type="button"
                    onClick={() => setShowPlan((v) => !v)}
                    className="mt-5 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left"
                  >
                    <span className="text-sm font-semibold">{copy.plan}</span>
                    <span className="text-xs text-muted-foreground">{showPlan ? copy.hide : copy.show}</span>
                  </button>

                  {showPlan && (
                    <div className="mt-3 space-y-2">
                      {result.plan.steps.filter((step) => (step.label as string) !== "Hedef" && (step.label as string) !== "Goal").map((step, index) => (
                        <div key={step.label} className="flex gap-3 rounded-2xl bg-muted/60 p-3.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-primary">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-primary">{step.label}</span>
                              {step.estimatedMinutes !== undefined && (
                                <span className="text-xs text-muted-foreground">~{step.estimatedMinutes} {copy.minutes}</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm font-medium">{step.title}</p>
                            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {conversationStarted && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.7rem)] pt-3 backdrop-blur md:px-6">
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border bg-card p-2 shadow-lg">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendFromComposer();
                  }
                }}
                placeholder={copy.answer}
                rows={1}
                className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-muted-foreground"
              />
              <button type="button" onClick={sendFromComposer} disabled={!answer.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                aria-label={copy.send}>
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              {copy.understand}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

