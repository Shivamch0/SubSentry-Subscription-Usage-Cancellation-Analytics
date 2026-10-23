import { Router } from "express";
import { controllers, usageSummary } from "../controllers/api.controller.js";
const router = Router();
router
  .route("/")
  .get(controllers.list("usage"))
  .post(controllers.create("usage"));
router.get("/summary", usageSummary);
router
  .route("/:id")
  .get(controllers.get("usage"))
  .patch(controllers.update("usage"));
export default router;
