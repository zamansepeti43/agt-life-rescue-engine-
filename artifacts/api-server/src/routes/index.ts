import { Router } from "express";
import healthRouter from "./health.js";
import chatRouter from "./chat.js";
import selfImprovementRouter from "./self-improvement.js";
import selfImprovementAgentRouter from "./self-improvement-agent.js";
import capabilitiesRouter from "./capabilities.js";
import bankingRouter from "./banking.js";
import agentRouter from "./agent.js";
import nearbyMarketsRouter from "./nearby-markets.js";
import lifeRescueRouter from "./life-rescue.js";

const router = Router();
router.use(healthRouter);
router.use("/chat", chatRouter);
router.use(selfImprovementRouter);
router.use(selfImprovementAgentRouter);
router.use(capabilitiesRouter);
router.use(bankingRouter);
router.use(agentRouter);
router.use(nearbyMarketsRouter);
router.use("/life-rescue", lifeRescueRouter);

export default router;
