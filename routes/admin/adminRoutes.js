import { Router } from "express";
import userAuthCheck from "../../middlewares/userAuthCheck.js";
import { getAllUser, getUserById, toggleBlockUser ,getBlockedUsers } from "../../controllers/admin/adminController.js";


const adminRoute = Router()

adminRoute.use(userAuthCheck)

adminRoute.get('/users',getAllUser)
adminRoute.get('/users/blockedUsers',getBlockedUsers)

adminRoute.get('/users/:id',getUserById)
adminRoute.patch('/users/block/:id', toggleBlockUser)

export default adminRoute