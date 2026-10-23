import { Router } from "express";
import {
  controllers,
  cancelSubscription,
} from "../controllers/api.controller.js";
const router = Router();
router
  .route("/")
  .get(controllers.list("subscriptions"))
  .post(controllers.create("subscriptions"));
router.post("/:id/cancel", cancelSubscription);
router
  .route("/:id")
  .get(controllers.get("subscriptions"))
  .patch(controllers.update("subscriptions"));
export default router;
