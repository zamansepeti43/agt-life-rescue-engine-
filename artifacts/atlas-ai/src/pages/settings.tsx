import { BellRing, Download, Languages, RotateCcw, ShieldCheck } from "lucide-react";
import { LifeAppHeader } from "@/components/LifeAppHeader";
import { notificationPermission, requestNotificationPermission } from "@/lib/notifications";
import { subscribeToPush } from "@/lib/push-notifications";
import { useState } from "react";

const STATE_KEY = "atlas_assistant_state_v1";
const HISTORY_KEY = "agt_life_rescue_history_v1";

export default function Settings() {
  const [language, setLanguage] = useState<"tr" | "en">(() => ((localStorage.getItem("agt_life_rescue_language") || localStorage.getItem("agt_life_language")) === "en" ? "en" : "tr"));
  const [permission, setPermission] = useState(notificationPermission());
  const t = language === "en" ? {
    home: "← Home", title: "Settings", desc: "Manage language, notifications, and your device data here.",
    lang: "Language", langDesc: "Choose the interface language.", notifications: "Notifications",
    notificationsDesc: "İZCİ can notify you about important tasks and alerts in time.",
    status: "Status:", on: "On", denied: "Blocked by browser", unsupported: "Not supported on this device/browser", pending: "Permission not granted yet",
    enable: "Enable notifications", deniedHelp: "If blocked, enable notification permission from your browser/app settings.",
    data: "Data", dataDesc: "AGT LIFE keeps this data in local storage on this device.",
    export: "Export my data", reset: "Reset local data", privacy: "Privacy",
    privacyDesc: "Tasks, goals, and problem history are stored in this app's local storage. Export only creates a JSON file on your device.",
    resetConfirm: "Are you sure you want to delete local tracking, goals, tasks, and history data from AGT LIFE?"
  } : {
    home: "← Ana Sayfa", title: "Ayarlar", desc: "Dil, bildirim ve cihazındaki verilerini buradan yönet.",
    lang: "Dil / Language", langDesc: "Arayüz dilini seç.", notifications: "Bildirimler",
    notificationsDesc: "İZCİ önemli görev ve uyarıları zamanında bildirebilir.",
    status: "Durum:", on: "Açık", denied: "Tarayıcı tarafından engellendi", unsupported: "Bu cihaz/tarayıcı desteklemiyor", pending: "Henüz izin verilmedi",
    enable: "Bildirimleri aç", deniedHelp: "Engellenmişse izni tarayıcı/uygulama bildirim ayarlarından yeniden açman gerekir.",
    data: "Veriler", dataDesc: "AGT LIFE bu verileri bu cihazın yerel depolamasında tutar.",
    export: "Verilerimi dışa aktar", reset: "Yerel verileri sıfırla", privacy: "Gizlilik",
    privacyDesc: "Görev, hedef ve problem geçmişi bu uygulamanın yerel depolamasında tutulur. Dışa aktarma işlemi yalnızca senin cihazında bir JSON dosyası oluşturur.",
    resetConfirm: "AGT LIFE üzerindeki yerel takip, hedef, görev ve geçmiş verilerini silmek istediğine emin misin?"
  };

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
    if (!window.confirm(t.resetConfirm)) return;
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    window.location.reload();
  };

  return <main className="flex h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
    <LifeAppHeader language={language} onLanguageChange={changeLanguage} />
    <div className="min-h-0 flex-1 overflow-y-auto">
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-8"><p className="text-sm font-semibold text-primary">AGT LIFE</p><h1 className="mt-1 text-3xl font-bold">{t.title}</h1><p className="mt-2 text-sm text-muted-foreground">{t.desc}</p></div>
      <div className="space-y-4 pb-12">
        <section className="rounded-3xl border bg-card p-5"><div className="flex items-center gap-3"><Languages className="h-5 w-5 text-primary"/><div><h2 className="font-semibold">{t.lang}</h2><p className="text-xs text-muted-foreground">{t.langDesc}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={()=>changeLanguage("tr")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${language==="tr"?"border-primary bg-primary/10":""}`}>Türkçe</button><button onClick={()=>changeLanguage("en")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${language==="en"?"border-primary bg-primary/10":""}`}>English (İngilizce)</button></div></section>
        <section className="rounded-3xl border bg-card p-5"><div className="flex items-center gap-3"><BellRing className="h-5 w-5 text-primary"/><div><h2 className="font-semibold">{t.notifications}</h2><p className="text-xs text-muted-foreground">{t.notificationsDesc}</p></div></div><div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border p-4"><div className="text-sm"><span className="font-semibold">{t.status}</span> {permission === "granted" ? t.on : permission === "denied" ? t.denied : permission === "unsupported" ? t.unsupported : t.pending}</div>{permission !== "granted" && permission !== "denied" && permission !== "unsupported" && <button onClick={enableNotifications} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">{t.enable}</button>}</div>{permission==="denied" && <p className="mt-3 text-xs text-muted-foreground">{t.deniedHelp}</p>}</section>
        <section className="rounded-3xl border bg-card p-5"><div className="flex items-center gap-3"><Download className="h-5 w-5 text-primary"/><div><h2 className="font-semibold">{t.data}</h2><p className="text-xs text-muted-foreground">{t.dataDesc}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={exportData} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">{t.export}</button><button onClick={resetData} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-600"><RotateCcw className="h-4 w-4"/>{t.reset}</button></div></section>
        <section className="rounded-3xl border bg-card p-5"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary"/><div><h2 className="font-semibold">{t.privacy}</h2><p className="text-xs leading-5 text-muted-foreground">{t.privacyDesc}</p></div></div></section>
      </div>
    </div>
    </div>
    </div>
  </main>;
}
