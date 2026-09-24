import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, Trash2 } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { clearLifeRescueHistory, listLifeRescueHistory, type LifeRescueHistoryItem } from "@/lib/life-rescue-history";

export default function LifeRescueHistory() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const sourceId = new URLSearchParams(search).get("id");
  const [items, setItems] = useState<LifeRescueHistoryItem[]>(() => listLifeRescueHistory());

  useEffect(() => {
    const refresh = () => setItems(listLifeRescueHistory());
    window.addEventListener("life-rescue-history-change", refresh);
    return () => window.removeEventListener("life-rescue-history-change", refresh);
  }, []);

  return (
    <main className="min-h-svh w-full overflow-y-auto bg-background px-4 py-6 text-foreground md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => navigate("/")} className="mb-6 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> Hayat Kurtarma
        </button>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary">AGT LIFE RESCUE</p>
            <h1 className="mt-1 text-3xl font-bold">Geçmiş Problemler</h1>
            <p className="mt-2 text-muted-foreground">Son çözdüğün problemlere cihazında tekrar bakabilirsin.</p>
          </div>
          {items.length > 0 && (
            <button type="button" onClick={() => { clearLifeRescueHistory(); setItems([]); }} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
              <Trash2 className="h-4 w-4" /> Temizle
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <section className="rounded-2xl border bg-card p-8 text-center">
            <p className="font-semibold">Henüz kayıt yok.</p>
            <p className="mt-2 text-sm text-muted-foreground">Bir problem çözdüğünde burada görünecek.</p>
          </section>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className={`rounded-2xl border bg-card p-5 transition ${sourceId === item.id ? "border-primary ring-2 ring-primary/20" : ""}`} id={item.id}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {new Date(item.createdAt).toLocaleString("tr-TR")}
                  <span>·</span><span>{item.category}</span>
                </div>
                <h2 className="mt-3 font-semibold">{item.problem}</h2>
                {sourceId === item.id && <p className="mt-2 text-xs font-semibold text-primary">İZCİ bu takibi bu problem konuşmasından oluşturdu.</p>}
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.diagnosis}</p>
                <div className="mt-3 rounded-xl bg-muted p-3 text-sm">
                  <span className="font-semibold">Hedef:</span> {item.objective}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
