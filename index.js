const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_CODE)

// middlewere

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tq1da.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function varifyToken (req,res,next) {
    const authorize = req.headers.authorization
   if(!authorize){
    return res.status(401).send({message:"who are you"})
   }
   const token = authorize.split(" ")[1]
   jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded) {
   if(err){
    return res.status(403).send({message:"You can't enter"})
   }
   req.decoded = decoded
   next()
  });
}

const run = async () => { 
    try{
        await client.connect()
        const toolCollection = client.db("manufacture").collection("tools");
        const orderCollection = client.db("manufacture").collection("orders");
        const reviewCollection = client.db("manufacture").collection("reviews");
        const userCollection = client.db("manufacture").collection("users");
        const paymentCollection = client.db("manufacture").collection("payments");
        
        const varifyAdmin =async (req,res,next) => {
            const requester = req.decoded.email
            const requesterAccount = await userCollection.findOne({email:requester})
            if(requesterAccount.role === 'admin'){
                next()
            }
            else{
                res.status(403).send({message:"you can't enter in the website(*_*)"})
            }
        }

        app.get('/items' ,async (req,res) => {
            const tools = await toolCollection.find().limit(6).toArray()
            const main = tools.reverse()
            res.send(main)
        })
        
        app.get('/item/:id',varifyToken, async(req,res) =>{
            const itemId = req.params.id
            const query = {_id:ObjectId(itemId)}
            const purchaseItem = await toolCollection.findOne(query)
            res.send(purchaseItem)
        })
         
        app.get('/payment/:_id', async(req,res) =>{
            const itemId = req.params._id
            const query = {_id:ObjectId(itemId)}
            const payItem = await orderCollection.findOne(query)
            res.send(payItem)
        })

        app.get('/order',varifyToken, async(req,res) => {
            const email = req.query.email;
            const filter = {email:email}
            const getOrder = await orderCollection.find(filter).toArray()
            res.send(getOrder);
        })

        app.get('/orders' ,varifyToken,async (req,res) => {
            const Orders = await orderCollection.find().toArray()
            res.send(Orders)
        })
        
        app.get('/review' ,async (req,res) => {
            const reviews = await reviewCollection.find().toArray()
            res.send(reviews)
        })

        app.get('/users',varifyToken,varifyAdmin, async(req,res)=>{
            const allUsers = await userCollection.find().toArray()
            res.send(allUsers)
        })
        
        app.get('/admin/:email',varifyToken, varifyAdmin, async(req,res)=>{
            const email = req.params.email
            const user = await userCollection.findOne({email:email})
            const isAdmin = user?.role === 'admin'
            res.send({admin : isAdmin})
        })

        app.get('/user', async(req,res) => {
            const email = req.query.email;
            const filter = {email:email}
            const user = await userCollection.findOne(filter)
            res.send(user)
        })

        app.post('/order',varifyToken, async(req,res) => {
            const order = req.body;
            const addOrder = await orderCollection.insertOne(order)
            res.send(addOrder);
        })

        app.post('/items',varifyToken, async(req,res) => {
            const product = req.body;
            console.log(product)
            const addProduct = await toolCollection.insertOne(product)
            res.send(addProduct);
        })

        app.post("/create-payment-intent",async (req, res) => {
            const items  = req.body;
            const price = items.orderPrice
            const orderAmount = price*100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount :  orderAmount,
                currency : 'usd',
                payment_method_types:['card']
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        app.post('/review',varifyToken, async(req,res) => {
            const review = req.body;
            const addReview = await reviewCollection.insertOne(review)
            res.send(addReview);
        })

        app.put('/user/admin/:email',varifyToken, async(req,res)=>{
            const email = req.params.email;
            const filter = {email:email};
            const updateDoc={
                $set:{role:"admin"}
            }
            const makeAdmin = await userCollection.updateOne(filter,updateDoc)
            res.send(makeAdmin)
        })

        app.put('/users/:email',async(req,res)=>{
            const email = req.params.email
            const user = req.body
            const filter = {email:email}
            const options = {upsert:true}
            const updateDoc={
                $set:user
            }
            const result = await userCollection.updateOne(filter,updateDoc,options)
            const token = jwt.sign({email:email},process.env.ACCESS_TOKEN)
            res.send({result,token});
        })

        app.put('/users/:email',varifyToken, async(req,res) => {
            const email = req.params.email;
            const user = req.body
            console.log(user)
            const cursor = {email:email};
            const options = {upsert:true};
            const updateDoc = {
                $set : {
                    img:user.img,
                    name:user.name,
                    education:user.education,
                    location:user.location,
                    number:user.number,
                    linkdin:user.linkdin
                 }
            }
            const result = await userCollection.updateOne(cursor,updateDoc,options)
            res.send(result)
        })
        app.patch('/payment/:_id',varifyToken, async(req,res) => {
            const id = req.params._id
            const payment = req.body
            const filter = {_id:ObjectId(id)}
            const updateDoc={
                $set:{
                    paid:true,
                    transactionId:payment.transactionId,
                    status:'pending'
                }
            }
            const updateOrder = await orderCollection.updateOne(filter,updateDoc)
            const result = await paymentCollection.insertOne(payment)
            res.send(updateDoc)
        })

        app.delete('/items/:id',varifyAdmin,varifyToken, async(req,res) => {
            const productId = req.params.id
            const filter = {_id:ObjectId(productId)}
            const deleteProduct = await toolCollection.deleteOne(filter)
            res.send(deleteProduct)
        })

        app.delete('/order/:id',varifyToken, async(req,res) => {
            const orderId = req.params.id
            const filter = {_id:ObjectId(orderId)}
            const deleteOrder = await orderCollection.deleteOne(filter)
            res.send(deleteOrder)
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