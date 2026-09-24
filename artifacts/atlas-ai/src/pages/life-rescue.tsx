import { useEffect, useMemo, useState } from "react";
import { ArrowUp, CheckCircle2, Menu, MoreVertical, PencilLine, Settings2, Sparkles, WifiOff } from "lucide-react";
import { analyzeOffline, type OfflineResult } from "@/lib/life-rescue-offline";
import { saveLifeRescueHistory } from "@/lib/life-rescue-history";
import { addGoal, addTask } from "@/lib/assistant-store";
import { extractIzciCandidates, type IzciCandidate } from "@/lib/izci-intelligence";
import { useSidebar } from "@/components/ui/sidebar";

type Result = OfflineResult;

type Message = {
  role: "user" | "engine";
  text: string;
};

type Language = "tr" | "en";

const uiText = {
  tr: {
    newProblem: "Yeni problem", menu: "Menüyü aç", whatHappened: "Bugün neyi çözmek istiyorsun?",
    intro: "Derdini kendi cümlelerinle anlat. Önce seni anlayacağım, sonra birlikte uygulanabilir bir yol çıkaracağız.",
    placeholder: "Şu an neyi çözmeye çalışıyorsun?", details: "Ayrıntılar", send: "Gönder",
    topic: "Konu", goal: "Hedef", auto: "Otomatik belirle", urgency: "Aciliyet",
    capabilitiesTitle: "Çözebildiğim konular", capabilitiesAll: "Tüm konuları gör →",
    budget: "Bütçe (TL)", timeToday: "Bugün ayırabileceğin zaman", optional: "İsteğe bağlı",
    hours: "Saat", offline: "Temel karar motoru cihazında çalışır.",
    answer: "Cevabını yaz...", you: "Sen", engine: "Life Rescue",
    understand: "Önce seni anlayacağım, sonra çözüm çıkaracağım.",
    tableClear: "Tamam, tablo netleşti.", plan: "Kurtarma planı", hide: "Gizle", show: "Göster",
    thinking: "Şimdi verdiğin bilgileri bir araya getirip sana uygulanabilir, öncelik sırasına konmuş bir çıkış yolu çıkarıyorum.",
    minutes: "dk", capabilitiesDesc: "Günlük hayattaki problemleri birlikte anlamlandırıp uygulanabilir bir plan çıkarmana yardımcı olurum.", scopeHint: "Başka bir konuda yardım istediğinde, bunu açıkça söyle; uygun değilse kapsamımı kısaca açıklayacağım.", composerHint: "Sorunu kendi cümlelerinle anlat.", izciFound: "İZCİ için bir şey yakaladım", izciDesc: "Konuşmada takip edilebilecek bir bilgi gördüm. Sen onaylamadan hiçbir şeyi takibe almıyorum.", goalItem: "Hedef", datedTask: "Tarihli görev", trackTask: "Takip edilecek görev", inIzci: "İZCİ'de", track: "Takibe al", greeting: "Merhaba. Buradayım. Önce neyi çözmeye çalıştığını anlat; hemen sonuca atlamadan durumu birlikte netleştirelim.",
    suggestions: ["Param yetmiyor", "Faturaları yetiştiremiyorum", "Bir karar veremiyorum", "Zamanım yetmiyor"],
  },
  en: {
    newProblem: "New problem", menu: "Open menu", whatHappened: "What do you want to solve today?",
    intro: "Tell me what is going on in your own words. I'll understand it first, then we'll build a practical way forward.",
    placeholder: "What are you trying to solve right now?", details: "Details", send: "Send",
    topic: "Topic", goal: "Goal", auto: "Auto-detect", urgency: "Urgency",
    capabilitiesTitle: "What I can help with", capabilitiesAll: "See all topics →",
    budget: "Budget", timeToday: "Time available today", optional: "Optional",
    hours: "Hours", offline: "The core decision engine runs on your device.",
    answer: "Type your answer...", you: "You", engine: "Life Rescue",
    understand: "I'll understand the situation first, then work out a solution.",
    tableClear: "Okay, I have enough of the picture.", plan: "Rescue plan", hide: "Hide", show: "Show",
    thinking: "Okay. I have enough context now. I'm putting it together into a practical, prioritized way forward.",
    minutes: "min", capabilitiesDesc: "I help you make sense of everyday problems and turn them into a practical plan.", scopeHint: "If you need help with another topic, say so clearly; if it is outside my scope, I will explain briefly.", composerHint: "Tell me the problem in your own words.", izciFound: "I found something for İZCİ", izciDesc: "I found information in the conversation that could be tracked. Nothing is tracked until you approve it.", goalItem: "Goal", datedTask: "Dated task", trackTask: "Task to track", inIzci: "In İZCİ", track: "Track", greeting: "Hello. I'm here. Tell me what you're trying to solve, and we'll understand the situation before jumping to a solution.",
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
  const adaptive: Record<string, string> = {
    "Önce paranın nereye gideceğini netleştirelim. Hangi ödemeler veya ihtiyaçlar için para gerekiyor? Mümkünse kalem kalem yaz.": "Let's first map where the money needs to go. What payments or needs are you covering? List them if you can.",
    "Şu an gerçekten kullanabileceğin para ne kadar? Banka hesabı, nakit ve hemen erişebileceğin başka para varsa birlikte düşün.": "How much money can you actually use right now? Include your bank balance, cash, and anything else immediately available.",
    "Şimdi zorunlu ödemeleri tek tek çıkaralım. Tutarını bilmiyorsan yaklaşık yaz; örneğin kira 15.000, kredi 10.000 gibi.": "Let's list the mandatory payments one by one. If you don't know an exact amount, give an estimate.",
    "Bu ödemelerin hangileri ertelenemez? Son tarihlerini ve gecikirse ne olacağını mümkün olduğunca yaz.": "Which payments cannot be delayed? Give the due dates and what happens if each one is late.",
    "Elimizde artık tablo var. Hangi seçenekleri gerçekten uygulayabilirsin: erteleme, taksit, masraf kısma, ek gelir, satış, borç alma veya başka bir yol?": "We have the basic picture now. Which options can you realistically use: delay, installments, cutting costs, extra income, selling, borrowing, or another route?",
    "Son olarak neyi korumamız gerekiyor: temel ihtiyaçlar, en ciddi sonucu önlemek, toplam maliyeti düşürmek veya en hızlı nakdi oluşturmak?": "Finally, what do we need to protect first: essential needs, avoiding the most serious consequence, reducing total cost, or creating cash fastest?",
    "“Ev işleri” dediğinde hangi işleri kastediyorsun? Örneğin yemek, bulaşık, çamaşır, temizlik, çocuk, alışveriş gibi mümkün olduğunca tek tek yaz.": "When you say “housework,” which tasks do you mean? For example cooking, dishes, laundry, cleaning, childcare, shopping—list them specifically.",
    "Bunlardan hangilerinin kesin bir son tarihi veya belirli bir saati var? Yoksa hiçbiri zorunlu bir saate bağlı değil mi?": "Which of these have a hard deadline or specific time? Or are none tied to a fixed time?",
    "Her önemli iş yaklaşık ne kadar sürüyor? Ayrıca seni en çok yavaşlatan şey ne: enerji, çocuk, iş/mesai, dağınıklık, malzeme eksikliği veya başka bir şey?": "Roughly how long does each important task take? What slows you down most: energy, childcare, work, clutter, missing supplies, or something else?",
    "Hangilerini erteleyebilir, bölebilir veya başka birine devredebilirsin? Hiç devredemediğin işler varsa onları da belirt.": "Which tasks can be delayed, split up, or delegated? Also tell me which ones cannot be delegated.",
    "Artık önceliklendirebiliriz. Senin için önce ne korunmalı: bugün bitmesi gereken işler, evin temel düzeni, çocuk/aile ihtiyacı veya dinlenmek için zaman?": "Now we can prioritize. What should be protected first: tasks that must be done today, basic home order, family needs, or time to rest?",
    "Şu anda senden beklenen işleri veya sorumlulukları mümkün olduğunca tek tek yaz.": "List the tasks or responsibilities expected from you right now, as specifically as possible.",
    "Hangilerinin kesin son tarihi veya belirli bir saati var?": "Which have a hard deadline or a specific time?",
    "Her iş yaklaşık ne kadar sürüyor ve hangisinin gecikmesi en ciddi sonucu doğurur?": "Roughly how long does each task take, and which has the most serious consequence if delayed?",
    "Hangilerini erteleyebilir, bölebilir veya devredebilirsin?": "Which can you delay, split up, or delegate?",
    "Önceliği neye göre kuralım: son tarih, sonuç, gelir kaybı veya enerjini korumak?": "What should determine priority: deadline, impact, lost income, or protecting your energy?",
    "Önce seçenekleri masaya koyalım. Gerçekte hangi seçenekler arasında karar veriyorsun?": "Let's put the actual options on the table. What choices are you deciding between?",
    "Bu seçeneklerin bildiğin farkları neler: fiyat, zaman, kalite, risk, kullanım kolaylığı veya başka bir şey?": "What differences do you know between the options: price, time, quality, risk, convenience, or something else?",
    "Senin için vazgeçilmez olan ölçüt hangisi? Örneğin bütçe, hız, güvenlik veya uzun ömür.": "What is non-negotiable for you? For example budget, speed, safety, or long-term value.",
    "Her seçeneğin kötü gitmesi durumunda özellikle kaçınmak istediğin sonuç ne?": "If each option goes badly, what outcome do you most want to avoid?",
    "Son kararda neyi korumamız gerekiyor? Bunu netleştirince seçenekleri buna göre sıralayacağım.": "What must the final decision protect? Once we know that, I'll compare the options against it.",
    "Araçta tam olarak ne oldu? Şu anda güvenli şekilde kullanılabiliyor mu?": "What exactly happened with the vehicle? Can it still be used safely right now?",
    "Nereye, hangi tarihte ve hangi amaçla gitmen gerekiyor?": "Where do you need to go, on what date, and why?",
    "Taşınman gereken tarih ne ve o tarihin değişme ihtimali var mı?": "When do you have to move, and can that date change?",
    "Evde tam olarak ne oldu ve şu anda hangi şeyler etkileniyor?": "What exactly happened at home, and what is affected right now?",
    "Aile içinde tam olarak hangi konuyu çözmeye çalışıyorsun ve kimler etkileniyor?": "What exactly are you trying to solve within the family, and who is affected?",
    "Önce problemi biraz açalım: tam olarak ne oluyor ve seni en çok zorlayan kısım hangisi?": "Let's open this up: what exactly is happening, and which part is putting the most pressure on you?",
    "Şu ana kadar düşündüğün, denediğin veya gerçekten uygulayabileceğin seçenekler neler?": "What options have you considered, tried, or could realistically use?",
    "Seni sınırlayan kesin bir şey var mı: bütçe, son tarih, başka bir kişinin kararı veya mevcut kaynaklar?": "Is there a firm constraint: budget, deadline, another person's decision, or available resources?",
    "Son planın öncelikle hangi sonucu koruması gerekiyor?": "What outcome must the final plan protect first?",
  };
  return adaptive[text] ?? exact[text] ?? text;
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
  const [izciCandidates, setIzciCandidates] = useState<IzciCandidate[]>([]);
  const [trackedCandidateIds, setTrackedCandidateIds] = useState<string[]>([]);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboardOffset = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(offset);
    };

    updateKeyboardOffset();
    viewport.addEventListener("resize", updateKeyboardOffset);
    viewport.addEventListener("scroll", updateKeyboardOffset);
    return () => {
      viewport.removeEventListener("resize", updateKeyboardOffset);
      viewport.removeEventListener("scroll", updateKeyboardOffset);
    };
  }, []);
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "tr";
    return window.localStorage.getItem("agt_life_rescue_language") === "en" ? "en" : "tr";
  });
  const { toggleSidebar } = useSidebar();
  const copy = uiText[language];

  const suggestions = copy.suggestions;
  const capabilityOptions = language === "en" ? [
    ["💰", "Money & budget"], ["📋", "Debt & payments"], ["🧾", "Bills & expenses"], ["⏰", "Time & planning"], ["🧠", "Decision making"], ["🎯", "Goals"], ["🏠", "Home & daily life"], ["💼", "Work & workflow"], ["👨‍👩‍👧", "Family & daily life"], ["✈️", "Travel & moving"],
  ] : [
    ["💰", "Para & bütçe"], ["📋", "Borç & ödemeler"], ["🧾", "Faturalar & giderler"], ["⏰", "Zaman & planlama"], ["🧠", "Karar verme"], ["🎯", "Hedefler"], ["🏠", "Ev & günlük yaşam"], ["💼", "İş & çalışma düzeni"], ["👨‍👩‍👧", "Aile & günlük düzen"], ["✈️", "Seyahat & taşınma"],
  ];

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
  function extractPaymentLabels(answerText: string) {
    return answerText
      .split(/[,;\n]|\s+ve\s+|\s+ile\s+/i)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  function getNextQuestion(currentCategory: string, context: string, uiLanguage: Language = language): string | null {
    const text = context.toLocaleLowerCase("tr-TR");
    const q = (tr: string, en: string) => uiLanguage === "en" ? en : tr;

    const has = (...patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text));
    const hasAmount = /\b\d{1,3}(?:[. ]\d{3})*(?:,\d{1,2})?\s*(?:tl|₺|lira|bin|k)\b/i.test(text);
    const hasMoneyPurpose = has(
      /\bkira\b|\bfatura\b|\bkredi\b|\bborç\b|\btaksit\b|\bmarket\b|\bçocuk\b|\bokul\b|\bilaç\b|\byakıt\b|\babonelik\b/,
      /rent|bill|loan|debt|installment|grocer|child|school|medicine|fuel|subscription/
    );
    const latestUserText = context.split(/\nKullanıcı:\s*/).pop()?.trim() ?? context.trim();
    const hasRecentMoneyAmount =
      /\b\d{1,3}(?:[. ]\d{3})*(?:,\d{1,2})?\s*(?:tl|₺|lira|try|bin|k)\b/i.test(latestUserText) ||
      /^\s*\d{2,7}(?:[.,]\d{1,2})?\s*$/.test(latestUserText.replace(/\s+/g, " "));
    const hasAvailableMoney = has(
      /elimde|elinde|hesabımda|hesabında|cebimde|nakit|kullanabileceğim|kullanılabilir|param yok|hiç para|para yok|banka hesab/,
      /available|in my account|cash|money i can use|i have no money|no money/
    ) || hasRecentMoneyAmount;
    const hasPaymentList = hasAmount && hasMoneyPurpose;
    const hasDeadline = has(/son tarih|vade|bugün|yarın|ayın \d+|\d{1,2}[./]\d{1,2}|gecik|kesilir|faiz|ceza|icra/, /deadline|due|today|tomorrow|late|cut off|interest|penalty|collection/);
    const hasOptions = has(/ertele|taksit|azalt|kıs|iptal|sat|ek gelir|ek para|avans|yardım|borç al|alternatif|seçenek/, /delay|installment|reduce|cancel|sell|extra income|advance|borrow|alternative|option/);
    const hasPriority = has(/öncelik|en önemli|korumamız|neyi koru|kriter|maliyet|nakit|temel ihtiyaç|güvenlik/, /priority|most important|protect|criterion|cost|cash|essential|safety/);

    if (currentCategory === "money") {
      if (!hasMoneyPurpose) return q(
        "Anladım. Para en çok hangi zorunlu ihtiyaç için gerekiyor? Örneğin kira, fatura, borç, market veya çocuk masrafı.",
        "First, let's map where the money needs to go. What does the money have to cover—rent, loans, bills, groceries, children, health, or something else? List the items if you can."
      );
      if (!hasAvailableMoney) return q(
        "Peki şu an elinde kullanabileceğin yaklaşık ne kadar para var?",
        "Now let's establish the resources. How much money can you actually use right now? Include cash, bank balance, and anything else you can access immediately."
      );
      if (!hasPaymentList) return q(
        "Önümüzdeki birkaç gün içinde ödenmesi gereken en önemli kalemler neler ve yaklaşık tutarları ne?",
        "What are the most important payments due in the next few days, and roughly how much are they?"
      );
      if (!hasDeadline) return q(
        "Rakamları gördüm. Şimdi zaman baskısını anlamam gerekiyor: Bu ödemelerin son tarihleri ne ve hangisi gecikirse en ciddi sonucu doğurur?",
        "I have the amounts. Now I need the timing: when are these payments due, and which one causes the most serious consequence if it is late?"
      );
      if (!hasOptions) return q(
        "Artık açık ile zorunlu ödemeleri karşılaştırabiliriz. Gerçekte kullanabileceğin yollar hangileri: erteleme, taksit, gider kısma, satış, ek gelir, avans, borç alma veya başka bir seçenek?",
        "Now we can compare the gap with the mandatory payments. Which options are actually available to you: delaying, installments, cutting expenses, selling something, extra income, an advance, borrowing, or another route?"
      );
      if (!hasPriority) return q(
        "Son kararı verirken neyi korumamız gerekiyor? Temel ihtiyaçların devam etmesi, en ağır sonucu önlemek, toplam maliyeti düşürmek veya mümkün olan en hızlı nakdi oluşturmak gibi bir önceliğin var mı?",
        "Before I prioritize the plan, what must we protect? Essential needs, avoiding the most serious consequence, reducing total cost, or creating cash as quickly as possible?"
      );
      return null;
    }

    const plans: Record<string, Array<{needs: () => boolean; tr: string; en: string}>> = {
      bills: [
        { needs: () => !hasMoneyPurpose, tr: "Hangi faturalar veya abonelikler sorun çıkarıyor? İsimlerini ve mümkünse tutarlarını tek tek yaz.", en: "Which bills or subscriptions are causing the problem? List them one by one with amounts if possible." },
        { needs: () => !hasAvailableMoney, tr: "Bu faturalar için şu an gerçekten ayırabileceğin toplam para ne kadar?", en: "How much money can you actually set aside for these bills right now?" },
        { needs: () => !hasDeadline, tr: "Hangilerinin son tarihi yakın ve gecikirse kesinti, faiz veya başka ciddi bir sonuç doğurur?", en: "Which ones are closest to their deadlines, and which could cause a serious consequence if late?" },
        { needs: () => !hasOptions, tr: "Hangisini erteleme, taksitlendirme, düşürme veya iptal etme ihtimalin var?", en: "Which ones could you delay, put on installments, reduce, or cancel?" },
        { needs: () => !hasPriority, tr: "Önceliği neye göre kuralım: temel hizmetin kesilmemesi, gecikme maliyetini azaltmak veya toplam borcu küçültmek?", en: "What should drive priority: keeping essential services active, reducing late costs, or reducing the total debt?" },
      ],
      time: [
        { needs: () => !has(/yemek|bulaşık|çamaşır|temizlik|çocuk|alışveriş|ütü|görev|işler|toplantı|rapor/), tr: "Zamanını ne tüketiyor? Yapman gereken işleri mümkünse tek tek yaz; hepsini aynı anda acil kabul etmeyeceğim.", en: "What is consuming your time? List the tasks if you can; I won't assume they are all equally urgent." },
        { needs: () => !hasDeadline, tr: "Bu işlerin hangilerinin gerçek son tarihi veya belirli saati var?", en: "Which of these tasks have a real deadline or fixed time?" },
        { needs: () => !has(/dakika|saat|gün|sürüyor|uzun|kısa/), tr: "Her önemli iş yaklaşık ne kadar sürüyor ve seni en çok yavaşlatan darboğaz ne?", en: "How long does each important task take, and what is the biggest bottleneck slowing you down?" },
        { needs: () => !has(/ertele|devret|yardım|böl|başkası|eşim|ailem/), tr: "Hangilerini erteleyebilir, bölebilir veya başka birine devredebilirsin?", en: "Which tasks can be delayed, split up, or delegated?" },
        { needs: () => !hasPriority, tr: "Son olarak neyi korumamız gerekiyor: teslim tarihleri, aile ihtiyacı, gelir, ev düzeni veya dinlenme?", en: "What must we protect: deadlines, family needs, income, home order, or rest?" },
      ],
      decision: [
        { needs: () => !has(/seçenek|alternatif|arasında|a mı|b mi|birinci|ikinci|veya|option|alternative/), tr: "Önce seçenekleri netleştirelim. Gerçekte hangi seçenekler arasında karar veriyorsun?", en: "First, let's define the real options. What choices are you actually deciding between?" },
        { needs: () => !has(/fiyat|maliyet|zaman|kalite|risk|özellik|avantaj|dezavantaj|price|cost|quality|risk/), tr: "Bu seçeneklerin bildiğin farkları neler? Fiyat, süre, kalite, risk ve kullanım kolaylığını ayrı ayrı düşünelim.", en: "What differences do you know between the options? Let's separate price, time, quality, risk, and ease of use." },
        { needs: () => !hasPriority, tr: "Senin için vazgeçilmez ölçüt hangisi? Bütçe, hız, güvenlik, kalite, uzun ömür veya başka bir şey mi?", en: "What is your non-negotiable criterion: budget, speed, safety, quality, longevity, or something else?" },
        { needs: () => !has(/en kötü|zarar|kayıp|pişman|risk|worst|loss|damage|regret/), tr: "Hangi kötü sonucu özellikle yaşamak istemiyorsun? Bunu bilirsem riskleri ona göre tartabilirim.", en: "What bad outcome do you especially want to avoid? That will let me weigh the risks properly." },
      ],
      vehicle: [
        { needs: () => !has(/arıza|bozuk|çalış|ses|ışık|lastik|akü|fren|motor|kaza|güvenli/), tr: "Araçta tam olarak ne oldu ve şu anda güvenli şekilde kullanılabiliyor mu?", en: "What exactly happened to the vehicle, and is it safe to drive right now?" },
        { needs: () => !hasOptions, tr: "Gerçekte hangi yolların var: tamir, parça değişimi, servis, beklemek veya alternatif ulaşım?", en: "What options are actually available: repair, replacement, service, waiting, or alternative transport?" },
        { needs: () => !hasAmount, tr: "Her seçeneğin yaklaşık maliyetini ve ne kadar süreceğini biliyor musun?", en: "Do you know the approximate cost and time for each option?" },
        { needs: () => !has(/iş|aile|gelir|çocuk|ulaşım|güvenlik|acil/), tr: "Aracı kullanamamak veya tamiri ertelemek işini, gelirini, aileni ya da güvenliğini nasıl etkiler?", en: "How would not using the vehicle or delaying repair affect work, income, family, or safety?" },
        { needs: () => !hasPriority, tr: "Öncelik hangisi: güvenlik, hızlı ulaşım, düşük maliyet veya daha büyük hasarı önlemek?", en: "Which comes first: safety, fast transport, low cost, or preventing further damage?" },
      ],
      travel: [
        { needs: () => !has(/gidece|gidiyorum|nereye|şehir|ülke|tarih|d{1,2}[./]d{1,2}/), tr: "Nereye, hangi tarihte ve hangi amaçla gitmen gerekiyor?", en: "Where do you need to go, on what date, and for what purpose?" },
        { needs: () => !hasOptions, tr: "Gerçekte hangi ulaşım ve konaklama seçeneklerini değerlendirebiliyorsun?", en: "What transport and accommodation options are actually available to you?" },
        { needs: () => !hasAmount, tr: "Her seçeneğin toplam maliyeti hakkında ne biliyorsun? Bilet dışında bagaj, transfer ve konaklamayı da ekleyelim.", en: "What do you know about the total cost of each option? Include baggage, transfers, and accommodation." },
        { needs: () => !has(/esnek|zorunlu|değişemez|saat|varış/), tr: "Tarih veya varış saati konusunda ne kadar esneksin? Değişmeyecek bir zorunluluk var mı?", en: "How flexible are you on the date or arrival time? Is anything non-negotiable?" },
        { needs: () => !hasPriority, tr: "Önceliği neye göre kuralım: toplam maliyet, zaman, güvenilirlik veya esneklik?", en: "What should drive priority: total cost, time, reliability, or flexibility?" },
      ],
      moving: [
        { needs: () => !has(/tarih|yarın|bugün|hafta|ayın|d{1,2}[./]d{1,2}/), tr: "Taşınman gereken tarih ne ve değişme ihtimali var mı?", en: "What is the move date, and can it change?" },
        { needs: () => !hasOptions, tr: "Ev, nakliye, depozito ve eşyalar konusunda hangi gerçek seçeneklerin var?", en: "What real options do you have for the home, movers, deposit, and belongings?" },
        { needs: () => !hasAmount, tr: "Toplam taşınma maliyetinde bildiğin rakamlar neler?", en: "What costs do you already know for the move?" },
        { needs: () => !has(/bütçe|para|ev|iş|aile|zorunlu|değişmez/), tr: "Değişmeyecek kısıtların neler: tarih, bütçe, ev, iş veya aile düzeni?", en: "What constraints cannot change: date, budget, housing, work, or family arrangements?" },
        { needs: () => !hasPriority, tr: "Önce neyi güvenceye almalıyız: ev, taşınma tarihi, nakit veya aile düzeni?", en: "What should we secure first: housing, the move date, cash, or family stability?" },
      ],
      home: [
        { needs: () => !has(/su|elektrik|gaz|tesisat|ısıtma|buzdolabı|çamaşır|kombi|kırık|bozuk|tamir/), tr: "Evde tam olarak ne oldu ve şu anda hangi şeyler etkileniyor?", en: "What exactly happened at home, and what is affected right now?" },
        { needs: () => !hasOptions, tr: "Düşündüğün çözüm yolları neler: tamir, değişim, servis veya geçici çözüm?", en: "What solutions are you considering: repair, replacement, service, or a temporary fix?" },
        { needs: () => !hasAmount, tr: "Her seçeneğin yaklaşık maliyeti ve süresi hakkında ne biliyorsun?", en: "What do you know about the approximate cost and time for each option?" },
        { needs: () => !has(/su|elektrik|gaz|hasar|tehlike|risk|güvenli/), tr: "Su, elektrik, gaz, yapısal hasar veya daha büyük zarara dönüşme riski var mı?", en: "Is there a water, electrical, gas, structural, or further-damage risk?" },
        { needs: () => !hasPriority, tr: "Öncelik hangisi: güvenlik, daha büyük hasarı önlemek, maliyet veya hız?", en: "Which comes first: safety, preventing further damage, cost, or speed?" },
      ],
      family: [
        { needs: () => !has(/eş|çocuk|bebek|anne|baba|aile|bakım/), tr: "Aile içinde tam olarak hangi konuyu çözmeye çalışıyorsun ve kimler etkileniyor?", en: "What exactly are you trying to solve in the family, and who is affected?" },
        { needs: () => !hasOptions, tr: "Şu ana kadar düşündüğün veya gerçekten uygulayabileceğin seçenekler neler?", en: "What options have you considered or can actually use?" },
        { needs: () => !has(/para|zaman|düzen|ilişki|etki|maliyet/), tr: "Bu seçeneklerin para, zaman, düzen ve aile üzerindeki etkileri neler?", en: "How do these options affect money, time, routines, and the family?" },
        { needs: () => !has(/ihtiyaç|sınır|son tarih|bugün|yarın|zorunlu/), tr: "Kesinlikle değişmeyecek bir ihtiyaç, sınır veya son tarih var mı?", en: "Is there a non-negotiable need, boundary, or deadline?" },
        { needs: () => !hasPriority, tr: "Önce neyi güvenceye almalıyız: temel ihtiyaç, güvenlik, aile düzeni veya zaman?", en: "What should we protect first: essential needs, safety, family stability, or time?" },
      ],
    };

    const selected = plans[currentCategory] ?? [
      { needs: () => !has(/ne oldu|sorun|problem|mesele/), tr: "Önce problemi kendi kelimelerinle biraz açar mısın? Tam olarak ne oluyor ve seni en çok zorlayan nokta hangisi?", en: "First, can you describe the problem in your own words? What is happening and what is the hardest part?" },
      { needs: () => !hasOptions, tr: "Şu ana kadar düşündüğün, denediğin veya gerçekten uygulayabileceğin seçenekler neler?", en: "What options have you considered, tried, or can actually use?" },
      { needs: () => !has(/para|zaman|risk|maliyet|fiyat|etki|sonuç/), tr: "Sonucu değiştirecek farklar neler: para, zaman, risk, maliyet veya etki?", en: "What differences could change the outcome: money, time, risk, cost, or impact?" },
      { needs: () => !has(/bütçe|son tarih|tarih|kaynak|zorunlu|sınır/), tr: "Seni sınırlayan kesin bir şey var mı: bütçe, son tarih, başka bir kişinin kararı veya mevcut kaynaklar?", en: "Is there a hard constraint: budget, deadline, another person's decision, or available resources?" },
      { needs: () => !hasPriority, tr: "Son planın öncelikle hangi sonucu koruması gerekiyor?", en: "What outcome does the final plan need to protect first?" },
    ];

    for (const step of selected) {
      if (step.needs()) return uiLanguage === "en" ? step.en : step.tr;
    }
    return null;
  }

  function conversationBridge(category: string, context: string, answerText: string, repeatedQuestion = false) {
    const answer = answerText.trim();
    const short = answer.length > 70 ? answer.slice(0, 67) + "..." : answer;

    if (repeatedQuestion) {
      return language === "en"
        ? "I may not have understood your last answer clearly. Let me ask that again more simply:"
        : "Son cevabını tam anlayamamış olabilirim. Aynı şeyi daha basit sorayım:";
    }

    if (/^(hiç|yok|yoktu|bilmiyorum|emin değilim|none|nothing|don't know|not sure)$/i.test(answer.toLocaleLowerCase("tr-TR"))) {
      return language === "en"
        ? "Got it. I'll treat that as a constraint and move on."
        : "Tamam, bunu bir kısıt olarak kabul edip devam ediyorum.";
    }

    if (category === "money" || category === "bills") {
      return language === "en"
        ? "Got it. I'll keep that in mind."
        : "Tamam, bunu dikkate alıyorum.";
    }

    if (category === "decision") {
      return language === "en"
        ? "Got it. I'll compare the options using that detail."
        : "Tamam, bunu seçenekleri karşılaştırırken dikkate alacağım.";
    }

    return language === "en"
      ? "Got it. I'll use that detail for the next step."
      : "Anladım, bunu sonraki adımda dikkate alacağım.";
  }

  function answerNeedsClarification(question: string, answer: string) {
    const q = normalizeQuestion(question);
    const a = answer.trim().toLocaleLowerCase("tr-TR");
    if (!a) return true;

    const unknown = /^(bilmiyorum|emin değilim|yok|hiç bilmiyorum|bilmiyorum maalesef|none|nothing|don't know|not sure)$/i.test(a);
    if (unknown) return false;

    if (/ne kadar|tutar|miktar|kaç tl|kaç para|bütçe/.test(q)) {
      return !/\d/.test(a);
    }
    if (/ne zaman|hangi tarih|son tarih|hangi saat|kaç gün|kaç saat/.test(q)) {
      return !/(bugün|yarın|hafta|gün|saat|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar|ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|\d)/i.test(a);
    }
    if (/seçenek|alternatif|hangileri/.test(q)) {
      return /^(evet|hayır|evet\.?|hayır\.?)$/i.test(a) || a.length < 4;
    }
    if (/hangi iş|hangi görev|ne yapman|ne yapman gerekiyor/.test(q)) {
      return /^(evet|hayır)$/i.test(a) || a.length < 4;
    }
    return false;
  }

  function rephraseRepeatedQuestion(question: string, category: string) {
    const q = question.toLocaleLowerCase("tr-TR");
    if (category === "money" || category === "bills") {
      if (/para|miktar|tutar|bütçe/.test(q)) return language === "en"
        ? "I didn't understand this part. Let me ask differently: about how much money are we talking about?"
        : "Bu kısmı anlayamadım. Farklı sorayım: Yaklaşık olarak ne kadar paradan bahsediyoruz?";
      if (/ödem|fatura|borç/.test(q)) return language === "en"
        ? "I didn't understand this part. Which payment is the most urgent right now?"
        : "Bu kısmı anlayamadım. Farklı sorayım: Şu anda en acil ödemen hangisi?";
    }
    if (category === "decision") {
      if (/seçenek|alternatif/.test(q)) return language === "en"
        ? "I didn't understand this part. What are the two or three choices you are actually deciding between?"
        : "Bu kısmı anlayamadım. Farklı sorayım: Gerçekte hangi iki veya üç seçenek arasında karar veriyorsun?";
      if (/öncel|önemli|kriter/.test(q)) return language === "en"
        ? "I didn't understand this part. What matters most to you in the end?"
        : "Bu kısmı anlayamadım. Farklı sorayım: Sonuçta senin için en önemli olan şey ne?";
    }
    if (category === "time" || category === "work") {
      if (/zaman|süre|saat/.test(q)) return language === "en"
        ? "I didn't understand this part. Which task is taking the most of your time?"
        : "Bu kısmı anlayamadım. Farklı sorayım: Zamanının en çoğunu hangi iş alıyor?";
      if (/iş|görev|sorumluluk/.test(q)) return language === "en"
        ? "I didn't understand this part. What are the main things you need to get done?"
        : "Bu kısmı anlayamadım. Farklı sorayım: Şu anda mutlaka yapman gereken başlıca işler neler?";
    }
    if (category === "travel" || category === "moving") {
      if (/tarih|saat|zaman/.test(q)) return language === "en"
        ? "I didn't understand this part. What date or time cannot change?"
        : "Bu kısmı anlayamadım. Farklı sorayım: Değiştiremeyeceğin tarih veya saat hangisi?";
      if (/maliyet|fiyat|para|bütçe/.test(q)) return language === "en"
        ? "I didn't understand this part. What is the maximum amount you can spend?"
        : "Bu kısmı anlayamadım. Farklı sorayım: En fazla ne kadar harcayabilirsin?";
    }
    if (category === "family" || category === "home") {
      if (/sorun|problem|konu|durum/.test(q)) return language === "en"
        ? "I didn't understand this part. What is the one thing at home or with your family that needs solving first?"
        : "Bu kısmı anlayamadım. Farklı sorayım: Evde veya aile içinde önce çözülmesi gereken tek şey ne?";
    }
    return language === "en"
      ? "I didn't understand your last answer. Let me ask it differently: what is the single piece of information you know for sure about this?"
      : "Son cevabını anlayamadım. Farklı sorayım: Bu konuyla ilgili kesin olarak bildiğin tek bilgi ne?";
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
    const firstQuestion = localResult.category === "unknown"
      ? null
      : getNextQuestion(localResult.category, text, language);

    setProblem("");
    setAnswer("");
    setQuestionIndex(0);
    setShowPlan(false);
    setConversationContext(text);
    setMessages([
      { role: "user", text },
      { role: "engine", text: localResult.diagnosis },
      ...(firstQuestion ? [{ role: "engine" as const, text: firstQuestion }] : []),
    ]);
  }

  function finishConversation(context: string, localResult: Result) {
    setShowPlan(true);
    const history = saveLifeRescueHistory({
      problem: context.split("\nKullanıcı:")[0],
      category: localResult.category,
      goal: localResult.goal,
      diagnosis: localResult.diagnosis,
      objective: localResult.plan.objective,
    });
    setIzciCandidates(extractIzciCandidates(context).map((candidate) => ({ ...candidate, sourceHistoryId: history.id })));
    setTrackedCandidateIds([]);
  }

  function normalizeQuestion(value: string) {
    return value
      .toLocaleLowerCase("tr-TR")
      .replace(/[“”"'’.,!?():;]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function continueConversation() {
    const text = answer.trim();
    if (!text || !result) return;

    const nextContext = conversationContext
      ? conversationContext + "\nKullanıcı: " + text
      : text;
    const nextIndex = questionIndex + 1;
    const localResult = runAnalysis(nextContext);
    const nextQuestion = localResult.category === "unknown"
      ? null
      : getNextQuestion(localResult.category, nextContext, language);

    setConversationContext(nextContext);
    setAnswer("");

    if (localResult.category === "unknown") {
      setQuestionIndex(nextIndex);
      setResult(localResult);
      setShowPlan(false);
      setMessages((prev) => [
        ...prev,
        { role: "user", text },
        { role: "engine", text: localResult.diagnosis },
      ]);
      return;
    }

    if (nextQuestion) {
      setQuestionIndex(nextIndex);

      const previousEngineMessages = messages
        .filter((message) => message.role === "engine")
        .map((message) => message.text);
      const previousQuestion = previousEngineMessages.length
        ? previousEngineMessages[previousEngineMessages.length - 1].split("\n\n").pop() ?? ""
        : "";
      const repeatedQuestion = normalizeQuestion(previousQuestion) === normalizeQuestion(nextQuestion);
      const unclearAnswer = answerNeedsClarification(previousQuestion, text);
      const needsRephrase = repeatedQuestion || unclearAnswer;

      const bridge = conversationBridge(result.category, nextContext, text, needsRephrase);
      const questionToAsk = needsRephrase
        ? rephraseRepeatedQuestion(previousQuestion || nextQuestion, localResult.category)
        : nextQuestion;

      setMessages((prev) => [
        ...prev,
        { role: "user", text },
        { role: "engine", text: bridge + "\n\n" + questionToAsk },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "engine",
        text: language === "en" ? "I have enough information. Here is the practical plan." : "Yeterli bilgi var. Şimdi uygulanabilir planı çıkarıyorum.",
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
    setIzciCandidates([]);
    setTrackedCandidateIds([]);
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
  const isReadyForPlan = showPlan && result;

  return (
    <main className="h-[100dvh] w-full overflow-y-auto overscroll-contain bg-background text-foreground">
      <div
        className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] md:px-6"
        style={{ paddingTop: "calc(5rem + env(safe-area-inset-top, 0px))" }}
      >
        <header
          className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 px-4 pb-3 shadow-sm backdrop-blur md:px-6"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
        >
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
        </header>

        {!conversationStarted ? (
          <section className="flex flex-1 flex-col pb-10 pt-8 md:pt-12">
            <div className="mb-8 max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AGT LIFE · LIFE RESCUE
              </div>
              <h1 className="text-[2.7rem] font-bold leading-[1.05] tracking-[-0.04em] md:text-6xl">{copy.whatHappened}</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                {copy.intro}
              </p>
            </div>
            <div className="overflow-hidden rounded-[1.75rem] border border-primary/10 bg-card shadow-[0_18px_60px_-35px_hsl(var(--primary)/0.35)]">
              <div className="px-1 pt-1">
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
              </div>
              <div className="flex items-center justify-between gap-3 border-t bg-background/30 px-2 py-2">
                <span className="hidden px-3 py-2 text-xs text-muted-foreground sm:block">Sorununu kendi cümlelerinle anlatman yeterli.</span>
                <button
                  type="button"
                  onClick={() => start()}
                  disabled={problem.trim().length < 3}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                  {copy.send}
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

            <div className="mt-7 rounded-3xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h2 className="text-base font-semibold">{copy.capabilitiesTitle}</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {copy.capabilitiesDesc}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {capabilityOptions.map(([icon, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => start(label + " konusunda yardıma ihtiyacım var.")}
                    className="flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm transition hover:border-primary/40 hover:bg-muted/40"
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {copy.scopeHint}
              </p>
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
              {copy.offline}
            </div>
          </section>
        ) : (
          <section className="min-h-0 flex-1 py-6 md:py-8">
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

                  {showPlan && izciCandidates.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">🔎</div>
                        <div>
                          <p className="text-sm font-semibold">{copy.izciFound}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy.izciDesc}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {izciCandidates.map((candidate) => {
                          const candidateId = candidate.kind + ":" + candidate.title;
                          const tracked = trackedCandidateIds.includes(candidateId);
                          return (
                            <div key={candidateId} className="flex items-center gap-3 rounded-xl border bg-background/80 p-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{candidate.title}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{candidate.kind === "goal" ? copy.goalItem : candidate.dueAt ? copy.datedTask : copy.trackTask} · {candidate.reason}</p>
                              </div>
                              <button type="button" disabled={tracked} onClick={() => {
                                if (candidate.kind === "goal") {
                                  addGoal({ title: candidate.title, ...(candidate.targetAmount !== undefined ? { targetAmount: candidate.targetAmount } : {}), ...(candidate.targetDate ? { targetDate: candidate.targetDate } : {}), ...(('sourceHistoryId' in candidate && candidate.sourceHistoryId) ? { sourceHistoryId: candidate.sourceHistoryId } : {}) });
                                } else {
                                  addTask({ title: candidate.title, ...(candidate.dueAt ? { dueAt: candidate.dueAt } : {}), ...(('sourceHistoryId' in candidate && candidate.sourceHistoryId) ? { sourceHistoryId: candidate.sourceHistoryId } : {}) });
                                }
                                setTrackedCandidateIds((ids) => [...ids, candidateId]);
                              }} className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">
                                {tracked ? copy.inIzci : copy.track}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {conversationStarted && (
          <div
            className="fixed inset-x-0 z-50 border-t bg-background/95 px-4 pb-3 pt-3 backdrop-blur md:px-6"
            style={{ bottom: keyboardOffset, paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
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
                onFocus={(event) => {
                  window.setTimeout(() => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }), 120);
                }}
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
