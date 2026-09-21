import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Izci from '@/pages/izci';
import AtlasOS from '@/pages/atlas-os';
import LifeRescue from '@/pages/life-rescue';
import { AtlasSidebar } from '@/components/AtlasSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function getRuntimeBase(): string {
  const configured = import.meta.env.BASE_URL;
  if (configured !== "./") return configured.replace(/\/$/, "");
  if (typeof window === "undefined") return "";
  const pathname = window.location.pathname;
  const slash = pathname.lastIndexOf("/");
  return slash > 0 ? pathname.slice(0, slash) : "";
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LifeRescue} />
      <Route path="/atlas" component={Home} />
      <Route path="/atlas-os" component={AtlasOS} />
      <Route path="/izci" component={Izci} />
      <Route path="/life-rescue" component={LifeRescue} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={getRuntimeBase()}>
          <SidebarProvider>
            <AtlasSidebar />
            <Router />
          </SidebarProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
