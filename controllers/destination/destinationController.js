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

//edit destination
export const updateDestination = async(req,res,next) => {
    try{
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return next(new HttpError('Validation Error: ' + errors.array()[0].msg, 422))
        }
        else{

            const id = req.params.id

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

            const imagePath = req.files && req.files.length > 0 
                ? req.files.map(file => file.path) 
                : [];

            const { user_id: adminId, user_role: tokenRole} = req.user_data

            if(tokenRole !== 'admin'){
                return next(new HttpError('You are not authorized to perform this action',403))
            }else{
                
                const updateValues = {
                    name,
                    country, 
                    city,
                    description,
                    popularAttractions,
                    bestSeason,
                    tags,
                    location
                }

                if (imagePath.length > 0) {
                    updateValues.images = imagePath;
                }

                const updatedDestination = await Destination.findOneAndUpdate(
                    {_id:id, is_deleted: false,createdBy:adminId},
                    updateValues,
                    {new:true}
                )

                if(!updatedDestination){
                    return next(new HttpError('Destination is not updated',400))
                }else{
                    res.status(200).json({
                        status:true,
                        message:'Destination updated successfully',
                        data: null
                    })
                }
            }

        }
    }catch(err){
        console.error("UPDATE DESTINATION ERROR:", err);
        return next(new HttpError('Oops! Something went wrong', 500))
    }
}

//delete destination
export const deleteDestination = async (req,res,next) => {
    try{

        const id = req.params.id

        const { user_id:adminId , user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to delete destination',403))
        }else{

            const deleted = await Destination.findOneAndUpdate(
                {_id:id, is_deleted:false, createdBy:adminId},
                {is_deleted: true},
                {new:true}
            )

            if(!deleted){
                return next(new HttpError('Destination is not found or already deleted',404))
            }else{
                res.status(200).json({
                    status:true,
                    message:'Destination deleted successfully',
                    data: null
                })
            }
        }
    }catch(err){
        console.error("DELETE DESTINATION ERROR:", err);
        return next(new HttpError('Oops! Something went wrong', 500))
    }
}

//get all destination
export const getAlldestinations = async(req,res,next) => {
    try{
        const destinations = await Destination.find({is_deleted: false}).sort({ createdAt : -1}) // to list out in descending form

        if(destinations){
            res.status(200).json({
                status:true,
                message:null,
                data: destinations
            })
        }
    }catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

// view single destination
export const getDestinationById = async (req, res,next) => {
    try{
        const id = req.params.id

        const destination = await Destination.findOne({is_deleted:false,_id:id})
        
        if(!destination){
            return next(new HttpError('Destination not found',404))
        }else{
            res.status(200).json({
                status:true,
                message:null,
                data: destination
            })
        }

    }catch(err){
        console.error('error from view ',err)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

