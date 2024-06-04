const express = require('express');
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()
const app = express()
const port = process.env.PORT || 3000

//middleware
app.use(express.json())
app.use(cors())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iwngqer.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("logistic-international");
    const topDeliveryMan = database.collection("bestDeliveryBoy");
    const userInfo = database.collection("userInfo");
    const bookParcelCollection = database.collection("book-parcel");
    app.get('/top-delivery-man',async(req,res)=>{
        
        const result = await topDeliveryMan.find().toArray()
        res.send(result)
    })
    app.post('/users',async(req,res)=>{
        const user = req.body
        const email= req.body.email
        const query = {email:email}
        const isExist = await userInfo.findOne(query)
        if(isExist){
          return res.send({ message: "User Already exist", insertId: null });
        }
        const result =await userInfo.insertOne(user)
        res.send(result)
    })
    app.get('/users/:email',async(req,res)=>{
      const email = req.params.email
      const query = {email:email}
      const result = await userInfo.findOne(query)
      res.send(result)
    })
    //user related api
    // Book a Parcel
    app.post('/book-parcel',async(req,res)=>{
      const parcel =req.body
      const result =await bookParcelCollection.insertOne(parcel)
      res.send(result)
    })
    //user information
    app.get('/user-profile/:email',async(req,res)=>{
      const email =req.params.email
      const query = {email:email}
      const result = await userInfo.findOne(query)
      res.send(result)
    })
    //update user
    app.patch('/profile-update/:id',async(req,res)=>{
      const id = req.params.id
      const image = req.body
      const query = {_id:new ObjectId(id)}
      const updateDoc = {
        $set: {
          ...image,
        },
      };
      const result =await userInfo.updateOne(query,updateDoc)
      res.send(result)

    })
    // my-parcel
    app.get('/my-parcel',async(req,res)=>{
      const result = await bookParcelCollection.find().toArray()
      res.send(result)
    })
    // delete my parcel
    app.delete('/my-parcel/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id:new ObjectId(id)}
      const result =await bookParcelCollection.deleteOne(query)
      res.send(result)
      

    })
    // my boking updated 
    app.patch('/update-parcel/:id',async(req,res)=>{
      const id = req.params.id
      const  data = req.body
      const query = {_id:new ObjectId(id)}
      const updateDoc = {
        $set: {
          ...data,
        },
      };
      const result =await bookParcelCollection.updateOne(query,updateDoc)
      res.send(result)

    })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



//listening 
app.listen(port,()=>console.log(`listening port : ${port}`))

