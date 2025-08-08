import { validationResult } from "express-validator"
import HttpError from "../../middlewares/httpError.js"
import Tour from "../../models/Tour.js"
import User from "../../models/User.js"
import mongoose from "mongoose"


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

// update tour
export const updateTour = async (req,res,next) => {
    try{
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return next (new HttpError('Validation Error: ' + errors.array()[0].msg, 422))
        }
        else{
            const id = req.params.id
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

            // const imagePath = req.file ? [req.file.path] : []
            // const imagePath = req.files ? req.files.map(file => file.path) : [];

            //data from middleware
            const { user_id:guideId , user_role: tokenRole} = req.user_data

            if( tokenRole !== 'guide'){
                return next(new HttpError('You are not authorized to update this tour',403))
            } 
            else{
                const update = {
                    title : title,
                    description : description,
                    itinerary : itinerary,
                    duration : duration,
                    highlights : highlights,
                    price : price,
                    availability : availability,
                    included : included,
                    excluded : excluded,
                    meetingPoint : meetingPoint,
                    category : category,
                    rating : rating,
                    destination : destination,                    
                }

                // if(imagePath){
                //     update.images = imagePath
                // }
                // if images uploaded, set them (replace)
                if (req.files && req.files.length > 0) {
                update.images = req.files.map(f => f.path);
                }

                const imagePath = req.files && req.files.length > 0 
                ? req.files.map(file => file.path) 
                : []   

                const updatedTour = await Tour.findOneAndUpdate(
                    {_id:id, is_deleted:false,guide:guideId},
                    update,
                    {new:true}
                )   

                if(!updatedTour){
                    return next(new HttpError('Tour is not updated',400))
                }else{
                    res.status(200).json({
                        status:true,
                        message:'Tour updated successfully',
                        data: updatedTour
                    })
                }
            }
        }

    }catch(err){
        console.error("Tour update error", err)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}


//delete tour
export const deleteTour = async (req,res,next) => {
    try{

        const id = req.params.id

        const{user_id: guideId,user_role: tokenRole} = req.user_data

        if(tokenRole !== 'guide'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }
        else{

            const deleted = await Tour.findOneAndUpdate(
                {_id:id, is_deleted: false,guide:guideId},
                {is_deleted:true},
                {new:true}
            )

            if(!deleted){
                return next(new HttpError('Tour not found or already deleted ',404))
            } else{
                res.status(200).json({
                    status:true,
                    message:'Tour deleted successfully',
                    data:null
                })
            }
        }
    }catch(err){
        console.error('delete tour',err)
        return next(new HttpError('Oops! Something went wrong while deleting the tour',500))
    }
}




//get single tour
export const viewTour = async (req, res, next) => {
    try{
        const id = req.params.id
        const {user_id: guideId, user_role: tokenRole} = req.user_data
        
        let tour = []
        
        if( tokenRole === "guide" ){
            tour = await Tour.findOne({_id:id, guide:guideId, is_deleted:false,isBlocked:false})
            .populate({ path: 'guide', select: 'name email' })
            .populate('destination', 'name');
        }
        else{
            tour = await Tour.findOne({_id:id , is_deleted:false, isBlocked: false, isActive: true})
            .populate({ path: 'guide', select: 'name' })
           .populate('destination', 'name');
        }

        if(!tour){
            return next(new HttpError(
                tokenRole === 'guide' ? "Tour not found or you are not authorized to access it" : 'This tour does not exist',404))
        }else{
            res.status(200).json({
                status: true,
                message:null,
                data: tour
            })
        }
    }catch(err){
        return next(new HttpError('Oops! Something went wrong'))
    }
}

// toggle tour active status for temporarily disabling a tour - not checked on postman , ROUTE IS IN GUIDEROUTE
export const toggleTourActiveStatus = async (req,res,next) => {
    try{

        const { tourId} = req.params
        const {user_id : guideId, user_role:tokenRole} = req.user_data

        if(tokenRole !== 'guide'){
            return next(new HttpError('You are not authorized to perform this action', 403));
        }else{

            const tour = await Tour.findOne({is_deleted:false, _id: tourId, guide: guideId})

            if (!tour) {
                return next(new HttpError('Tour not found or you are not the owner', 404));
            }else{

                tour.isActive = !tour.isActive
                await tour.save()

                res.status(200).json({
                    status: true,
                    message: `Tour has been ${tour.isActive ? 'enabled' : 'disabled'} successfully`,
                    data: tour,
                });
            }
        }

    }catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}





