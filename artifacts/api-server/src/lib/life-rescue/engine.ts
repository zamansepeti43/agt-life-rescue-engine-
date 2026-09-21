import { matchScenario } from "./scenarios.js";
import type {
  RescueAction,
  RescueCategory,
  RescueGoal,
  RescueInput,
  RescueResult,
  RescuePlan,
} from "./types.js";

const categoryHints: Record<RescueCategory, string[]> = {
  money: ["para", "borç", "borc", "maaş", "gelir", "ödeme", "ödemem", "nakit"],
  home: ["ev", "kira", "tamir", "buzdolabı", "çamaşır", "evde"],
  family: ["çocuk", "aile", "eş", "bebek", "okul"],
  work: ["iş", "maaş", "mesai", "vardiya", "patron", "işveren"],
  vehicle: ["araba", "araç", "motor", "lastik", "akü", "yakıt"],
  time: ["zaman", "yetiş", "yoğun", "vakit", "süre"],
  bills: ["fatura", "abonelik", "internet", "elektrik", "su", "doğalgaz"],
  travel: ["seyahat", "uçak", "otel", "tatil", "yolculuk"],
  moving: ["taşın", "taşınma", "ev değiştir", "nakliye"],
  decision: ["hangisi", "karar", "seç", "seçmeli", "almalı"],
  other: [],
};

const goalHints: Record<RescueGoal, string[]> = {
  find_money: ["para bul", "nakit", "gelir", "ek gelir", "kazan"],
  reduce_cost: ["azalt", "ucuz", "tasarruf", "masraf", "maliyet"],
  save_time: ["zaman kazan", "yetiş", "hızlı", "vakit"],
  prioritize: ["öncelik", "önce", "hangisini"],
  make_decision: ["karar", "hangisi", "seç"],
  cancel: ["iptal", "kapat", "vazgeç"],
  organize: ["düzenle", "organize", "planla"],
  solve: ["çöz", "sorun", "problem", "ne yap"],
};

const actionLabels: Record<RescueAction["type"], string> = {
  reduce: "Azalt",
  delay: "Ertele",
  cancel: "İptal et",
  rearrange: "Yeniden düzenle",
  earn: "Ek gelir",
  do_now: "Şimdi yap",
  ask_help: "Destek iste",
  compare: "Karşılaştır",
};

function normalize(value: string): string {
  return value.toLocaleLowerCase("tr-TR");
}

function detectByHints<T extends string>(
  text: string,
  hints: Record<T, string[]>,
  fallback: T,
): T {
  const normalized = normalize(text);
  let best = fallback;
  let score = 0;

  for (const [key, words] of Object.entries(hints) as [T, string[]][]) {
    const current = words.reduce(
      (total, word) => total + (normalized.includes(word) ? 1 : 0),
      0,
    );
    if (current > score) {
      score = current;
      best = key;
    }
  }

  return best;
}

