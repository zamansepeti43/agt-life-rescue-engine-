import { BellRing, History, LifeBuoy, MessageSquareText, Plus, Settings2 } from "lucide-react";
import { useLocation } from "wouter";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from "@/components/ui/sidebar";
import { useAssistantState } from "@/hooks/useAssistantState";
import { useEffect, useState } from "react";

export function AtlasSidebar() {
  const [location, navigate] = useLocation();
  const { setOpenMobile } = useSidebar();
  const state = useAssistantState();
  const [language, setLanguage] = useState<"tr" | "en">(() => localStorage.getItem("agt_life_language") === "en" ? "en" : "tr");
  useEffect(() => {
    const onLanguage = () => setLanguage(localStorage.getItem("agt_life_language") === "en" ? "en" : "tr");
    window.addEventListener("agt-life-language-change", onLanguage);
    return () => window.removeEventListener("agt-life-language-change", onLanguage);
  }, []);
  const t = language === "en" ? {
    tagline: "Get your life together.", life: "Life", home: "Home", newProblem: "New Problem", history: "History",
    chat: "Chat", tracker: "TRACKER", system: "System", settings: "Settings"
  } : {
    tagline: "{t.tagline}", life: "Hayat", home: "Ana Sayfa", newProblem: "Yeni Problem", history: "Geçmiş",
    chat: "Sohbet", tracker: "İZCİ", system: "Sistem", settings: "Ayarlar"
  };
  const unread = state.events.filter((event) => !event.read).length;
  const goTo = (path: string) => { navigate(path); setOpenMobile(false); };
  const newProblem = () => { goTo("/"); window.dispatchEvent(new Event("life-rescue-new-problem")); };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary"><LifeBuoy className="h-5 w-5" /></div>
          <div><p className="text-base font-bold tracking-tight">AGT LIFE</p><p className="text-xs text-muted-foreground">Hayatını toparla.</p></div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.life}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton isActive={location === "/"} onClick={() => goTo("/")} tooltip={t.home}><LifeBuoy /><span>{t.home}</span></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton onClick={newProblem} tooltip={t.newProblem}><Plus /><span>{t.newProblem}</span></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton isActive={location === "/life-rescue-history"} onClick={() => goTo("/life-rescue-history")} tooltip={t.history}><History /><span>{t.history}</span></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton isActive={location === "/atlas"} onClick={() => goTo("/atlas")} tooltip={t.chat}><MessageSquareText /><span>{t.chat}</span></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.tracker}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location === "/izci"} onClick={() => goTo("/izci")} tooltip={t.tracker}>
                  <BellRing /><span>İZCİ</span>
                </SidebarMenuButton>
                {unread > 0 && <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{unread}</span>}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.system}</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive={location === "/settings"} onClick={() => goTo("/settings")} tooltip={t.settings}><Settings2 /><span>{t.settings}</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
