import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractIzciCandidates } from "./izci-intelligence";

describe("Izci adaylari", () => {
  it("odeme tutari ve yarin tarihini yakalar", () => {
    const items = extractIzciCandidates("Yarın 2.500 TL kira ödemem gerekiyor.");
    const task = items.find((item) => item.kind === "task");
    assert.ok(task);
    assert.equal(task.title, "Kira ödemesini takip et · 2.500 TL");
    assert.ok(task.dueAt);
  });

  it("hedef tutarini baska tutardan ayirir", () => {
    const items = extractIzciCandidates("3.000 TL kira odemem var. Ayrıca 20.000 TL biriktirmek istiyorum.");
    const goal = items.find((item) => item.kind === "goal");
    assert.ok(goal);
    assert.equal(goal.targetAmount, 20000);
  });

  it("alakasiz metin icin aday uretmez", () => {
    assert.deepEqual(extractIzciCandidates("Bugun biraz yoruldum."), []);
  });
});
