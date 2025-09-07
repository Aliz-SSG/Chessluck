const { Server } = require("socket.io");
const Message = require("./src/models/Message");

function initSocket(server) {
    const io = new Server(server);

    io.on("connection", (socket) => {
        console.log("a user connected:", socket.id);

        socket.on("joinChat", ({ currentUserId, friendId }) => {
            const roomId = [currentUserId, friendId].sort().join("-");
            socket.join(roomId);
            console.log(`User ${currentUserId} joined chat room: ${roomId}`);
        });

        socket.on("chatMessage", async (msg) => {
            try {
                const { senderId, receiverId, text } = msg;
                const roomId = [senderId, receiverId].sort().join("-");


                const message = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    text,
                    time: new Date()
                });

                io.to(roomId).emit("chatMessage", {
                    text: message.text,
                    time: message.time,
                    senderId: message.sender.toString()
                });
            } catch (err) {
                console.error("Error saving message:", err);
            }
        });

        socket.on("disconnect", () => {
            console.log("user disconnected:", socket.id);
        });
    });

    return io;
}

module.exports = initSocket;
