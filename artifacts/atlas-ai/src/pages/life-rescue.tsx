import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

type Result = {
  problem: string;
  category: string;
  goal: string;
  diagnosis: string;
  priority: "critical" | "high" | "normal";
  actions: { title: string; reason: string; priority: number }[];
  nextQuestion: string;
  constraints: string[];
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

export default function LifeRescue() {
  const [problem, setProblem] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("");
  const [urgency, setUrgency] = useState(5);
  const [budget, setBudget] = useState("");
  const [availableHours, setAvailableHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function analyze() {
    if (problem.trim().length < 3 || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/life-rescue/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problem.trim(),
          category: category || undefined,
          goal: goal || undefined,
          urgency,
          budget: budget === "" ? undefined : Number(budget),
          availableHours: availableHours === "" ? undefined : Number(availableHours),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Analiz başarısız.");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide">AGT LIFE RESCUE ENGINE</span>
          </div>
          <h1 className="text-3xl font-bold md:text-5xl">Hayat karıştı mı?</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Sorunu yaz. Sistem problemi parçalasın, önceliği belirlesin ve uygulanabilir ilk adımları çıkarsın.
          </p>
        </header>

        <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <label className="mb-2 block text-sm font-medium">Şu an neyi çözmeye çalışıyorsun?</label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") void analyze(); }}
            placeholder="Örn: Bu ay faturalar ve diğer zorunlu ödemeler için param yetmiyor. Nereden başlamalıyım?"
            className="min-h-36 w-full resize-y rounded-xl border bg-background p-4 outline-none ring-primary/30 focus:ring-2"
          />

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border bg-background px-3 py-3">
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={goal} onChange={(e) => setGoal(e.target.value)} className="rounded-xl border bg-background px-3 py-3">
              {goals.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label className="rounded-xl border px-3 py-2">
              <span className="block text-xs text-muted-foreground">Aciliyet: {urgency}/10</span>
              <input className="w-full" type="range" min="1" max="10" value={urgency} onChange={(e) => setUrgency(Number(e.target.value))} />
            </label>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="rounded-xl border px-3 py-2">
              <span className="block text-xs text-muted-foreground">Bütçe (TL, isteğe bağlı)</span>
              <input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min="0" placeholder="Örn: 1500" className="mt-1 w-full bg-transparent outline-none" />
            </label>
            <label className="rounded-xl border px-3 py-2">
              <span className="block text-xs text-muted-foreground">Bugün ayırabileceğin zaman (saat)</span>
              <input value={availableHours} onChange={(e) => setAvailableHours(e.target.value)} type="number" min="0" step="0.5" placeholder="Örn: 2" className="mt-1 w-full bg-transparent outline-none" />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void analyze()}
            disabled={loading || problem.trim().length < 3}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50 md:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? "Analiz ediliyor..." : "Sorunu çözmeye başla"}
          </button>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </section>

        {result && (
          <section className="mt-6 space-y-4">
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border px-3 py-1 text-xs font-medium">{result.category}</span>
                <span className="rounded-full border px-3 py-1 text-xs font-medium">{result.goal}</span>
                <span className="rounded-full border px-3 py-1 text-xs font-medium">{result.priority}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold">Teşhis</h2>
              <p className="mt-2 text-muted-foreground">{result.diagnosis}</p>
              {result.constraints.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.constraints.map((constraint) => <span key={constraint} className="rounded-full bg-muted px-3 py-1 text-xs">{constraint}</span>)}
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {result.actions.map((action) => (
                <article key={action.priority} className="rounded-2xl border bg-card p-5">
                  <div className="mb-3 flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-xs font-bold">ADIM {action.priority}</span>
                  </div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{action.reason}</p>
                </article>
              ))}
            </div>

            <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">Sıradaki soru</h3>
                <p className="mt-1 text-sm text-muted-foreground">{result.nextQuestion}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
