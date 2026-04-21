import express from "express";
import cors from "cors";

const app = express();

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Server is ready");
});

//get a list of 5 jokes
app.get("/api/jokes", (req, res) => {
  const jokes = [
    {
      id: 1,
      title: "A joke",
      content: "This is a joke",
    },
    {
      id: 2,
      title: "2nd joke",
      content: "This  is 2nd joke",
    },
    {
      id: 3,
      title: "3rd joke",
      content: "This is 3rd joke",
    },
    {
      id: 4,
      title: "4th joke",
      content: "This is 4th joke",
    },
    {
      id: 5,
      title: "5th joke",
      content: "This is 5th joke",
    },
  ];

  res.send(jokes);
});

app.listen(port, () => {
  console.log(`Server is at http://localhost:${port}`);
});
