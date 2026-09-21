import { matchScenario } from "./scenarios.js";
import type {
  RescueAction,
  RescueCategory,
  RescueGoal,
  RescueInput,
  RescueResult,
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

function priorityFrom(input: RescueInput): RescueResult["priority"] {
  if ((input.urgency ?? 0) >= 9) return "critical";
  if ((input.urgency ?? 0) >= 6) return "high";

  const text = normalize(input.problem);
  if (/(bugün|acil|hemen|son gün|yarın)/.test(text)) return "high";
  if (input.budget !== undefined && input.budget <= 0 && /para|borç|fatura|ödeme/.test(text)) return "high";

  return "normal";
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
  const scenario = matchScenario(input);
  if (scenario) {
    return {
      problem: input.problem.trim(),
      category: scenario.category,
      goal: input.goal ?? scenario.goals[0] ?? "solve",
      diagnosis: scenario.diagnosis,
      priority,
      actions: scenario.actions,
      nextQuestion: scenario.questions[0] ?? "Bu sorunda sonucu en çok değiştirecek kısıt nedir?",
    };
  }

  const constraints: string[] = [];
  if (input.budget !== undefined) constraints.push(`Bütçe: ${input.budget.toLocaleString("tr-TR")} TL`);
  if (input.availableHours !== undefined) constraints.push(`Zaman: ${input.availableHours} saat`);
  constraints.push(`Aciliyet: ${input.urgency ?? 5}/10`);

  const diagnosis =
    category === "money"
      ? input.budget !== undefined && input.budget <= 0
        ? "Nakit açığı var. Önce yeni harcamayı durdur, ertelenebilir yükleri ayır ve hızlı gelir seçeneklerini değerlendir."
        : "Nakit akışı ve zorunlu giderler ayrıştırılmalı."
      : category === "time"
        ? "Zaman baskısı, sonraki adım ve devredilebilir işler ayrıştırılmalı."
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
    actions: actionsFor(category, goal, input),
    nextQuestion,
    constraints,
  };
}
