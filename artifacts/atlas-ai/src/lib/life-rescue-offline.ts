export interface OfflineAction {
  title: string;
  reason: string;
  priority: number;
}

export interface OfflineResult {
  problem: string;
  category: string;
  goal: string;
  priority: "critical" | "high" | "normal";
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
];

function pick(text: string) {
  const t = text.toLocaleLowerCase("tr-TR");
  return rules.reduce((best, rule) => {
    const score = rule.words.reduce((n, word) => n + (t.includes(word) ? 1 : 0), 0);
    return score > best.score ? { score, rule } : best;
  }, { score: 0, rule: rules[0] });
}

export function analyzeOffline(problem: string): OfflineResult {
  const selected = pick(problem);
  const urgent = /(acil|hemen|bugün|yarın|son gün)/i.test(problem);
  const priority = urgent ? "high" : "normal";
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
  };
  return {
    problem,
    category: selected.rule.category,
    goal: selected.rule.goal,
    priority,
    diagnosis: "İnternet veya harici AI olmadan temel problem sınıflandırması yapıldı.",
    actions: common[selected.rule.category] ?? common.decision,
    nextQuestion: selected.rule.category === "money" ? "Açık kalan tutar ne kadar?" : "Sonucu en çok değiştirecek kısıt nedir?",
  };
}
