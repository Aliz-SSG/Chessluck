// Lightweight Chess logic (extended)
// Supports: reset(), load(fen), fen(), turn(), move({from,to,promotion})
// Plus: moves(), in_check(), in_checkmate(), in_stalemate(), game_over()

class Chess {
    constructor() {
        this.reset();
    }

    reset() {
        this._board = {};
        this._side = 'w';
        this._history = [];
        this._parseFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    }

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
                    this._board[square] = ch;
                    fileIndex++;
                }
            }
        }
        this._side = side;
        this._updateFenFromBoard();
    }

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

    fen() { return this._fen; }
    turn() { return this._side; }
    get(square) { return this._board[square] || null; }

    _pieceColor(ch) {
        if (!ch) return null;
        return (ch === ch.toUpperCase()) ? 'w' : 'b';
    }

    _kingSquare(color) {
        for (const sq in this._board) {
            const p = this._board[sq];
            if (p && p.toLowerCase() === 'k' && this._pieceColor(p) === color) {
                return sq;
            }
        }
        return null;
    }

    // ============= Move Generation =============
    moves({ square } = {}) {
        const moves = [];
        for (const from in this._board) {
            const piece = this._board[from];
            if (!piece) continue;
            if (this._pieceColor(piece) !== this._side) continue;
            if (square && square !== from) continue;

            const legalDests = this._pseudoMoves(from, piece);
            for (const to of legalDests) {
                const moveObj = { from, to, piece };
                if (this._isLegal(moveObj)) {
                    moves.push(moveObj);
                }
            }
        }
        return moves;
    }

    _pseudoMoves(from, piece) {
        const dirs = {
            n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0],
            ne: [1, 1], nw: [-1, 1], se: [1, -1], sw: [-1, -1]
        };
        const file = from.charCodeAt(0) - 97;
        const rank = parseInt(from[1]) - 1;
        const addFrom = (baseFile, baseRank, df, dr) => {
            const f = baseFile + df, r = baseRank + dr;
            if (f < 0 || f > 7 || r < 0 || r > 7) return null;
            return String.fromCharCode(97 + f) + (r + 1);
        };

        const color = this._pieceColor(piece);
        const type = piece.toLowerCase();
        let moves = [];

        if (type === 'p') {
            const dir = color === 'w' ? 1 : -1;
            const fwd = addFrom(file, rank, 0, dir);
            if (fwd && !this._board[fwd]) moves.push(fwd);
            // double move from start
            const startRank = (color === 'w') ? 1 : 6;
            if (rank === startRank) {
                const mid = addFrom(file, rank, 0, dir);
                const dbl = addFrom(file, rank, 0, 2 * dir);
                if (mid && dbl && !this._board[mid] && !this._board[dbl]) moves.push(dbl);
            }
            for (let df of [-1, 1]) {
                const cap = addFrom(file, rank, df, dir);
                if (cap && this._board[cap] && this._pieceColor(this._board[cap]) !== color) {
                    moves.push(cap);
                }
            }
        }
        else if (type === 'n') {
            const deltas = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
            for (const [df, dr] of deltas) {
                const sq = addFrom(file, rank, df, dr);
                if (!sq) continue;
                if (!this._board[sq] || this._pieceColor(this._board[sq]) !== color) {
                    moves.push(sq);
                }
            }
        }
        else if (type === 'b' || type === 'r' || type === 'q') {
            const vecs = [];
            if (type === 'b' || type === 'q') vecs.push(dirs.ne, dirs.nw, dirs.se, dirs.sw);
            if (type === 'r' || type === 'q') vecs.push(dirs.n, dirs.s, dirs.e, dirs.w);
            for (const [df, dr] of vecs) {
                let cf = file;
                let cr = rank;
                while (true) {
                    const next = addFrom(cf, cr, df, dr);
                    if (!next) break;
                    const nf = next.charCodeAt(0) - 97;
                    const nr = parseInt(next[1]) - 1;
                    if (!this._board[next]) {
                        moves.push(next);
                        cf = nf; cr = nr;
                        continue;
                    } else {
                        if (this._pieceColor(this._board[next]) !== color) moves.push(next);
                        break;
                    }
                }
            }
        }
        else if (type === 'k') {
            for (const [df, dr] of Object.values(dirs)) {
                const sq = addFrom(file, rank, df, dr);
                if (!sq) continue;
                if (!this._board[sq] || this._pieceColor(this._board[sq]) !== color) {
                    moves.push(sq);
                }
            }
        }
        return moves;
    }

    _isLegal(move) {
        const { from, to, piece } = move;
        const backup = this._board[to];
        this._board[to] = piece;
        delete this._board[from];
        const kingSq = this._kingSquare(this._pieceColor(piece));
        const inCheck = this._squareAttacked(kingSq, this._pieceColor(piece));
        this._board[from] = piece;
        if (backup) this._board[to] = backup; else delete this._board[to];
        return !inCheck;
    }

    _squareAttacked(square, color) {
        for (const from in this._board) {
            const piece = this._board[from];
            if (this._pieceColor(piece) === color) continue;
            const pseudo = this._pseudoMoves(from, piece);
            if (pseudo.includes(square)) return true;
        }
        return false;
    }

    // ============= Checks & Endings =============
    in_check() {
        const kingSq = this._kingSquare(this._side);
        return this._squareAttacked(kingSq, this._side);
    }

    in_checkmate() {
        return this.in_check() && this.moves().length === 0;
    }

    in_stalemate() {
        return !this.in_check() && this.moves().length === 0;
    }

    game_over() {
        return this.in_checkmate() || this.in_stalemate();
    }

    // ============= Move =============
    move({ from, to, promotion = 'q' }) {
        const piece = this._board[from];
        if (!piece) return null;
        if (this._pieceColor(piece) !== this._side) return null;

        const legalMoves = this.moves({ square: from }).map(m => m.to);
        if (!legalMoves.includes(to)) return null;

        const captured = this._board[to] || null;
        this._board[to] = piece; delete this._board[from];

        // promotion
        if (piece.toLowerCase() === 'p') {
            const rank = Number(to[1]);
            if ((this._pieceColor(piece) === 'w' && rank === 8) || (this._pieceColor(piece) === 'b' && rank === 1)) {
                this._board[to] = this._side === 'w' ? promotion.toUpperCase() : promotion.toLowerCase();
            }
        }

        this._side = (this._side === 'w') ? 'b' : 'w';
        this._updateFenFromBoard();

        const moveObj = { from, to, piece, captured, color: this._pieceColor(piece), san: to };
        this._history.push(moveObj);
        return moveObj;
    }
}
