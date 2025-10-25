const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8,
});

// ! Server connection and get Access token
const getAccessToken = async () => {
  const url = "https://live.goalserve.com/api/v1/auth/gettoken"; // prefer https
  const apiKey = "89b86665dc8348f5605008dc3da97a57";

  try {
    const response = await axios.post(
      url,
      { apiKey }, // send as JSON body
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Access token:", response.data);
    return response.data;
  } catch (err) {
    console.log(
      "❌ Fetch error:",
      err.response?.status || err.code,
      err.response?.data || err.message
    );
    return null;
  }
};





const getRandomGames = async (category) => {
  const url = `https://images-api.nasa.gov/search?q=${category}`;

  try {
    const response = await axios.get(url);
    return response?.data?.collection?.items || [];
  } catch (err) {
    console.error("Fetch error", err);
    return [];
  }
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);


  let currentCategory = "cricket"; // default
  let interval = null;

  const startCategoryUpdates = (category) => {
    if (interval) clearInterval(interval);
    currentCategory = category;

    interval = setInterval(async () => {
      const data = await getRandomGames(category);
      socket.emit("category-data", data);
    }, 2000); // every 3s new API data
  };

  // Start with cricket
  startCategoryUpdates("cricket");

  // Client can select category
  socket.on("select-category", (category) => {
    console.log(`Category selected: ${category}`);
    startCategoryUpdates(category);
    // Get Access token
    getAccessToken();
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    if (interval) clearInterval(interval);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
