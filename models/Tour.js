import mongoose from "mongoose";

const tourSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type: String,
        required:true
    },
    destination:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Destination",
        required:true
    },
    guide:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    itinerary:{
        type: [String],
        required: true,
    },
    duration:{
        type:Number,
        required: true
    },
    highlights:{
        type:[String],
        default:[]
    },
    price:{
        type:Number,
        required:true
    },
    availability:[
       { 
        date:{
            type:Date,
            required:true
            },
        slots:{
            type: Number,
            required:true
            }
        }
    ],
    images:{
        type:[String],
        default:[]
    },
    included:{
        type:[String],
        default: []
    },
     excluded: {
      type: [String],
      default: [],
    },
    meetingPoint: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Adventure",
        "Cultural",
        "Nature",
        "Food & Drink",
        "Wildlife",
        "Historical",
        "Beach",
        "Urban",
        "Religious",
        "Others",
      ],
      default: "Others",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    isActive: {   //guide control
      type: Boolean,
      default: true,
    },
    isBlocked: {    //admin control
        type: Boolean,
        default: false
    }
   
},{
    timestamps:true
})

const Tour = mongoose.model("Tour", tourSchema)

export default Tour