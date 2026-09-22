import { BellRing, CheckSquare2, Crosshair, History, LifeBuoy, Plus, Target } from 'lucide-react';
import { useLocation } from 'wouter';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAssistantState } from '@/hooks/useAssistantState';
import { useEffect } from 'react';

const IZCI_ITEMS = [
  { label: 'Takipler', icon: Crosshair },
  { label: 'Görevler', icon: CheckSquare2 },
  { label: 'Hedefler', icon: Target },
];

export function AtlasSidebar() {
  const [location, navigate] = useLocation();
  const { setOpenMobile } = useSidebar();
  const state = useAssistantState();


  const unread = state.events.filter((event) => !event.read).length;
  const goTo = (path: string) => {
    navigate(path);
    setOpenMobile(false);
  };

  const newProblem = () => {
    goTo('/');
    window.dispatchEvent(new Event('life-rescue-new-problem'));
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">AGT Life Rescue</p>
            <p className="text-xs text-muted-foreground">Hayat Kurtarma Motoru</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Hayat Kurtarma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === '/'}
                  onClick={() => goTo('/')}
                  tooltip="Hayat Kurtarma"
                >
                  <LifeBuoy />
                  <span>Hayat Kurtarma</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={newProblem} tooltip="Yeni problem">
                  <Plus />
                  <span>Yeni Problem</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === '/life-rescue-history'}
                  onClick={() => goTo('/life-rescue-history')}
                  tooltip="Geçmiş"
                >
                  <History />
                  <span>Geçmiş</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>İZCİ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === '/izci'}
                  onClick={() => goTo('/izci')}
                  tooltip="İZCİ"
                >
                  <BellRing />
                  <span>İZCİ</span>
                </SidebarMenuButton>
                {unread > 0 && <SidebarMenuBadge>{unread}</SidebarMenuBadge>}
              </SidebarMenuItem>
              {IZCI_ITEMS.map(({ label, icon: Icon }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton onClick={() => goTo('/izci')} tooltip={label}>
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
