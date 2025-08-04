import { validationResult } from 'express-validator'
import HttpError from '../../middlewares/httpError.js'
import Destination from '../../models/Destination.js'


//create destination
export const createDestination = async(req, res,next) => {
    try{
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return next(new HttpError('Validation error: ' + errors.array()[0].msg,422))
        }else{
            const {
                name,
                country,
                city,
                description,
                popularAttractions,
                bestSeason,
                tags,
                location,
            } = req.body

            const imagePath = req.file?.path

            const{user_id: adminId, user_role: tokenRole} = req.user_data

            if(tokenRole !== "admin"){
                return next(new HttpError("You're not authorized to create destination", 403))
            }
            else{

                 const newDestination = await new Destination({
                    name,
                    country,
                    city,
                    description,
                    images: imagePath ? [imagePath] : [],
                    popularAttractions,
                    bestSeason,
                    tags,
                    location,
                    createdBy: adminId
                }).save()

                if(!newDestination){
                    return next(new HttpError('Failed to create Destination', 400))
                }else{
                    res.status(201).json({
                        status:true,
                        message: 'Destination created successfully',
                        data: newDestination
                    })
                }
            }
        }

    }catch(err){
        console.error("CREATE DESTINATION ERROR:", err);
        return next(new HttpError("Oops! Something went wrong",500))
    }
}