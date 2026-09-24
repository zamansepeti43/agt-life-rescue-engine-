import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeRescue } from "./engine.js";

test("money problem detects money category and find-money goal", () => {
  const result = analyzeRescue({
    problem: "Bu ay borç ve faturalar için param yetmiyor, ek gelir bulmam lazım.",
  });
  assert.equal(result.category, "money");
  assert.equal(result.goal, "find_money");
  assert.equal(result.actions[0]?.type, "reduce");
});

test("explicit category and goal override text detection", () => {
  const result = analyzeRescue({
    problem: "Araba ile ilgili bir sorun var.",
    category: "time",
    goal: "save_time",
  });
  assert.equal(result.category, "time");
  assert.equal(result.goal, "save_time");
});

test("urgent input becomes critical", () => {
  const result = analyzeRescue({
    problem: "Yarın ödeme son gün.",
    urgency: 9,
  });
  assert.equal(result.priority, "critical");
});

test("decision problems produce comparison actions", () => {
  const result = analyzeRescue({
    problem: "İki seçenek arasında hangisini seçmeliyim?",
  });
  assert.equal(result.category, "decision");
  assert.equal(result.goal, "make_decision");
  assert.equal(result.actions[0]?.type, "compare");
});


test("budget and time constraints are reflected in the rescue plan", () => {
  const result = analyzeRescue({
    problem: "Bu ay ödemeler için param yetmiyor.",
    budget: 0,
    availableHours: 1,
  });
  assert.equal(result.priority, "high");
  assert.equal(result.constraints.includes("Bütçe: 0 TL"), true);
  assert.equal(result.constraints.includes("Zaman: 1 saat"), true);
  assert.equal(result.actions[0]?.priority, 1);
});


test("zero budget asks about income before building a spending plan", () => {
  const result = analyzeRescue({ problem: "Bütçem 0 TL" });
  assert.match(result.nextQuestion, /düzenli bir gelirin var mı/);
});

test("zero budget does not assume the user works", () => {
  const result = analyzeRescue({ problem: "Param 0 TL" });
  assert.doesNotMatch(result.nextQuestion, /Çalışıyor musun/);
});

test("zero budget then asks when the next income arrives", () => {
  const result = analyzeRescue({ problem: "Bütçem 0 TL, düzenli gelirim var" });
  assert.match(result.nextQuestion, /ilk veya sonraki gelirin ne zaman/);
});