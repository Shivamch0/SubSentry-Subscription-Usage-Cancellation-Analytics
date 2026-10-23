import { Router } from "express";
import { controllers } from "../controllers/api.controller.js";
const router = Router();
router
  .route("/")
  .get(controllers.list("customers"))
  .post(controllers.create("customers"));
router
  .route("/:id")
  .get(controllers.get("customers"))
  .patch(controllers.update("customers"))
  .delete(controllers.removeCustomer);
export default router;
