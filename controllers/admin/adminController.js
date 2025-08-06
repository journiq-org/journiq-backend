import HttpError from '../../middlewares/httpError.js'
import User from '../../models/User.js'


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

//toggle block user
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
