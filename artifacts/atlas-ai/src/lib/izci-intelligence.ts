type IzciSource = { sourceHistoryId?: string };

export type IzciCandidate =
  | ({ kind: "task"; title: string; dueAt?: string; reason: string } & IzciSource)
  | ({ kind: "goal"; title: string; targetAmount?: number; targetDate?: string; reason: string } & IzciSource);

function parseAmount(text: string): number | undefined {
  const match = text.match(/(\d{1,3}(?:[. ]\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:tl|₺|lira|try)\b/i);
  if (!match) return undefined;
  const value = Number(match[1].replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : undefined;
}

function normalize(text: string) {
  return text.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

function amount(text: string): number | undefined {
  return parseAmount(text);
}

function dueDate(text: string): string | undefined {
  const now = new Date();
  const lower = normalize(text);
  if (/\bbugün\b/.test(lower)) return now.toISOString();
  if (/\byarın\b/.test(lower)) { now.setDate(now.getDate() + 1); now.setHours(9, 0, 0, 0); return now.toISOString(); }
  const explicit = lower.match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/);
  if (explicit) {
    const day = Number(explicit[1]); const month = Number(explicit[2]) - 1;
    let year = explicit[3] ? Number(explicit[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const date = new Date(year, month, day, 9, 0, 0, 0);
    if (date.getTime() < now.getTime() && !explicit[3]) date.setFullYear(year + 1);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
}

export function extractIzciCandidates(context: string): IzciCandidate[] {
  const lines = context.split(/\nKullanıcı:\s*/i).map((line) => line.trim()).filter(Boolean);
  const text = lines.join(" ");
  const lower = normalize(text);
  const candidates: IzciCandidate[] = [];
  const paymentLine = lines.find((line) => /(öde|ödeme|fatura|kira|borç|taksit|son gün|vadesi)/i.test(line));
  const money = amount(paymentLine ?? text);
  const goalLine = lines.find((line) => /(biriktir|birikim|hedefim|hedef.*tl|tl.*hedef)/i.test(line));
  const goalMoney = amount(goalLine ?? "");
  const hasPayment = /(öde|ödeme|fatura|kira|borç|taksit|son gün|vadesi)/.test(lower);
  const dueAt = dueDate(text);

  if (hasPayment && money !== undefined) {
    const label = lower.includes("kira") ? "Kira ödemesini takip et" : lower.includes("fatura") ? "Fatura ödemesini takip et" : lower.includes("borç") ? "Borç ödemesini takip et" : "Ödemeyi takip et";
    candidates.push({ kind: "task", title: label + " · " + money.toLocaleString("tr-TR") + " TL", ...(dueAt ? { dueAt } : {}), reason: "Konuşmada tutarı ve ödeme bağlamını gördüm." });
  }

  if (/(biriktir|birikim|hedefim|hedef.*tl|tl.*hedef)/.test(lower)) {
    candidates.push({ kind: "goal", title: "Birikim hedefi", ...(goalMoney !== undefined ? { targetAmount: goalMoney } : {}), ...(goalLine ? (() => { const goalDue = dueDate(goalLine); return goalDue ? { targetDate: goalDue } : {}; })() : {}), reason: "Konuşmada takip edilebilir bir hedef olduğunu gördüm." });
  }

  const hasTaskLanguage = /(yapmam gerekiyor|halletmem gerekiyor|kontrol etmem gerekiyor|sonra yapacağım|unutmayayım|takip et)/.test(lower);
  if (hasTaskLanguage && !candidates.some((candidate) => candidate.kind === "task")) {
    const first = lines.find((line) => /(yapmam gerekiyor|halletmem gerekiyor|kontrol etmem gerekiyor|takip et)/i.test(line));
    candidates.push({ kind: "task", title: (first ?? "Konuşulan işi takip et").replace(/^[-•]\s*/, "").slice(0, 90), ...(dueAt ? { dueAt } : {}), reason: "Konuşmada tamamlanması gereken bir iş olduğunu gördüm." });
  }
  return candidates.slice(0, 3);
}

