const mongoose = require('mongoose');
const express = require('express');
const nodemailer = require('nodemailer');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const checkTokenExpiry = require('../middleware/checktoken');
require('dotenv').config();


const UserRouter = express.Router();

const JWT_SECRET = "jkjdsnfsd()asjfbaujewhrhejwo[]jsdf";


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

require('../Database/models/Reviews')
const Reviews = mongoose.model('Reviews')

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

const calculateAverageRating = (ratings) => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    const average = sum / ratings.length;
    return parseFloat(average.toFixed(1));
};


UserRouter.post('/user-data',checkTokenExpiry, async (req, res) => {
    const { token } = req.body;

    if (!token) {
        console.log('Token is required');
        return res.status(400).send({ error: "Token is required" });
    }

    try {
        // Verify token and decode user email
        const decodedUser = jwt.verify(token, JWT_SECRET);

        // Check if token is expired


        const userEmail = decodedUser.email;

        // Fetch user details from database using email
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            return res.status(404).send({ error: "User not found" });
        }

        return res.send({ status: 'ok', data: user });
    } catch (err) {
        // Handle JWT errors

    }
});

UserRouter.post('/generateOTP', (req, res) => {
    const { email } = req.body;

    // Generate a random OTP (in a real-world scenario, you might want to use a more secure method)
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Use your email service provider here
        auth: {
            user: 'adithyans1438@gmail.com', // Your email address
            pass: 'otls tpiy yemw dfig' // Your email password
        }
    });

    // Email content
    const mailOptions = {
        from: 'adithyans1438@gmail.com',
        to: email,
        subject: 'OTP For Your STAYEASE Account Verification',
        text: `Your OTP for Account Verification is: ${otp}`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ status: 'error', data: 'Failed to send OTP' });
        } else {
            console.log('Email sent:', info.response);
            res.status(200).json({ status: 'success', otp: otp });
        }
    });
});


UserRouter.post('/register', async (req, res) => {

    const { name, number, email, password, userType, image } = req.body

    const olduser = await User.findOne({ email: email })

    if (olduser) {
        return res.send({ data: "User already exist" })
    }
    const encryptedPassword = await bcrypt.hash(password, 10)
    console.log(encryptedPassword)
    try {
        await User.create({
            name: name,
            number: number,
            email: email,
            password: encryptedPassword,
            userType: userType,
            image: image
        })

        res.send({ status: "ok", data: "User Created" })
    } catch (err) {
        res.send({ status: "error", data: err })
    }
})

UserRouter.post('/login-user', async (req, res) => {
    const { email, password } = req.body
    const olduser = await User.findOne({ email: email })
    if (!olduser) {
        return res.send({ data: "User doesn't exists" })
    }
    if (await bcrypt.compare(password, olduser.password)) {
        const token = jwt.sign({ email: olduser.email }, JWT_SECRET , {expiresIn: '1m'})

        if (res.status(201)) {
            return res.send({ status: 'ok', data: token, userType: olduser.userType, })
        } else {
            return res.send({ error: "error" })
        }

    } else {
        return res.send({ data: "Incorrect Password" })
    }
})

UserRouter.post('/logout', async (req, res) => {
    const {token} =req.body

    res.send({status:'ok',data:'loggedOut'})

})

async function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' }); // Adjust expiry as needed
}


UserRouter.post('/delete-user', async (req, res) => {
    const { email, userId } = req.body
    console.log(email, userId)

    try {
        const deletedUser = await User.findOneAndDelete({ email });
        const deleteFav = await Favourites.findOneAndDelete({ userId });
        if (deletedUser && deleteFav) {
            return res.send({ status: 'ok', data: "User and favorites deleted successfully" });
        } else {
            return res.send({ status: 'fail', data: "User or favorites not found" });
        }

    } catch (err) {
        res.send({ data: "Error in Deleting User" })

    }
})

