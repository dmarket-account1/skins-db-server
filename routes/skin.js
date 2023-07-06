import express from "express";
import { mongoClient } from "..";

const router = express.Router();

router.post("/add", async (req, res) => {
  const body = req.body;

  if (body.data == undefined) {
    res.status(400).send("Bad request.");
    return;
  }

  const db = mongoClient.db("steam-skins");
  const isSkin = await db.collection("skins").findOne({
    "extra.floatValue": body.data.extra.floatValue,
  });

  if (isSkin) {
    if (
      body.data.status.includes("TxSuccess") &&
      isSkin.status.includes("TxFailed")
    ) {
      await db
        .collection("skins")
        .findOneAndUpdate(
          { "extra.floatValue": body.data.extra.floatValue },
          { $set: body.data }
        );
      res.status(200).send("Success");
    }
    res.status(400).send("Skin has been already added");
    return;
  }

  body.data.date = new Date(body.data.date);
  await db.collection("skins").insertOne(body.data);
  res.status(200).send("Success");
});

// router.post("/update", async (req, res) => {});
// router.delete("/delete", async (req, res) => {});

export default router;
