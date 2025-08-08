import { Router } from "express";
import userAuthCheck from "../../middlewares/userAuthCheck.js";
import { toggleTourActiveStatus } from "../../controllers/tour/tourController.js";

const guideRoute = Router()

guideRoute.use(userAuthCheck)

guideRoute.patch('/tours/toggle-status/:tourId', toggleTourActiveStatus)


export default guideRoute