UserRouter.post('/update-user', async (req, res) => {
    console.log(req.body)
    const { name, number, email, userType, image } = req.body
    try {
        let user = await User.findOne({ email: email })
        await User.updateOne({ email: email }, {
            $set: {
                name,
                number,
                email,
                userType,
                image
            }
        })

        console.log(user)
        res.send({ status: 'ok', data: user })
    } catch (err) {
        res.send({ data: "Error While Updating" })


    }
})

UserRouter.post('/update-password', async (req, res) => {
    const { email, password } = req.body
    try {
        let user = await User.findOne({ email: email })
        const encryptedPassword = await bcrypt.hash(password, 10)

        if (!user) {
            res.send({ data: `User Doesn't Exists!!!` })
        } else {
            await User.updateOne({ email: email }, {
                $set: {
                    password: encryptedPassword
                }
            })
            console.log(user)
            res.send({ status: 'ok', data: 'Password Updated' })
        }
    } catch (err) {
        res.send({ data: "Error While Updating" })


    }
})

UserRouter.post('/add-to-favorites',checkTokenExpiry, async (req, res) => {
    try {
        console.log(req.body);
        const { userId, hotelId } = req.body;

        // Find the user's favorites document, if it exists
        let userFavorites = await Favourites.findOne({ userId });

        // If the user's favorites document doesn't exist, create one
        if (!userFavorites) {
            userFavorites = new Favourites({ userId, hotels: [hotelId] });
        } else {
            // Check if the hotel is already in user's favorites
            if (userFavorites.hotels.includes(hotelId)) {
                return res.send({ status: 'error', data: 'Hotel is already a favorite' });
            }
            // Add the hotel to user's favorites
            userFavorites.hotels.push(hotelId);
        }
        // Save the document
        await userFavorites.save();

        res.send({ status: 'ok', data: 'Hotel added to favorites successfully' });
    } catch (error) {
        console.error('Error adding hotel to favorites:', error);
        res.send({ status: 'error', data: 'Failed to add hotel to favorites' });
    }
});

UserRouter.post('/remove-from-favorites',checkTokenExpiry, async (req, res) => {
    try {
        const { userId, hotelId } = req.body;

        // Find the user's favorites document
        const userFavorites = await Favourites.findOne({ userId });

        if (!userFavorites) {
            return res.send({ status: 'error', data: 'User favorites not found' });
        }

        // Check if the hotel is in user's favorites
        const index = userFavorites.hotels.indexOf(hotelId);
        if (index === -1) {
            return res.send({ status: 'error', data: 'Hotel is not in user favorites' });
        }
        // Remove the hotel from user's favorites and save the document
        userFavorites.hotels.splice(index, 1);
        await userFavorites.save();

        res.send({ status: 'ok', data: 'Hotel removed from favorites successfully' });
    } catch (error) {
        console.error('Error removing hotel from favorites:', error);
        res.send({ status: 'error', data: 'Failed to remove hotel from favorites' });
    }
});

UserRouter.get('/get-favorites/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // console.log(userId)

        // Find the user's favorites docuent
        const userFavorites = await Favourites.findOne({ userId });

        if (!userFavorites) {
            return res.send({ data: 'No favourites found' }); // Return an empty array if user has no favorites
        } else {
            res.send({ status: 'ok', data: userFavorites.hotels });
        }

        // Return the list of favorite hotel IDs
    } catch (error) {
        console.error('Error getting user favorites:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get user favorites' });
    }
});


UserRouter.post('/submit-booking',checkTokenExpiry, async (req, res) => {
    console.log(req.body)
    try {
        // Create a new booking instance using the request body data
        const newBooking = new Bookings(req.body);
        // Save the booking to the database
        const savedBooking = await newBooking.save();
        // Send the saved booking details back to the frontend
        await sendConfirmationEmail(req.body)
        res.send({ status: 'ok', data: savedBooking })
    } catch (error) {
        // Handle errors
        console.error('Error submitting booking:', error);
        res.send({ data: 'Internal server error' });
    }
})

