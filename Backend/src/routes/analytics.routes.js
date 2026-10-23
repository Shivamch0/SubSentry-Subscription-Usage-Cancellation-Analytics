import { Router } from "express";
import {
  analytics,
  analyticsTrends,
  csvExport,
} from "../controllers/api.controller.js";
const router = Router();
router.get("/summary", analytics);
router.get("/trends/:kind", analyticsTrends);
router.get("/exports/:dataset.csv", csvExport);
export default router;
