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