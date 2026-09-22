export interface OfflineAction {
  title: string;
  reason: string;
  priority: number;
}

export interface OfflinePlanStep {
  label: "Şimdi" | "Bugün" | "Sonraki adım" | "Hedef";
  title: string;
  detail: string;
  estimatedMinutes?: number;
}

export interface OfflinePlan {
  objective: string;
  steps: OfflinePlanStep[];
}

export interface OfflineAnalysisOptions {
  category?: string;
  goal?: string;
  urgency?: number;
  budget?: number;
  availableHours?: number;
}

export interface OfflineResult {
  problem: string;
  category: string;
  goal: string;
  priority: "critical" | "high" | "normal";
  phase: "understand" | "stabilize" | "prioritize" | "act";
  decisionBasis: string[];
  plan: OfflinePlan;
  diagnosis: string;
  actions: OfflineAction[];
  nextQuestion: string;
}

const rules = [
  { category: "money", goal: "find_money", words: ["para", "borç", "borc", "maaş", "nakit", "ödeme"] },
  { category: "bills", goal: "reduce_cost", words: ["fatura", "elektrik", "su", "internet", "doğalgaz", "abonelik"] },
  { category: "time", goal: "save_time", words: ["zaman", "yetiş", "yoğun", "vakit", "çok iş"] },
  { category: "decision", goal: "make_decision", words: ["hangisi", "karar", "seç", "almalı"] },
  { category: "family", goal: "organize", words: ["çocuk", "aile", "eş", "bebek"] },
  { category: "work", goal: "prioritize", words: ["iş", "mesai", "vardiya", "patron"] },
  { category: "vehicle", goal: "reduce_cost", words: ["araba", "araç", "motor", "lastik", "akü", "servis", "yakıt"] },
  { category: "travel", goal: "organize", words: ["seyahat", "uçuş", "uçak", "otobüs", "otel", "bilet", "yolculuk"] },
  { category: "moving", goal: "organize", words: ["taşınma", "taşınıyorum", "ev taşı", "nakliye", "depozito"] },
  { category: "home", goal: "solve", words: ["ev", "tamir", "bozuk", "eşya", "temizlik", "tesisat"] },
];

function pick(text: string, options?: OfflineAnalysisOptions) {
  if (options?.category) {
    const forced = rules.find((rule) => rule.category === options.category);
    if (forced) return { score: 100, rule: forced };
  }
  const t = text.toLocaleLowerCase("tr-TR");
  return rules.reduce((best, rule) => {
    const score = rule.words.reduce((n, word) => n + (t.includes(word) ? 1 : 0), 0);
    return score > best.score ? { score, rule } : best;
  }, { score: 0, rule: rules[0] });
}

function phaseFrom(text: string): OfflineResult["phase"] {
  const t = text.toLocaleLowerCase("tr-TR");
  if (/yaptım|hallettim|çözdüm|ödedim|iptal ettim/.test(t)) return "act";
  if (/öncelik|hangisi önce|ilk olarak|şimdi/.test(t)) return "prioritize";
  if (/elimde|kaldı|bütçe|param var|ödeyebilirim|vaktim var/.test(t)) return "stabilize";
  return "understand";
}

function buildPlan(category: string, actions: OfflineAction[], phase: OfflineResult["phase"]): OfflinePlan {
  const first = actions[0];
  const second = actions[1];
  const third = actions[2];
  const objective =
    category === "money" ? "Nakit baskısını azaltıp en kritik ödemeyi güvenceye almak." :
    category === "bills" ? "Ödemeleri son tarih ve sonuçlarına göre sadeleştirmek." :
    category === "time" ? "Kısıtlı zamanı en önemli sonuca yönlendirmek." :
    category === "decision" ? "Belirsizliği azaltıp uygulanabilir bir karar vermek." :
    category === "vehicle" ? "Güvenliği koruyup araç kaynaklı toplam maliyeti kontrol etmek." :
    category === "travel" ? "Seyahati tarih, maliyet ve risk açısından kontrol altına almak." :
    category === "moving" ? "Taşınmayı zaman, nakit ve zorunluluk sırasına göre yönetmek." :
    category === "home" ? "Evdeki baskıyı önce güvenli şekilde azaltıp kalıcı çözümü netleştirmek." :
    "Sorunun ana baskısını azaltıp kontrolü geri kazanmak.";
  return {
    objective,
    steps: [
      {
        label: "Şimdi",
        title: phase === "act" ? "Sonucu doğrula" : (first?.title ?? "İlk adımı seç"),
        detail: phase === "act"
          ? "Yaptığın işlemin sorunu gerçekten azaltıp azaltmadığını kontrol et."
          : (first?.reason ?? "Sonucu en çok değiştirecek ilk adıma odaklan."),
        estimatedMinutes: 20,
      },
      {
        label: "Bugün",
        title: second?.title ?? "Kısıtları netleştir",
        detail: second?.reason ?? "Bugün uygulanabilecek seçenekleri ayır.",
        estimatedMinutes: 30,
      },
      {
        label: "Sonraki adım",
        title: third?.title ?? "Planı yeniden değerlendir",
        detail: third?.reason ?? "İlk adımdan sonra yeni duruma göre yönünü güncelle.",
      },
      {
        label: "Hedef",
        title: "Kontrolü geri al",
        detail: category === "money"
          ? "Zorunlu ödemeler ayrılmış ve nakit açığı için net bir yol oluşmuş olsun."
          : category === "time"
            ? "Kritik iş tamamlanmış ve kalan işler sıraya girmiş olsun."
            : "Sorunun ana baskısı azaltılmış ve sonraki karar netleşmiş olsun.",
      },
    ],
  };
}

