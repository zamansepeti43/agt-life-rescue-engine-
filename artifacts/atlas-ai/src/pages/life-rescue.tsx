import { useEffect, useMemo, useState } from "react";
import { ArrowUp, CheckCircle2, Menu, RotateCcw, Settings2, Sparkles, WifiOff } from "lucide-react";
import { analyzeOffline, type OfflineResult } from "@/lib/life-rescue-offline";
import { saveLifeRescueHistory } from "@/lib/life-rescue-history";
import { useSidebar } from "@/components/ui/sidebar";

type Result = OfflineResult;

type Message = {
  role: "user" | "engine";
  text: string;
};

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
  const { toggleSidebar } = useSidebar();

  const suggestions = useMemo(
    () => ["Param yetmiyor", "Faturaları yetiştiremiyorum", "Bir karar veremiyorum", "Zamanım yetmiyor"],
    [],
  );

  useEffect(() => {
    const resetFromMenu = () => reset();
    window.addEventListener("life-rescue-new-problem", resetFromMenu);
    return () => window.removeEventListener("life-rescue-new-problem", resetFromMenu);
  }, []);

  function extractMoney(text: string) {
    const matches = text.toLocaleLowerCase("tr-TR").matchAll(/(\\d{1,3}(?:[. ]\\d{3})*(?:,\\d{1,2})?|\\d+(?:,\\d{1,2})?)\\s*(?:tl|₺|lira)/gi);
    return Array.from(matches, (m) => Number(m[1].replace(/\\s/g, "").replace(/\\./g, "").replace(",", "."))).filter(Number.isFinite);
  }

  function getQuestionSet(currentCategory: string, text: string) {
    const normalized = text.toLocaleLowerCase("tr-TR");

    // Önce durumu ve seçenekleri öğren; kısıtları çıkar; en son önceliklendir.
    if (currentCategory === "money" || currentCategory === "bills" || /para|maaş|borç|ödeme|fatura/.test(normalized)) {
      const questions: string[] = [];
      const hasPurpose = /kira|fatura|borç|maaş|market|alışveriş|çocuk|çocuğ|ev|araba|araç|taksit|kredi|vergi|sigorta|ilaç|sağlık|okul|eğitim|seyahat|bilet|taşın|nakliye/.test(normalized);
      const hasAvailableMoney = /elimde|elinde|cebimde|hesabımda|param var|para var|\\d+\\s*(?:tl|₺|lira)/.test(normalized);
      if (!hasPurpose) questions.push("Önce şunu anlayalım: Bu para tam olarak neye lazım? Kira, fatura, borç, market, çocuk masrafı veya başka bir şey mi?");
      if (!hasAvailableMoney) questions.push("Şu an elinde veya hesabında gerçekten kullanabileceğin yaklaşık ne kadar para var?");
      questions.push("Önümüzdeki birkaç gün içinde ödenmesi gereken neler var? Mümkünse tek tek yaz: örneğin kira 10.000 TL, elektrik 1.000 TL gibi.");
      questions.push("Bu ödemelerin hangileri gerçekten ertelenemez? Son tarihlerini de mümkün olduğunca yaz.");
      questions.push("Tamam, şimdi seçenekleri değerlendirebiliriz: erteleme, taksitlendirme, masraf azaltma, mevcut parayı yeniden dağıtma veya ek para bulma gibi hangi seçenekleri uygulama şansın var?");
      questions.push("Bu seçenekler arasında senin için en önemli ölçüt ne: gecikme riskini azaltmak, toplam maliyeti düşürmek, bugün nakit bulmak veya başka bir şey?");
      return questions;
    }

    if (currentCategory === "decision" || /karar|seç|hangisi/.test(normalized)) {
      return [
        "Önce seçenekleri masaya koyalım. Şu anda gerçekten değerlendirdiğin seçenekler neler?",
        "Bu seçeneklerin her biri için bildiğin önemli farklar neler: fiyat, zaman, risk, kolaylık veya başka bir şey?",
        "Senin için kesinlikle vazgeçilmez olan şey ne? Örneğin bütçeyi aşmamak, hızlı çözmek veya riski düşük tutmak.",
        "Her seçeneğin en kötü durumda doğurabileceği sonuç ne olur?",
        "Şimdi bu bilgilerle seçenekleri senin önceliklerine göre sıralayabiliriz. En çok hangi sonucu korumak istiyorsun?",
      ];
    }

    if (currentCategory === "time" || /zaman|yetiş|süre|yoğun|vakit/.test(normalized)) {
      return [
        "Önce yetiştirmeye çalıştığın işleri çıkaralım. Şu anda önünde hangi işler veya sorumluluklar var?",
        "Bunların hangileri gerçekten bugün veya belirli bir tarihe kadar yapılmak zorunda?",
        "Her iş yaklaşık ne kadar zaman alıyor ve hangilerini erteleyebilir, bölebilir veya başka birine devredebilirsin?",
        "Seni en çok zorlayan kısıt ne: toplam zaman, enerji, başka insanların beklemesi veya başka bir şey?",
        "Şimdi işleri son tarih, sonuç ve harcanacak zamana göre önceliklendirebiliriz. Önceliğin neyi korumak?",
      ];
    }

    if (currentCategory === "work" || /iş|mesai|vardiya|patron|proje|görev/.test(normalized)) {
      return [
        "Önce mevcut yükü çıkaralım. Şu anda senden beklenen işler veya görevler neler?",
        "Bunlardan hangilerinin kesin son tarihi var ve hangilerinin sonucu daha kritik?",
        "Hangilerini erteleyebilir, bölebilir veya devredebilirsin?",
        "İş yükünü etkileyen kısıtların neler: vardiya, süre, ekip, para veya başka bir şey?",
        "Şimdi görevleri etkisi, aciliyeti ve maliyeti üzerinden önceliklendirelim. Senin için korunması gereken en önemli sonuç hangisi?",
      ];
    }

    if (currentCategory === "vehicle" || /araç|araba|motor|lastik|akü|servis/.test(normalized)) {
      return [
        "Önce sorunun tamamını anlayalım. Araçta tam olarak ne oluyor ve şu anda araç kullanılabiliyor mu?",
        "Şu ana kadar bildiğin çözüm seçenekleri neler: tamir, parça değişimi, servis, beklemek veya geçici başka bir ulaşım çözümü?",
        "Her seçeneğin yaklaşık maliyeti ve ne kadar süreceği hakkında ne biliyorsun?",
        "Aracı kullanmaya devam etmek güvenlik veya daha büyük hasar açısından bir risk oluşturuyor mu?",
        "Şimdi seçenekleri güvenlik, maliyet, süre ve zorunluluk açısından önceliklendirebiliriz. Hangisini korumamız gerekiyor?",
      ];
    }

    if (currentCategory === "travel" || /seyahat|uçuş|uçak|bilet|yolculuk|otel/.test(normalized)) {
      return [
        "Önce yolculuğun seçeneklerini çıkaralım. Nereye, hangi tarihte ve hangi amaçla gitmen gerekiyor?",
        "Hangi ulaşım veya konaklama seçeneklerini değerlendiriyorsun?",
        "Her seçeneğin yaklaşık toplam maliyeti ve zaman farkı ne kadar?",
        "Tarih veya saat konusunda ne kadar esneksin? Değiştirilemeyecek bir zorunluluk var mı?",
        "Şimdi seçenekleri toplam maliyet, süre, risk ve esneklik açısından önceliklendirebiliriz. Senin için hangisi daha önemli?",
      ];
    }

    if (currentCategory === "moving" || /taşın|ev değiş|nakliye|depozito/.test(normalized)) {
      return [
        "Önce taşınma tablosunu çıkaralım. Taşınman gereken tarih ve şu an değerlendirdiğin seçenekler neler?",
        "Ev, nakliye, depozito, eşya ve ulaşım tarafında hangi seçeneklerin var?",
        "Her seçeneğin yaklaşık maliyeti ve ne kadar zaman istediği hakkında ne biliyorsun?",
        "Kesin olarak değişmeyecek kısıtların neler: tarih, bütçe, ev, iş veya aile durumu?",
        "Şimdi seçenekleri zorunluluk, maliyet, süre ve risk açısından önceliklendirebiliriz. Öncelikle neyi güvenceye almalıyız?",
      ];
    }

    if (currentCategory === "home" || /ev|tamir|bozuk|eşya|temizlik|tesisat/.test(normalized)) {
      return [
        "Önce sorunun kapsamını çıkaralım. Evde tam olarak ne oldu ve hangi şeyler etkileniyor?",
        "Şu anda düşündüğün çözüm seçenekleri neler: tamir, değiştirme, geçici çözüm, servis çağırma veya başka bir şey?",
        "Bu seçeneklerin yaklaşık maliyeti, süresi ve varsa ek riskleri hakkında ne biliyorsun?",
        "Su, elektrik, gaz, yapısal hasar veya daha büyük bir zarara dönüşme riski var mı?",
        "Şimdi seçenekleri güvenlik, aciliyet, maliyet ve kalıcılık açısından önceliklendirebiliriz. Önce hangi sonucu korumalıyız?",
      ];
    }

    if (currentCategory === "family" || /aile|eş|çocuk|çocuğ|bebek/.test(normalized)) {
      return [
        "Önce durumu anlayalım. Şu anda aile içinde çözmeye çalıştığın konu tam olarak ne?",
        "Şu ana kadar düşündüğün veya uygulayabileceğin seçenekler neler?",
        "Her seçeneğin aile üzerindeki zaman, para, düzen veya ilişki açısından etkisi ne olur?",
        "Kesinlikle korunması gereken bir ihtiyaç, sınır veya son tarih var mı?",
        "Şimdi seçenekleri etkilerine ve aciliyetlerine göre önceliklendirebiliriz. Önce neyi güvenceye almalıyız?",
      ];
    }

    return [
      "Önce durumu tam olarak anlayalım. Şu anda çözmeye çalıştığın problem nedir ve seni en çok zorlayan kısmı hangisi?",
      "Şu ana kadar düşündüğün, denediğin veya kullanabileceğin seçenekler neler?",
      "Bu seçeneklerin her biri için bildiğin önemli farklar neler: para, zaman, risk, kolaylık veya başka bir şey?",
      "Seni sınırlayan kesin bir şey var mı: bütçe, son tarih, başka bir kişinin kararı, mevcut kaynaklar veya başka bir kısıt?",
      "Şimdi seçenekleri sonuç, aciliyet, maliyet ve risk açısından karşılaştırabiliriz. Senin için en önemli kriter hangisi?",
    ];
  }

  function conversationBridge(category: string, context: string, answerText: string) {
    const amounts = extractMoney(context);
    if (category === "money" || category === "bills") {
      if (amounts.length >= 2) {
        const available = amounts[0];
        const required = amounts[1];
        const gap = required - available;
        if (gap > 0) {
          return `Anladım. Şu an yaklaşık ${available.toLocaleString("tr-TR")} TL var, önümüzdeki ödemeler yaklaşık ${required.toLocaleString("tr-TR")} TL. Yani ilk bakışta ${gap.toLocaleString("tr-TR")} TL'lik bir açık görünüyor. Şimdi bu açığın nereden oluştuğunu ve hangi ödemenin gerçekten önce gelmesi gerektiğini ayıralım.`;
        }
        if (gap <= 0) {
          return `Anladım. Şu an verdiğin rakamlara göre ${available.toLocaleString("tr-TR")} TL kullanılabilir paran, yaklaşık ${required.toLocaleString("tr-TR")} TL'lik zorunlu ödemeye karşılık geliyor. Burada asıl mesele toplam tutardan çok ödeme tarihleri ve hangisinin gecikmesinin daha ağır sonuç doğuracağı. Onu netleştirelim.`;
        }
      }
      if (amounts.length === 1) {
        return `Tamam, ${amounts[0].toLocaleString("tr-TR")} TL'lik tutarı not ettim. Şimdi bunu diğer zorunlu ödemelerle karşılaştırıp gerçek açığı bulalım.`;
      }
    }
    return answerText.length > 20
      ? "Anladım. Verdiğin bu ayrıntı önemli; bunu sonraki adımda hesaba katacağım."
      : "Tamam, bunu not ettim. Şimdi sonucu değiştirecek bir noktayı daha netleştirelim.";
  }

  function getOptions() {
    return {
      category: category || undefined,
      goal: goal || undefined,
      urgency,
      budget: budget === "" ? undefined : Number(budget),
      availableHours: availableHours === "" ? undefined : Number(availableHours),
    };
  }

  function runAnalysis(context: string) {
    const localResult = analyzeOffline(context, getOptions());
    setResult(localResult);
    return localResult;
  }

  function start(textOverride?: string) {
    const text = (textOverride ?? problem).trim();
    if (text.length < 3) return;

    const localResult = runAnalysis(text);
    const questions = getQuestionSet(localResult.category, text);

    setProblem("");
    setAnswer("");
    setQuestionIndex(0);
    setShowPlan(false);
    setConversationContext(text);
    setMessages([
      { role: "user", text },
      { role: "engine", text: localResult.diagnosis },
      { role: "engine", text: questions[0] },
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
    const questions = getQuestionSet(result.category, conversationContext);
    const localResult = runAnalysis(nextContext);

    setConversationContext(nextContext);
    setAnswer("");

    if (nextIndex < questions.length) {
      setQuestionIndex(nextIndex);
      const nextQuestion = questions[nextIndex];
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
        text: "Tamam dostum, artık tabloyu yeterince net görüyorum. Şimdi verdiğin bilgileri bir araya getirip sana uygulanabilir, öncelik sırasına konmuş bir çıkış yolu çıkarıyorum.",
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
    if (result) continueConversation();
    else start();
  }

  const conversationStarted = messages.length > 0;
  const questions = result ? getQuestionSet(result.category, conversationContext) : [];
  const isReadyForPlan = showPlan && result;

  return (
    <main className="h-[100dvh] w-full overflow-y-auto overscroll-contain bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-4 pb-28 md:px-6">
        <header className={conversationStarted ? "sticky top-0 z-30 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6" : "pt-8 md:pt-12"}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Menüyü aç"
              className="flex h-10 w-10 items-center justify-center rounded-full border bg-card md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 shrink-0" />
              <span className="truncate text-sm font-bold tracking-wide">AGT LIFE RESCUE</span>
            </div>
            {conversationStarted && (
              <button
                type="button"
                onClick={reset}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Yeni problem
              </button>
            )}
          </div>
          {!conversationStarted && (
            <>
              <h1 className="mt-8 text-4xl font-bold tracking-tight md:text-5xl">Ne oldu?</h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                Anlat derdini. Önce seni anlayacağım, sonra birlikte en mantıklı çıkış yolunu bulacağız.
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
                placeholder="Şu an neyi çözmeye çalışıyorsun?"
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
                    <span className="mb-1.5 block text-muted-foreground">Konu</span>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border bg-background px-3 py-3">
                      {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1.5 block text-muted-foreground">Hedef</span>
                    <select value={goal} onChange={(e) => setGoal(e.target.value)}
                      className="w-full rounded-xl border bg-background px-3 py-3">
                      {goals.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="rounded-xl border px-3 py-2 sm:col-span-2">
                    <span className="block text-xs text-muted-foreground">Aciliyet: {urgency}/10</span>
                    <input className="mt-1 w-full" type="range" min="1" max="10" value={urgency}
                      onChange={(e) => setUrgency(Number(e.target.value))} />
                  </label>
                  <label className="rounded-xl border px-3 py-2">
                    <span className="block text-xs text-muted-foreground">Bütçe (TL)</span>
                    <input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min="0"
                      placeholder="İsteğe bağlı" className="mt-1 w-full bg-transparent outline-none" />
                  </label>
                  <label className="rounded-xl border px-3 py-2">
                    <span className="block text-xs text-muted-foreground">Bugün ayırabileceğin zaman</span>
                    <input value={availableHours} onChange={(e) => setAvailableHours(e.target.value)} type="number"
                      min="0" step="0.5" placeholder="Saat" className="mt-1 w-full bg-transparent outline-none" />
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
                      {message.role === "user" ? "Sen" : "Life Rescue"}
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
                    <span className="text-sm font-semibold">Tamam, tablo netleşti.</span>
                  </div>
                  <p className="mt-3 text-base leading-7">{result.diagnosis}</p>

                  <button
                    type="button"
                    onClick={() => setShowPlan((v) => !v)}
                    className="mt-5 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left"
                  >
                    <span className="text-sm font-semibold">Kurtarma planı</span>
                    <span className="text-xs text-muted-foreground">{showPlan ? "Gizle" : "Göster"}</span>
                  </button>

                  {showPlan && (
                    <div className="mt-3 space-y-2">
                      {result.plan.steps.filter((step) => step.label !== "Hedef").map((step, index) => (
                        <div key={step.label} className="flex gap-3 rounded-2xl bg-muted/60 p-3.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-primary">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-primary">{step.label}</span>
                              {step.estimatedMinutes !== undefined && (
                                <span className="text-xs text-muted-foreground">~{step.estimatedMinutes} dk</span>
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
          <div className="sticky bottom-0 z-30 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border bg-card p-2 shadow-lg">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    continueConversation();
                  }
                }}
                placeholder="Cevabını yaz..."
                rows={1}
                className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-muted-foreground"
              />
              <button type="button" onClick={sendFromComposer} disabled={!answer.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                aria-label="Gönder">
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              Önce seni anlayacağım, sonra çözüm çıkaracağım.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
