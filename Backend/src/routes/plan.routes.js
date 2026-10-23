import { Router } from "express";
import { controllers, cancelPlan } from "../controllers/api.controller.js";
const router = Router();
router
  .route("/")
  .get(controllers.list("plans"))
  .post(controllers.create("plans"));
router.post("/:id/deactivate", cancelPlan);
router
  .route("/:id")
  .get(controllers.get("plans"))
  .patch(controllers.update("plans"));
export default router;
