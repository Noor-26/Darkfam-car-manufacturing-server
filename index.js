const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express()
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');

// middlewere

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tq1da.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try{
        await client.connect()
        const toolCollection = client.db("manufacture").collection("tools");
        const orderCollection = client.db("manufacture").collection("orders");
        const reviewCollection = client.db("manufacture").collection("reviews");
        const userCollection = client.db("manufacture").collection("users");

        app.get('/items' ,async (req,res) => {
            const tools = await toolCollection.find().toArray()
            res.send(tools)
        })
        
        app.get('/item/:id',async(req,res) =>{
            const itemId = req.params.id
            const query = {_id:ObjectId(itemId)}
            const purchaseItem = await toolCollection.findOne(query)
            res.send(purchaseItem)
        })

        app.get('/order',async(req,res) => {
            const email = req.query.email;
            const filter = {email:email}
            const getOrder = await orderCollection.find(filter).toArray()
            res.send(getOrder);
        })
        
        app.get('/review' ,async (req,res) => {
            const reviews = await reviewCollection.find().toArray()
            res.send(reviews)
        })
        app.post('/order',async(req,res) => {
            const order = req.body;
            const addOrder = await orderCollection.insertOne(order)
            res.send(addOrder);
        })
        app.post('/review',async(req,res) => {
            const review = req.body;
            const addReview = await reviewCollection.insertOne(review)
            res.send(addReview);
        })

        app.put('/user/:email', async(req,res) => {
            const email = req.params.email;
            const user = req.body
            // console.log(user.education,email)
            const cursor = {email:email};
            const options = {upsert:true};
            const updateDoc = {
                $set : {
                    education:user.education,
                    location:user.location,
                    number:user.number,
                    linkdin:user.linkdin
                 }
            }
            const result = await userCollection.updateOne(cursor,updateDoc,options)
            res.send(result)
        })

    }

    
    finally{

    }
}
run()

app.get('/',(req,res) => {
    res.send('Success the surver is running')
})

app.listen(port,() => {
    console.log('Connections to the port done'); 
})