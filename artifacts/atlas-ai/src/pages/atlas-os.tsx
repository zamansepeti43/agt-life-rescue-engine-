import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, Eye, Search, ShieldCheck, ShoppingCart, Wallet, Car, Home, Briefcase, Users, BookOpen, Brain, ListTodo, Link2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAssistantState } from '@/hooks/useAssistantState';
import { analyzeScamText, ATLAS_CAPABILITIES } from '@/lib/atlas-capabilities';
import { analyzeUrl, summarizeBudget } from '@/lib/offline-tools';
import { extractTurkishText } from '@/lib/local-ocr';

const ICONS = { shopping: ShoppingCart, finance: Wallet, 'scam-shield': ShieldCheck, automotive: Car, 'real-estate': Home, career: Briefcase, family: Users, learning: BookOpen, memory: Brain, tasks: ListTodo, research: Search } as const;

export default function AtlasOS() {
  const [, navigate] = useLocation();
  const state = useAssistantState();
  const [language, setLanguage] = useState<'tr' | 'en'>(() => localStorage.getItem('agt_life_language') === 'en' ? 'en' : 'tr');
  useEffect(() => { const onLanguage = () => setLanguage(localStorage.getItem('agt_life_language') === 'en' ? 'en' : 'tr'); window.addEventListener('agt-life-language-change', onLanguage); return () => window.removeEventListener('agt-life-language-change', onLanguage); }, []);
  const t = language === 'en' ? {
    title: 'Ask. Atlas researches, thinks, and tracks.', desc: 'Local decision tools, visual OCR, security checks, budget, and İZCİ in one place.', ask: 'Ask Atlas',
    activeTasks: 'Active tasks', tracked: 'Tracked', unread: 'Unread İZCİ', scam: 'Scam Shield', scamDesc: 'Extract text or a screenshot with local OCR, then analyze risk signals.',
    ocr: 'Run OCR on image', reading: 'Reading image…', confidence: 'OCR confidence', url: 'Link Security Check', urlDesc: 'Check HTTPS, shorteners, domain, and suspicious extension signals before opening a URL.',
    budget: 'Local Budget Summary', budgetDesc: 'Calculate saved income, expenses, debt, and savings without an API.', income: 'Income', expenses: 'Expenses', debt: 'Debt', saving: 'Savings',
    balance: 'Net balance', savingRate: 'Savings rate', financeNote: 'This is not financial advice; it summarizes your saved data.',
    tracker: 'İZCİ & Automation', trackerDesc: 'Connect decisions to tasks, reminders, goals, and price tracking.', tasks: 'Tasks', prices: 'Price tracking', alerts: 'Alerts', active: 'active', openIzci: 'Open İZCİ',
    capabilities: 'Atlas capabilities', capabilitiesDesc: 'All in one personal decision center.', risk: 'Risk'
  } : {
    title: 'Sen sor. Atlas araştırır, düşünür, takip eder.', desc: 'Yerel karar araçları, görsel OCR, güvenlik kontrolleri, bütçe ve İZCİ tek merkezde.', ask: "Atlas'a sor",
    activeTasks: 'Aktif görev', tracked: 'İzlenen', unread: 'Okunmamış İZCİ', scam: 'Dolandırıcılık Kalkanı', scamDesc: 'Metin veya ekran görüntüsünü yerel OCR ile çıkar, ardından risk sinyallerini analiz et.',
    ocr: 'Görselden OCR yap', reading: 'Görsel okunuyor…', confidence: 'OCR güveni', url: 'Bağlantı Güvenlik Kontrolü', urlDesc: "URL'yi açmadan önce HTTPS, kısaltıcı, alan adı ve şüpheli uzantı sinyallerini kontrol et.",
    budget: 'Yerel Bütçe Özeti', budgetDesc: 'Kayıtlı gelir/gider/borç/tasarruf verilerini API olmadan hesaplar.', income: 'Gelir', expenses: 'Gider', debt: 'Borç', saving: 'Tasarruf',
    balance: 'Net bakiye', savingRate: 'Tasarruf oranı', financeNote: 'Bu hesap finansal tavsiye değil, kayıtlı verilerin özetidir.',
    tracker: 'İZCİ & Otomasyon', trackerDesc: 'Kararları görev, hatırlatıcı, hedef ve fiyat takibine bağlar.', tasks: 'Görevler', prices: 'Fiyat takipleri', alerts: 'Uyarılar', active: 'aktif', openIzci: "İZCİ'yi aç",
    capabilities: 'Atlas yetenekleri', capabilitiesDesc: 'Hepsi tek bir kişisel karar merkezinde.', risk: 'Risk'
  };
  const [scamText, setScamText] = useState('');
  const [urlText, setUrlText] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrError, setOcrError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const analysis = useMemo(() => analyzeScamText(scamText), [scamText]);
  const urlAnalysis = useMemo(() => analyzeUrl(urlText), [urlText]);
  const budget = useMemo(() => summarizeBudget(state.budgetEntries), [state.budgetEntries]);
  const activeTasks = state.tasks.filter((task) => task.status === 'active').length;
  const activeTracks = state.trackedProducts.filter((product) => product.status === 'active').length;
  const unread = state.events.filter((event) => !event.read).length;

  const ask = (text: string) => {
    navigate('/');
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('atlas-prefill', { detail: text })), 0);
  };

  const runOcr = async (file?: File) => {
    if (!file) return;
    setOcrBusy(true);
    setOcrError('');
    try {
      const result = await extractTurkishText(file);
      setScamText(result.text);
      setOcrConfidence(result.confidence);
    } catch (error) {
      setOcrError(error instanceof Error ? error.message : (language === 'en' ? 'OCR could not be completed.' : 'OCR çalıştırılamadı.'));
      setOcrConfidence(null);
    } finally {
      setOcrBusy(false);
    }
  };

  const capabilityText = (id: string, title: string, description: string): [string, string] => {
    if (language !== "en") return [title, description];
    const map: Record<string, [string, string]> = {
      shopping: ["Smart Shopping", "Evaluate products, prices, features, and value together."],
      finance: ["Money Assistant", "Plan budgets, expenses, debt, and goals together."],
      "scam-shield": ["Scam Shield", "Explain scam signals in messages, links, or screenshots."],
      automotive: ["Automotive", "Compare vehicle listings, price, running cost, and risk."],
      "real-estate": ["Home & Real Estate", "Evaluate rent and purchase options by total cost and needs."],
      career: ["Career", "Handle jobs, CVs, skills, and career goals in one flow."],
      family: ["Family", "Organize family tasks, important dates, and shared plans."],
      learning: ["Learning", "Teach at your level and build review and progress plans."],
      memory: ["Memory", "Use preferences and decision context you explicitly share."],
      tasks: ["Tasks & İZCİ", "Atlas creates tasks; İZCİ tracks changes and surfaces them."],
      research: ["Research", "Prepare sourced research and decision summaries."]
    };
    return map[id] ?? [title, description];
  };

  return (
    <main className="min-h-screen flex-1 overflow-auto bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div><div className="mb-3 flex items-center gap-2 text-primary"><Bot className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.22em]">Atlas Life OS</span></div><h1 className="text-3xl font-bold tracking-tight md:text-5xl">{t.title}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{t.desc}</p></div>
            <button onClick={() => ask(t.ask === 'Ask Atlas' ? 'Summarize the tasks, tracking items, and alerts that matter to me today.' : 'Bugün benim için önemli olan görevleri, takipleri ve uyarıları özetle.')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground">{t.ask} <ArrowRight className="h-4 w-4" /></button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3"><Stat icon={ListTodo} label={t.activeTasks} value={activeTasks} /><Stat icon={Eye} label={t.tracked} value={activeTracks} /><Stat icon={AlertTriangle} label={t.unread} value={unread} /></section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ToolCard icon={ShieldCheck} title={t.scam} description={t.scamDesc}>
            <textarea value={scamText} onChange={(e) => setScamText(e.target.value)} placeholder={language === 'en' ? 'E.g. Congratulations, you won 50,000 TL...' : 'Örn. Tebrikler, 50.000 TL kazandınız...'} className="min-h-28 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => fileInput.current?.click()} disabled={ocrBusy} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"><ImageIcon className="h-4 w-4" />{ocrBusy ? t.reading : t.ocr}</button>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => void runOcr(e.target.files?.[0])} />
              {ocrBusy && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {ocrConfidence !== null && <span className="rounded-xl bg-muted/40 px-3 py-2 text-xs">{t.confidence}: %{Math.round(ocrConfidence)}</span>}
            </div>
            {ocrError && <p className="mt-2 text-sm text-destructive">{ocrError}</p>}
            {scamText && <div className="mt-3 rounded-xl border border-border p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{t.risk}</p><p className="font-bold">{language === 'en' ? ({'DÜŞÜK RİSK':'LOW RISK','ORTA RİSK':'MEDIUM RISK','YÜKSEK RİSK':'HIGH RISK','ÇOK YÜKSEK RİSK':'VERY HIGH RISK'} as Record<string,string>)[analysis.level] : analysis.level}</p></div><span className="text-3xl font-bold">%{analysis.score}</span></div><ul className="mt-3 space-y-2 text-sm">{analysis.signals.map((signal) => <li key={signal} className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{language === 'en' ? ({'Acil davranmaya zorlayan dil kullanıyor.':'Uses language that pressures you to act urgently.','Beklenmedik ödül veya para vaadi içeriyor.':'Contains an unexpected prize or money promise.','Hassas kimlik veya finans bilgisi talep ediyor.':'Requests sensitive identity or financial information.','Bağlantıya tıklama veya hesap doğrulama çağrısı yapıyor.':'Asks you to click a link or verify an account.','Korku veya hesap kapatma tehdidi kullanıyor.':'Uses fear or account-closure threats.','Gerçek dışı veya aşırı kazanç vaadi içeriyor.':'Promises unrealistic or excessive returns.','Mesajda dış bağlantı bulunuyor; alan adı ayrıca doğrulanmalı.':'Contains an external link; verify the domain separately.'} as Record<string,string>)[signal] ?? signal : signal}</li>)}</ul><p className="mt-3 text-sm text-muted-foreground">{language === 'en' ? ({'Bağlantıyı açma, ödeme yapma ve doğrulama kodu paylaşma. Kurumu kendi resmi kanalından doğrula.':'Do not open the link, pay, or share verification codes. Verify the organization through its official channel.','İşlemi aceleye getirme; göndereni ve bağlantıyı bağımsız bir kanaldan doğrula.':'Do not rush; verify the sender and link through an independent channel.','Belirgin dolandırıcılık sinyali az, ancak bu sonuç güvenlik garantisi değildir.':'There are few obvious scam signals, but this is not a security guarantee.'} as Record<string,string>)[analysis.recommendation] ?? analysis.recommendation : analysis.recommendation}</p></div>}
          </ToolCard>

          <ToolCard icon={Link2} title={t.url} description={t.urlDesc}>
            <div className="flex gap-2"><input value={urlText} onChange={(e) => setUrlText(e.target.value)} placeholder="https://ornek.com/..." className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
            {urlText && <div className="mt-3 rounded-xl border border-border p-4"><div className="flex items-center justify-between"><p className="font-bold">{language === 'en' ? ({'GÜVENLİ GÖRÜNÜYOR':'LOOKS SAFE','DİKKAT':'CAUTION','ŞÜPHELİ':'SUSPICIOUS'} as Record<string,string>)[urlAnalysis.level] : urlAnalysis.level}</p><span className="text-2xl font-bold">%{urlAnalysis.score}</span></div><ul className="mt-3 space-y-2 text-sm">{urlAnalysis.signals.map((signal) => <li key={signal}>• {language === 'en' ? ({'HTTPS kullanılmıyor.':'HTTPS is not being used.','URL kısaltma servisi kullanıyor; gerçek hedef görünmüyor.':'A URL shortener is being used; the real destination is hidden.','Alan adı uzantısı kötüye kullanımla ilişkilendirilebilen bir uzantı.':'The domain extension can be associated with abuse.','Alan adında olağandışı karakter/sayı kullanımı var.':'The domain contains unusual characters or numbers.','URL içinde kullanıcı adı/şifre bölümü bulunuyor.':'The URL contains a username/password section.'} as Record<string,string>)[signal] ?? signal : signal}</li>)}</ul><p className="mt-3 text-sm text-muted-foreground">{language === 'en' ? ({'Açma ve bilgi girme. Kurumu resmi uygulama/site üzerinden kendin açarak doğrula.':'Do not open it or enter information. Open the official app/site yourself to verify the organization.','Acele etme; alan adını ve göndereni bağımsız bir kanaldan doğrula.':'Do not rush; verify the domain and sender independently.','Belirgin URL sinyali az. Bu analiz güvenlik garantisi değildir.':'There are few obvious URL signals. This is not a security guarantee.','Bağlantıyı açmadan önce göndereni doğrula.':'Verify the sender before opening the link.'} as Record<string,string>)[urlAnalysis.recommendation] ?? urlAnalysis.recommendation : urlAnalysis.recommendation}</p></div>}
          </ToolCard>

          <ToolCard icon={Wallet} title={t.budget} description={t.budgetDesc}>
            <div className="grid grid-cols-2 gap-2 text-sm"><Metric label={t.income} value={budget.income} /><Metric label={t.expenses} value={budget.expenses} /><Metric label={t.debt} value={budget.debt} /><Metric label={t.saving} value={budget.saving} /></div><div className="mt-3 flex items-center justify-between rounded-xl bg-muted/40 p-3"><span>{t.balance}</span><strong>{budget.balance.toLocaleString(language === 'en' ? 'en-US' : 'tr-TR')} TL</strong></div><p className="mt-2 text-xs text-muted-foreground">{t.savingRate}: %{budget.savingRate}. {t.financeNote}</p>
          </ToolCard>

          <ToolCard icon={ListTodo} title={t.tracker} description={t.trackerDesc}>
            <div className="space-y-2 text-sm"><StatusRow label={t.tasks} value={`${activeTasks} ${t.active}`} /><StatusRow label={t.prices} value={`${activeTracks} ${t.active}`} /><StatusRow label={t.alerts} value={`${unread} ${language === 'en' ? 'new' : 'yeni'}`} /></div><button onClick={() => navigate('/izci')} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">{t.openIzci} <ArrowRight className="h-4 w-4" /></button>
          </ToolCard>
        </section>

        <section><div className="mb-4"><h2 className="text-xl font-bold">{t.capabilities}</h2><p className="text-sm text-muted-foreground">{t.capabilitiesDesc}</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{ATLAS_CAPABILITIES.map((capability) => { const Icon = ICONS[capability.id]; return <button key={capability.id} onClick={() => ask(capability.examples[0])} className="group rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><h3 className="font-semibold">{capabilityText(capability.id, capability.title, capability.description)[0]}</h3><p className="mt-1 text-sm text-muted-foreground">{capabilityText(capability.id, capability.title, capability.description)[1]}</p></button>; })}</div></section>
      </div>
    </main>
  );
}

function ToolCard({ icon: Icon, title, description, children }: { icon: typeof Bot; title: string; description: string; children: React.ReactNode }) { return <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-3"><Icon className="h-5 w-5 text-primary" /><div><h2 className="font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div></div>{children}</div>; }
function Stat({ icon: Icon, label, value }: { icon: typeof Bot; label: string; value: number }) { return <div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span className="text-sm">{label}</span></div><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value.toLocaleString('tr-TR')} TL</p></div>; }
function StatusRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-3"><span>{label}</span><span className="flex items-center gap-1 text-muted-foreground"><CheckCircle2 className="h-4 w-4" />{value}</span></div>; }