function extractMoney(text: string): number[] {
  const values: number[] = [];
  const matches = text.toLocaleLowerCase("tr-TR").matchAll(/(\d{1,3}(?:[. ]\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:tl|₺|lira)/gi);
  for (const match of matches) {
    const raw = match[1].replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const value = Number(raw);
    if (Number.isFinite(value)) values.push(value);
  }
  return values;
}

function extractTimeConstraint(text: string): string | undefined {
  const normalized = normalize(text);
  if (/bugün/.test(normalized)) return "Son tarih: bugün";
  if (/yarın/.test(normalized)) return "Son tarih: yarın";
  const days = normalized.match(/(\d+)\s*gün/);
  if (days) return `Zaman kısıtı: ${days[1]} gün`;
  const hours = normalized.match(/(\d+(?:[.,]\d+)?)\s*saat/);
  if (hours) return `Zaman kısıtı: ${hours[1].replace(",", ".")} saat`;
  return undefined;
}

function priorityFrom(input: RescueInput): RescueResult["priority"] {
  if ((input.urgency ?? 0) >= 9) return "critical";
  if ((input.urgency ?? 0) >= 6) return "high";

  const text = normalize(input.problem);
  if (/(bugün|acil|hemen|son gün|yarın)/.test(text)) return "high";
  if (input.budget !== undefined && input.budget <= 0 && /para|borç|fatura|ödeme/.test(text)) return "high";

  return "normal";
}

function buildConstraints(input: RescueInput): string[] {
  const constraints: string[] = [];
  if (input.budget !== undefined) constraints.push(`Bütçe: ${input.budget.toLocaleString("tr-TR")} TL`);
  if (input.availableHours !== undefined) constraints.push(`Zaman: ${input.availableHours} saat`);
  const amounts = extractMoney(input.problem);
  if (amounts.length >= 2) constraints.push(`Metinde geçen tutarlar: ${amounts.slice(0, 3).map((value) => `${value.toLocaleString("tr-TR")} TL`).join(" / ")}`);
  const timeConstraint = extractTimeConstraint(input.problem);
  if (timeConstraint) constraints.push(timeConstraint);
  constraints.push(`Aciliyet: ${input.urgency ?? 5}/10`);
  return [...new Set(constraints)];
}

function phaseFrom(text: string): RescueResult["phase"] {
  const normalized = normalize(text);
  if (/yaptım|hallettim|çözdüm|tamamlandı|ödedim|iptal ettim/.test(normalized)) return "act";
  if (/şimdi|öncelik|hangisi önce|ilk olarak/.test(normalized)) return "prioritize";
  if (/elimde|kaldı|bütçe|param var|ödeyebilirim|vaktim var/.test(normalized)) return "stabilize";
  return "understand";
}

function buildDecisionBasis(input: RescueInput, constraints: string[]): string[] {
  const basis: string[] = [];
  if (constraints.some((item) => item.startsWith("Metinde geçen tutarlar"))) basis.push("Konuşmada geçen parasal tutarlar");
  if (constraints.some((item) => item.startsWith("Son tarih"))) basis.push("Yakın son tarih");
  if (input.budget !== undefined) basis.push("Belirtilen bütçe");
  if (input.availableHours !== undefined) basis.push("Belirtilen zaman kapasitesi");
  if (input.urgency !== undefined && input.urgency >= 6) basis.push("Yüksek aciliyet");
  if (basis.length === 0) basis.push("Sorunun hedefi ve mevcut kısıtlar");
  return [...new Set(basis)];
}

function buildRescuePlan(
  category: RescueCategory,
  goal: RescueGoal,
  actions: RescueAction[],
  input: RescueInput,
  phase: RescueResult["phase"],
): RescuePlan {
  const first = actions[0];
  const second = actions[1];
  const third = actions[2];

  const objective =
    category === "money"
      ? "Nakit baskısını azaltıp en kritik ödemeyi güvenceye almak."
      : category === "bills"
        ? "Ödemeleri son tarih ve sonuçlarına göre sadeleştirmek."
        : category === "time"
          ? "Kısıtlı zamanı en önemli sonuca yönlendirmek."
          : category === "decision"
            ? "Belirsizliği azaltıp uygulanabilir bir karar vermek."
            : goal === "save_time"
              ? "En önemli sonucu daha az zaman ve eforla almak."
              : "Sorunu küçük, uygulanabilir adımlara bölüp kontrolü geri kazanmak.";

  const nowTitle =
    phase === "act" ? "Sonucu doğrula" :
    phase === "prioritize" ? (first?.title ?? "İlk adımı seç") :
    first?.title ?? "Sorunu netleştir";

  const nowDetail =
    phase === "act"
      ? "Yaptığın işlemin sonucu gerçekten sorunu azaltmış mı kontrol et; gerekiyorsa bir sonraki adımı güncelle."
      : first?.reason ?? "Önce sonucu en çok değiştirecek noktayı netleştir.";

  const todayTitle = second?.title ?? "Kısıtları netleştir";
  const todayDetail =
    second?.reason ??
    "Bugün uygulanabilecek seçenekleri ayır ve gereksiz işleri dışarıda bırak.";

  const nextTitle = third?.title ?? "Sonucu yeniden değerlendir";
  const nextDetail =
    third?.reason ??
    "İlk adımdan sonra yeni duruma göre planı güncelle.";

  const targetDetail =
    category === "money"
      ? "Zorunlu ödemeler karşılanmış, ertelenebilir yükler ayrılmış ve nakit açığı için net bir yol oluşmuş olsun."
      : category === "time"
        ? "Kritik iş tamamlanmış ve kalan işler kontrol edilebilir bir sıraya girmiş olsun."
        : "Sorunun ana baskısı azaltılmış ve sonraki karar netleşmiş olsun.";

  const steps = [
    { label: "Şimdi" as const, title: nowTitle, detail: nowDetail, estimatedMinutes: input.availableHours !== undefined && input.availableHours <= 1 ? 15 : 20 },
    { label: "Bugün" as const, title: todayTitle, detail: todayDetail, estimatedMinutes: 30 },
    { label: "Sonraki adım" as const, title: nextTitle, detail: nextDetail },
    { label: "Hedef" as const, title: "Kontrolü geri al", detail: targetDetail },
  ];

  return { objective, steps };
}

function actionsFor(
  category: RescueCategory,
  goal: RescueGoal,
  input: RescueInput,
): RescueAction[] {
  const actions: RescueAction[] = [];

  if (goal === "find_money") {
    actions.push(
      { type: "reduce", title: "Zorunlu olmayan giderleri ayır", reason: "Kısa vadede nakit açığını küçültür.", priority: 1 },
      { type: "delay", title: "Ertelenebilir ödemeleri listele", reason: "Vadesi ve olası sonucu kontrol ederek zaman kazan.", priority: 2 },
      { type: "earn", title: "Hızlı ek gelir seçeneklerini çıkar", reason: "Mevcut beceri ve kaynaklara göre gelir fırsatı oluştur.", priority: 3 },
    );
  } else if (goal === "reduce_cost") {
    actions.push(
      { type: "compare", title: "Daha düşük maliyetli alternatifleri karşılaştır", reason: "Fiyatı tek başına değil toplam maliyeti dikkate al.", priority: 1 },
      { type: "cancel", title: "Kullanılmayan abonelikleri kontrol et", reason: "Tekrarlayan küçük giderleri görünür hale getirir.", priority: 2 },
      { type: "rearrange", title: "Ödemeleri önem ve son tarihe göre sırala", reason: "Nakit akışındaki baskıyı azaltmaya yardımcı olur.", priority: 3 },
    );
  } else if (goal === "save_time") {
    actions.push(
      { type: "do_now", title: "Tek bir sonraki adımı seç", reason: "Karar yükünü azaltıp işe başlamayı kolaylaştırır.", priority: 1 },
      { type: "rearrange", title: "Birleştirilebilecek işleri grupla", reason: "Tekrarlanan hazırlık ve geçiş sürelerini azaltır.", priority: 2 },
      { type: "ask_help", title: "Devredilebilecek işi belirle", reason: "Her işi tek kişinin yapması gerekmez.", priority: 3 },
    );
  } else if (goal === "make_decision" || category === "decision") {
    actions.push(
      { type: "compare", title: "Seçenekleri aynı kriterlerle karşılaştır", reason: "Fiyat, zaman, risk ve faydayı aynı tabloda gör.", priority: 1 },
      { type: "do_now", title: "Geri dönüşü kolay seçeneği önce değerlendir", reason: "Belirsizlik yüksekken geri alınabilir kararlar riski sınırlar.", priority: 2 },
      { type: "ask_help", title: "Eksik kritik bilgiyi belirle", reason: "Kararı değiştirebilecek tek bilgiye odaklan.", priority: 3 },
    );
  } else {
    actions.push(
      { type: "do_now", title: "Sorunun ilk somut adımını belirle", reason: "Sorunu küçük ve uygulanabilir bir göreve dönüştürür.", priority: 1 },
      { type: "rearrange", title: "En acil sonucu önce ele al", reason: "Öncelik sırasını netleştirir.", priority: 2 },
      { type: "ask_help", title: "Dışarıdan destek gerekip gerekmediğini kontrol et", reason: "Tek başına çözülmesi gerekmeyen işleri ayırır.", priority: 3 },
    );
  }

  // Kısıtları plana yansıt: az zaman veya sıfır bütçe varsa ilk adımlar buna göre öne çıkar.
  if (input.availableHours !== undefined && input.availableHours <= 1) {
    const quick = actions.find((action) => action.type === "do_now");
    if (quick) quick.priority = 1;
    actions.sort((a, b) => a.priority - b.priority);
  }

  if (input.budget !== undefined && input.budget <= 0) {
    const noCost = actions.find((action) =>
      ["reduce", "delay", "cancel", "earn", "ask_help"].includes(action.type),
    );
    if (noCost) noCost.priority = 1;
    actions.sort((a, b) => a.priority - b.priority);
  }

  return actions.map((action, index) => ({
    ...action,
    priority: index + 1,
    title: action.title,
    reason: `${actionLabels[action.type]}: ${action.reason}`,
  }));
}

export function analyzeRescue(input: RescueInput): RescueResult {
  const category = input.category ?? detectByHints(input.problem, categoryHints, "other");
  const goal = input.goal ?? detectByHints(input.problem, goalHints, "solve");
  const priority = priorityFrom(input);
  const phase = phaseFrom(input.problem);
  const scenario = matchScenario(input);
  if (scenario) {
    return {
      problem: input.problem.trim(),
      category: scenario.category,
      goal: input.goal ?? scenario.goals[0] ?? "solve",
      diagnosis: scenario.diagnosis,
      priority,
      phase,
      decisionBasis: buildDecisionBasis(input, buildConstraints(input)),
      plan: buildRescuePlan(scenario.category, input.goal ?? scenario.goals[0] ?? "solve", scenario.actions, input, phase),
      actions: scenario.actions,
      nextQuestion: scenario.questions[0] ?? "Bu sorunda sonucu en çok değiştirecek kısıt nedir?",
      constraints: buildConstraints(input),
    };
  }

  const constraints = buildConstraints(input);

  const diagnosis =
    category === "money"
      ? input.budget !== undefined && input.budget <= 0
        ? "Nakit açığı var. Önce yeni harcamayı durdur, ertelenebilir yükleri ayır ve hızlı gelir seçeneklerini değerlendir."
        : "Nakit akışını, zorunlu giderleri ve son tarihleri birbirinden ayırmadan sağlıklı bir çözüm çıkarmak zor. Önce tabloyu sadeleştirip hangi yükün gerçekten acil olduğunu bulacağız."
      : category === "time"
        ? "Zaman baskısı var. Önce sonucu en çok etkileyen işi seçip geri kalanları sıraya koyacağız."
        : "Sorun; aciliyet, hedef, bütçe ve uygulanabilir sonraki adım olarak parçalanmalı.";

  const nextQuestion =
    category === "money"
      ? "Eksik olan tutar ve en yakın ödeme tarihi nedir?"
      : input.availableHours === undefined
        ? "Bu sorunu çözmek için bugün kaç saatin var?"
        : "Bu sorunda sonucu en çok değiştirecek kısıt veya son tarih nedir?";

  return {
    problem: input.problem.trim(),
    category,
    goal,
    diagnosis,
    priority,
    phase,
    decisionBasis: buildDecisionBasis(input, constraints),
    plan: buildRescuePlan(category, goal, actionsFor(category, goal, input), input, phase),
    actions: actionsFor(category, goal, input),
    nextQuestion,
    constraints,
  };
}
