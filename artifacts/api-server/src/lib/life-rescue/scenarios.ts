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
    diagnosis: "Tamam, burada önce paniği büyütmeden tabloyu sadeleştirelim. Nakit açığı varsa her ödemeyi aynı anda kapatmaya çalışmak yerine zorunlu olanları, ertelenebilenleri ve azaltılabilecek giderleri ayırmak daha sağlıklı. Önce açığın gerçek boyutunu bulacağız; sonra elindeki kaynakla en az hasarla hangi adımın atılacağını netleştireceğiz.",
    actions: [
      a("do_now", "Açığı netleştir", "Eksik kalan tutarı tek bir rakama indir; böylece çözüm için gerçekten ne kadar kaynak gerektiğini görürüz.", 1),
      a("reduce", "Zorunlu olmayan giderleri dondur", "Kısa vadede nakit çıkışını azalt ve çözüm üretirken yeni bir açık oluşmasını önle.", 2),
      a("delay", "Ertelenebilir ödemeleri ayır", "Vadesini ve olası sonucunu kontrol ederek zaman kazan; her erteleme aynı riski taşımaz.", 3),
      a("earn", "Kısa vadeli gelir seçeneklerini listele", "Mevcut zaman, beceri ve kaynaklarına göre gerçekten uygulanabilir seçenekleri çıkar; teorik fikirlerle vakit kaybetme.", 4),
    ],
    questions: ["Bu ay tam olarak ne kadar açık var ve elinde şu an kullanılabilir ne kadar para var?", "Son ödeme tarihi en yakın olan zorunlu ödeme hangisi?"],
  },
  {
    id: "bill-overload",
    category: "bills",
    goals: ["reduce_cost", "prioritize", "solve"],
    keywords: ["fatura", "elektrik", "su faturası", "internet", "doğalgaz", "abonelik"],
    diagnosis: "Faturaları tek bir yığın gibi ele almak yerine son tarih, hizmetin kesilme riski ve tutar açısından ayıracağız. Böylece bugün çözülmesi gerekenle birkaç gün bekleyebilecek olan birbirine karışmayacak; ardından azaltılabilecek düzenli giderleri ayrıca çıkaracağız.",
    actions: [
      a("do_now", "Son tarihleri sırala", "Önce gecikmesi veya hizmet kesintisi açısından daha kritik olanları görünür yap.", 1),
      a("reduce", "Tutarı azaltılabilecek faturaları belirle", "Tarife, kullanım veya paket değişikliği ihtimallerini ayır; aynı ihtiyacı daha düşük maliyetle karşılayabilecek noktaları bul.", 2),
      a("cancel", "Kullanılmayan abonelikleri kontrol et", "Tekrarlayan giderleri görünür hale getir ve gerçekten kullanılmayanları ayrı bir tasarruf alanı olarak değerlendir.", 3),
    ],
    questions: ["Hangi faturanın son ödeme tarihi en yakın ve yaklaşık tutarı ne kadar?", "Aylık tekrarlayan aboneliklerin toplamı ne kadar?"],
  },
  {
    id: "time-overload",
    category: "time",
    goals: ["save_time", "prioritize", "organize"],
    keywords: ["yetişem", "zamanım yok", "çok iş", "yoğun", "vakit yok"],
    diagnosis: "Burada amaç bütün işleri bitirmek değil; zaman daraldığında sonucu en çok etkileyen işi korumak. Önce bugün kaç saatimiz olduğunu ve hangi sonucun gerçekten gecikmemesi gerektiğini bulacağız. Sonra gereksiz geçişleri, ertelenebilecek işleri ve devredilebilecek parçaları ayıracağız.",
    actions: [
      a("do_now", "Tek sonraki adımı seç", "Karar yükünü azaltıp hemen başlayabileceğin somut bir işi öne çıkar.", 1),
      a("rearrange", "İşleri aciliyet ve etkiye göre sırala", "Düşük etkili işleri geriye atarak sınırlı zamanı kritik sonuca ayır.", 2),
      a("ask_help", "Devredilebilecek işi ayır", "Başkası tarafından güvenli biçimde yapılabilecek işleri senden çıkar ve kapasite kazan.", 3),
    ],
    questions: ["Bugün kesinlikle yetişmesi gereken tek sonuç ne ve bunun için yaklaşık kaç saatin var?", "Hangi işi başka biri yapabilir?"],
  },
  {
    id: "purchase-decision",
    category: "decision",
    goals: ["make_decision", "prioritize"],
    keywords: ["hangisini al", "hangisi", "karar verem", "seçem", "almalı mıyım"],
    diagnosis: "Kararı hemen vermek yerine önce kararın gerçekten neye göre değişeceğini bulalım. Seçenekleri aynı kriterlerle karşılaştıracağız; fiyat, toplam maliyet, fayda, risk ve geri dönüş kolaylığını ayrı göreceğiz. Böylece çok bilgi toplamak yerine kararı değiştirebilecek eksik bilgiye odaklanabiliriz.",
    actions: [
      a("compare", "Seçenekleri aynı kriterlerde karşılaştır", "Fiyat, toplam maliyet, fayda, risk ve kullanım süresini aynı çerçevede değerlendir.", 1),
      a("ask_help", "Kararı değiştirebilecek bilgiyi bul", "Gereksiz araştırmayı azaltıp sonucu gerçekten değiştirebilecek tek veya iki bilgiye odaklan.", 2),
      a("do_now", "Geri dönüşü kolay seçeneği ayrıca işaretle", "Belirsizlik yüksekken geri alınabilir seçenekleri görünür tut; böylece yanlış kararın maliyetini sınırlayabilirsin.", 3),
    ],
    questions: ["Bu kararda senin için en önemli üç kriter hangisi?", "Bütçenin üst sınırı nedir ve karar için bir son tarih var mı?"],
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
