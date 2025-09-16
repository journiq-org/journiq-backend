import transporter from '../../config/email.js'
import HttpError from '../../middlewares/httpError.js'
import Booking from '../../models/Booking.js'
import Review from '../../models/Review.js'
import Tour from '../../models/Tour.js'
import User from '../../models/User.js'
import Notification from '../../models/Notification.js'
import Destination from '../../models/Destination.js'


//USER MANAGEMENT

//view all users
export const getAllUser = async (req , res ,next) => {
    try{
        let total = 0 
        const {user_id : adminId,user_role:tokenRole} = req.user_data

        //pagination
        const limit = parseInt(req.query.limit) || 10
        const skip = parseInt(req.query.skip) || 0

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{


            const users = await User.find({isDeleted:false, role:'traveller'}).select('-password')
             //pagination
            .skip(skip)
            .limit(limit)

            total = await User.countDocuments({isDeleted: false, role: 'traveller'})

            if(users){
                res.status(200).json({
                    status:true,
                    message:null,
                    data:users,
                    total : total
                })
            }
        }

    }catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//get user by id
export const getUserById = async (req,res,next) => {
    try{
        const id = req.params.id

        const {user_id:adminId, user_role:tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next( new HttpError('You are not authorized to perform this action ',403))
        }
        else{
            const user = await User.findOne({isDeleted: false, role:'traveller', _id:id}).select('-password')

            if(!user){
                return next(new HttpError('User not found',404))
            }else{
                res.status(200).json({
                    status:true,
                    message:null,
                    data:user
                })
            }
        }
    }catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//toggle block user- (email notification)
export const toggleBlockUser = async (req,res,next) => {
    try{
        const id = req.params.id
        const {user_id:adminId, user_role:tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next( new HttpError('You are not authorized to perform this action ',403))
        }else{

            const user = await User.findById(id)

            if(!user || user.isDeleted){
                return next(new HttpError('User not found',404))
            }else{

                user.isBlocked = !user.isBlocked
                await user.save()

                // 📩 Send email to the user about block/unblock status
                    const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: `Your Journiq Account Has Been ${user.isBlocked ? 'Blocked' : 'Unblocked'}`,
                    template: 'userBlockStatus', // The .hbs file name without extension
                    context: {
                        name: user.name,
                        isBlocked: user.isBlocked,
                        year: new Date().getFullYear(),
                    },
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error(`Failed to send user block/unblock notification:`, error);
                    } else {
                        console.log(`User notified: ${info.response}`);
                    }
                    });

                res.status(200).json({
                    status:true,
                    message:` User has been ${user.isBlocked ? 'Blocked' : 'Unblocked' } successfully`,
                    data: {userId: user._id,isBlocked:user.isBlocked}
                })
            }
        }

    }catch(err){
         console.error('BLOCK/UNBLOCK USER ERROR:', err);
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//get blocked users
export const getBlockedUsers = async (req,res,next) => {
    try{
        
        const {user_role:tokenRole}= req.user_data

        if(tokenRole !== 'admin'){
            return next( new HttpError('You are not authorized to perform this action ',403))
        }else{
            const users = await User.find({isBlocked: true}).select('-password')

            // if(!users || users.length === 0){
            //     return next(new HttpError('No blocked users found',404))
            // }else{
                res.status(200).json({
                    status:true,
                    message:null,
                    data: users
                })
            // }
        }

    }catch(err){
        console.error('view blocked user error', err.message, err.stack)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//delete user (email)
export const deleteUser = async (req,res,next) => {
    try{

        const id = req.params.id
        const {user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{
            const deletedUser = await User.findOneAndUpdate(
                {_id:id, isDeleted:false,role:'traveller'},
                {isDeleted:true},
                {new:true}
            )

            if(!deleteUser){
                return next(new HttpError('User not found',404))
            }else{

                // 📩 Send email to deleted user
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: deletedUser.email,
                    subject: "Your Journiq Account Has Been Deleted",
                    template: "userDeletedNotification", // matches the filename userDeletedNotification.hbs
                    context: {
                        name: deletedUser.name,
                    },
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error(`Failed to send account deletion email:`, error);
                    } else {
                        console.log(`Deletion email sent to ${deletedUser.email}: ${info.response}`);
                    }
                });


                res.status(200).json({
                    status:true,
                    message:'User deleted successfully',
                    data:deletedUser
                })
            }
        }

    }catch(err){
        return next(new HttpError('Oops ! Something went wrong',500))
    }

}



//GUIDE MANAGEMENT

//get all guide
export const getAllGuide = async (req,res,next) => {
    try{
        let total = 0
        const { user_role: tokenRole} = req.user_data

        const limit = (req.query.limit) || 10
        const skip = (req.query.skip ) || 0

        if(tokenRole !== 'admin') {
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{



            //get guides data
            const guides = await User.find({isDeleted:false, role:'guide'})
            .limit(limit)
            .skip(skip)

            total = await User.countDocuments({isDeleted: false, role: 'guide'})

            if(guides){
                res.status(200).json({
                    status:true,
                    message:null,
                    data:guides,
                    total: total
                })
            }
        }

    }catch(err){
        console.error('get all guide error', err.message, err.stack)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//verify guide (both inbox and mail)
export const verifyGuide = async (req,res,next) => {
    try{

        const id = req.params.id
        const { user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{

            const guide = await User.findOneAndUpdate(
                {_id:id, role:'guide',isDeleted: false,isVerified:false},
                {isVerified:true},
                {new:true, runValidators: true }
            )

            if(!guide){
                return next(new HttpError('Guide not found',404))
            }else{

                //  Create in-app notification
                    await Notification.create({
                        recipient: guide._id,
                        type: "guide_verified",
                        message: "Your guide account has been verified by the admin.",
                        isRead: false,
                    });

                    //  Send email notification
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: guide.email,
                        subject: "Congratulations! Your Guide Account is Verified",
                        template: "guideVerifiedNotification", // template file name
                        context: {
                            name: guide.name,
                        },
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error(`Failed to send verification email:`, error);
                        } else {
                            console.log(`Verification email sent to ${guide.email}: ${info.response}`);
                        }
                    });


                res.status(200).json({
                    status:true,
                    message:'Guide verified successfully',
                    data:{
                        id: guide._id,
                        name: guide.name,
                        email: guide.email,
                        isVerified: guide.isVerified
                    }
                })
            }
        }

    }catch(err){
        console.log('verify guide error', err)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//revoke guide
export const revokeGuide = async (req,res,next) => {
    try{
        const id = req.params.id
        const {user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{

            const guide = await User.findOneAndUpdate(
                {_id:id, role:'guide',isDeleted:false, isVerified:true},
                {isVerified:false},
                {new:true}
            ).select('-password')

            if(!guide){
                return next(new HttpError('Guide not found or already unverified', 404))
            }else{

                //  Create in-app notification
                await Notification.create({
                    recipient: guide._id,
                    type: "custom",
                    message: "Your guide verification has been revoked by the admin.",
                    isRead: false,
                });

                //  Send email notification
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: guide.email,
                    subject: "Important: Your Guide Verification Has Been Revoked",
                    template: "guideRevokedNotification", // Handlebars template file name
                    context: {
                        name: guide.name,
                    },
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error(`Failed to send revocation email:`, error);
                    } else {
                        console.log(`Revocation email sent to ${guide.email}: ${info.response}`);
                    }
                });


                res.status(200).json({
                    status:true,
                    message:'Guide verification has been revoked',
                    data: guide
                })
            }
        }
    }catch(err){
        console.error('revoke guide error', err.message, err.stack)
        return next(new HttpError('Oops! Something went wrong', 500))
    }
}

//get guide by id
export const viewGuideById = async (req,res,next) => {
    try{
        const id = req.params.id
        const {user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin') {
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{
            const guide = await User.findOne({_id: id,role: "guide",isDeleted: false}).select("-password");

            if(!guide){
                return next(new HttpError('Guide not found ', 404))
            }else{
                return res.status(200).json({
                    success: true,
                    message: null,
                    data: guide,
                });
            }
        }

    }catch(err){
        return next(new HttpError('Oops ! Something went wrong',500))
    }
}


//TOUR MODERATION - not checked in postman |
 

// block tour - toggle (inbox)
export const toggleBlockTour = async (req,res,next) => {
    try{
        const id = req.params.id

        const {user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{

            const blockedTour = await Tour.findOne({is_deleted:false, _id:id})
            .populate("guide", "_id name");

            if(!blockedTour){
                return next(new HttpError('Tour not found',404))
            }else{

                blockedTour.isBlocked = !blockedTour.isBlocked
                await blockedTour.save()

                // Create in-app notification for the tour's guide
                await Notification.create({
                    recipient: blockedTour.guide._id, // send to guide
                    type: blockedTour.isBlocked ? "tour_blocked" : "tour_unblocked",
                    message: `Your tour "${blockedTour.title}" has been ${blockedTour.isBlocked ? "blocked" : "unblocked"} by the admin.`,
                    isRead: false
                });


                 res.status(200).json({
                    status:true,
                    message:` Tour has been ${blockedTour.isBlocked ? 'Blocked' : 'Unblocked' } successfully`,
                    data: {
                        tourId: blockedTour._id, 
                        isBlocked:blockedTour.isBlocked
                    }
                })


            }
        }

    }catch(err){
        console.error('toggle block tour',err)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//get tour of corresponding guide
export const getTourByGuide = async (req,res,next) => {
    try{

        const id = req.params.id

        const { user_role:tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{


            const tours = await Tour.find({guide:id, is_deleted:false})
            .populate('destination', 'name')

            if(tours){
                res.status(200).json({
                    status:true,
                    message:null,
                    data: tours,
                })
            }
        }

    }catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}


//get single tour by guide
export const getSingleTourByGuide = async (req,res,next) => {
    try{

        const {guideId , tourId} = req.params
        const {user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{

            const tour = await Tour.findOne({_id: tourId, is_deleted:false, guide:guideId})
            .populate('guide', 'name email phone')
            .populate('destination', 'name ')

            if(!tour){
                return next(new HttpError('Tour not found',404))
            }else{
                res.status(200).json({
                    status:true,
                    message:null,
                    data: tour
                })
            }
        }

    }catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}


//BOOKING OVERSIGHT

//view all bookings of corresponding tour
export const getBookingsByTour = async (req,res,next) => {
    try{
         const {tourId} = req.params

         const {user_role: tokenRole} = req.user_data

         if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
         }else{

            const bookings = await Booking.find({tour: tourId, is_deleted:false}) 
            .populate('user' , 'name email')

            if(bookings){
                res.status(200).json({
                    status:true,
                    message:null,
                    data: bookings,
                })
            }
         }

    }catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//view single booking 
export const getSingleBooking = async (req,res,next) => {
    try{

        const {bookingId} = req.params

        const {user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{

            const booking = await Booking.findOne({ _id: bookingId, is_deleted: false })
            .populate('user', 'name email')
            .populate('tour', 'title guide');

            if(!booking){
                return next(new HttpError('Booking not found',404))
            }else{
                 res.status(200).json({
                    status: true,
                    message: null,
                    data: booking,
                    });
            }
        }
        
    }catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}


// REVIEW MODERATION

//delete review
export const adminDeleteReview = async (req,res,next) => {
    try{
        const {id} = req.params

        const { user_id: adminId, user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{

            // const deletedReview = await Review.findOneAndUpdate(
            //     {_id:id,isDeleted:false},
            //     {isDeleted:true},
            //     {new:true}
            // )

            // First get the review with tour & user populated
            const review = await Review.findOne({ _id: id, isDeleted: false })
                .populate("tour", "title")
                .populate("user", "_id name");


            if(!review){
                return next(new HttpError('Review is already deleted or not found',404))
            }else{

                // Mark as deleted
                review.isDeleted = true;
                await review.save({ validateBeforeSave: false });



                // Send in-app notification to review author
                await Notification.create({
                    recipient: review.user._id,
                    type: "custom",
                    message: `Your review on tour "${review.tour?.title || 'Unknown'}" has been removed by the admin.`,
                    isRead: false
                });


                res.status(200).json({
                    status: true,
                    message: "Review deleted successfully",
                    data: null,
                })
            }
        }
    }catch(err){
        console.error('admin delete rewiew:', err)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//get review count for guide
export const getGuideTotalReviews = async (req, res, next) => {
    try{
        const {guideId} = req.params
        const {user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('Your not authorized to perform this action',403))
        }else{

            //get all tour ids
            const tours = await Tour.find({guide: guideId,is_deleted: false}).select('_id')

            if(!tours.length){
                 return res.status(200).json({
                    status: true,
                    message: "No tours found for this guide",
                    data: { totalReviews: 0 },
                })
            }

            const tourIds = tours.map((t) => t._id)

            //count review
            const totalReviews = await Review.countDocuments({tour: {$in: tourIds},isDeleted: false})

            return res.status(200).json({
                status: true,
                message: null,
                data: { totalReviews },
            })
        }

    }catch(err){
        return next(new HttpError('Oops! Something went wrong', 500))
    }
}



//dashboard statistics
export const getDashboardStats = async (req, res, next) => {
  try {
    const { user_role: tokenRole } = req.user_data;
    if (tokenRole !== "admin") {
      return next(new HttpError("Not authorized", 403));
    }

    const totalUsers = await User.countDocuments({ isDeleted: false });
    const totalGuides = await User.countDocuments({ role: "guide", isDeleted: false });
    const totalTours = await Tour.countDocuments({ is_deleted: false });
    const totalBookings = await Booking.countDocuments({ isDeleted: false });

    res.status(200).json({
      status: true,
      message: null,
      data: {
        totalUsers,
        totalGuides,
        totalTours,
        totalBookings
      }
    });
  } catch (err) {
    return next(new HttpError("Failed to fetch dashboard stats", 500));
  }
};


//Destination

//view all destination
export const getAllDestinationsAdmin = async (req, res, next) => {
  try {

    let total = 0
    const {user_role : tokenRole} = req.user_data

    const limit = (req.query.limit) || 10
    const skip = (req.query.skip) || 0

    if(tokenRole !== 'admin'){
        return next(new HttpError('You are not authorized to view this',403))
    }else{

        const destinations = await Destination.find({is_deleted: false})
        .limit(limit)
        .skip(skip)

        total = await Destination.countDocuments({is_deleted: false})

        res.status(200).json({
          message:null,  
          status: true,
          data: destinations,
          total:total
        });
    }
  } catch (err) {
    next(err);
  }
};


// view single destination (admin only)
export const getDestinationByIdAdmin = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { user_role: tokenRole } = req.user_data;

    let destination; 

    if (tokenRole === "admin") {
      destination = await Destination.findOne({ is_deleted: false, _id: id });
    } else {
      return next(new HttpError("You are not authorized", 403));
    }

    if (!destination) {
      return next(new HttpError("Destination not found", 404));
    }

    res.status(200).json({
      status: true,
      message: null,
      data: destination,
    });
  } catch (err) {
    console.error("error from view ", err);
    return next(new HttpError("Oops! Something went wrong", 500));
  }
};
