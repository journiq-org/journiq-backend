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
        console.error("Tour creation error", err)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

// // update tour

// export const updateTour = async (req,res,next) => {
//     try{
//         const errors = validationResult(req)
//         if(!errors.isEmpty()){
//             return next (new HttpError('Validation Error: ' + errors.array()[0].msg, 422))
//         }
//         else{
//             const id = req.params.id
//             const{
//                 title,
//                 description, 
//                 itinerary,
//                 duration,
//                 highlights,
//                 price,
//                 availability,
//                 included,
//                 excluded,
//                 meetingPoint,
//                 category,
//                 rating,
//                 destination
//             } = req.body

//             const imagePath = req.file ? [req.file.path] : []

//             //data from middleware
//             const { user_id:guideId , user_role: tokenRole} = req.user_data

//             if( tokenRole !== 'guide'){
//                 return next(new HttpError('You are not authorized to update this tour',403))
//             } 
//             else{
//                 const update = {
//                     title : title,
//                     description : description,
//                     itinerary : itinerary,
//                     duration : duration,
//                     highlights : highlights,
//                     price : price,
//                     availability : availability,
//                     included : included,
//                     excluded : excluded,
//                     meetingPoint : meetingPoint,
//                     category : category,
//                     rating : rating,
//                     destination : destination,                    
//                 }

//                 if(imagePath){
//                     update.images = [req.file.path]
//                 }

//                 const updatedTour = await Tour.findOneAndUpdate(
//                     {_id:id, is_deleted:false,guide:guideId},
//                     update,
//                     {new:true}
//                 )   

//                 if(!updatedTour){
//                     return next(new HttpError('Tour is not updated',400))
//                 }else{
//                     res.status(200).json({
//                         status:true,
//                         message:'Tour updated successfully',
//                         data: updatedTour
//                     })
//                 }
//             }
//         }

//     }catch(err){
//         console.error("Tour update error", err)
//         return next(new HttpError('Oops! Something went wrong',500))
//     }
// }











//view all tour

export const getAllTour = async (req, res,next) => {
    try{
        let tourList = []

        const {user_id: guideId, user_role:tokenRole} = req.user_data

        if(tokenRole === "guide"){

            tourList = await Tour.find({is_deleted:false ,guide: guideId})
        }
        else{

            tourList = await Tour.find({is_deleted:false})
        }

        if(tourList){
            res.status(201).json({
                status:true,
                message:null,
                data:tourList
            })
        }
    }catch(err){
        console.error("Error fetching tours", err)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//get single tour

export const viewTour = async (req, res, next) => {
    try{
        const id = req.params.id
        const {user_id: guideId, user_role: tokenRole} = req.user_data

        let tour = []

        if( tokenRole === "guide"){
            tour = await Tour.findOne({_id:id, guide:guideId, is_deleted:false})
            .populate({
                path:'guide',
                select:'title'
            })
        }
        else{
            tour = await Tour.findOne({_id:id , is_deleted:false})
        }

        if(!tour){
            return next(new HttpError(
                tokenRole === 'guide' ? "Tour not found or you are not authorized to access it" : 'This tour does not exist',404))
        }else{
            res.status(201).json({
                status: true,
                message:null,
                data: tour
            })
        }
    }catch(err){
        return next(new HttpError('Oops! Something went wrong'))
    }
}