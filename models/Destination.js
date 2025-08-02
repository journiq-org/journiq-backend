import  mongoose  from "mongoose";

const destinationSchema = mongoose.Schema({
    name:{
        type: String,
        required:true,
        trim:true
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String], // URLs or filenames
      required: true,
    },
    popularAttractions: {
      type: [String],
      default: [],
    },
    bestSeason: {
      type: String,
    },
    tags: {
      type: [String], // e.g., ["mountains", "temple", "wildlife"]
      default: [],
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // or "Guide" if guides create destinations
      required: true,
    }
},{
    timestamps:true
})



const Destination = mongoose.model("Destination",destinationSchema)

export default Destination