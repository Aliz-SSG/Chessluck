const http = require("http");
const app = require("./app");
const initSocket = require("./socket");
const gameController = require("./src/controllers/gameController");

const server = http.createServer(app);
const io = initSocket(server);

gameController.setIO(io);

const Port = process.env.PORT || 5000;
server.listen(Port, () => {
    console.log(`listening on port ${Port}!!!`);
});
