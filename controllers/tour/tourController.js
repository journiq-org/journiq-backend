import mongoose from "mongoose"
import path from "path"
import fs from "fs";
import handlebars from "handlebars";
import { validationResult } from "express-validator"
import HttpError from "../../middlewares/httpError.js"
import Tour from "../../models/Tour.js"
import User from "../../models/User.js"
import Destination from "../../models/Destination.js"
import transporter from "../../config/email.js"
import Booking from "../../models/Booking.js"
import Notification from "../../models/Notification.js"
// import { sendNotification } from "../../services/notificationService.js"


//create tour
export const createTour = async (req,res,next) => {
    try{
        console.log("Incoming tour create:", req.body, req.files);


        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return next(new HttpError("Validation Error: " + errors.array()[0].msg, 422))
        }else{

             // Parse arrays safely
            let itinerary = [];
            let highlights = [];
            let included = [];
            let excluded = [];
            let availability = [];

            try {
            itinerary = req.body.itinerary ? JSON.parse(req.body.itinerary) : [];
            highlights = req.body.highlights ? JSON.parse(req.body.highlights) : [];
            included = req.body.included ? JSON.parse(req.body.included) : [];
            excluded = req.body.excluded ? JSON.parse(req.body.excluded) : [];
            availability = req.body.availability ? JSON.parse(req.body.availability) : [];
            } catch (err) {
            console.error("JSON parse error:", err.message);
            return next(new HttpError("Invalid array data format", 400));
            }

            // Strings
            const {
            title,
            description,
            duration,
            price,
            meetingPoint,
            category,
            rating,
            destination,
            } = req.body;


            // const{
            //     title,
            //     description, 
            //     itinerary,
            //     duration,
            //     highlights,
            //     price,
            //     availability,
            //     included,
            //     excluded,
            //     meetingPoint,
            //     category,
            //     rating,
            //     destination
            // } = req.body




             // Convert strings back to arrays
            if (typeof itinerary === "string") {
                try { itinerary = JSON.parse(itinerary) } catch { itinerary = [itinerary] }
            }
            if (typeof highlights === "string") {
                try { highlights = JSON.parse(highlights) } catch { highlights = [highlights] }
            }
            if (typeof included === "string") {
                try { included = JSON.parse(included) } catch { included = [included] }
            }
            if (typeof excluded === "string") {
                try { excluded = JSON.parse(excluded) } catch { excluded = [excluded] }
            }
            if (typeof availability === "string") {
                try { availability = JSON.parse(availability) } catch { availability = [] }
            }

            // If availability[] came as array of JSON strings (most common case with FormData)
            if (Array.isArray(availability)) {
                availability = availability.map(item => 
                    typeof item === "string" ? JSON.parse(item) : item
                )
            }


            const imagePaths = req.files ? req.files.map(file => file.path) : []

            const{user_id:guideId, user_role:tokenRole} = req.user_data

            if(tokenRole !== "guide"){
                return next(new HttpError("You are not authorized to create a tour",403))
            }
            else{
                const guide = await User.findById(guideId);
                if(!guide || !guide.isVerified){
                     return next(new HttpError("Your guide profile is not verified yet", 403))
                }else{

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
                        images:imagePaths,
                        guide:guideId
                    }).save()
    
                    if(!newTour){
                        return next(new HttpError("Failed to create tour",400))
                    }else{
                        
                        // Populate destination name before sending email
                        const populatedTour = await newTour.populate("destination", "name");

                        // 📩 Send email to Admin
                        const admin = await User.findOne({ role: "admin" }).select("email name");
                        if (admin) {
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: admin.email,
                            subject: `New Tour Added on Journiq: ${title}`,
                            template: "newTourAlert",
                            context: {
                            name: admin.name,
                            guideName: guide.name,
                            title,
                            destination: populatedTour.destination.name,
                            category,
                            price,
                            link: `https://yourfrontend.com/tour/${newTour._id}`,
                            },
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                            console.error(`Failed to send admin notification:`, error);
                            } else {
                            console.log(`Admin notified: ${info.response}`);
                            }
                        });
                        }
                        //  // 🔔 Notify admin about new tour
                        // const adminUser = await User.findOne({ role: "admin" });
                        // if (adminUser) {
                        // await sendNotification({
                        //     recipientId: adminUser._id,
                        //     senderId: guideId,
                        //     type: "tour_updated",
                        //     message: `A new tour "${title}" has been created by guide ${guide.name}.`,
                        //     link: `https://yourapp.com/tours/${newTour._id}`,
                        //     relatedTour: newTour._id,
                        //     emailData: {
                        //     to: adminUser.email,
                        //     subject: "New Tour Created - Journiq",
                        //     template: "newTourNotification", // your handlebars template name
                        //     context: {
                        //         name: adminUser.name,
                        //         tourTitle: title,
                        //         guideName: guide.name,
                        //         link: `https://yourapp.com/tours/${newTour._id}`
                        //     }
                        //     }
                        // });
                        // }

                        
                        // const adminUser = await User.findOne({ role: "admin" });
                        // if (adminUser) {
                        // // 📩 Send notification to admin about new tour
                        // await sendNotification({
                        //     recipientId: adminUser._id,
                        //     senderId: guideId,
                        //     type: "tour_updated",
                        //     message: `A new tour "${title}" has been created by a guide.`,
                        //     link: `https://yourapp.com/tours/${newTour._id}`,
                        //     relatedTour: newTour._id,
                        //     emailData: {
                        //         to: adminUser.email,
                        //         subject: "New Tour Created - Journiq",
                        //         recipientName: adminUser.name,
                        //         message: `A new tour "${title}" has been created. Click below to review it.`,
                        //         link: `https://yourapp.com/tours/${newTour._id}`
                        //     }
                        // });
            // }
    
    
                        res.status(201).json({
                            status:true,
                            message:"Tour created successfully",
                            data:newTour
                        })
                    }
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

                 const guide = await User.findById(guideId);
                if(!guide || !guide.isVerified){
                     return next(new HttpError("Your guide profile is not verified yet", 403))
                }else{


                     // Fetch current tour
                    const currentTour = await Tour.findById(id);
                    if (!currentTour) return next(new HttpError("Tour not found", 404));


                // ---- Helper to parse arrays ----
                    const parseArrayField = (field, fallback = []) => {
                    if (!field) return fallback;
                    if (Array.isArray(field)) return field;
                    return [field];
                    };

                    const parsedItinerary = parseArrayField(itinerary, currentTour.itinerary);
                    const parsedHighlights = parseArrayField(highlights, currentTour.highlights);
                    const parsedIncluded = parseArrayField(included, currentTour.included);
                    const parsedExcluded = parseArrayField(excluded, currentTour.excluded);


                   // ---- Availability Handling ----
                    let parsedAvailability = [];
                    if (Array.isArray(availability)) {
                        parsedAvailability = availability.map(item => ({
                            date: item.date,
                            slots: Number(item.slots)
                        }));
                    } else if (availability && typeof availability === "object") {
                        parsedAvailability = [{
                            date: availability.date,
                            slots: Number(availability.slots)
                        }];
                    }

                    // fallback to existing if nothing new
                    let finalAvailability = parsedAvailability.length > 0
                        ? parsedAvailability
                        : currentTour.availability;

                    console.log("Raw body:", req.body);
                    console.log("Parsed availability:", parsedAvailability);


                    // ---- Images Handling ----
                    let updatedImages = currentTour.images;

                    // 1. Keep only the existingImages[] sent from frontend
                    if (req.body.existingImages) {
                    updatedImages = Array.isArray(req.body.existingImages)
                        ? req.body.existingImages
                        : [req.body.existingImages];
                    }

                    // 2. Add new uploaded files
                    if (req.files && req.files.length > 0) {
                    updatedImages = [
                        ...updatedImages,
                        ...req.files.map((file) => file.path),
                    ];
                    }


                    // ---- Build update object ----

                    const update = {
                        title : title,
                        description : description,
                        itinerary : parsedItinerary,
                        duration : duration,
                        highlights : parsedHighlights,
                        price : price,
                        availability : finalAvailability,
                        included : parsedIncluded,
                        excluded : parsedExcluded,
                        meetingPoint : meetingPoint,
                        category : category,
                        rating : rating,
                        destination : destination, 
                         images: updatedImages,                   
                    }
    
                    // if(imagePath){
                    //     update.images = imagePath
                    // }
                    // if images uploaded, set them (replace)
                    // if (req.files && req.files.length > 0) {
                    // update.images = req.files.map(f => f.path);
                    // }
    
                    // const imagePath = req.files && req.files.length > 0 
                    // ? req.files.map(file => file.path) 
                    // : []   
    
                    const updatedTour = await Tour.findOneAndUpdate(
                        {_id:id, is_deleted:false,guide:guideId},
                        update,
                        {new:true}
                    ).populate("destination", "name")
                     .populate("guide", "name email");   
    
                    if(!updatedTour){
                        return next(new HttpError('Tour is not updated',400))
                    }else{

                         //  Send Email Notification to Admin
                        const admin = await User.findOne({ role: "admin" }).select("email name");
                        if (admin) {
                            const mailOptions = {
                                from: process.env.EMAIL_USER,
                                to: admin.email,
                                subject: `Tour Updated: ${updatedTour.title}`,
                                template: "tourUpdatedNotification", // handlebars file
                                context: {
                                    adminName: admin.name,
                                    guideName: updatedTour.guide.name,
                                    title: updatedTour.title,
                                    destination: updatedTour.destination?.name,
                                    price: updatedTour.price,
                                    link: `https://yourfrontend.com/tour/${updatedTour._id}`
                                },
                            };

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    console.error("Failed to send tour update notification:", error);
                                } else {
                                    console.log("Admin notified about tour update:", info.response);
                                }
                            });
                        }


                        res.status(200).json({
                            status:true,
                            message:'Tour updated successfully',
                            data: updatedTour
                        })
                    }
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

             const guide = await User.findById(guideId);
                if(!guide || !guide.isVerified){
                     return next(new HttpError("Your guide profile is not verified yet", 403))
                }else{

                    const deleted = await Tour.findOneAndUpdate(
                        {_id:id, is_deleted: false,guide:guideId},
                        {is_deleted:true, isActive: false},
                        {new:true}
                    ).populate("destination", "name")
                     .populate("guide", "name");
        
                    if(!deleted){
                        return next(new HttpError('Tour not found or already deleted ',404))
                    } else{

                        //  Find travellers with active bookings for this tour
                        const bookings = await Booking.find({ 
                            tour: deleted._id, 
                            status: { $in: ["pending", "confirmed"] } 
                        }).populate("user", "name email");

                        //  Notify each traveller
                        for (const booking of bookings) {
                            const traveller = booking.user;
                            if (!traveller) continue;

                            // In-app notification
                            await Notification.create({
                                recipient: traveller._id,
                                sender: guideId,
                                type: "custom",
                                message: `The tour "${deleted.title}" you booked has been cancelled.`,
                                link: `https://yourfrontend.com/bookings/${booking._id}`,
                                relatedTour: deleted._id,
                            });

                            // Email notification
                            const mailOptions = {
                                from: process.env.EMAIL_USER,
                                to: traveller.email,
                                subject: `Tour Cancelled: ${deleted.title}`,
                                template: "tourDeletedNotification", // handlebars file
                                context: {
                                    travellerName: traveller.name,
                                    tourTitle: deleted.title,
                                    guideName: deleted.guide.name,
                                    destination: deleted.destination?.name,
                                    bookingId: booking._id,
                                    link: `https://yourfrontend.com/bookings/${booking._id}`
                                },
                            };

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    console.error(`Failed to send cancellation email to ${traveller.email}:`, error);
                                } else {
                                    console.log(`Cancellation email sent to ${traveller.email}:`, info.response);
                                }
                            });
                        }


                        res.status(200).json({
                            status:true,
                            message:'Tour deleted successfully',
                            data:null
                        })
                    }
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
            .populate('destination', 'name country');
        }
        else{
            tour = await Tour.findOne({_id:id , is_deleted:false, isBlocked: false, isActive: true})
            .populate({ path: 'guide', select: 'name' })
           .populate('destination', 'name country');
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

//get single tour public
export const publicViewTour = async( req, res, next) => {
    try{

        const id = req.params.id

        const tour = await Tour.findOne({_id:id, is_deleted:false, isActive:true, isBlocked: false})
        .populate({ path: 'guide', select: 'name' })
        .populate('destination', 'name');

        if(!tour){
            return next(new HttpError('Tour not found', 404))
        }else{
            res.status(200).json({
                status:true,
                data: tour,
                message: null
            })
        }

    }catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

// toggle tour active status for temporarily disabling a tour 
export const toggleTourActiveStatus = async (req,res,next) => {
    try{

        const { tourId} = req.params
        const {user_id : guideId, user_role:tokenRole} = req.user_data

        if(tokenRole !== 'guide'){
            return next(new HttpError('You are not authorized to perform this action', 403));
        }else{

             const guide = await User.findById(guideId);
                if(!guide || !guide.isVerified){
                     return next(new HttpError("Your guide profile is not verified yet", 403))
                }else{

                    const tour = await Tour.findOne({is_deleted:false, _id: tourId, guide: guideId})
        
                    if (!tour) {
                        return next(new HttpError('Tour not found or you are not the owner', 404));
                    }else{
        
                        tour.isActive = !tour.isActive
                        await tour.save()


                        
                        //  Fetch travellers with active bookings for this tour
                        const bookings = await Booking.find({ tour: tourId, status: "confirmed" })
                            .populate("user", "name email")
                            console.log("Bookings found:", bookings.length)


                        // Load handlebars template
                        const templatePath = path.join(process.cwd(), "views", "tourStatusUpdate.handlebars")
                        const source = fs.readFileSync(templatePath, "utf8")
                        const compiledTemplate = handlebars.compile(source)

                        // Notify each traveller
                        for (const booking of bookings) {
                            const traveller = booking.user
                            if (!traveller) continue

                            // In-app notification
                            await Notification.create({
                                recipient: traveller._id,
                                sender: guideId,
                                type: "tour_updated",
                                message: `The tour "${tour.title}" has been ${tour.isActive ? "enabled" : "disabled"} by the guide.`,
                                relatedTour: tour._id
                            })

                            // Email notification
                            const htmlContent = compiledTemplate({
                                travellerName: traveller.name,
                                tourTitle: tour.title,
                                status: tour.isActive ? "enabled" : "disabled",
                                guideName: guide.name,
                                year: new Date().getFullYear()
                            })

                            await transporter.sendMail({
                                from: `"Journiq" <no-reply@journiq.com>`,
                                to: traveller.email,
                                subject: `Update: Tour "${tour.title}" has been ${tour.isActive ? "enabled" : "disabled"}`,
                                html: htmlContent
                            })
                        }
        
                        res.status(200).json({
                            status: true,
                            message: `Tour has been ${tour.isActive ? 'enabled' : 'disabled'} successfully`,
                            data: tour,
                        });
                    }
                }
        }

    }catch(err){
        console.error("toggle tour status error", err)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}



// View all tours with search, filters, destination, popularity, and pagination
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
      popular,
      skip,
      limit
    } = req.query;

    const { user_id: guideId, user_role: tokenRole } = req.user_data || {};

    let query = { is_deleted: false, isBlocked: false };

    // Public users should only see active tours; guides should see their tours (even inactive)
    if (tokenRole !== "guide") {
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
      query.title = { 
        $regex: title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 
        $options: "i" 
      };
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

    // Filter: availability date
    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return next(new HttpError("Invalid date format. Use YYYY-MM-DD", 400));
      }
      const filterDateStart = new Date(d.setHours(0,0,0,0));
      const filterDateEnd = new Date(d.setHours(23,59,59,999));

      query.availability = {
        $elemMatch: {
          date: { $gte: filterDateStart, $lte: filterDateEnd },
          slots: { $gt: 0 }
        }
      };
    }

    // Pagination values
    const limitNum = parseInt(limit) || 6;  // default 6 per page
    const skipNum = parseInt(skip) || 0;

    // Base query
    let tourList = Tour.find(query)
      .populate("destination", "name")
      .populate("guide", "name email");

    // Sorting
    if (popular === "true") {
      tourList = tourList.sort({ rating: -1 });
    } else {
      tourList = tourList.sort({ createdAt: -1 });
    }

    // Apply pagination
    tourList = tourList.skip(skipNum).limit(limitNum);

    // Execute query
    const tours = await tourList;
    const total = await Tour.countDocuments(query);

    res.status(200).json({
      status: true,
      message: null,
      total,                  // total tours (all matching filters)
      count: tours.length,    // count in current page
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

//get all tours by destination - done this function destination controller
// export const getAllTourByDestination = async (req, res, next) => {
//     try{
//          const {id} = req.params

//          const tours = await Tour.find({is_deleted: false, destination: id, isActive: true,})
//          .populate('destination', 'name')
//          .populate('guide','name email')

//          if(tours){
//             res.status(200).json({
//                 status: true,
//                 message:null,
//                 data: tours
//             })
//          }
//     }catch(err){
//         console.error("get all tour by destination error",err)
//         return next(new HttpError('Oops! Something went wrong', 500))
//     }
// }


//list for public without authentication 111

export const getAllToursPublic = async (req, res, next) => {
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


        const { id } = req.params;


        // Public query — only active and not deleted/blocked
        let query = { 
            is_deleted: false, 
            isBlocked: false, 
            isActive: true 
        };

         // Destination from params (/tours/destination/:id)
            if (id && mongoose.Types.ObjectId.isValid(id)) {
            query.destination = id;
            }

            // Destination from query (?destination=)
            if (destination && mongoose.Types.ObjectId.isValid(destination)) {
            query.destination = destination;
            }

        // Title search
        if (title) {
            query.title = {
                $regex: title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
                $options: 'i'
            };
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Price range
        if (priceMin || priceMax) {
            query.price = {};
            if (priceMin) query.price.$gte = Number(priceMin);
            if (priceMax) query.price.$lte = Number(priceMax);
        }

        // Duration range
        if (durationMin || durationMax) {
            query.duration = {};
            if (durationMin) query.duration.$gte = Number(durationMin);
            if (durationMax) query.duration.$lte = Number(durationMax);
        }

        // Rating filter
        if (ratingMin) {
            query.rating = { $gte: Number(ratingMin) };
        }

        // Availability filter by date
        if (date) {
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                return next(new HttpError('Invalid date format. Use YYYY-MM-DD', 400));
            }
            const filterDateStart = new Date(d.setHours(0,0,0,0));
            const filterDateEnd = new Date(d.setHours(23,59,59,999));

            query.availability = {
                $elemMatch: {
                    date: { $gte: filterDateStart, $lte: filterDateEnd },
                    slots: { $gt: 0 }
                }
            };
        }

        // Build query
        let tourList = Tour.find(query)
            .populate("destination", "name")
            .populate("guide", "name email");

        // Sorting
        if (popular === "true") {
            tourList = tourList.sort({ rating: -1 });
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
        console.error("Error fetching public tours", err);
        return next(new HttpError("Oops! Something went wrong", 500));
    }
};
