// Lightweight Chess logic (compatible-ish with chess.js API used in play.ejs)
// Supports: reset(), load(fen), fen(), turn(), move({from,to,promotion})
class Chess {
    constructor() {
        this.reset();
    }

    reset() {
        // standard starting FEN
        this._fen = "rn1qkbnr/pppppppp/8/8/8/8/PPPPPPPP/RN1QKBNR w KQkq - 0 1";
        // using classic starting pieces (but you can override by load)
        // We'll use a simple board map and side to move
        this._board = {};
        this._side = 'w';
        this._history = [];
        this._parseFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    }

    // parse only what's necessary from FEN: placement and side-to-move
    _parseFEN(fen) {
        const parts = fen.trim().split(/\s+/);
        if (!parts.length) return;
        const placement = parts[0];
        const side = parts[1] || 'w';

        const rows = placement.split('/');
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        this._board = {};
        for (let r = 0; r < 8; r++) {
            const rank = 8 - r;
            let fileIndex = 0;
            for (const ch of rows[r]) {
                if (/\d/.test(ch)) {
                    fileIndex += Number(ch);
                } else {
                    const square = files[fileIndex] + rank;
                    this._board[square] = ch; // keep case: uppercase white, lowercase black
                    fileIndex++;
                }
            }
        }
        this._side = side;
        this._updateFenFromBoard();
    }

    // simple fen generator (placement + side)
    _updateFenFromBoard() {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const rows = [];
        for (let rank = 8; rank >= 1; rank--) {
            let row = '';
            let empty = 0;
            for (const f of files) {
                const sq = f + rank;
                const p = this._board[sq];
                if (!p) { empty++; }
                else {
                    if (empty) { row += empty; empty = 0; }
                    row += p;
                }
            }
            if (empty) row += empty;
            rows.push(row);
        }
        // minimal other fields
        this._fen = `${rows.join('/')} ${this._side} - 0 1`;
    }

    load(fen) {
        try {
            this._parseFEN(fen);
            return true;
        } catch (e) {
            return false;
        }
    }

    fen() {
        return this._fen;
    }

    turn() {
        return this._side;
    }

    // helper: get piece color from piece char
    _pieceColor(ch) {
        if (!ch) return null;
        return (ch === ch.toUpperCase()) ? 'w' : 'b';
    }

    // move: very lightweight. No castling/en-passant/promotion rules besides forced promotion to 'q' char mapping.
    move({ from, to, promotion = 'q' }) {
        const piece = this._board[from];
        if (!piece) return null;

        const color = this._pieceColor(piece);
        if (color !== this._side) return null; // not your turn

        const target = this._board[to];
        const captured = target || null;

        // very permissive move legality: allow any destination that's empty or opponent
        if (target && this._pieceColor(target) === color) return null; // can't capture own

        // do the move
        this._board[to] = piece;
        delete this._board[from];

        // handle promotion: if piece is pawn and reaches rank 8 or 1, promote
        const pieceType = piece.toLowerCase();
        if (pieceType === 'p') {
            const rank = Number(to[1]);
            if ((color === 'w' && rank === 8) || (color === 'b' && rank === 1)) {
                const promoted = (promotion || 'q').toLowerCase();
                // uppercase for white, lowercase for black
                this._board[to] = color === 'w' ? promoted.toUpperCase() : promoted;
            }
        }

        // flip side
        this._side = (this._side === 'w') ? 'b' : 'w';
        // update fen and history
        this._updateFenFromBoard();
        const moveObj = {
            from, to, piece, captured, san: from + to, color
        };
        this._history.push(moveObj);
        return moveObj;
    }

    // convenience: get piece at square
    get(square) {
        return this._board[square] || null;
    }
}
