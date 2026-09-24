import { BellRing, Download, Languages, RotateCcw, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { notificationPermission, requestNotificationPermission } from "@/lib/notifications";
import { subscribeToPush } from "@/lib/push-notifications";
import { useState } from "react";

const STATE_KEY = "atlas_assistant_state_v1";
const HISTORY_KEY = "agt_life_rescue_history_v1";

export default function Settings() {
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"tr" | "en">(() => localStorage.getItem("agt_life_language") === "en" ? "en" : "tr");
  const [permission, setPermission] = useState(notificationPermission());

  const changeLanguage = (next: "tr" | "en") => {
    setLanguage(next);
    localStorage.setItem("agt_life_language", next);
    localStorage.setItem("agt_life_rescue_language", next);
    window.dispatchEvent(new Event("agt-life-language-change"));
  };

  const enableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") await subscribeToPush();
  };

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      assistantState: JSON.parse(localStorage.getItem(STATE_KEY) || "{}"),
      lifeRescueHistory: JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"),
      language
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "agt-life-verilerim.json"; a.click(); URL.revokeObjectURL(url);
  };

  const resetData = () => {
    if (!window.confirm("AGT LIFE üzerindeki yerel takip, hedef, görev ve geçmiş verilerini silmek istediğine emin misin?")) return;
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    window.location.reload();
  };

  return <main className="min-h-[100dvh] flex-1 overflow-y-auto bg-background text-foreground">
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <button type="button" onClick={() => navigate("/")} className="mb-6 rounded-xl border px-4 py-2 text-sm">← Ana Sayfa</button>
      <div className="mb-8"><p className="text-sm font-semibold text-primary">AGT LIFE</p><h1 className="mt-1 text-3xl font-bold">Ayarlar</h1><p className="mt-2 text-sm text-muted-foreground">Dil, bildirim ve cihazındaki verilerini buradan yönet.</p></div>
      <div className="space-y-4">
        <section className="rounded-3xl border bg-card p-5"><div className="flex items-center gap-3"><Languages className="h-5 w-5 text-primary"/><div><h2 className="font-semibold">Dil / Language</h2><p className="text-xs text-muted-foreground">Arayüz dilini seç.</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={()=>changeLanguage("tr")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${language==="tr"?"border-primary bg-primary/10":""}`}>Türkçe</button><button onClick={()=>changeLanguage("en")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${language==="en"?"border-primary bg-primary/10":""}`}>English (İngilizce)</button></div></section>
        <section className="rounded-3xl border bg-card p-5"><div className="flex items-center gap-3"><BellRing className="h-5 w-5 text-primary"/><div><h2 className="font-semibold">Bildirimler</h2><p className="text-xs text-muted-foreground">İZCİ önemli görev ve uyarıları zamanında bildirebilir.</p></div></div><div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border p-4"><div className="text-sm"><span className="font-semibold">Durum:</span> {permission === "granted" ? "Açık" : permission === "denied" ? "Tarayıcı tarafından engellendi" : permission === "unsupported" ? "Bu cihaz/tarayıcı desteklemiyor" : "Henüz izin verilmedi"}</div>{permission !== "granted" && permission !== "denied" && permission !== "unsupported" && <button onClick={enableNotifications} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Bildirimleri aç</button>}</div>{permission==="denied" && <p className="mt-3 text-xs text-muted-foreground">Engellenmişse izni tarayıcı/uygulama bildirim ayarlarından yeniden açman gerekir.</p>}</section>
        <section className="rounded-3xl border bg-card p-5"><div className="flex items-center gap-3"><Download className="h-5 w-5 text-primary"/><div><h2 className="font-semibold">Veriler</h2><p className="text-xs text-muted-foreground">AGT LIFE bu verileri bu cihazın yerel depolamasında tutar.</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={exportData} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Verilerimi dışa aktar</button><button onClick={resetData} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-600"><RotateCcw className="h-4 w-4"/>Yerel verileri sıfırla</button></div></section>
        <section className="rounded-3xl border bg-card p-5"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary"/><div><h2 className="font-semibold">Gizlilik</h2><p className="text-xs leading-5 text-muted-foreground">Görev, hedef ve problem geçmişi bu uygulamanın yerel depolamasında tutulur. Dışa aktarma işlemi yalnızca senin cihazında bir JSON dosyası oluşturur.</p></div></div></section>
      </div>
    </div>
  </main>;
}
