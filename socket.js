const { Server } = require("socket.io");
const Message = require("./src/models/Message");
const Game = require("./src/models/Games");
const User = require("./src/models/User");
const { Chess } = require("chess.js");

function initSocket(server) {
    const io = new Server(server);

    io.on("connection", (socket) => {
        console.log("a user connected:", socket.id);

        socket.on("registerUser", (userId) => {
            console.log(`🟢 Registered user ${userId} with socket ${socket.id}`);
            socket.join(userId.toString());
        });

        socket.on("joinChat", ({ gameId }) => {
            const roomId = `chat-${gameId}`;
            socket.join(roomId);
            console.log(`User joined chat room: ${roomId}`);
        });

        socket.on("chatMessage", async (msg) => {
            try {
                const { senderId, receiverId, text, gameId } = msg;
                const roomId = `chat-${gameId}`;

                const message = await Message.create({
                    gameId,
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

        socket.on("joinGame", async ({ gameId, userId }) => {
            try {
                socket.join(gameId);
                console.log(`🎮 User ${userId} joined game room: ${gameId}`);

                const game = await Game.findById(gameId).populate("player1Deck player2Deck");
                if (!game) return;


                function expandRow(row) {
                    let out = "";
                    for (const ch of row) {
                        if (/\d/.test(ch)) out += "1".repeat(Number(ch)); else out += ch;
                    }
                    return out;
                }
                function compressRow(row) {
                    let out = ""; let run = 0;
                    for (const ch of row) {
                        if (ch === '1') run++; else { if (run) { out += String(run); run = 0; } out += ch; }
                    }
                    if (run) out += String(run);
                    return out;
                }
                function normalizeRankString(rank) {
                    if (!rank) return "8";
                    const firstField = String(rank).split(" ")[0];
                    const row = firstField.includes('/') ? firstField.split('/')[0] : firstField;
                    const expanded = expandRow(row);
                    return expanded.slice(0, 8).padEnd(8, '1');
                }
                function buildInitialFenFromDecks(whiteBackRank, blackBackRank) {
                    const w = normalizeRankString(whiteBackRank).toUpperCase();
                    const b = normalizeRankString(blackBackRank).toLowerCase();
                    const rows = [
                        compressRow(b),          
                        'p'.repeat(8),          
                        '8',                   
                        '8',                    
                        '8',                     
                        '8',                    
                        'P'.repeat(8),           
                        compressRow(w)          
                    ];
                    return rows.join('/') + ' w KQkq - 0 1';
                }


                if (!game.boardState && game.player1Deck && game.player2Deck) {
                    game.boardState = buildInitialFenFromDecks(game.player1Deck.fenRank, game.player2Deck.fenRank);
                    game.turn = "white";
                    game.state = "playing";
                    await game.save();
                }

                socket.emit("initBoard", { fen: game.boardState, turn: game.turn });

                try {
                    const msgs = await Message.find({ gameId }).sort({ time: 1 }).limit(50);
                    socket.emit("chatHistory", msgs.map(m => ({
                        text: m.text,
                        time: m.time,
                        senderId: m.sender.toString()
                    })));
                } catch (e) {
                    console.error("❌ Error sending chat history:", e);
                }
            } catch (err) {
                console.error("❌ Error joining game:", err);
            }
        });

        socket.on("playerMove", async ({ gameId, userId, from, to, fen }) => {
            try {
                const game = await Game.findById(gameId);
                if (!game) return;

                const chess = new Chess();
                if (game.boardState) chess.load(game.boardState);

                const isWhite = userId && game.player1 && String(game.player1) === String(userId);
                const expectedTurn = chess.turn() === 'w';
                if ((isWhite && !expectedTurn) || (!isWhite && expectedTurn)) {
                    socket.emit("invalidMove", { from, to, reason: "not_your_turn" });
                    return;
                }

                const move = chess.move({ from, to, promotion: "q" });
                if (!move) {
                    socket.emit("invalidMove", { from, to });
                    return;
                }

                game.boardState = chess.fen();
                game.turn = chess.turn() === "w" ? "white" : "black";
                game.moves.push({ from, to, piece: move.piece });
                await game.save();

                socket.to(gameId).emit("opponentMove", {
                    from,
                    to,
                    fen: chess.fen(),
                    turn: game.turn,
                    san: move.san
                });



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
                    game.state = "finished";
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


                    try { await Message.deleteMany({ gameId }); } catch (e) { console.error('❌ Error deleting chat for game', e); }
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
                game.state = "finished";
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