async function sendConfirmationEmail(bookingData) {
    const _id = bookingData.userId
    const olduser = await User.findById({ _id })
    console.log('mail ', olduser)

    // Create a Nodemailer transporter using your email service provider's SMTP settings
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Use your email service provider here
        auth: {
            user: 'adithyans1438@gmail.com', // Your email address
            pass: 'otls tpiy yemw dfig' // Your email password
        }
    });

    // Compose the email message
    const mailOptions = {
        from: 'adithyans1438@gmail.com',
        to: olduser.email,
        subject: 'Booking Confirmation',
        html: `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        max-width: 600px;
                        margin: auto;
                        padding: 20px;
                        border: 1px solid #ccc;
                        border-radius: 10px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .booking-details {
                        margin-bottom: 20px;
                    }
                    .booking-details p {
                        margin: 5px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Booking Confirmation</h1>
                    </div>
                    <div class="booking-details">
                        <p>Dear ${olduser.name},</p>
                        <p>Thank you for your booking!</p>
                        <p>Hotel: ${bookingData.hotelName}</p>
                        <p>Check-in: ${formatDate(bookingData.CheckIn)}</p>
                        <p>Check-out: ${formatDate(bookingData.CheckOut)}</p>
                        <p>Please carry your original ID proof during check-in.</p>
                        <p>This is a mandatory requirement for verification purposes.</p> <!-- New message --><br>
                        <p>Cancellation is available until the check-in time.</p>
                        <p>Pay now and get discount upto ₹200!  </p> <!-- New message -->                
                    </div>
                        <div class="footer">
                        <p>Regards,<br>STAYEASE</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    // Function to format date in "24 Apr 2024" format


    // Send the email
    await transporter.sendMail(mailOptions);
}

UserRouter.get('/get-user-bookings/:userId',checkTokenExpiry, async (req, res) => {
    try {
        const userId = req.params.userId
        let Booking = await Bookings.find({ userId })
        console.log("userbook", Booking)
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

UserRouter.get('/get-booking-deatils/:_id',checkTokenExpiry, async (req, res) => {
    try {
        const _id = req.params._id;
        let Booking = await Bookings.findById(_id).populate('hotelId');
        console.log('Booking', Booking)
        res.send({ status: 'ok', data: Booking });
    } catch (err) {
        res.send({ data: "Error Fetching booking" });
    }

})

UserRouter.post('/cancel-booking',checkTokenExpiry, async (req, res) => {
    const { id } = req.body
    console.log('cancel', id)

    try {
        // Find the document by its ID and update it
        const updatedDocument = await Bookings.findByIdAndUpdate(id, { BookingStatus: 'Cancelled' });

        if (!updatedDocument) {
            return res.send({ data: 'Document not found' });
        }

        else {
            // Document updated successfully
            await CancelationEmail(updatedDocument);
            return res.send({ status: 'ok', data: updatedDocument });
        }


    } catch (error) {
        console.error('Error cancelling booking:', error);
        return res.send({ error: 'Internal server error' });
    }
})

async function CancelationEmail(bookingData) {
    try {
        // Retrieve user details based on booking data (assuming 'userId' field exists in bookingData)
        const user = await User.findById(bookingData.userId);

        // Create Nodemailer transporter using your email service provider's SMTP settings
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'adithyans1438@gmail.com', // Your email address
                pass: 'otls tpiy yemw dfig' // Your email password
            }
        });

        // Compose the email message
        const mailOptions = {
            from: 'adithyans1438@gmail.com',
            to: user.email,
            subject: 'Booking Cancelled',
            html: `
                <html>
                <head>
                <style>
                body {
                    font-family: Arial, sans-serif;
                }
                .container {
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    border: 1px solid #ccc;
                    border-radius: 10px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .booking-details {
                    margin-bottom: 20px;
                }
                .booking-details p {
                    margin: 5px 0;
                }
            </style>
                </head>
                <body>
                <div class="container">
                <div class="header">
                    <h1>Booking Cancellation Confirmation</h1>
                </div>
                <div class="booking-details">
                    <p>Dear ${user.name},</p>
                    <p>Your booking has been cancelled!</p>
                    <p>Booking details:</p>
                    <p>Hotel: ${bookingData.hotelName}</p>
                    <p>Check-in: ${formatDate(bookingData.CheckIn)}</p>
                    <p>Check-out: ${formatDate(bookingData.CheckOut)}</p>
                    ${bookingData.PaymentStatus == 'paid' ? `
                    <p>A refund for your booking payment has been initiated as per our cancellation policies. Please allow up to 7 days for the refund to be processed.</p>
                    <p>If you have any further inquiries regarding the refund, please contact us.</p>
                    ` : ''}
                    <p>If you have any questions or concerns, please feel free to contact us.</p>
                </div>
                    <div class="footer">
                    <p>Regards,<br>STAYEASE</p>
                </div>
            </div>
                </body>
                </html>
            `
        };

        // Send the email
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending cancellation confirmation email:', error);
    }
}

UserRouter.get('/get-hotel-byID', async (req, res) => {
    try {
        const { id } = req.query;
        console.log(id); // Log the received ID for debugging
        const hotel = await Hotel.findById(id);
        if (hotel) {
            res.status(200).json({ status: 'ok', data: hotel });
        } else {
            res.status(404).json({ status: 'error', message: 'Hotel not found' });
        }
    } catch (err) {
        console.error('Error fetching hotel details:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
})

UserRouter.post('/reviews',checkTokenExpiry, async (req, res) => {
    try {
        console.log(req.body);
        const { hotelId, userName, userId, review, rating } = req.body;
        const newReview = new Reviews({ hotelId, userName, userId, review, rating });
        await newReview.save();

        // Update the hotel to push the new rating and increment the review count
        const hotel = await Hotel.findByIdAndUpdate(
            { _id: hotelId },
            {
                $inc: { reviewcount: 1 },
                $push: { ratings: rating }
            },
            { new: true }
        );

        // Calculate the new average rating
        const averageRating = calculateAverageRating(hotel.ratings);
        hotel.averageRating = averageRating;
        await hotel.save();

        return res.send({ status: 'ok', data: newReview });
    } catch (error) {
        res.status(500).json({ data: 'Error adding review', error });
    }
});


UserRouter.get('/reviews/:hotelId', async (req, res) => {
    try {
        console.log('review', req.params)
        const { hotelId } = req.params;

        const reviews = await Reviews.find({ hotelId }).sort({ createdAt: -1 });
        return res.send({ status: 'ok', data: reviews });
    } catch (error) {
        res.status(500).json({ data: 'Error fetching reviews', error });
    }
});
UserRouter.delete('/reviews/:id',checkTokenExpiry, async (req, res) => {
    try {
        const reviewId = req.params.id;

        // Find the review by ID
        const review = await Reviews.findById(reviewId);
        if (!review) {
            return res.status(404).json({ data: 'Review not found' });
        }

        // Delete the review
        await Reviews.findByIdAndDelete(reviewId);

        // Decrement the review count and remove the rating from the associated hotel
        const hotel = await Hotel.findByIdAndUpdate(
            { _id: review.hotelId },
            {
                $inc: { reviewcount: -1 },
                $pull: { ratings: review.rating }
            },
            { new: true } // This option returns the modified document
        );

        const averageRating = calculateAverageRating(hotel.ratings);
        hotel.averageRating = averageRating;
        await hotel.save();

        return res.send({ status: 'ok', data: 'Review and rating deleted' });
    } catch (error) {
        res.status(500).json({ data: 'Error deleting review and rating', error });
    }
});





module.exports = UserRouter;

