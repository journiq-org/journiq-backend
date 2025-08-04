import { Router } from "express";
import userAuthCheck from "../../middlewares/userAuthCheck.js";
import upload from "../../middlewares/fileUpload.js";
import { createDestination } from "../../controllers/destination/destinationController.js";
import { check } from "express-validator";

const destinationRoute = Router()

destinationRoute.use(userAuthCheck)

destinationRoute.post('/createDestination', upload.array('images',3),
[
  check("name")
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),

  check("country")
    .notEmpty().withMessage("Country is required"),

  check("city")
    .optional()
    .isString().withMessage("City must be a string"),

  check("description")
    .notEmpty().withMessage("Description is required"),

  // image is handled by multer (req.file), so we skip validating it here

  check("popularAttractions")
    .optional()
    .isArray().withMessage("Popular attractions must be an array"),

  check("bestSeason")
    .optional()
    .isString().withMessage("Best season must be a string"),

  check("tags")
    .optional()
    .isArray().withMessage("Tags must be an array of strings"),

  // Nested object validation for location
  check("location.lat")
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),

  check("location.lng")
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),

],createDestination)


export default destinationRoute