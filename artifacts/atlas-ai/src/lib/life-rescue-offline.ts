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
  language?: "tr" | "en";
}

export interface OfflineResult {
  problem: string;
  category: string;
  goal: string;
  priority: "critical" | "high" | "normal";
  phase: "understand" | "stabilize" | "prioritize" | "act";
  decisionBasis: string[];
  constraints: string[];
  plan: OfflinePlan;
  diagnosis: string;
  actions: OfflineAction[];
  nextQuestion: string;
}

const rules = [
  { category: "money", goal: "find_money", words: ["para", "borç", "borc", "maaş", "nakit", "ödeme", "money", "debt", "salary", "cash", "payment"] },
  { category: "bills", goal: "reduce_cost", words: ["fatura", "elektrik", "su", "internet", "doğalgaz", "abonelik", "bill", "electricity", "water", "subscription"] },
  { category: "time", goal: "save_time", words: ["zaman", "yetiş", "yoğun", "vakit", "çok iş", "time", "deadline", "busy", "tasks"] },
  { category: "decision", goal: "make_decision", words: ["hangisi", "karar", "seç", "almalı", "decision", "choose", "option", "which"] },
  { category: "family", goal: "organize", words: ["çocuk", "aile", "eş", "bebek", "family", "child", "baby", "spouse"] },
  { category: "work", goal: "prioritize", words: ["iş", "mesai", "vardiya", "patron", "work", "shift", "boss", "job"] },
  { category: "vehicle", goal: "reduce_cost", words: ["araba", "araç", "motor", "lastik", "akü", "servis", "yakıt", "car", "vehicle", "engine", "tire", "battery", "fuel"] },
  { category: "travel", goal: "organize", words: ["seyahat", "uçuş", "uçak", "otobüs", "otel", "bilet", "yolculuk", "travel", "flight", "plane", "bus", "hotel", "ticket", "trip"] },
  { category: "moving", goal: "organize", words: ["taşınma", "taşınıyorum", "ev taşı", "nakliye", "depozito", "moving", "move", "moving house", "deposit"] },
  { category: "home", goal: "solve", words: ["ev", "tamir", "bozuk", "eşya", "temizlik", "tesisat", "home", "repair", "broken", "plumbing", "cleaning"] },
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

function buildPlan(category: string, actions: OfflineAction[], phase: OfflineResult["phase"], amounts: number[] = []): OfflinePlan {
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
  const moneyDetail = amounts.length >= 2
    ? (() => {
        const gap = amounts[1] - amounts[0];
        if (gap > 0) return `Şu an yaklaşık ${amounts[0].toLocaleString("tr-TR")} TL var ve yaklaşık ${amounts[1].toLocaleString("tr-TR")} TL gerekiyor; yaklaşık ${gap.toLocaleString("tr-TR")} TL açık var.`;
        return `Verilen rakamlara göre yaklaşık ${amounts[0].toLocaleString("tr-TR")} TL kullanılabilir para, ${amounts[1].toLocaleString("tr-TR")} TL zorunlu ödeme var.`;
      })()
    : undefined;

  return {
    objective,
    steps: [
      {
        label: "Şimdi",
        title: phase === "act" ? "Sonucu doğrula" : (first?.title ?? "İlk adımı seç"),
        detail: phase === "act"
          ? "Yaptığın işlemin sorunu gerçekten azaltıp azaltmadığını kontrol et."
          : (moneyDetail ?? first?.reason ?? "Sonucu en çok değiştirecek ilk adıma odaklan."),
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

const enText: Record<string, string> = {
  "Açığı netleştir":"Clarify the cash gap","Eksik kalan tutarı tek rakama indir.":"Reduce the missing amount to one clear number.",
  "Zorunlu olmayan giderleri ayır":"Separate non-essential expenses","Kısa vadeli nakit çıkışını azalt.":"Reduce short-term cash outflow.",
  "Ertelenebilir ödemeleri listele":"List deferrable payments","Vade baskısını görünür hale getir.":"Make payment pressure visible.",
  "Son tarihleri sırala":"Sort by due date","Gecikme riski en yüksek ödemeyi önce gör.":"See the payment with the highest late-payment risk first.",
  "Tekrarlayan giderleri kontrol et":"Review recurring expenses","Kullanılmayan abonelikleri ayır.":"Identify unused subscriptions.",
  "Daha düşük maliyetli alternatifleri karşılaştır":"Compare lower-cost alternatives","Aynı ihtiyacı daha düşük maliyetle karşılamayı araştır.":"Look for a lower-cost way to meet the same need.",
  "Tek sonraki adımı seç":"Choose the next step","Karar yükünü azalt.":"Reduce decision load.",
  "Düşük etkili işleri ertele":"Delay low-impact tasks","Kritik sonucu koru.":"Protect the critical outcome.",
  "Devredilebilecek işi ayır":"Separate delegable work","Zamanı geri kazan.":"Recover time.",
  "Kriterleri belirle":"Define the criteria","Seçenekleri aynı ölçekte karşılaştır.":"Compare options on the same scale.",
  "Kritik eksik bilgiyi bul":"Find the critical missing information","Gereksiz araştırmayı azalt.":"Reduce unnecessary research.",
  "Geri dönüşü kolay seçeneği işaretle":"Mark the easiest-to-reverse option","Belirsizlik riskini azalt.":"Reduce uncertainty risk.",
  "Bugünün kritik işini seç":"Choose today's critical task","Önceliği netleştir.":"Clarify the priority.",
  "Devredilebilir işi ayır":"Separate delegable work","Kapasiteyi koru.":"Protect capacity.",
  "Son tarihleri sırala":"Sort deadlines","Gecikme riskini azalt.":"Reduce late risk.",
  "Güvenlik riskini ayır":"Separate safety risk","Fren, lastik, direksiyon veya ciddi uyarıları masraf optimizasyonundan önce değerlendir.":"Check brakes, tires, steering and serious warnings before optimizing cost.",
  "Toplam araç maliyetini çıkar":"Calculate total vehicle cost","Parça, işçilik, çekici ve tekrar masrafını birlikte düşün.":"Include parts, labor, towing and possible repeat costs.",
  "Alternatif ulaşımı karşılaştır":"Compare alternative transport","Aracı kullanmamanın geçici ulaşım maliyetini de hesaba kat.":"Include temporary transport costs if you cannot use the vehicle.",
  "Tarihi ve zorunlu varış saatini sabitle":"Lock the date and required arrival time","Esnek ve zorunlu parçaları ayırmadan seçim yapma.":"Separate fixed requirements from flexible choices before deciding.",
  "Toplam yol maliyetini hesapla":"Calculate total travel cost","Biletin yanında bagaj, transfer ve konaklama giderlerini de hesaba kat.":"Include baggage, transfers and accommodation, not just the ticket.",
  "B planını hazırla":"Prepare a backup plan","İptal veya gecikme halinde kullanabileceğin alternatifi belirle.":"Identify an alternative for cancellation or delay.",
  "Taşınma tarihini ve zorunlu ödemeleri çıkar":"Map the move date and mandatory payments","Kira, depozito, nakliye ve abonelikleri aynı zaman çizelgesine koy.":"Put rent, deposit, moving and subscriptions on one timeline.",
  "Taşınma maliyetini kalemlere böl":"Break moving costs into line items","Nakit baskısını hangi kalemin oluşturduğunu görünür yap.":"Identify which cost is creating the cash pressure.",
  "Ertelenebilir işleri ayır":"Separate deferrable tasks","İlk gün gerekli olmayan masraf ve işleri sonraya bırak.":"Delay costs and tasks that are not needed on day one.",
  "Güvenlik ve hasar riskini kontrol et":"Check safety and damage risk","Su, elektrik veya daha büyük hasar riskini önce durdur.":"Stop water, electrical or further-damage risks first.",
  "Tamir mi değişim mi karşılaştır":"Compare repair vs replacement","Parça, işçilik ve kullanım ömrünü birlikte değerlendir.":"Consider parts, labor and useful life together.",
  "Geçici çözümü belirle":"Identify a temporary solution","Kalıcı çözüm zaman alıyorsa güvenli geçici seçeneği ayır.":"If the permanent fix takes time, identify a safe temporary option.",
  "Çocuğu/aileyi etkileyen sonucu önce belirle":"Identify the family impact first","Aile üzerindeki doğrudan etkiyi koru.":"Protect the direct impact on the family.",
  "Acil ve ertelenebilir işleri ayır":"Separate urgent and deferrable tasks","Gereksiz yükü azalt.":"Reduce unnecessary load.",
  "Destek alınabilecek işi belirle":"Identify what can be supported","Tüm yükün tek kişide kalmasını önle.":"Avoid keeping the whole load on one person.",
  "Sorunun ana baskısını azaltıp kontrolü geri kazanmak.":"Reduce the main pressure and regain control.",
  "Nakit baskısını azaltıp en kritik ödemeyi güvenceye almak.":"Reduce cash pressure and secure the most critical payment.",
  "Ödemeleri son tarih ve sonuçlarına göre sadeleştirmek.":"Simplify payments by deadline and consequence.",
  "Kısıtlı zamanı en önemli sonuca yönlendirmek.":"Direct limited time toward the most important outcome.",
  "Belirsizliği azaltıp uygulanabilir bir karar vermek.":"Reduce uncertainty and make a practical decision.",
  "Güvenliği koruyup araç kaynaklı toplam maliyeti kontrol etmek.":"Protect safety and control total vehicle cost.",
  "Seyahati tarih, maliyet ve risk açısından kontrol altına almak.":"Control the trip by date, cost and risk.",
  "Taşınmayı zaman, nakit ve zorunluluk sırasına göre yönetmek.":"Manage the move by time, cash and necessity.",
  "Evdeki baskıyı önce güvenli şekilde azaltıp kalıcı çözümü netleştirmek.":"Reduce the pressure at home safely first, then clarify the lasting solution.",
  "Sonucu doğrula":"Verify the result","Yaptığın işlemin sorunu gerçekten azaltıp azaltmadığını kontrol et.":"Check whether the action actually reduced the problem.",
  "İlk adımı seç":"Choose the first step","Sonucu en çok değiştirecek ilk adıma odaklan.":"Focus on the first step that changes the outcome most.",
  "Kısıtları netleştir":"Clarify constraints","Bugün uygulanabilecek seçenekleri ayır.":"Separate options that can be applied today.",
  "Planı yeniden değerlendir":"Reassess the plan","İlk adımdan sonra yeni duruma göre yönünü güncelle.":"Update direction based on the new situation after the first step.",
  "Kontrolü geri al":"Regain control","Sorunun ana baskısı azaltılmış ve sonraki karar netleşmiş olsun.":"Reduce the main pressure and make the next decision clear.",
  "Zorunlu ödemeler ayrılmış ve nakit açığı için net bir yol oluşmuş olsun.":"Separate mandatory payments and establish a clear path for the cash gap.",
  "Kritik iş tamamlanmış ve kalan işler sıraya girmiş olsun.":"Complete the critical task and put the remaining tasks in order.",
  "Konuşmada geçen parasal tutarlar":"Amounts mentioned in the conversation","Belirtilen bütçe":"Stated budget","Belirtilen zaman kapasitesi":"Stated time capacity","Yüksek aciliyet":"High urgency","Yakın son tarih":"Near deadline","Sorunun hedefi ve mevcut kısıtlar":"Problem goal and current constraints"
};

function englishizeResult(result: OfflineResult): OfflineResult {
  const tr = (value: string) => enText[value] ?? value;
  return {
    ...result,
    goal: result.goal,
    diagnosis:
      result.category === "money"
        ? (result.constraints.length && /Konuşmada geçen/.test(result.constraints[0])
          ? "We'll first map the available money and required payments, then identify the real gap and which payment must come first."
          : "We'll put income, mandatory expenses and upcoming payments into one picture and find the real gap.")
        : result.category === "vehicle"
          ? "We'll separate safety risk first, then compare repair and alternative transport costs."
          : result.category === "travel"
            ? "We'll lock down the date and required arrival time first, then work out total travel cost and a backup plan."
            : result.category === "moving"
              ? "We'll lock down the move date and mandatory payments first, then reduce cash and time pressure."
              : result.category === "home"
                ? "We'll check safety and further-damage risk first, then compare repair, replacement and temporary solutions."
                : "We'll simplify the situation first, identify what changes the outcome most, and build the plan around it.",
    constraints: result.constraints.map((c) => c.startsWith("Konuşmada geçen parasal tutarlar:")
      ? c.replace("Konuşmada geçen parasal tutarlar:", "Amounts mentioned:").replace(/ TL/g, " TL")
      : c.startsWith("Bütçe:")
        ? c.replace("Bütçe:", "Budget:")
        : c.startsWith("Bugün ayrılabilecek zaman:")
          ? c.replace("Bugün ayrılabilecek zaman:", "Time available today:")
          : c.startsWith("Son tarih:")
            ? c.replace("Son tarih:", "Deadline:")
            : tr(c)),
    decisionBasis: result.decisionBasis.map(tr),
    actions: result.actions.map((a) => ({ ...a, title: tr(a.title), reason: tr(a.reason) })),
    plan: {
      objective: tr(result.plan.objective),
      steps: result.plan.steps.map((s) => ({
        ...s,
        label: s.label === "Şimdi" ? "Now" as never : s.label === "Bugün" ? "Today" as never : s.label === "Sonraki adım" ? "Next step" as never : "Goal" as never,
        title: tr(s.title),
        detail: tr(s.detail),
      })),
    },
    nextQuestion:
      result.category === "money"
        ? "Which of these payments truly cannot be delayed, and what are their due dates?"
        : result.category === "vehicle"
          ? "Can the vehicle be used safely right now, and what is the estimated cost?"
          : result.category === "travel"
            ? "What is the exact travel date and what time do you absolutely need to arrive?"
            : result.category === "moving"
              ? "What is the move date, and what total budget do you have for rent, deposit and moving?"
              : result.category === "home"
                ? "Does the problem create a safety, water, electrical, or further-damage risk?"
                : "What constraint changes the outcome most: money, time, deadline, or something else?",
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
  const result: OfflineResult = {
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
    plan: buildPlan(selected.rule.category, actions, phase, amounts),
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
                ? amounts.length >= 2
                  ? `Şu an yaklaşık ${amounts[0].toLocaleString("tr-TR")} TL kullanılabilir para ve ${amounts[1].toLocaleString("tr-TR")} TL zorunlu ödeme görünüyor. Yaklaşık ${Math.max(amounts[1] - amounts[0], 0).toLocaleString("tr-TR")} TL açık varsa önce hangi ödemenin kritik olduğunu ayırıp açığı nasıl kapatacağımızı planlayacağız.`
                  : "Burada önce gelir, zorunlu gider ve yaklaşan ödemeyi aynı tabloya koyup gerçek açığı bulacağız."
                : "Önce tabloyu sadeleştirelim. Sonucu en çok değiştirecek noktayı bulup planı buna göre şekillendireceğim.",
    actions,
    constraints,
    nextQuestion: selected.rule.category === "money"
      ? amounts.length >= 2
        ? "Bu zorunlu ödemelerin içinde hangileri gerçekten ertelenemez ve son tarihleri ne?"
        : "Şu an elinde kullanılabilir ne kadar para ve en yakın zorunlu ödeme yaklaşık ne kadar?"
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
  return options?.language === "en" ? englishizeResult(result) : result;
}
