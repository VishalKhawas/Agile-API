//whole code in a single file as it is a very basic code, in case of big projects, code can be written in different files and then exported to be used elsewhere

//Code By: Vishal Khawas

//requiring and initializing the express module
const express = require("express");
const app = express();

//requiring multer to upload file
const multer = require("multer");

//giving multer disk storage permission
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, Date.now() + "-" + file.originalname);
  },
});

//initializing multer
const upload = multer({ storage: storage });

//allowing express to parse incoming JSON requests
app.use(express.json());

const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");
// or as an es module:
// import { MongoClient } and {ObjectId} from 'mongodb'

// Connection URL
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

// Database Name
const dbName = "agileEvent";

async function main() {
  // Using connect method to connect to the server
  await client.connect();
  console.log("Connected successfully to server");

  const db = client.db(dbName);

  //assigning collection name
  const collection = db.collection("events");

  //root get request
  app.get("/", (req, res) => {
    res.send("Hello from the server");
  });

  //post request: to insert new data and image in MongoDB
  app.post("/events", upload.single("avatar"), async (req, res) => {
    try {
      //acquiring data from body and creating an object to store it
      toInsert = req.body;

      //adding path of image as key value pair in toInsert JSON object
      toInsert["imagePath"] = req.file.path;

      //inserting the data into MongoDB
      const insertResult = await collection.insertOne(toInsert);

      //if succesfull, send success message
      res.status(201).send("Data Inserted Succesfully");
    } catch (e) {
      //else send failure message
      res.status(400).send("An error occured while inserting data");
    }
  });

  // // code to fetch all documents in the collection
  // app.get("/events", async (req, res) => {
  //   try {
  //     const allDocs = await collection.find({}).toArray();
  //     res.status(200).send(allDocs);
  //   } catch (e) {
  //     res.status(404).send(e);
  //   }
  // });

  // get method to retrieve data from the mongoDB database according to parameters passed in url
  app.get("/events", async (req, res) => {
    try {
      //aquiring different fileds from url
      const _id = ObjectId(req.query.id);
      let type = req.body.type;
      const limit = parseInt(req.query.limit);
      const page = parseInt(req.query.page);

      //declaring startIndex and endIndex to do paging among returned documents
      let startIndex = (page - 1) * limit;
      let endIndex = page * limit;

      //if the id filled is present in the url i.e. we have to fetch by id
      if (_id) {
        const filteredDocs = await collection.find({ _id: _id }).toArray();
        res.send(filteredDocs);
      } else {
        //else fetch all and page results according to page and limit
        if (type == "latest") {
          const pagedDocs = await collection.find().sort({ _id: -1 }).toArray();
          res.send(pagedDocs.slice(startIndex, endIndex));
        }
      }
    } catch (e) {
      // in case of error, return status 404 i.e. not found
      res.status(404).send("Data Not found");
    }
  });

  //delete method to delete a document by its id
  app.delete("/events/:id", async (req, res) => {
    try {
      const _id = ObjectId(req.query.id);
      const deleteResult = await collection.deleteMany({ _id: _id }).toArray();
      res.status(200).send(deleteResult);
    } catch (e) {
      //in case of error return 404 i.e. not found
      res.status(404).send();
    }
  });

  // put method to change the contents of a document on a large level, if required to change on a small level, we can also use patch
  app.put("/events/:id", async (req, res) => {
    try {
      const _id = ObjectId(req.query.id);

      //replacing the whole body of document with new one
      const updateResult = await collection.updateOne(
        { _id: _id },
        { $set: req.body }
      );
      res.status(201).send(updateResult);
    } catch (e) {
      //in case of error, 404 i.e. not found
      res.status(404).send();
    }
  });
}

//lastly catch any error in connection, not closing the connection right now
main().then(console.log).catch(console.error);
// .finally(() => client.close());

//listen to the port
app.listen(3000, () => {
  console.log("Connected to server");
});
