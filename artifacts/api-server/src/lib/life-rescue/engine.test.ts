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
