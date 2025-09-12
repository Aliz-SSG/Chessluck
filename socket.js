const { Server } = require("socket.io");
const Message = require("./src/models/Message");
const Game = require("./src/models/Games");
const User = require("./src/models/User");
const { Chess } = require("chess.js");

function initSocket(server) {
    const io = new Server(server);

    io.on("connection", (socket) => {
        console.log("a user connected:", socket.id);

        /* ===== MATCHMAKING / WAITING ROOM ===== */
        socket.on("registerUser", (userId) => {
            console.log(`🟢 Registered user ${userId} with socket ${socket.id}`);
            socket.join(userId.toString()); // now io.to(userId) works
        });

        /* ===== CHAT LOGIC ===== */
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

        /* ===== GAME ROOM LOGIC ===== */
        socket.on("joinGame", async ({ gameId, userId }) => {
            try {
                socket.join(gameId);
                console.log(`🎮 User ${userId} joined game room: ${gameId}`);

                const game = await Game.findById(gameId).populate("player1Deck player2Deck");
                if (!game) return;

                // Merge deck FENs
                function mergeDeckFEN(whiteFEN, blackFEN) {
                    const whiteRows = whiteFEN.split(" ")[0].split("/");
                    const blackRows = blackFEN.split(" ")[0].split("/");
                    const mergedRows = whiteRows.map((row, i) => {
                        if (blackRows[i]) return row.replace(/8/, blackRows[i]);
                        return row;
                    });
                    return mergedRows.join("/") + " w KQkq - 0 1";
                }

                if (!game.boardState && game.player1Deck && game.player2Deck) {
                    game.boardState = mergeDeckFEN(game.player1Deck.fenRank, game.player2Deck.fenRank);
                    game.turn = "white";
                    game.state = "playing";
                    await game.save();
                }

                socket.emit("initBoard", { fen: game.boardState, turn: game.turn });
            } catch (err) {
                console.error("❌ Error joining game:", err);
            }
        });

        /* ===== GAMEPLAY ===== */
        socket.on("playerMove", async ({ gameId, from, to }) => {
            try {
                const game = await Game.findById(gameId);
                if (!game) return;

                const chess = new Chess();
                if (game.boardState) chess.load(game.boardState);

                const move = chess.move({ from, to, promotion: "q" });
                if (!move) {
                    socket.emit("invalidMove", { from, to });
                    return;
                }

                game.boardState = chess.fen();
                game.turn = chess.turn() === "w" ? "white" : "black";
                game.moves.push({ from, to, piece: move.piece });
                await game.save();

                io.to(gameId).emit("moveMade", {
                    from,
                    to,
                    move,
                    fen: chess.fen(),
                    turn: game.turn
                });

                // End game check
                if (chess.isGameOver()) {
                    let winner = null, loser = null, reason = "draw";

                    if (chess.isCheckmate()) {
                        const whitePlayerId = game.player1.toString();
                        const blackPlayerId = game.player2.toString();
                        winner = move.color === "w" ? whitePlayerId : blackPlayerId;
                        loser = move.color === "w" ? blackPlayerId : whitePlayerId;
                        reason = "checkmate";
                    }

                    game.winner = winner;
                    game.loser = loser;
                    game.state = "ended";
                    game.endedAt = new Date();
                    game.isDraw = !winner;
                    await game.save();

                    if (winner) {
                        const winnerUser = await User.findById(winner);
                        const loserUser = await User.findById(loser);
                        winnerUser.wins += 1;
                        loserUser.losses += 1;
                        await winnerUser.save();
                        await loserUser.save();
                    } else {
                        const player1User = await User.findById(game.player1);
                        const player2User = await User.findById(game.player2);
                        player1User.draws += 1;
                        player2User.draws += 1;
                        await player1User.save();
                        await player2User.save();
                    }

                    io.to(gameId).emit("gameEnded", { reason, winner: winner ? winner.toString() : null });
                }
            } catch (err) {
                console.error("❌ Error processing move:", err);
            }
        });

        socket.on("resign", async ({ gameId, playerId }) => {
            try {
                const game = await Game.findById(gameId);
                if (!game) return;

                const winner = game.player1.equals(playerId) ? game.player2 : game.player1;
                const loser = playerId;

                game.winner = winner;
                game.loser = loser;
                game.state = "ended";
                game.endedAt = new Date();
                await game.save();

                const winnerUser = await User.findById(winner);
                const loserUser = await User.findById(loser);
                winnerUser.wins += 1;
                loserUser.losses += 1;
                await winnerUser.save();
                await loserUser.save();

                io.to(gameId).emit("gameEnded", {
                    reason: "resignation",
                    winner: winner.toString()
                });
            } catch (err) {
                console.error("❌ Error handling resignation:", err);
            }
        });

        socket.on("disconnect", () => {
            console.log("user disconnected:", socket.id);
        });
    });

    return io;
}

module.exports = initSocket;
