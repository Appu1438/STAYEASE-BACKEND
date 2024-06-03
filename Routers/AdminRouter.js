const mongoose = require('mongoose');
const express = require('express');
const HotelRouter = require('./HotelRouter');

const AdminRouter = express.Router();


require("../Database/models/Userdetails")
const User = mongoose.model("UserInfo")

require('../Database/models/Hoteldetails')
const Hotel = mongoose.model('HotelDetails')

require('../Database/models/Favourites')
const Favourites = mongoose.model('Favourites')

require('../Database/models/Bookings')
const Bookings = mongoose.model('Bookings')

require('../Database/models/Pending')
const Pending = mongoose.model('PendingDetails')

AdminRouter.get('/get-all-users', async (req, res) => {

    try {
        const data = await User.find({})
        if (data.length == 0) {
            res.send({ data: 'No Users Found' })
        } else {
            res.send({ status: "ok", data: data })
        }
    } catch (err) {
        res.send({ data: 'Error Fetching Users' })
        console.log(err)
    }
})


AdminRouter.post('/add-hotel', async (req, res) => {
    console.log(req.body)
    const _id=req.body._id
    try {

         
        const newHotel = new Hotel(req.body);

        if(_id){
            const pendingReq=await Pending.findByIdAndDelete({ _id })
        }
        // Save the booking to the database
        const savedBooking = await newHotel.save();
        res.send({ status: 'ok', data: 'Hotel Added Successfully' })


    } catch (err) {
        res.send({ data: 'Error in hotel Adding' })

    }
})

AdminRouter.get('/get-all-hotels', async (req, res) => {
    try {
        const hotels = await Hotel.find({})
        if (hotels.length > 0) {
            res.send({ status: 'ok', data: hotels })
        } else {
            res.send({ data: 'Hotels Not Found' })
        }
    } catch (err) {
        console.log(err)
        res.send({ data: 'Unknown Error occured' })
    }
})

AdminRouter.get('/get-pending-hotels', async (req, res) => {
    try {
        const hotels = await Pending.find({})
        if (hotels.length > 0) {
            res.send({ status: 'ok', data: hotels })
        } else {
            res.send({ data: 'Requests Not Found' })
        }
    } catch (err) {
        console.log(err)
        res.send({ data: 'Unknown Error occured' })
    }
})

AdminRouter.post('/remove-pending-hotels', async (req, res) => {
    const { _id } = req.body
    console.log(_id)
    try {
        const hotels = await Pending.findOneAndDelete({ _id })
        if (hotels) {
            res.send({ status: 'ok', data: "Removed Succesfully" })
        } else {
            res.send({ data: 'Hotel Not Found' })
        }
    } catch (err) {
        console.log(err)
        res.send({ data: 'Unknown Error occured' })
    }
})

AdminRouter.get('/get-all-bookings',async(req,res)=>{
    try{
        const Booking=await Bookings.find({})

        if(Booking.length==0){
            return res.send({ data: 'No Bookings Found' }); // Return an empty array if user has no favorites
        }else{
            res.send({ status: 'ok', data: Booking });

        }
    }catch (err) {
        res.send({ data: 'Error Fetching Bookings' });

    }
})


module.exports=AdminRouter