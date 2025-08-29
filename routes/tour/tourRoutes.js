import { Router } from "express";
import userAuthCheck from "../../middlewares/userAuthCheck.js";
import { createTour, deleteTour, getAllTour,  getAllToursPublic, getPublicToursByGuide, publicViewTour, toggleTourActiveStatus, updateTour, viewTour } from "../../controllers/tour/tourController.js";
import upload from "../../middlewares/fileUpload.js";
import { check } from "express-validator";
import { getToursByDestination } from "../../controllers/destination/destinationController.js";

const tourRoute = Router()

tourRoute.get('/publicView/:id',getAllToursPublic)
tourRoute.get('/publicViewTourDetails/:id', publicViewTour)

//auth check middleware
tourRoute.use(userAuthCheck)

tourRoute.post('/createtour',upload.array('images',6),
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

  
  check("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),

 // In your tour route validation
check("highlights")
  .optional()
  .custom((value) => {
    if (!value) return true; // Allow empty
    
    // Try to parse as JSON if it's a string
    let parsed;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch (err) {
        throw new Error("Highlights must be a valid JSON array or array");
      }
    } else {
      parsed = value;
    }
    
    if (!Array.isArray(parsed)) {
      throw new Error("Highlights must be an array");
    }
    
    return true;
  }),

check("included")
  .optional()
  .custom((value) => {
    if (!value) return true;
    
    let parsed;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch (err) {
        throw new Error("Included must be a valid JSON array or array");
      }
    } else {
      parsed = value;
    }
    
    if (!Array.isArray(parsed)) {
      throw new Error("Included must be an array");
    }
    
    return true;
  }),

check("excluded")
  .optional()
  .custom((value) => {
    if (!value) return true;
    
    let parsed;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch (err) {
        throw new Error("Excluded must be a valid JSON array or array");
      }
    } else {
      parsed = value;
    }
    
    if (!Array.isArray(parsed)) {
      throw new Error("Excluded must be an array");
    }
    
    return true;
  }),

check("availability")
  .custom((value) => {
    if (!value) throw new Error("Availability is required");
    
    let parsed;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch (err) {
        throw new Error("Availability must be a valid JSON array");
      }
    } else {
      parsed = value;
    }
    
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Availability must be a non-empty array");
    }
    
    for (let slot of parsed) {
      if (!slot.date || slot.slots == null) {
        throw new Error("Each availability item must include 'date' and 'slots'");
      }
      
      if (isNaN(Date.parse(slot.date))) {
        throw new Error("Invalid date format in availability");
      }
      
      const slots = Number(slot.slots);
      if (isNaN(slots) || slots <= 0) {
        throw new Error("Slots must be a positive number");
      }
    }
    
    return true;
  }),

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
// tourRoute.get('/allTourByDestination/:id',getAllTourByDestination)
tourRoute.get('/guide/:id',getPublicToursByGuide)
tourRoute.get('/viewtour/:id', viewTour)
tourRoute.patch('/update/:id',upload.array('images',6),
[
  check("title").optional().isString().withMessage("Title must be a string"),
  check("description").optional().isString().withMessage("Description must be a string"),
  check("itinerary").optional(),
  // .isString().withMessage("Itinerary must be a string"),
  check("duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive integer"),
  check("highlights").optional(),
  // .isArray().withMessage("Highlights must be an array"),
  check("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  // check("availability").optional(),
  // .isArray().withMessage("Availability must be an array"),
  check("included").optional(),
  // .isArray().withMessage("Included must be an array"),
  check("excluded").optional(),
  // .isArray().withMessage("Excluded must be an array"),
  check("meetingPoint").optional().isString().withMessage("Meeting point must be a string"),
  check("category")
    .optional()
    .isIn([ "Adventure",
        "Cultural",
        "Nature",
        "Food & Drink",
        "Wildlife",
        "Historical",
        "Beach",
        "Urban",
        "Religious",
        "Others",]) // adjust enum as per your model
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
tourRoute.get('/destination/:id',getToursByDestination)
tourRoute.patch('/toggleStatus/:tourId',toggleTourActiveStatus)


export default tourRoute