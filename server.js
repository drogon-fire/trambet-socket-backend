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
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    if (interval) clearInterval(interval);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
