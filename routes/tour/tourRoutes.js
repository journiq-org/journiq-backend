import { Router } from "express";
import userAuthCheck from "../../middlewares/userAuthCheck.js";
import { createTour, deleteTour, getAllTour, updateTour, viewTour } from "../../controllers/tour/tourController.js";
import upload from "../../middlewares/fileUpload.js";
import { check } from "express-validator";

const tourRoute = Router()

tourRoute.use(userAuthCheck)

tourRoute.post('/createtour',upload.array('images',3),
[
  check('title')
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 3 }).withMessage("Title should be at least 3 characters"),

  check("description")
        .notEmpty().withMessage("Description is required"),

  check('destination')
        .notEmpty().withMessage("Destination is required")
        .isMongoId().withMessage("Destination must be a valid ID"),
        
  check("duration")
    .notEmpty().withMessage("Duration is required")
    .isInt({ min: 1 }).withMessage("Duration must be a positive integer"),

  check("highlights")
    .optional()
    .isArray().withMessage("Highlights must be an array of strings"),

  check("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),

  check("availability")
  .isArray({ min: 1 }).withMessage("Availability must be a non-empty array")
  .custom((value) => {
    for (let slot of value) {
      if (!slot.date || slot.slots == null) {
        throw new Error("Each availability item must include 'date' and 'slots'");
      }

      // Validate date
      if (isNaN(Date.parse(slot.date))) {
        throw new Error("Invalid date format in availability");
      }

      // Convert to number (handles "12" and 12)
      const slots = Number(slot.slots);

      if (isNaN(slots) || slots <= 0) {
        throw new Error("Slots must be a positive number");
      }

      // Optional: you can even rewrite it to make sure it's a number in req.body
      slot.slots = slots;
    }

    return true;
  }),

  check("included")
    .optional()
    .isArray().withMessage("Included must be an array of strings"),

  check("excluded")
    .optional()
    .isArray().withMessage("Excluded must be an array of strings"),

  check("meetingPoint")
    .notEmpty().withMessage("Meeting point is required"),

  check("category")
    .notEmpty().withMessage("Category is required")
    .isIn([
      "Adventure",
      "Cultural",
      "Nature",
      "Food & Drink",
      "Wildlife",
      "Historical",
      "Beach",
      "Urban",
      "Religious",
      "Others"
    ]).withMessage("Invalid category"),

  check("rating")
    .optional()
    .isFloat({ min: 0, max: 5 }).withMessage("Rating must be between 0 and 5"),

]
,createTour)


tourRoute.get('/viewAll',getAllTour)
tourRoute.get('/viewtour/:id', viewTour)
tourRoute.patch('/update/:id',upload.array('images',3),
[
  check("title").optional().isString().withMessage("Title must be a string"),
  check("description").optional().isString().withMessage("Description must be a string"),
  check("itinerary").optional().isString().withMessage("Itinerary must be a string"),
  check("duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive integer"),
  check("highlights").optional().isArray().withMessage("Highlights must be an array"),
  check("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  check("availability").optional().isArray().withMessage("Availability must be an array"),
  check("included").optional().isArray().withMessage("Included must be an array"),
  check("excluded").optional().isArray().withMessage("Excluded must be an array"),
  check("meetingPoint").optional().isString().withMessage("Meeting point must be a string"),
  check("category")
    .optional()
    .isIn(["adventure", "cultural", "nature", "wildlife", "other"]) // adjust enum as per your model
    .withMessage("Invalid category"),
  check("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5"),
  check("destination")
    .optional()
    .isMongoId()
    .withMessage("Destination must be a valid ID")

],updateTour)
tourRoute.patch('/deleteTour/:id',deleteTour)

export default tourRoute