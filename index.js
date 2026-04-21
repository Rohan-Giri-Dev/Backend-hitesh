require('dotenv').config()
const express = require("express");

const app = express();
const port = process.env.PORT

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.get(
  "/twitter",
  (req, res) => {
    res.send("Listeing at twitter");
  }),

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  console.log(`listening at http://localhost:${port}/`);
});
