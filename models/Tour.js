import mongoose from "mongoose";

const tourSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    destination:{
        type:string,
        required:true
    },
    description:{
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
        type:[string],
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
        type:[string],
        default:[]
    },
    included:{
        type:[string],
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
    isActive: {
      type: Boolean,
      default: true,
    }
   
},{
    timestamps:true
})

const Tour = mongoose.model("Tour", tourSchema)

export default Tour