import { BellRing, History, LifeBuoy, MessageSquareText, Plus, Settings2 } from "lucide-react";
import { useLocation } from "wouter";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from "@/components/ui/sidebar";
import { useAssistantState } from "@/hooks/useAssistantState";

export function AtlasSidebar() {
  const [location, navigate] = useLocation();
  const { setOpenMobile } = useSidebar();
  const state = useAssistantState();
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
          <SidebarGroupLabel>Hayat</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton isActive={location === "/"} onClick={() => goTo("/")} tooltip="Ana sayfa"><LifeBuoy /><span>Ana Sayfa</span></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton onClick={newProblem} tooltip="Yeni problem"><Plus /><span>Yeni Problem</span></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton isActive={location === "/life-rescue-history"} onClick={() => goTo("/life-rescue-history")} tooltip="Konuşmalar"><History /><span>Geçmiş</span></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton isActive={location === "/atlas"} onClick={() => goTo("/atlas")} tooltip="Sohbet"><MessageSquareText /><span>Sohbet</span></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>İZCİ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location === "/izci"} onClick={() => goTo("/izci")} tooltip="İZCİ">
                  <BellRing /><span>İZCİ</span>
                </SidebarMenuButton>
                {unread > 0 && <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{unread}</span>}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistem</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive={location === "/settings"} onClick={() => goTo("/settings")} tooltip="Ayarlar"><Settings2 /><span>Ayarlar</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
