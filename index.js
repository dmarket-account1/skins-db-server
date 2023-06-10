import express from "express";
import cors from "cors";
import * as mongodb from "mongodb";
import dotenv from "dotenv";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: "10mb" }));
dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;

const mongoClient = new mongodb.MongoClient(MONGODB_URL);

let data = { db: null, lastUpdated: null };

const updateSkinsDB = async () => {
  const response = await axios.get(
    "http://csgobackpack.net/api/GetItemsList/v2/"
  );
  data.db = response.data["items_list"];
  const time = new Date();
  data.lastUpdated = `${time.toDateString()}, ${time.toLocaleTimeString()}`;
};

const start = () => {
  setTimeout(() => {
    updateSkinsDB();
  }, 0);
  setInterval(() => {
    updateSkinsDB;
  }, 21600 * 1000);
};

app.get("/", (req, res) => {
  res.status(200).json({
    status: "SkinsDB is working.",
    info: {
      "last_updated": data.lastUpdated,
    },
  });
});

app.get("/db", (req, res) => {
  if (data.db) {
    res.status(200).json(data.db);
  } else {
    res.status(400).send("Try one more time");
  }
});

app.listen(3000, async () => {
  mongoClient.connect().then(() => {
    console.log(`Server is live.`);
    start();
  });
});
