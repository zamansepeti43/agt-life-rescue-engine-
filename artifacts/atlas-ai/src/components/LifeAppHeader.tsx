import { PencilLine, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Language = "tr" | "en";

export function LifeAppHeader({ language, onLanguageChange }: { language: Language; onLanguageChange: (language: Language) => void }) {
  const [, navigate] = useLocation();
  const isEn = language === "en";
  return (
    <header className="sticky top-0 z-30 h-[88px] shrink-0 border-b border-border/70 bg-background/95 px-4 backdrop-blur md:h-[96px] md:px-8">
      <div className="mx-auto flex h-full max-w-5xl items-center gap-3">
        <SidebarTrigger aria-label={isEn ? "Open menu" : "Menüyü aç"} />
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary md:h-10 md:w-10">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="truncate text-lg font-bold tracking-tight text-primary md:text-xl">AGT LIFE</span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="inline-flex rounded-full border bg-card p-0.5" role="group" aria-label={isEn ? "Language" : "Dil"}>
            <button type="button" onClick={() => onLanguageChange("tr")} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${language === "tr" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>TR</button>
            <button type="button" onClick={() => onLanguageChange("en")} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
          </div>
          <button type="button" onClick={() => navigate("/")} aria-label={isEn ? "New problem" : "Yeni problem"} title={isEn ? "New problem" : "Yeni problem"} className="flex h-10 w-10 items-center justify-center rounded-full border bg-card">
            <PencilLine className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
