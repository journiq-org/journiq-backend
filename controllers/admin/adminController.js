import transporter from '../../config/email.js'
import HttpError from '../../middlewares/httpError.js'
import Booking from '../../models/Booking.js'
import Review from '../../models/Review.js'
import Tour from '../../models/Tour.js'
import User from '../../models/User.js'
import Notification from '../../models/Notification.js'


//USER MANAGEMENT

//view all users
export const getAllUser = async (req , res ,next) => {
    try{
        const {user_id : adminId,user_role:tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{

            const users = await User.find({isDeleted:false, role:'traveller'}).select('-password')

            if(users){
                res.status(200).json({
                    status:true,
                    message:null,
                    data:users
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

            if(!users || users.length === 0){
                return next(new HttpError('No blocked users found',404))
            }else{
                res.status(200).json({
                    status:true,
                    message:null,
                    data: users
                })
            }
        }

    }catch(err){
        console.error('view blocked user error', err.message, err.stack)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//delete user
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
        const { user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin') {
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{

            const guides = await User.find({isDeleted:false, role:'guide'})

            if(guides){
                res.status(200).json({
                    status:true,
                    message:null,
                    data:guides
                })
            }
        }

    }catch(err){
        console.error('get all guide error', err.message, err.stack)
        return next(new HttpError('Oops! Something went wrong',500))
    }
}

//verify guide
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


//TOUR MODERATION - not checked in postman |
 

// block tour - toggle
export const toggleBlockTour = async (req,res,next) => {
    try{
        const id = req.params.id

        const {user_role: tokenRole} = req.user_data

        if(tokenRole !== 'admin'){
            return next(new HttpError('You are not authorized to perform this action',403))
        }else{

            const blockedTour = await Tour.findOne({is_deleted:false, _id:id})

            if(!blockedTour){
                return next(new HttpError('Tour not found',404))
            }else{

                blockedTour.isBlocked = !blockedTour.isBlocked
                await blockedTour.save()

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

            if(tours){
                res.status(200).json({
                    status:true,
                    message:null,
                    data: tours
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
                    data: bookings
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

            const deletedReview = await Review.findOneAndUpdate(
                {_id:id,isDeleted:false},
                {isDeleted:true},
                {new:true}
            )

            if(!deletedReview){
                return next(new HttpError('Review is already deleted or not found',404))
            }else{
                res.status(200).json({
                    status: true,
                    message: "Review deleted successfully",
                    data: null,
                })
            }
        }
    }catch(err){
        return next(new HttpError('Oops! Something went wrong',500))
    }
}