const mongoose = require('mongoose');
const express = require('express');
const nodemailer = require('nodemailer');

const HotelRouter = express.Router();

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

HotelRouter.get('/get-user-hotels/:hoteluserid', async (req, res) => {
    console.log(req.params.hoteluserid)

    try {
        const hoteluserid = req.params.hoteluserid
        const hotels = await Hotel.find({ hoteluserid })
        console.log(hotels)
        if (hotels.length > 0) {
            res.send({ status: 'ok', data: hotels })
        } else {
            res.send({ data: 'No Hotels Found' })
        }
    } catch (err) {
        console.log(err)
        res.send({ data: 'Unknown Error occured' })
    }

})

HotelRouter.post('/req-hotel', async (req, res) => {
    console.log(req.body)
    try {


        const newReq = new Pending(req.body);
        // Save the booking to the database
        const savedBooking = await newReq.save();
        res.send({ status: 'ok', data: 'Requested Successfully' })


    } catch (err) {
        res.send({ data: 'Error in Requesting' })

    }
})


HotelRouter.post('/update-business', async (req, res) => {
    const {
        hotelid,
        hoteluserid,
        hotelname,
        hotelnumber,
        location,
        locationlink,
        actualrate,
        discountedrate,
        discountpercentage,
        taxandfee,
        availablerooms,
        personsperroom,
        extraperhead,
        extraperroom,
        extraperday,
        rating,
        facilities,
        images
    } = req.body;

    try {
        const _id=hotelid
        const updatedHotel = await Hotel.findOneAndUpdate(
            { _id },
            {
                hoteluserid,
                hotelname,
                hotelnumber,
                location,
                locationlink,
                actualrate,
                discountedrate,
                discountpercentage,
                taxandfee,
                availablerooms,
                personsperroom,
                extraperhead,
                extraperroom,
                extraperday,
                rating,
                facilities,
                images
            },
            { new: true }
        );

        if (!updatedHotel) {
            return res.status(404).send('Hotel not found');
        }

        res.send({ status: 'ok', data: 'Hotel Updated Successfully' });
    } catch (error) {
        console.error('Error updating hotel:', error);
        res.status(500).send('Internal Server Error');
    }
});

HotelRouter.post('/delete-business',async(req,res)=>{
    console.log(req.body._id)
    const _id=req.body._id
    
  try {
    const deletedHotel = await Hotel.findByIdAndDelete(_id);

    if (!deletedHotel) {
      return res.status(404).send('Hotel not found');
    }

    res.send({status:'ok',data:'Hotel was deleted successfully.'});
    
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).send('Internal Server Error');
  }
})

HotelRouter.get('/get-business-bookings/:hoteluserId', async (req, res) => {
    try {
        const hoteluserId = req.params.hoteluserId
        let Booking = await Bookings.find({ hoteluserId })
        console.log("BusinessBook", Booking)
        if (Booking.length == 0) {
            return res.send({ data: 'No Bookings Found' }); // Return an empty array if user has no favorites
        } else {
            res.send({ status: 'ok', data: Booking });
        }
        // Return the list of favorite hotel IDs
    } catch (err) {
        res.send({ data: 'Something Error' });

    }
})

module.exports=HotelRouter