import { Router } from "express";
import userAuthCheck from "../../middlewares/userAuthCheck.js";
import upload from "../../middlewares/fileUpload.js";
import { createDestination, deleteDestination, getAlldestinations, getDestinationById, getPopularDestinations, getToursByDestination, toggleDestinationStatus, updateDestination } from "../../controllers/destination/destinationController.js";
import { check ,body } from "express-validator";

const destinationRoute = Router()

destinationRoute.get('/viewAllDestination',getAlldestinations)
destinationRoute.get('/:id/tours',getToursByDestination)


destinationRoute.use(userAuthCheck)


destinationRoute.post('/createDestination', upload.array('images', 3),
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

  // For JSON strings that will be parsed to arrays
  check("popularAttractions")
    .optional()
    .isString().withMessage("Popular attractions must be a valid JSON string"),

  check("bestSeason")
    .optional()
    .isString().withMessage("Best season must be a string"),

  check("tags")
    .optional()
    .isString().withMessage("Tags must be a valid JSON string"),

  // Location as JSON string
  check("location")
    .optional()
    .isString().withMessage("Location must be a valid JSON string"),

], createDestination)

destinationRoute.get('/viewDestination/:id',getDestinationById)
destinationRoute.patch('/updateDestination/:id',upload.array('images',3),
[
  check("name")
    .optional()
    .notEmpty()
    .withMessage("Name cannot be empty"),

  check("country")
    .optional()
    .notEmpty()
    .withMessage("Country cannot be empty"),

  check("city")
    .optional()
    .isString()
    .withMessage("City must be a string"),

  check("description")
    .optional()
    .notEmpty()
    .withMessage("Description cannot be empty"),

  check("popularAttractions")
    .optional()
    .isArray()
    .withMessage("Popular attractions must be an array of strings"),

  check("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array of strings"),

  check("bestSeason")
    .optional()
    .isString()
    .withMessage("Best season must be a string"),

  body("location.lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("location.lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
],updateDestination)

destinationRoute.get('/PopularDestination',getPopularDestinations)
destinationRoute.patch('/deleteDestination/:id',deleteDestination)
destinationRoute.patch('/:id/toggle-status', toggleDestinationStatus)


export default destinationRoute