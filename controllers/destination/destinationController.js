import { validationResult } from 'express-validator'
import HttpError from '../../middlewares/httpError.js'
import Destination from '../../models/Destination.js'
import Booking from "../../models/Booking.js";
import Tour from '../../models/Tour.js';
import Notification from '../../models/Notification.js'
import User from '../../models/User.js'
import transporter from '../../config/email.js';


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
                // popularAttractions,
                bestSeason,
                // lat,
                // lng,
                // tags,
                // location,
            } = req.body

            const imagePaths = req.files?.map(file => file.path) || [];

 // Parse JSON strings to arrays
            let popularAttractions = [];
            let tags = [];
            let location = {};

            try {
                if (req.body.popularAttractions) {
                    popularAttractions = JSON.parse(req.body.popularAttractions);
                }
                if (req.body.tags) {
                    tags = JSON.parse(req.body.tags);
                }
                if (req.body.location) {
                    location = JSON.parse(req.body.location);
                }
            } catch (parseError) {
                return next(new HttpError('Invalid JSON format in request data', 400))
            }


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
                    images: imagePaths ,
                    popularAttractions,
                    bestSeason,
                    tags,
                    location,
                    createdBy: adminId,
                }).save()

                if(!newDestination){
                    return next(new HttpError('Failed to create Destination', 400))
                    
                    
                }else{

                    // ✅ In-app Notification for all guides
                    const guides = await User.find({ role: "guide" }).select("_id");

                    if (guides.length > 0) {
                    const notifications = guides.map((guide) => ({
                        recipient: guide._id,
                        sender: adminId,
                        type: "custom",
                        message: `A new destination "${newDestination.name}" has been added. Create your tours now!`,
                        link: `/destinations/${newDestination._id}`, // frontend route
                        relatedTour: null,
                        relatedBooking: null,
                    }));

                    await Notification.insertMany(notifications);
                    }


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
            
            const { user_id: adminId, user_role: tokenRole} = req.user_data
          
          
            // const imagePath = req.files && req.files.length > 0 
            //     ? req.files.map(file => file.path) 
            //     : [];


            if(tokenRole !== 'admin'){
                return next(new HttpError('You are not authorized to perform this action',403))
            }else{

                // Fetch current destination
                const currentDestination = await Destination.findById(id);
                if (!currentDestination) return next(new HttpError("Destination not found", 404));

                // ---- Helper to parse arrays ----
                const parseArrayField = (field, fallback = []) => {
                    if (!field) return fallback;
                    if (Array.isArray(field)) return field;
                    return [field];
                };

                 const parsedPopularAttractions = parseArrayField(popularAttractions, currentDestination.popularAttractions);
                const parsedTags = parseArrayField(tags, currentDestination.tags);

                // ---- Location Handling ----
                let parsedLocation = currentDestination.location;
                if (location && typeof location === "object") {
                    parsedLocation = {
                        lat: parseFloat(location.lat) || currentDestination.location?.lat,
                        lng: parseFloat(location.lng) || currentDestination.location?.lng
                    };
                }

                 // ---- Images Handling ----
                let updatedImages = [];

                // 1. Start with existing images from current destination
                if (currentDestination.images) {
                    updatedImages = [...currentDestination.images];
                }

                // Replace with only the existingImages[] sent from frontend (these are the ones user wants to keep)
                if (req.body.existingImages && req.body.existingImages.length > 0) {
                    updatedImages = Array.isArray(req.body.existingImages)
                        ? req.body.existingImages
                        : [req.body.existingImages];
                } else if (req.body.existingImages === null || req.body.existingImages === undefined) {
                    // If no existingImages sent, user removed all images
                    updatedImages = [];
                }

                //  Add new uploaded files
                if (req.files && req.files.length > 0) {
                    updatedImages = [
                        ...updatedImages,
                        ...req.files.map((file) => file.path),
                    ];
                }
                
                console.log("Current destination images:", currentDestination.images);
                console.log("Received existingImages:", req.body.existingImages);
                console.log("Final updatedImages:", updatedImages);

                
                const updateValues = {
                    name,
                    country, 
                    city,
                    description,
                    popularAttractions: parsedPopularAttractions,
                    bestSeason,
                    tags: parsedTags,
                    location:parsedLocation,
                    images: updatedImages
                }

                // if (imagePath.length > 0) {
                //     updateValues.images = imagePath;
                // }

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
                        data: updatedDestination
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

                // ✅ In-app notification for all guides
                const guides = await User.find({ role: "guide" }).select("_id");

                if (guides.length > 0) {
                const notifications = guides.map((guide) => ({
                    recipient: guide._id,
                    sender: adminId,
                    type: "custom",
                    message: `The destination "${deleted.name}" has been removed by admin.`,
                    link: `/destinations`, // can redirect to destinations list
                    relatedTour: null,
                    relatedBooking: null,
                }));

                await Notification.insertMany(notifications);
                }


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


// view single destination - public
export const getDestinationById = async (req, res,next) => {
    try{
        const id = req.params.id

        const destination = await Destination.findOne({is_deleted:false,_id:id, is_active:true})
        
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


// //get all destination
// export const getAlldestinations = async(req,res,next) => {
//     try{
//         const destinations = await Destination.find({is_deleted: false}).sort({ createdAt : -1}) // to list out in descending form

//         if(destinations){
//             res.status(200).json({
//                 status:true,
//                 message:null,
//                 data: destinations
//             })
//         }
//     }catch(err){
//         return next(new HttpError('Oops! Something went wrong',500))
//     }
// }



// GET all destinations with search & filters   111
// export const getAlldestinations = async (req, res, next) => {
//     try {
//         const { 
//             search, 
//             country, 
//             bestSeason, 
//             tags, 
//             popularAttractions, 
//             sort 
//         } = req.query;

//         let query = { is_deleted: false , is_active:true};

//         // Search by name, country, city, tags (case-insensitive)
//         if (search) {
//             const searchRegex = new RegExp(search, "i");
//             query.$or = [
//                 { name: searchRegex },
//                 { country: searchRegex },
//                 { city: searchRegex },
//                 { tags: searchRegex }
//             ];
//         }

//         // Filter: country
//         if (country) {
//             query.country = { $regex: new RegExp(country, "i") };
//         }

//         // Filter: bestSeason
//         if (bestSeason) {
//             query.bestSeason = { $regex: new RegExp(bestSeason, "i") };
//         }

//         // Filter: tags (must contain all tags)
//         if (tags) {
//             const tagsArray = tags.split(",").map(tag => tag.trim());
//             query.tags = { $all: tagsArray };
//         }

//         // Filter: popularAttractions (must contain all)
//         if (popularAttractions) {
//         const attractionsArray = popularAttractions.split(",").map(attr => attr.trim());
//         query.popularAttractions = { 
//             $all: attractionsArray.map(attr => new RegExp(attr, "i")) 
//         };
// }

//         // Base query
//         let destinationList = Destination.find(query);

//         // Sorting
//         if (sort === "name") {
//             destinationList = destinationList.sort({ name: 1 });
//         } else if (sort === "name-desc") {
//             destinationList = destinationList.sort({ name: -1 });
//         } else if (sort === "oldest") {
//             destinationList = destinationList.sort({ createdAt: 1 });
//         } else {
//             destinationList = destinationList.sort({ createdAt: -1 }); // default latest first
//         }

//         const destinations = await destinationList;

//         res.status(200).json({
//             status: true,
//             message: null,
//             count: destinations.length,
//             data: destinations
//         });

//     } catch (err) {
//         console.error("Error fetching destinations", err);
//         return next(new HttpError("Oops! Something went wrong", 500));
//     }
// };


// GET all destinations with search, filters & pagination
export const getAlldestinations = async (req, res, next) => {
  try {
    const {
      search,
      country,
      bestSeason,
      tags,
      popularAttractions,
      sort,
    } = req.query;

    // Pagination
    const limit = parseInt(req.query.limit) || 6; // per page
    const skip = parseInt(req.query.skip) || 0;

    let query = { is_deleted: false, is_active: true };

    // Search by name, country, city, tags (case-insensitive)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { country: searchRegex },
        { city: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Filter: country
    if (country) {
      query.country = { $regex: new RegExp(country, "i") };
    }

    // Filter: bestSeason
    if (bestSeason) {
      query.bestSeason = { $regex: new RegExp(bestSeason, "i") };
    }

    // Filter: tags (must contain all tags)
    if (tags) {
      const tagsArray = tags.split(",").map((tag) => tag.trim());
      query.tags = { $all: tagsArray };
    }

    // Filter: popularAttractions (must contain all)
    if (popularAttractions) {
      const attractionsArray = popularAttractions
        .split(",")
        .map((attr) => attr.trim());
      query.popularAttractions = {
        $all: attractionsArray.map((attr) => new RegExp(attr, "i")),
      };
    }

    // Base query
    let destinationList = Destination.find(query);

    // Sorting
    if (sort === "name") {
      destinationList = destinationList.sort({ name: 1 });
    } else if (sort === "name-desc") {
      destinationList = destinationList.sort({ name: -1 });
    } else if (sort === "oldest") {
      destinationList = destinationList.sort({ createdAt: 1 });
    } else {
      destinationList = destinationList.sort({ createdAt: -1 }); // default latest first
    }

    // Apply pagination
    destinationList = destinationList.skip(skip).limit(limit);

    // Execute query
    const destinations = await destinationList;

    // Total count (without skip/limit)
    const total = await Destination.countDocuments(query);

    res.status(200).json({
      status: true,
      message: null,
      total,               // total destinations (all matching filters)
      count: destinations.length, // count in current page
      data: destinations,
    });
  } catch (err) {
    console.error("Error fetching destinations", err);
    return next(new HttpError("Oops! Something went wrong", 500));
  }
};



//get popular destination
export const getPopularDestinations = async (req, res, next) => {
  try {
    const popularDestinations = await Booking.aggregate([
      // Consider only confirmed or completed bookings
      {
        $match: {
          status: { $in: ["confirmed", "completed"] }
        }
      },
      // Join tours to get destination
      {
        $lookup: {
          from: "tours",
          localField: "tour",
          foreignField: "_id",
          as: "tourData"
        }
      },
      { $unwind: "$tourData" },
      // Group by destination and count bookings
      {
        $group: {
          _id: "$tourData.destination",
          bookingCount: { $sum: 1 }
        }
      },
      // Sort by booking count
      { $sort: { bookingCount: -1 } },
      // Limit to top 5
      { $limit: 5 },
      // Join destination details
      {
        $lookup: {
          from: "destinations",
          localField: "_id",
          foreignField: "_id",
          as: "destinationData"
        }
      },
      { $unwind: "$destinationData" },
      // Project final fields
      {
        $project: {
          _id: 0,
          destinationId: "$destinationData._id",
          name: "$destinationData.name",
          image: "$destinationData.image",
          bookingCount: 1
        }
      }
    ]);

    res.json(popularDestinations);
  } catch (err) {
    next(err);
  }
};


//get tours by destination --- done in tourcontroller and that is been used
export const getToursByDestination = async(req,res, next) => {
    try{

        const {id} = req.params //destination id

        const tours = await Tour.find({destination: id, is_deleted:false})
        .populate("guide", "name email") // show guide details if needed
        .populate("destination", "name country") // show destination details
        .lean();

        if (!tours || tours.length === 0) {
            return res.status(404).json({ message: "No tours found for this destination" });
        }else{
            res.status(200).json({
                count:tours.length,
                status: true,
                message:null,
                data:tours
            })
        }
    }catch(err){
        return next(new HttpError('Oops! Something went wrong', 500))
    }
}

//toggle destination status
export const toggleDestinationStatus = async(req,res,next)  => {
    try{

        const {id} = req.params

        const { user_role: tokenRole, user_id: adminId} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action', 403))
        }else{
            const toggleDestination = await Destination.findById(id)

            if(!toggleDestination){
                return next(new HttpError('Destination not found', 404))
            }else{
                
                //flip status
                toggleDestination.is_active = !toggleDestination.is_active
                await toggleDestination.save()


                const statusText = toggleDestination.is_active ? "Activated (Unblocked)" : "Deactivated (Blocked)";
                const message = `The destination "${toggleDestination.name}" has been ${statusText} by admin.`;

                //  In-app notification for all guides
                const guides = await User.find({ role: "guide" }).select("_id name email");

                if (guides.length > 0) {
                    const notifications = guides.map((guide) => ({
                        recipient: guide._id,
                        sender: adminId,
                        type: "custom",
                        message,
                        link: `/destinations/${toggleDestination._id}`,
                    }));

                    await Notification.insertMany(notifications);

                    //  Send email to all guides
                    for (const guide of guides) {
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: guide.email,
                            subject: `Destination ${statusText}`,
                            template: "destinationStatus", // your .hbs file name
                            context: {
                                guideName: guide.name || "Guide",
                                destinationName: toggleDestination.name,
                                statusText,
                                adminNote: "Please check the destinations page for more details.",
                                link: `${process.env.FRONTEND_URL}/destinations/${toggleDestination._id}`,
                                year: new Date().getFullYear(),
                            },
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.error(`Failed to send destination status notification:`, error);
                            } else {
                                console.log(`Guide notified: ${info.response}`);
                            }
                        });
                    }
                }

                res.status(200).json({
                    status:true,
                    message:` Destination has been ${toggleDestination.is_active ? 'Unblocked' : 'Blocked' } successfully`,
                    data: {
                        destinationId: toggleDestination._id, 
                        is_active: toggleDestination.is_active}
                })
            }
        }
    }catch(err){
        console.error("toggle destination status erro", err)
        return next (new HttpError('Oops ! Something went wrong', 500))
    }
}