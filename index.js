const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iwngqer.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("logistic-international");
    const topDeliveryMan = database.collection("bestDeliveryBoy");
    const userInfo = database.collection("userInfo");
    const bookParcelCollection = database.collection("book-parcel");
    const reviewsCollection = database.collection("reviews");
    app.get("/top-delivery-man", async (req, res) => {
      const result = await topDeliveryMan.find().toArray();
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const email = req.body.email;
      const query = { email: email };
      const isExist = await userInfo.findOne(query);
      if (isExist) {
        return res.send({ message: "User Already exist", insertId: null });
      }
      const result = await userInfo.insertOne(user);
      res.send(result);
    });
    app.get("/users/:email", async (req, res) => {
      const email = req?.params?.email;
      console.log(email)
      const query = { email: email };
      const result = await userInfo.findOne(query);
      res.send(result);
    });
    //user related api
    // Book a Parcel
    app.post("/book-parcel", async (req, res) => {
      const parcel = req.body;
      const result = await bookParcelCollection.insertOne(parcel);
      res.send(result);
    });
    //user information
    app.get("/user-profile/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userInfo.findOne(query);
      res.send(result);
    });
    //update user
    app.patch("/profile-update/:id", async (req, res) => {
      const id = req.params.id;
      const image = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...image,
        },
      };
      const result = await userInfo.updateOne(query, updateDoc);
      res.send(result);
    });
    // my-parcel
    app.get("/my-parcel/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await bookParcelCollection.find(query).toArray();
      res.send(result);
    });
    // my-parcel delete item
    app.patch("/my-parcel/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const updateDoc = {
        $set:{
          ...body
        }
      }
      const query = { _id: new ObjectId(id) };
      const result = await bookParcelCollection.updateOne(query,updateDoc);
      res.send(result);
    });
    // my-parcel
    app.get("/my-parcel", async (req, res) => {
      const { startDate, endDate } = req.query;
    

    
      if (startDate || endDate) {
        const start = new Date(startDate);
      const end = new Date(endDate);
      
    
      try {
        const query = {
          requestedDeliveryDate: {
            $gte: start.toISOString(), 
            $lte: end.toISOString(),  
          }
        };
        
    
        const result = await bookParcelCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal Server Error" });
      };
      }else{
        const result = await bookParcelCollection.find().toArray();
        res.send(result);
      }
      
    });
    
    app.get("/users", async (req, res) => {
      const { role, page = 1, limit = 5 } = req.query;
    
      const query = { role: role };
      const skip = (parseInt(page) - 1) * parseInt(limit);
    
      try {
        const userCursor = userInfo.find(query).skip(skip).limit(parseInt(limit));
        const userCount = await userInfo.countDocuments(query);
        const users = await userCursor.toArray();
    
        const usersWithParcelCount = await Promise.all(
          users.map(async (user) => {
            const parcels = await bookParcelCollection.find({ email: user.email }).toArray();
            const parcelCount = parcels.length;
            const totalSpent = parcels.reduce((sum, parcel) => sum + parcel.price, 0);
            return {
              ...user,
              parcelCount: parcelCount,
              totalSpent: totalSpent,
            };
          })
        );
    
        res.send({
          users: usersWithParcelCount,
          total: userCount,
          currentPage: parseInt(page),
          totalPages: Math.ceil(userCount / parseInt(limit)),
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = {
        _id: new ObjectId(id),
      };
      const updateDoc = {
        $set: {
          ...body,
        },
      };
    
      try {
        const result = await userInfo.updateOne(query, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    

    // my boking updated
    app.patch("/update-parcel/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          ...data,
        },
      };
      const result = await bookParcelCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    // Delivery Man Related Api
    app.get("/parcels", async (req, res) => {
      try {
        const { deliveryMan } = req.query;
        const query = {
          deliveryManEmail: deliveryMan,
        };
        console.log(query);
        const parcels = await bookParcelCollection.find(query).toArray();
        console.log(parcels);
        res.send(parcels);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });
    app.put("/parcels/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      console.log(data);
      const updateDoc = {
        $set: {
          ...data,
        },
      };
      const result = await bookParcelCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.get('/delivery-man', async (req, res) => {
      const deliveryMan = req.query;
      
    
      if (deliveryMan.role === 'deliveryMan') {
        const query = { role: deliveryMan.role };
    
        try {
          const deliveryMen = await userInfo.find(query).toArray();
          const reviews = await reviewsCollection.find().toArray();
    
          const deliveryMenWithAverageRating = deliveryMen.map((man) => {
            const manReviews = reviews.filter((review) => review.reviewEmail === man.email);
    
            const averageRating =
              manReviews.length > 0
                ? (manReviews.reduce((acc, curr) => acc + curr.rating, 0) / man.deliveryCount).toFixed(2)
                : 'No ratings';
    
            return {
              ...man,
              averageRating,
            };
          });
    
          res.json(deliveryMenWithAverageRating);
        } catch (error) {
          console.error(error);
          res.status(500).send({ message: 'Internal Server Error' });
        }
      } else {
        res.status(404).send({ message: 'Not found' });
      }
    });
    
    app.patch("/delivery-man/:email", async (req, res) => {
      const { email } = req.params;
      const result = await userInfo.updateOne(
        { email },
        { $inc: { deliveryCount: 1 } }
      );
      res.json(result);
    });
    app.post("/reviews", async (req, res) => {
      const data = req.body;
      const result = await reviewsCollection.insertOne(data);
      
      res.send(result);
    });
    // Route to get bookings by date
    app.get("/statistics/bookings-by-date", async (req, res) => {
      try {
        // Fetch all documents from the collection
        const allBookings = await bookParcelCollection.find().toArray();
        const bookingsByDate = {};
    
        // Process the data to count the number of orders for each booking date
        allBookings.forEach(booking => {
          const bookingDate = booking.booking_date; // Booking date in 'MM-DD-YYYY' format
    
          // Ensure the date string is correctly parsed and compared
          if (bookingsByDate[bookingDate]) {
            bookingsByDate[bookingDate]++;
          } else {
            bookingsByDate[bookingDate] = 1;
          }
        });
    
        // Format the response data
        const data = Object.keys(bookingsByDate).map(date => ({
          date,
          count: bookingsByDate[date]
        }));
    
        // Sort the data by date
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
        // Send the response
        res.send(data);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.get("/statistics/booking-delivery-comparison", async (req, res) => {
      try {
        const allBookings = await bookParcelCollection.find().toArray();
        const bookingsByDate = {};
        const deliveriesByDate = {};
    
        allBookings.forEach(booking => {
          const bookingDate = booking.booking_date;
          const deliveryDate = booking.status === "Delivered" ? booking.requestedDeliveryDate : null;
    
          // Count bookings by date
          if (bookingsByDate[bookingDate]) {
            bookingsByDate[bookingDate]++;
          } else {
            bookingsByDate[bookingDate] = 1;
          }
    
          // Count deliveries by date
          if (deliveryDate) {
            if (deliveriesByDate[deliveryDate]) {
              deliveriesByDate[deliveryDate]++;
            } else {
              deliveriesByDate[deliveryDate] = 1;
            }
          }
        });
    
        const allDates = Array.from(new Set([...Object.keys(bookingsByDate), ...Object.keys(deliveriesByDate)]));
    
        const data = allDates.map(date => ({
          date,
          bookings: bookingsByDate[date] || 0,
          deliveries: deliveriesByDate[date] || 0,
        }));
    
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
        res.send(data);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });
    


    app.get("/reviews/:email", async (req, res) => {
      const query = {
        reviewEmail: req.params.email,
      };
      const result = await reviewsCollection.find(query).toArray();
      res.send(result);
    });
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//listening
app.listen(port, () => console.log(`listening port : ${port}`));
