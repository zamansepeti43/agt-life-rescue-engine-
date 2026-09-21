import type {
  RescueAction,
  RescueCategory,
  RescueGoal,
  RescueInput,
  RescueResult,
} from "./types.js";

const categoryHints: Record<RescueCategory, string[]> = {
  money: ["para", "borç", "borc", "maaş", "gelir", "ödeme", "ödemem"],
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
  return "normal";
}

function actionsFor(category: RescueCategory, goal: RescueGoal): RescueAction[] {
  const actions: RescueAction[] = [];

  if (goal === "find_money") {
    actions.push(
      { type: "reduce", title: "Zorunlu olmayan giderleri ayır", reason: "Kısa vadede nakit açığını küçültür.", priority: 1 },
      { type: "delay", title: "Ertelenebilir ödemeleri listele", reason: "Vadesi ve olası sonucu kontrol ederek zaman kazan.", priority: 2 },
      { type: "earn", title: "Hızlı ek gelir seçeneklerini çıkar", reason: "Mevcut beceri ve kaynaklara göre gelir fırsatı oluştur.", priority: 3 },
    );
  } else if (goal === "reduce_cost") {
    actions.push(
      { type: "compare", title: "Aynı ihtiyacın daha düşük maliyetli alternatiflerini karşılaştır", reason: "Fiyatı tek başına değil toplam maliyeti dikkate al.", priority: 1 },
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
      { type: "prioritize" as never, title: "En acil sonucu önce ele al", reason: "Öncelik sırasını netleştirir.", priority: 2 },
      { type: "ask_help", title: "Dışarıdan destek gerekip gerekmediğini kontrol et", reason: "Tek başına çözülmesi gerekmeyen işleri ayırır.", priority: 3 },
    );
  }

  return actions;
}

export function analyzeRescue(input: RescueInput): RescueResult {
  const category = input.category ?? detectByHints(input.problem, categoryHints, "other");
  const goal = input.goal ?? detectByHints(input.problem, goalHints, "solve");
  const priority = priorityFrom(input);

  const diagnosis =
    category === "money"
      ? "Nakit akışı ve zorunlu giderler ayrıştırılmalı."
      : category === "time"
        ? "Zaman baskısı, sonraki adım ve devredilebilir işler ayrıştırılmalı."
        : "Sorun; aciliyet, hedef ve uygulanabilir sonraki adım olarak parçalanmalı.";

  return {
    problem: input.problem.trim(),
    category,
    goal,
    diagnosis,
    priority,
    actions: actionsFor(category, goal),
    nextQuestion: "Bu sorunda sonucu en çok değiştirecek kısıt veya son tarih nedir?",
  };
}
