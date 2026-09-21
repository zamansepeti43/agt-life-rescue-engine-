import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Sparkles, WifiOff, RotateCcw, MessageCircle } from "lucide-react";
import { analyzeOffline, type OfflineResult } from "@/lib/life-rescue-offline";
import { addTask } from "@/lib/assistant-store";

type Result = {
  problem: string;
  category: string;
  goal: string;
  diagnosis: string;
  priority: "critical" | "high" | "normal";
  phase: "understand" | "stabilize" | "prioritize" | "act";
  decisionBasis: string[];
  plan: {
    objective: string;
    steps: { label: "Şimdi" | "Bugün" | "Sonraki adım" | "Hedef"; title: string; detail: string; estimatedMinutes?: number }[];
  };
  actions: { title: string; reason: string; priority: number }[];
  nextQuestion: string;
  constraints: string[];
};

type Message = { role: "user" | "engine"; text: string };

const categories = [["", "Otomatik belirle"],["money", "Para"],["home", "Ev"],["family", "Aile"],["work", "İş"],["vehicle", "Araç"],["time", "Zaman"],["bills", "Faturalar"],["travel", "Seyahat"],["moving", "Taşınma"],["decision", "Karar"]];
const goals = [["", "Otomatik belirle"],["find_money", "Para bul"],["reduce_cost", "Masrafı azalt"],["save_time", "Zaman kazan"],["prioritize", "Önceliklendir"],["make_decision", "Karar ver"],["cancel", "İptal et"],["organize", "Düzenle"],["solve", "Çöz"]];

