const  mongoose  = require("mongoose")

const BookingsSchema=new mongoose.Schema({
    userId:String,
    hotelId:String,
    hoteluserId:String,
    hotelName:String,
    BookedAt:Date,
    CheckIn:Date,
    CheckOut:Date,
    Rooms:String,
    Guests:String,
    BookingId:String,
    TotalAmount:String,
    BookingStatus:String,
    PaymentStatus:String,
    PaymentDetails: [{
      paymentMethodId: String,
      amount: String,
      currency: String,
      clientSecret: String
  }],
  RefundedAmount:String,
  PaidAmount:String,

},{
    collection:"Bookings"
  }
)

mongoose.model("Bookings",BookingsSchema)