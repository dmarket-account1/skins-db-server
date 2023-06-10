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

const DB = () => {
  const db = mongoClient.db("steam-skins");
  return db;
};

const updateSkinsDB = async () => {
  try {
    const response = await axios.get(
      "http://csgobackpack.net/api/GetItemsList/v2/"
    );
    let skinsObject = response.data["items_list"];
    for (let [key, value] of Object.entries(skinsObject)) {
      if (!key.includes("Sticker")) {
        delete skinsObject[key];
      }
    }

    await DB()
      .collection("items-db")
      .updateOne(
        { id: "items-db" },
        {
          $set: {
            lastUpdated: new Date(),
            data: skinsObject,
          },
        }
      );
  } catch (error) {
    console.log(error);
  }
};

const start = () => {
  updateSkinsDB();

  setInterval(() => {
    updateSkinsDB;
  }, 10800 * 1000);
};

app.listen(3000, async () => {
  mongoClient.connect().then(() => {
    console.log(`Server is live.`);
    start();
  });
});