export default function LifeRescue() {
  const [problem,setProblem]=useState("");
  const [category,setCategory]=useState("");
  const [goal,setGoal]=useState("");
  const [urgency,setUrgency]=useState(5);
  const [budget,setBudget]=useState("");
  const [availableHours,setAvailableHours]=useState("");
  const [answer,setAnswer]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState<Result|null>(null);
  const [offline,setOffline]=useState(false);
  const [messages,setMessages]=useState<Message[]>([]);
  const [conversationContext,setConversationContext]=useState("");

  async function analyze(context?: string) {
    const base=problem.trim();
    if(base.length<3 || loading) return;
    const combined=context?.trim() ? base+"\n\nKonuşmada verilen bilgiler:\n"+context.trim() : base;
    setLoading(true);
    const localResult = analyzeOffline(combined) as OfflineResult as Result;

    // Android APK is deliberately offline-first. There is no API server inside
    // the APK, so never wait on a relative /api request that can hang in WebView.
    const isAndroidApp =
      typeof window !== "undefined" && "AndroidLocalNotifications" in window;

    if (isAndroidApp) {
      setResult(localResult);
      setOffline(true);
      setMessages(prev => [...prev, { role: "engine", text: localResult.diagnosis }]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch("/api/life-rescue/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          problem:combined,
          category:category||undefined,
          goal:goal||undefined,
          urgency,
          budget:budget===""?undefined:Number(budget),
          availableHours:availableHours===""?undefined:Number(availableHours)
        }),
        signal: controller.signal
      });
      const data = await response.json();
      if(!response.ok||!data.success) throw new Error(data.error||"Analiz başarısız.");
      setResult(data.result);
      setOffline(false);
      setMessages(prev => [...prev, { role: "engine", text: data.result.diagnosis }]);
    } catch {
      setResult(localResult);
      setMessages(prev => [...prev, { role: "engine", text: localResult.diagnosis }]);
      setOffline(true);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  function start() {
    const text=problem.trim();
    if(!text) return;
    setMessages([{role:"user",text}]);
    setConversationContext(text);
    void analyze(text);
  }

  function continueConversation() {
    if(!answer.trim() || !result) return;
    const text=answer.trim();
    const nextContext=conversationContext ? conversationContext+"\nKullanıcı: "+text : text;
    setMessages(prev=>[...prev,{role:"user",text}]);
    setConversationContext(nextContext);
    setAnswer("");
    void analyze(nextContext);
  }

  function reset() {
    setProblem(""); setAnswer(""); setResult(null); setMessages([]); setConversationContext(""); setCategory(""); setGoal(""); setUrgency(5); setBudget(""); setAvailableHours(""); setOffline(false);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5"/><span className="text-sm font-semibold tracking-wide">AGT LIFE RESCUE ENGINE</span></div>
          <h1 className="text-3xl font-bold md:text-5xl">Hayat karıştı mı?</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Anlat derdini. Sana hazır bir liste fırlatmak yerine önce seni ve içinde bulunduğun durumu anlamaya çalışalım; sonra en mantıklı adımları birlikte daraltalım.</p>
        </header>

        <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <label className="mb-2 block text-sm font-medium">Şu an neyi çözmeye çalışıyorsun?</label>
          <textarea value={problem} onChange={e=>setProblem(e.target.value)} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")start();}} placeholder="Örn: Bu ay faturalar ve diğer zorunlu ödemeler için param yetmiyor. Nereden başlamalıyım?" className="min-h-36 w-full resize-y rounded-xl border bg-background p-4 outline-none ring-primary/30 focus:ring-2"/>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select value={category} onChange={e=>setCategory(e.target.value)} className="rounded-xl border bg-background px-3 py-3">{categories.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
            <select value={goal} onChange={e=>setGoal(e.target.value)} className="rounded-xl border bg-background px-3 py-3">{goals.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
            <label className="rounded-xl border px-3 py-2"><span className="block text-xs text-muted-foreground">Aciliyet: {urgency}/10</span><input className="w-full" type="range" min="1" max="10" value={urgency} onChange={e=>setUrgency(Number(e.target.value))}/></label>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="rounded-xl border px-3 py-2"><span className="block text-xs text-muted-foreground">Bütçe (TL, isteğe bağlı)</span><input value={budget} onChange={e=>setBudget(e.target.value)} type="number" min="0" placeholder="Örn: 1500" className="mt-1 w-full bg-transparent outline-none"/></label>
            <label className="rounded-xl border px-3 py-2"><span className="block text-xs text-muted-foreground">Bugün ayırabileceğin zaman (saat)</span><input value={availableHours} onChange={e=>setAvailableHours(e.target.value)} type="number" min="0" step="0.5" placeholder="Örn: 2" className="mt-1 w-full bg-transparent outline-none"/></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={start} disabled={loading||problem.trim().length<3} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<ArrowRight className="h-4 w-4"/>}{loading?"Düşünüyorum...":"Anlat, başlayalım"}</button>
            {result&&<button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium"><RotateCcw className="h-4 w-4"/>Yeni problem</button>}
          </div>
        </section>

        {messages.length>0&&<section className="mt-6 rounded-2xl border bg-card p-5 md:p-7">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><MessageCircle className="h-4 w-4 text-primary"/>Konuşma</div>
          <div className="space-y-3">{messages.map((m,i)=><div key={i} className={m.role==="user"?"ml-6 rounded-2xl bg-primary/10 p-4":"mr-6 rounded-2xl bg-muted p-4"}><div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{m.role==="user"?"Sen":"Life Rescue"}</div><p className="text-sm leading-6">{m.text}</p></div>)}</div>
        </section>}

        {result&&<section className="mt-6 space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            {offline&&<div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground"><WifiOff className="h-4 w-4 text-primary"/>Çevrimdışı mod: temel karar motoru cihaz üzerinde çalıştı.</div>}
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border px-3 py-1 text-xs font-medium">{result.category}</span><span className="rounded-full border px-3 py-1 text-xs font-medium">{result.goal}</span><span className="rounded-full border px-3 py-1 text-xs font-medium">Aşama: {result.phase}</span><span className="rounded-full border px-3 py-1 text-xs font-medium">{result.priority}</span></div>
            <h2 className="mt-4 text-xl font-bold">Durumu şöyle okuyorum</h2>
            <p className="mt-2 leading-7 text-muted-foreground">{result.diagnosis}</p>
            {result.decisionBasis?.length>0&&<div className="mt-4"><p className="text-xs font-semibold text-muted-foreground">Bu değerlendirmeyi etkileyenler</p><div className="mt-2 flex flex-wrap gap-2">{result.decisionBasis.map(c=><span key={c} className="rounded-full bg-muted px-3 py-1 text-xs">{c}</span>)}</div></div>}{result.constraints?.length>0&&<div className="mt-3 flex flex-wrap gap-2">{result.constraints.map(c=><span key={c} className="rounded-full bg-muted px-3 py-1 text-xs">{c}</span>)}</div>}
          </div>
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="flex items-center gap-2 text-primary"><CheckCircle2 className="h-5 w-5"/><span className="text-sm font-bold">KURTARMA PLANI</span><button type="button" onClick={() => { result.plan.steps.filter((step) => step.label !== "Hedef").forEach((step, index) => addTask({ title: `${step.label}: ${step.title}`, ...(step.label === "Şimdi" ? { dueAt: new Date(Date.now() + Math.max(15, step.estimatedMinutes ?? 20) * 60000).toISOString() } : index === 1 ? { dueAt: new Date(Date.now() + 24 * 60 * 60000).toISOString() } : {}) })); }} className="ml-auto rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">İZCİ'ye aktar</button></div>
            <h3 className="mt-2 text-lg font-bold">{result.plan.objective}</h3>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {result.plan.steps.map((step)=><article key={step.label} className="rounded-xl border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-primary">{step.label}</span>
                  {step.estimatedMinutes !== undefined && <span className="text-xs text-muted-foreground">~{step.estimatedMinutes} dk</span>}
                </div>
                <h4 className="mt-2 font-semibold">{step.title}</h4>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </article>)}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">{result.actions.map(a=><article key={a.priority} className="rounded-2xl border bg-card p-5"><div className="mb-3 flex items-center gap-2 text-primary"><CheckCircle2 className="h-5 w-5"/><span className="text-xs font-bold">ADIM {a.priority}</span></div><h3 className="font-semibold">{a.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{a.reason}</p></article>)}</div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary"/><div className="flex-1"><h3 className="font-semibold">Şimdi senden şunu bilmem lazım</h3><p className="mt-1 leading-6 text-muted-foreground">{result.nextQuestion}</p>
              <div className="mt-4 flex gap-2"><input value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey)continueConversation();}} placeholder="Cevabını doğal şekilde yaz..." className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"/><button type="button" onClick={continueConversation} disabled={!answer.trim()||loading} className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:"Devam"}</button></div>
            </div></div>
          </div>
        </section>}
      </div>
    </main>
  );
}