export function analyzeOffline(problem: string, options?: OfflineAnalysisOptions): OfflineResult {
  const selected = pick(problem, options);
  const constraints: string[] = [];
  const moneyMatches = problem.toLocaleLowerCase("tr-TR").matchAll(/(\d{1,3}(?:[. ]\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:tl|₺|lira)/gi);
  const amounts = Array.from(moneyMatches, (m) => Number(m[1].replace(/\s/g, "").replace(/\./g, "").replace(",", "."))).filter(Number.isFinite);
  if (amounts.length) constraints.push("Konuşmada geçen tutarlar: " + amounts.slice(0, 3).map((n) => n.toLocaleString("tr-TR") + " TL").join(" / "));
  if (options?.budget !== undefined) constraints.push("Bütçe: " + options.budget.toLocaleString("tr-TR") + " TL");
  if (options?.availableHours !== undefined) constraints.push("Bugün ayrılabilecek zaman: " + options.availableHours + " saat");
  if (/bugün/i.test(problem)) constraints.push("Son tarih: bugün");
  else if (/yarın/i.test(problem)) constraints.push("Son tarih: yarın");
  if (options?.urgency !== undefined) constraints.push("Aciliyet: " + options.urgency + "/10");
  const urgent = options?.urgency !== undefined ? options.urgency >= 8 : /(acil|hemen|bugün|yarın|son gün)/i.test(problem);
  const urgent = /(acil|hemen|bugün|yarın|son gün)/i.test(problem);
  const priority = urgent ? "critical" : options?.urgency !== undefined && options.urgency >= 6 ? "high" : "normal";
  const phase = phaseFrom(problem);
  const common: Record<string, OfflineAction[]> = {
    money: [
      { title: "Açığı netleştir", reason: "Eksik kalan tutarı tek rakama indir.", priority: 1 },
      { title: "Zorunlu olmayan giderleri ayır", reason: "Kısa vadeli nakit çıkışını azalt.", priority: 2 },
      { title: "Ertelenebilir ödemeleri listele", reason: "Vade baskısını görünür hale getir.", priority: 3 },
    ],
    bills: [
      { title: "Son tarihleri sırala", reason: "Gecikme riski en yüksek ödemeyi önce gör.", priority: 1 },
      { title: "Tekrarlayan giderleri kontrol et", reason: "Kullanılmayan abonelikleri ayır.", priority: 2 },
      { title: "Daha düşük maliyetli alternatifleri karşılaştır", reason: "Aynı ihtiyacı daha düşük maliyetle karşılamayı araştır.", priority: 3 },
    ],
    time: [
      { title: "Tek sonraki adımı seç", reason: "Karar yükünü azalt.", priority: 1 },
      { title: "Düşük etkili işleri ertele", reason: "Kritik sonucu koru.", priority: 2 },
      { title: "Devredilebilecek işi ayır", reason: "Zamanı geri kazan.", priority: 3 },
    ],
    decision: [
      { title: "Kriterleri belirle", reason: "Seçenekleri aynı ölçekte karşılaştır.", priority: 1 },
      { title: "Kritik eksik bilgiyi bul", reason: "Gereksiz araştırmayı azalt.", priority: 2 },
      { title: "Geri dönüşü kolay seçeneği işaretle", reason: "Belirsizlik riskini azalt.", priority: 3 },
    ],
    family: [
      { title: "Çocuğu/aileyi etkileyen sonucu önce belirle", reason: "Aile üzerindeki doğrudan etkiyi koru.", priority: 1 },
      { title: "Acil ve ertelenebilir işleri ayır", reason: "Gereksiz yükü azalt.", priority: 2 },
      { title: "Destek alınabilecek işi belirle", reason: "Tüm yükün tek kişide kalmasını önle.", priority: 3 },
    ],
    work: [
      { title: "Bugünün kritik işini seç", reason: "Önceliği netleştir.", priority: 1 },
      { title: "Devredilebilir işi ayır", reason: "Kapasiteyi koru.", priority: 2 },
      { title: "Son tarihleri sırala", reason: "Gecikme riskini azalt.", priority: 3 },
    ],
    vehicle: [
      { title: "Güvenlik riskini ayır", reason: "Fren, lastik, direksiyon veya ciddi uyarıları masraf optimizasyonundan önce değerlendir.", priority: 1 },
      { title: "Toplam araç maliyetini çıkar", reason: "Parça, işçilik, çekici ve tekrar masrafını birlikte düşün.", priority: 2 },
      { title: "Alternatif ulaşımı karşılaştır", reason: "Aracı kullanmamanın geçici ulaşım maliyetini de hesaba kat.", priority: 3 },
    ],
    travel: [
      { title: "Tarihi ve zorunlu varış saatini sabitle", reason: "Esnek ve zorunlu parçaları ayırmadan seçim yapma.", priority: 1 },
      { title: "Toplam yol maliyetini hesapla", reason: "Biletin yanında bagaj, transfer ve konaklama giderlerini de hesaba kat.", priority: 2 },
      { title: "B planını hazırla", reason: "İptal veya gecikme halinde kullanabileceğin alternatifi belirle.", priority: 3 },
    ],
    moving: [
      { title: "Taşınma tarihini ve zorunlu ödemeleri çıkar", reason: "Kira, depozito, nakliye ve abonelikleri aynı zaman çizelgesine koy.", priority: 1 },
      { title: "Taşınma maliyetini kalemlere böl", reason: "Nakit baskısını hangi kalemin oluşturduğunu görünür yap.", priority: 2 },
      { title: "Ertelenebilir işleri ayır", reason: "İlk gün gerekli olmayan masraf ve işleri sonraya bırak.", priority: 3 },
    ],
    home: [
      { title: "Güvenlik ve hasar riskini kontrol et", reason: "Su, elektrik veya daha büyük hasar riskini önce durdur.", priority: 1 },
      { title: "Tamir mi değişim mi karşılaştır", reason: "Parça, işçilik ve kullanım ömrünü birlikte değerlendir.", priority: 2 },
      { title: "Geçici çözümü belirle", reason: "Kalıcı çözüm zaman alıyorsa güvenli geçici seçeneği ayır.", priority: 3 },
    ],
  };
  const actions = common[selected.rule.category] ?? common.decision;
  return {
    problem,
    category: selected.rule.category,
    goal: options?.goal ?? selected.rule.goal,
    priority,
    phase,
    decisionBasis: [
      ...(amounts.length ? ["Konuşmada geçen parasal tutarlar"] : []),
      ...(options?.budget !== undefined ? ["Belirtilen bütçe"] : []),
      ...(options?.availableHours !== undefined ? ["Belirtilen zaman kapasitesi"] : []),
      ...(urgent ? ["Yüksek aciliyet"] : []),
      ...(constraints.some((item) => item.startsWith("Son tarih")) ? ["Yakın son tarih"] : []),
    ].length ? [
      ...(amounts.length ? ["Konuşmada geçen parasal tutarlar"] : []),
      ...(options?.budget !== undefined ? ["Belirtilen bütçe"] : []),
      ...(options?.availableHours !== undefined ? ["Belirtilen zaman kapasitesi"] : []),
      ...(urgent ? ["Yüksek aciliyet"] : []),
      ...(constraints.some((item) => item.startsWith("Son tarih")) ? ["Yakın son tarih"] : []),
    ] : ["Sorunun hedefi ve mevcut kısıtlar"],
    plan: buildPlan(selected.rule.category, actions, phase),
    diagnosis:
      selected.rule.category === "vehicle"
        ? "Önce güvenlik riskini ayıracağız; ardından tamir ve alternatif ulaşım maliyetini birlikte değerlendireceğiz."
        : selected.rule.category === "travel"
          ? "Önce tarih ve zorunlu varış saatini sabitleyeceğiz; sonra toplam seyahat maliyetini ve B planını çıkaracağız."
          : selected.rule.category === "moving"
            ? "Önce taşınma tarihini ve zorunlu ödemeleri sabitleyeceğiz; sonra nakit ve zaman baskısını azaltacağız."
            : selected.rule.category === "home"
              ? "Önce güvenlik ve daha büyük hasar riskini kontrol edeceğiz; sonra tamir, değişim veya geçici çözümü karşılaştıracağız."
              : selected.rule.category === "money"
                ? "Burada önce gelir, zorunlu gider ve yaklaşan ödemeyi aynı tabloya koyup gerçek açığı bulacağız."
                : "Önce tabloyu sadeleştirelim. Sonucu en çok değiştirecek noktayı bulup planı buna göre şekillendireceğim.",
    actions,
    constraints,
    nextQuestion: selected.rule.category === "money"
      ? "Şu an elinde kullanılabilir ne kadar para var ve en yakın zorunlu ödeme yaklaşık ne kadar?"
      : selected.rule.category === "vehicle"
        ? "Araç şu an güvenli şekilde kullanılabiliyor mu ve tahmini masraf ne kadar?"
        : selected.rule.category === "travel"
          ? "Seyahatin kesin tarihi ve mutlaka yetişmen gereken saat nedir?"
          : selected.rule.category === "moving"
            ? "Taşınma tarihi ne ve kira, depozito, nakliye için ayırdığın toplam bütçe ne kadar?"
            : selected.rule.category === "home"
              ? "Sorun güvenlik, su/elektrik veya daha büyük hasar riski oluşturuyor mu?"
              : "Bunu doğru yönlendirebilmem için sonucu en çok değiştiren kısıt ne: para, zaman, son tarih veya başka bir şey mi?",
  };
}
