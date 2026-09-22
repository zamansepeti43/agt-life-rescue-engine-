import { useEffect, useMemo, useState } from "react";
import { ArrowUp, CheckCircle2, Menu, RotateCcw, Settings2, Sparkles, WifiOff } from "lucide-react";
import { analyzeOffline, type OfflineResult } from "@/lib/life-rescue-offline";
import { addTask } from "@/lib/assistant-store";
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

  function getQuestionSet(currentCategory: string, text: string) {
    const normalized = text.toLocaleLowerCase("tr-TR");
    const categoryName = categoryLabels[currentCategory] ?? currentCategory;

    if (currentCategory === "money" || /para|maaş|borç|ödeme|fatura/.test(normalized)) {
      return [
        "Şu an elinde kullanılabilir yaklaşık ne kadar para var?",
        "Önümüzdeki birkaç gün içinde kesinlikle ödenmesi gereken toplam tutar yaklaşık ne kadar?",
        "Bu ödemelerin son tarihi ne ve gecikirse en ciddi sonucu hangisi doğurur?",
      ];
    }

    if (currentCategory === "time" || /zaman|yetiş|süre|yoğun/.test(normalized)) {
      return [
        "Bunu en geç ne zamana kadar çözmüş olman gerekiyor?",
        "Bugün gerçekten ayırabileceğin kaç saat var?",
        "Şu anda seni en çok yavaşlatan veya engelleyen şey ne?",
      ];
    }

    if (currentCategory === "decision" || /karar|seç|hangisini/.test(normalized)) {
      return [
        "Şu anda hangi seçenekler arasında kalmış durumdasın?",
        "Senin için en önemli ölçüt ne: para, zaman, risk, rahatlık veya başka bir şey?",
        "Yanlış seçeneği seçersen ortaya çıkabilecek en ciddi sonuç ne olur?",
      ];
    }

    if (currentCategory === "vehicle" || /araç|araba|motor/.test(normalized)) {
      return [
        "Araçla ilgili tam olarak neyi çözmeye çalışıyoruz?",
        "Bunun için ayırabileceğin yaklaşık bütçe nedir?",
        "Bunu ne zamana kadar çözmen gerekiyor?",
      ];
    }

    if (currentCategory === "travel" || /seyahat|uçak|bilet|yolculuk/.test(normalized)) {
      return [
        "Nereye gitmen gerekiyor ve hedef tarih nedir?",
        "Bu yolculuk için yaklaşık bütçen ne kadar?",
        "Tarih konusunda esnek misin, yoksa değişmeyecek bir son tarih var mı?",
      ];
    }

    if (currentCategory === "moving" || /taşın|ev değiş/.test(normalized)) {
      return [
        "Taşınman gereken kesin tarih var mı?",
        "Taşınma için yaklaşık ne kadar bütçe ayırabiliyorsun?",
        "Şu anda seni en çok zorlayan kısım hangisi: ev, nakliye, para veya zaman?",
      ];
    }

    return [
      `${categoryName || "Bu problem"} içinde sonucu en çok değiştirecek bilgi sence ne?`,
      "Bunu çözmek için şu anda elindeki en önemli imkân veya kısıt ne?",
      "Bunun için bir son tarih, bütçe veya başka bir zorunluluk var mı?",
    ];
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
      setMessages((prev) => [
        ...prev,
        { role: "user", text },
        { role: "engine", text: questions[nextIndex] },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "engine",
        text: "Tamam. Şimdi elimizdeki bilgileri bir araya getirip sana uygulanabilir bir çıkış yolu çıkarıyorum.",
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
          <section className="flex-1 py-5 md:py-8">
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

              {!isReadyForPlan && result && (
                <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {questionIndex + 1} / {questions.length} bilgi topluyoruz
                </div>
              )}

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
