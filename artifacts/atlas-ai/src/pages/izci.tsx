import { AlertTriangle, BellRing, Check, CheckSquare2, ChevronRight, Clock3, Crosshair, Plus, Target, WalletCards } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAssistantState } from "@/hooks/useAssistantState";
import { addGoal, addTask, markEventRead, setTaskCompleted } from "@/lib/assistant-store";
import { notificationPermission, requestNotificationPermission } from "@/lib/notifications";
import { subscribeToPush } from "@/lib/push-notifications";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

function formatDate(value?: string) {
  if (!value) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function daysUntil(value?: string) {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

function Empty({ children }: { children: string }) { return <p className="py-7 text-sm text-muted-foreground">{children}</p>; }

export default function Izci() {
  const state = useAssistantState();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"tr" | "en">(() => (localStorage.getItem("agt_life_language") === "en" ? "en" : "tr"));
  const [notificationState, setNotificationState] = useState(notificationPermission());
  const [showCreate, setShowCreate] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalAmount, setGoalAmount] = useState("");

  useEffect(() => { if (notificationState === "granted") void subscribeToPush(); }, [notificationState]);
  useEffect(() => {
    const onLanguage = () => setLanguage(localStorage.getItem("agt_life_language") === "en" ? "en" : "tr");
    window.addEventListener("agt-life-language-change", onLanguage);
    return () => window.removeEventListener("agt-life-language-change", onLanguage);
  }, []);
  const t = language === "en" ? {
    openMenu: "Open menu", notificationsOn: "Notifications on", enableNotifications: "Enable notifications",
    eyebrow: "Important things only.", title: "What needs your attention now", intro: "İZCİ surfaces upcoming, overdue, or genuinely important items without flooding you.",
    add: "Add tracking", critical: "Nothing critical right now.", quiet: "I’m quietly watching what you track.",
    task: "Task", goal: "Goal", taskPlaceholder: "What should be tracked?", goalPlaceholder: "What is your goal?", amount: "Target amount (optional)", addTask: "Add task", addGoal: "Add goal",
    soon: "Coming up", noSoon: "No upcoming dated tasks.", goals: "Goals", noGoals: "No goals being tracked yet.", tasks: "Tasks", noTasks: "No active tasks. İZCİ is quiet.", other: "Other tracking", noOther: "No price or subscription tracking yet.", price: "Price tracking", renewal: "Renewal", changes: "Recent changes", noChanges: "No new alerts.", complete: "Complete", openSource: "Open source", footer: "İZCİ surfaces what matters and quietly watches the rest."
  } : {
    openMenu: "Menüyü aç", notificationsOn: "Bildirimler açık", enableNotifications: "Bildirimleri aç", eyebrow: "Önemli şeyler.", title: "{t.title}", intro: "İZCİ yaklaşan, geciken veya gerçekten önemli olanları öne çıkarır; seni bildirimle boğmaz.",
    add: "Takip ekle", critical: "{t.critical}", quiet: "{t.quiet}", task: "Görev", goal: "Hedef", taskPlaceholder: "Ne takip edilsin?", goalPlaceholder: "Hedefin ne?", amount: "Hedef tutarı (isteğe bağlı)", addTask: "Görevi ekle", addGoal: "Hedefi ekle",
    soon: "Yakında", noSoon: "Yaklaşan tarihli görev yok.", goals: "Hedefler", noGoals: "Henüz izlenen hedef yok.", tasks: "Görevler", noTasks: "Aktif görev yok. İZCİ sessiz.", other: "Diğer takipler", noOther: "Henüz fiyat veya abonelik takibi yok.", price: "Fiyat takibi", renewal: "Yenileme", changes: "Son değişiklikler", noChanges: "Yeni uyarı yok.", complete: "Tamamla", openSource: "Kaynağı aç", footer: "İZCİ önemli olanı öne çıkarır; geri kalanını sessizce takip eder."
  };

  const activeTasks = useMemo(() => state.tasks.filter((task) => task.status === "active"), [state.tasks]);
  const activeGoals = useMemo(() => state.goals.filter((goal) => goal.status === "active"), [state.goals]);
  const unread = useMemo(() => state.events.filter((event) => !event.read), [state.events]);
  const urgentTasks = useMemo(() => activeTasks.filter((task) => { const days = daysUntil(task.dueAt); return days !== null && days <= 2; }).sort((a,b) => new Date(a.dueAt ?? "9999").getTime() - new Date(b.dueAt ?? "9999").getTime()), [activeTasks]);
  const soonTasks = useMemo(() => activeTasks.filter((task) => !urgentTasks.some((item) => item.id === task.id) && daysUntil(task.dueAt) !== null && (daysUntil(task.dueAt) as number) <= 7).slice(0, 5), [activeTasks, urgentTasks]);

  async function enableNotifications() {
    const permission = await requestNotificationPermission();
    setNotificationState(permission);
    if (permission === "granted") await subscribeToPush();
  }

  function createTask() {
    const title = taskTitle.trim();
    if (!title) return;
    addTask({ title, ...(dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}) });
    setTaskTitle(""); setDueAt(""); setShowCreate(false);
  }

  function createGoal() {
    const title = goalTitle.trim();
    if (!title) return;
    const value = Number(goalAmount);
    addGoal({ title, ...(Number.isFinite(value) && value > 0 ? { targetAmount: value } : {}) });
    setGoalTitle(""); setGoalAmount(""); setShowCreate(false);
  }

  return (
    <main className="min-h-[100dvh] flex-1 overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <SidebarTrigger aria-label={t.openMenu} />
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">AGT LIFE</p><h1 className="text-xl font-bold tracking-tight">İZCİ</h1></div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={enableNotifications} className="rounded-xl border px-3 py-2 text-xs font-semibold hover:border-primary/40">{notificationState === "granted" ? "Bildirimler açık" : "Bildirimleri aç"}</button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 pb-12 md:px-8 md:py-8">
        <section className="rounded-3xl border bg-card p-5 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="text-sm font-medium text-primary">{t.eyebrow}</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Şu an dikkat etmen gerekenler</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t.intro}</p></div>
            <button type="button" onClick={() => setShowCreate((v) => !v)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />{t.add}</button>
          </div>

          {(urgentTasks.length > 0 || unread.some((event) => event.severity === "critical")) ? (
            <div className="mt-6 space-y-2">
              {urgentTasks.slice(0, 3).map((task) => <div key={task.id} className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500"><AlertTriangle className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="font-semibold">{task.title}</p><p className="text-xs text-muted-foreground">{task.dueAt ? (daysUntil(task.dueAt)! < 0 ? "Gecikti · " : daysUntil(task.dueAt) === 0 ? "Bugün · " : "Yakında · ") + formatDate(task.dueAt) : "Tarih belirlenmedi"}</p></div><button type="button" onClick={() => setTaskCompleted(task.id, true)} className="rounded-xl border px-3 py-2 text-xs font-semibold hover:border-primary/40">{t.complete}</button></div>)}
              {unread.filter((event) => event.severity === "critical").slice(0, 2).map((event) => <button key={event.id} type="button" onClick={() => markEventRead(event.id)} className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-left"><BellRing className="h-5 w-5 shrink-0 text-amber-500" /><span className="min-w-0 flex-1"><strong className="block text-sm">{event.title}</strong><span className="text-xs text-muted-foreground">{event.message}</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>)}
            </div>
          ) : <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm"><span className="font-semibold">Şu an kritik bir şey yok.</span><span className="ml-1 text-muted-foreground">Takip ettiklerini sessizce izliyorum.</span></div>}
        </section>

        {showCreate && <section className="grid gap-3 rounded-3xl border bg-card p-5 md:grid-cols-2"><div className="rounded-2xl border p-4"><div className="mb-3 flex items-center gap-2"><CheckSquare2 className="h-4 w-4 text-primary" /><h3 className="font-semibold">{t.task}</h3></div><input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder={t.taskPlaceholder} className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none focus:border-primary" /><input value={dueAt} onChange={(e) => setDueAt(e.target.value)} type="datetime-local" className="mt-2 w-full rounded-xl border bg-background px-3 py-3 text-sm" /><button type="button" onClick={createTask} disabled={!taskTitle.trim()} className="mt-2 w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{t.addTask}</button></div><div className="rounded-2xl border p-4"><div className="mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><h3 className="font-semibold">{t.goal}</h3></div><input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder={t.goalPlaceholder} className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none focus:border-primary" /><input value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} type="number" min="0" placeholder={t.amount} className="mt-2 w-full rounded-xl border bg-background px-3 py-3 text-sm" /><button type="button" onClick={createGoal} disabled={!goalTitle.trim()} className="mt-2 w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{t.addGoal}</button></div></section>}

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border bg-card p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /><h3 className="font-semibold">{t.soon}</h3></div><span className="text-xs text-muted-foreground">{soonTasks.length}</span></div>{soonTasks.length === 0 ? <Empty>{t.noSoon}</Empty> : <div className="space-y-2">{soonTasks.map((task) => <div key={task.id} className="rounded-2xl border p-3"><p className="text-sm font-medium">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(task.dueAt)}</p></div>)}</div>}</div>
          <div className="rounded-3xl border bg-card p-5"><div className="mb-4 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><h3 className="font-semibold">{t.goals}</h3></div>{activeGoals.length === 0 ? <Empty>{t.noGoals}</Empty> : <div className="space-y-4">{activeGoals.slice(0, 4).map((goal) => { const progress = goal.targetAmount ? Math.min(100, Math.round(((goal.currentAmount ?? 0) / goal.targetAmount) * 100)) : 0; return <div key={goal.id}><div className="flex justify-between gap-3 text-sm"><span className="font-medium">{goal.title}</span><span className="tabular-nums text-primary">%{progress}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: progress + "%" }} /></div>{goal.targetAmount && <p className="mt-1 text-xs text-muted-foreground">{(goal.currentAmount ?? 0).toLocaleString("tr-TR")} / {goal.targetAmount.toLocaleString("tr-TR")} TL</p>}</div>; })}</div>}</div>
          <div className="rounded-3xl border bg-card p-5"><div className="mb-4 flex items-center gap-2"><CheckSquare2 className="h-4 w-4 text-primary" /><h3 className="font-semibold">{t.tasks}</h3></div>{activeTasks.length === 0 ? <Empty>{t.noTasks}</Empty> : <div className="space-y-2">{activeTasks.slice(0, 5).map((task) => <div key={task.id} className="flex items-center gap-3 rounded-2xl border p-3"><button type="button" onClick={() => setTaskCompleted(task.id, true)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border hover:border-primary" aria-label="Tamamla"><Check className="h-4 w-4" /></button><div className="min-w-0"><p className="truncate text-sm font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{formatDate(task.dueAt)}</p>{task.sourceHistoryId && <button type="button" onClick={() => navigate("/life-rescue-history?id=" + encodeURIComponent(task.sourceHistoryId!))} className="mt-1 text-[11px] font-semibold text-primary hover:underline">{t.openSource}</button>}</div></div>)}</div>}</div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border bg-card p-5"><div className="mb-4 flex items-center gap-2"><Crosshair className="h-4 w-4 text-primary" /><h3 className="font-semibold">{t.other}</h3></div><div className="space-y-3">{state.trackedProducts.length === 0 && state.subscriptions.length === 0 ? <Empty>{t.noOther}</Empty> : <>{state.trackedProducts.slice(0, 4).map((item) => <div key={item.id} className="flex justify-between gap-3 border-b pb-3 last:border-0"><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{t.price}</p></div><span className="text-sm">{item.currentPrice ? item.currentPrice.toLocaleString("tr-TR") + " TL" : "—"}</span></div>)}{state.subscriptions.slice(0, 4).map((item) => <div key={item.id} className="flex justify-between gap-3 border-b pb-3 last:border-0"><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{t.renewal} · {formatDate(item.renewalAt)}</p></div><span className="text-sm">{item.monthlyCost ? item.monthlyCost.toLocaleString("tr-TR") + " TL/ay" : "—"}</span></div>)}</>}</div></div>
          <div className="rounded-3xl border bg-card p-5"><div className="mb-4 flex items-center gap-2"><BellRing className="h-4 w-4 text-primary" /><h3 className="font-semibold">{t.changes}</h3></div>{unread.length === 0 ? <Empty>{t.noChanges}</Empty> : <div className="space-y-2">{unread.slice(0, 5).map((event) => <button key={event.id} type="button" onClick={() => markEventRead(event.id)} className="flex w-full items-start gap-3 rounded-2xl border p-3 text-left"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /><span className="min-w-0"><strong className="block text-sm">{event.title}</strong><span className="text-xs text-muted-foreground">{event.message}</span></span></button>)}</div>}</div>
        </section>

        <div className="flex items-center gap-2 text-xs text-muted-foreground"><WalletCards className="h-3.5 w-3.5" />{t.footer}</div>
      </div>
    </main>
  );
}