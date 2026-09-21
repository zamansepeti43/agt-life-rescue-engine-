import { Router } from "express";
import { analyzeRescue } from "../lib/life-rescue/index.js";
import type { RescueInput } from "../lib/life-rescue/types.js";

const router = Router();

router.post("/analyze", (req, res) => {
  const body = req.body as Partial<RescueInput>;

  if (!body || typeof body.problem !== "string" || body.problem.trim().length < 3) {
    res.status(400).json({
      success: false,
      error: "problem alanı en az 3 karakter olmalıdır.",
    });
    return;
  }

  const result = analyzeRescue({
    problem: body.problem,
    category: body.category,
    goal: body.goal,
    urgency: typeof body.urgency === "number" ? body.urgency : undefined,
    budget: typeof body.budget === "number" ? body.budget : undefined,
    availableHours: typeof body.availableHours === "number" ? body.availableHours : undefined,
  });

  res.json({ success: true, result });
});

export default router;