//view all tour
// export const getAllTour = async (req, res,next) => {
//     try{
//         let tourList = []
//         // let query = {is_deleted:false, isBlocked:false, isActive:true}

//         // if(searchquery) {

//         // }

//         const {user_id: guideId, user_role:tokenRole} = req.user_data

//         if(tokenRole === "guide" ){

//             tourList = await Tour.find({is_deleted:false ,guide: guideId,isBlocked:false,isActive:true})
//         }
//         else{

//             tourList = await Tour.find({is_deleted:false, isBlocked:false, isActive:true})
//         }

//         if(tourList){
//             res.status(200).json({
//                 status:true,
//                 message:null,
//                 data:tourList
//             })
//         }
//     }catch(err){
//         console.error("Error fetching tours", err)
//         return next(new HttpError('Oops! Something went wrong',500))
//     }
// }



//view  all tour with support search, filters, destination, and popularity functions included
export const getAllTour = async (req, res, next) => {
    try {
        const { 
            destination, 
            title, 
            category, 
            priceMin, 
            priceMax, 
            durationMin, 
            durationMax, 
            date, 
            ratingMin, 
            popular 
        } = req.query;

        const { user_id: guideId, user_role: tokenRole } = req.user_data || {};

        let query = { is_deleted: false, isBlocked: false};

        // Public users should only see active tours; guides should see their tours (even inactive)
        if (tokenRole !== 'guide') {
            query.isActive = true;
        }

        // Guide can only see their tours
        if (tokenRole === "guide") {
            query.guide = guideId;
        }

        // Filter: destination
        if (destination && mongoose.Types.ObjectId.isValid(destination)) {
            query.destination = destination;
        }

        // Filter: title (case-insensitive search)
        if (title) {
            query.title = {$regex: title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        }

        // Filter: category
        if (category) {
            query.category = category;
        }

        // Filter: price range
        if (priceMin || priceMax) {
            query.price = {};
            if (priceMin) query.price.$gte = Number(priceMin);
            if (priceMax) query.price.$lte = Number(priceMax);
        }

        // Filter: duration range
        if (durationMin || durationMax) {
            query.duration = {};
            if (durationMin) query.duration.$gte = Number(durationMin);
            if (durationMax) query.duration.$lte = Number(durationMax);
        }

        // Filter: rating minimum
        if (ratingMin) {
            query.rating = { $gte: Number(ratingMin) };
        }

       // availability date: match any availability item whose date falls in the day range
        let filterDateStart, filterDateEnd;
        if (date) {
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                return next(new HttpError('Invalid date format. Use YYYY-MM-DD', 400));
            }
            filterDateStart = new Date(d);
            filterDateStart.setHours(0,0,0,0);
            filterDateEnd = new Date(d);
            filterDateEnd.setHours(23,59,59,999);

            query.availability = {
                $elemMatch: {
                date: { $gte: filterDateStart, $lte: filterDateEnd },
                slots: { $gt: 0 }
                }
            };
        }

        // Query execution
        let tourList = Tour.find(query)
            .populate("destination", "name")
            .populate("guide", "name email");

        // Sorting for popular tours
        if (popular === "true") {
            tourList = tourList.sort({ rating: -1 }); // or bookingsCount if you store it
        } else {
            tourList = tourList.sort({ createdAt: -1 });
        }

        const tours = await tourList;

        res.status(200).json({
            status: true,
            message: null,
            data: tours
        });

    } catch (err) {
        console.error("Error fetching tours", err);
        return next(new HttpError("Oops! Something went wrong", 500));
    }
};


//getToursByGuide route (for travellers visiting a guide’s profile)

export const getPublicToursByGuide = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if guide exists & is not blocked
    const guideUser = await User.findById(id);

    if (!guideUser || guideUser.isBlocked) {
      return next(new HttpError("Guide not found or unavailable", 404));
    } else {

// optional: only show tours with upcoming availability (improves UX)
      const today = new Date();

      const tours = await Tour.find({
        guide: id,
        is_deleted: false,
        isBlocked: false,
        isActive: true,
        availability: { $elemMatch: { date: { $gte: today }, slots: { $gt: 0 } } }
      })
      .populate("destination", "name")
      .populate("guide", "name");

      res.status(200).json({
        status: true,
        count: tours.length,
        data: tours
      });
    }
  } catch (err) {
    console.error("Error fetching public tours by guide:", err);
    return next(new HttpError("Oops! Something went wrong", 500));
  }
};
