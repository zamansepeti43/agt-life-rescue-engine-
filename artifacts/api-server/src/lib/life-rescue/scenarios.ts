import type { RescueCategory, RescueGoal, RescueInput, RescueAction } from "./types.js";

export interface RescueScenario {
  id: string;
  category: RescueCategory;
  goals: RescueGoal[];
  keywords: string[];
  diagnosis: string;
  actions: RescueAction[];
  questions: string[];
}

const a = (type: RescueAction["type"], title: string, reason: string, priority: number): RescueAction =>
  ({ type, title, reason, priority });

export const RESCUE_SCENARIOS: RescueScenario[] = [
  {
    id: "cash-shortfall",
    category: "money",
    goals: ["find_money", "reduce_cost", "prioritize", "solve"],
    keywords: ["para yetm", "nakit yok", "maaş yetm", "borç", "ödeme", "eksi"],
    diagnosis: "Önce zorunlu ödemeleri koruyup nakit açığını ölçmek gerekiyor.",
    actions: [
      a("do_now", "Açığı netleştir", "Eksik kalan tutarı tek bir rakama indir.", 1),
      a("reduce", "Zorunlu olmayan giderleri dondur", "Kısa vadede nakit çıkışını azalt.", 2),
      a("delay", "Ertelenebilir ödemeleri ayır", "Sonuçlarını kontrol ederek vade baskısını azalt.", 3),
      a("earn", "Kısa vadeli gelir seçeneklerini listele", "Mevcut zaman ve becerilere göre uygulanabilir seçenekleri çıkar.", 4),
    ],
    questions: ["Bu ay tam olarak ne kadar açık var?", "Son ödeme tarihi en yakın olan zorunlu ödeme hangisi?"],
  },
  {
    id: "bill-overload",
    category: "bills",
    goals: ["reduce_cost", "prioritize", "solve"],
    keywords: ["fatura", "elektrik", "su faturası", "internet", "doğalgaz", "abonelik"],
    diagnosis: "Faturalar son tarih, kesilme riski ve tutar açısından sıralanmalı.",
    actions: [
      a("do_now", "Son tarihleri sırala", "Önce gecikmesi en kritik olanları görünür yap.", 1),
      a("reduce", "Tutarı azaltılabilecek faturaları belirle", "Tarife, kullanım veya paket değişikliği ihtimallerini ayır.", 2),
      a("cancel", "Kullanılmayan abonelikleri kontrol et", "Tekrarlayan giderleri azalt.", 3),
    ],
    questions: ["Hangi faturanın son ödeme tarihi en yakın?", "Aylık tekrarlayan aboneliklerin toplamı ne kadar?"],
  },
  {
    id: "time-overload",
    category: "time",
    goals: ["save_time", "prioritize", "organize"],
    keywords: ["yetişem", "zamanım yok", "çok iş", "yoğun", "vakit yok"],
    diagnosis: "Zaman sıkışıklığında bütün işleri aynı anda çözmek yerine kritik sonucu korumak gerekir.",
    actions: [
      a("do_now", "Tek sonraki adımı seç", "Karar yükünü azaltıp işe başlamayı sağlar.", 1),
      a("rearrange", "İşleri aciliyet ve etkiye göre sırala", "Düşük etkili işleri geriye at.", 2),
      a("ask_help", "Devredilebilecek işi ayır", "Başkası tarafından yapılabilecek işleri senden çıkar.", 3),
    ],
    questions: ["Bugün kesinlikle yetişmesi gereken tek sonuç ne?", "Hangi işi başka biri yapabilir?"],
  },
  {
    id: "purchase-decision",
    category: "decision",
    goals: ["make_decision", "prioritize"],
    keywords: ["hangisini al", "hangisi", "karar verem", "seçem", "almalı mıyım"],
    diagnosis: "Karar için seçenekler aynı kriterlerle karşılaştırılmalı; kritik eksik bilgi bulunmalı.",
    actions: [
      a("compare", "Seçenekleri aynı kriterlerde karşılaştır", "Fiyat, toplam maliyet, fayda, risk ve kullanım süresini aynı çerçevede değerlendir.", 1),
      a("ask_help", "Kararı değiştirebilecek bilgiyi bul", "Gereksiz araştırmayı azaltıp kritik bilgiye odaklan.", 2),
      a("do_now", "Geri dönüşü kolay seçeneği ayrıca işaretle", "Belirsizlik yüksekken geri alınabilir kararları görünür tut.", 3),
    ],
    questions: ["Bu kararda senin için en önemli üç kriter hangisi?", "Bütçenin üst sınırı nedir?"],
  },
];

export function matchScenario(input: RescueInput): RescueScenario | null {
  const text = input.problem.toLocaleLowerCase("tr-TR");
  let best: RescueScenario | null = null;
  let score = 0;
  for (const scenario of RESCUE_SCENARIOS) {
    if (input.category && scenario.category !== input.category) continue;
    if (input.goal && !scenario.goals.includes(input.goal)) continue;
    const current = scenario.keywords.reduce((n, keyword) => n + (text.includes(keyword) ? 1 : 0), 0);
    if (current > score) {
      score = current;
      best = scenario;
    }
  }
  return best;
}
