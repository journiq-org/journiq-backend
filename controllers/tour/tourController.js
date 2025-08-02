import { validationResult } from "express-validator"
import HttpError from "../../middlewares/httpError.js"
import Tour from "../../models/Tour.js"


//create tour


export const createTour = async (req,res,next) => {
    try{
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return next(new HttpError("Validation Error: " + errors.array()[0].msg, 422))
        }else{

            const{
                title,
                description, 
                itinerary,
                duration,
                highlights,
                price,
                availability,
                included,
                excluded,
                meetingPoint,
                category,
                rating,
                destination
            } = req.body

            const imagePath = req.file?.path

            const{user_id:guideId, user_role:tokenRole} = req.user_data

            if(tokenRole !== "guide"){
                return next(new HttpError("You are not authorized to create a tour",403))
            }
            else{
                const newTour = await new Tour({
                    title:title,
                    description:description,
                    itinerary:itinerary,
                    duration:duration,
                    highlights:highlights,
                    price:price,
                    availability:availability,
                    included:included,
                    excluded:excluded,
                    meetingPoint:meetingPoint,
                    category:category,
                    rating:rating,
                    destination:destination,
                    images:imagePath ? [imagePath] : [],
                    guide:guideId
                }).save()

                if(!newTour){
                    return next(new HttpError("Failed to create tour",400))
                }else{
                    res.status(201).json({
                        status:true,
                        message:"Tour created successfully",
                        data:newTour
                    })
                }
            }
        }
    }
    catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}