// Lightweight UI board. API:
// const board = Chessboard('boardId', config);
// board.position(fen)  -> set board position (fen string)
// config: { draggable, position, orientation, onDragStart, onDrop, onSnapEnd, pieceTheme }

function Chessboard(containerId, config = {}) {
    const container = (typeof containerId === 'string') ? document.getElementById(containerId) : containerId;
    if (!container) throw new Error('Board container not found');

    const state = {
        orientation: config.orientation || 'white',
        selected: null,
        cfg: config,
        currentFen: null
    };

    // create board DOM
    container.innerHTML = '';
    container.classList.add('cc-board-container');
    const boardEl = document.createElement('div');
    boardEl.className = 'cc-board';
    boardEl.style.display = 'grid';
    boardEl.style.gridTemplateColumns = 'repeat(8, 1fr)';
    boardEl.style.width = '100%';
    boardEl.style.height = '100%';
    boardEl.style.boxSizing = 'border-box';
    container.appendChild(boardEl);

    // styles
    const style = document.createElement('style');
    style.innerHTML = `
      .cc-board {border-radius:8px; overflow:hidden; touch-action:none;}
      .cc-square {position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; user-select:none;}
      .cc-piece {width:80%; height:80%; touch-action:none; cursor:grab; pointer-events:auto;}
      .cc-square.light{background:rgba(255,255,255,0.02);}
      .cc-square.dark{background:rgba(0,0,0,0.12);}
      .cc-square.selected{outline:3px solid rgba(96,165,250,0.25); border-radius:6px;}
    `;
    document.head.appendChild(style);

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    function getSquares(orientation) {
        const ranks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
        const fs = orientation === 'white' ? files : files.slice().reverse();
        const sqs = [];
        for (const r of ranks) for (const f of fs) sqs.push(f + r);
        return sqs;
    }

    const squareEls = {};
    function renderEmptyBoard() {
        boardEl.innerHTML = '';
        const sqs = getSquares(state.orientation);
        for (let i = 0; i < sqs.length; i++) {
            const sq = sqs[i];
            const el = document.createElement('div');
            el.className = 'cc-square';
            const fileIndex = files.indexOf(sq[0]);
            const rankIndex = Number(sq[1]) - 1;
            const isLight = ((fileIndex + rankIndex) % 2 === 0);
            el.classList.add(isLight ? 'light' : 'dark');
            el.dataset.square = sq;
            el.style.aspectRatio = '1/1';
            el.addEventListener('click', onSquareClick);
            squareEls[sq] = el;
            boardEl.appendChild(el);
        }
    }
    renderEmptyBoard();

    function fenCharToPieceId(ch) {
        if (!ch) return null;
        const isWhite = (ch === ch.toUpperCase());
        const type = ch.toLowerCase();
        const mapping = { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: 'P' };
        const t = mapping[type] || type.toUpperCase();
        return (isWhite ? 'w' : 'b') + t;
    }

    function clearPieces() {
        Object.values(squareEls).forEach(el => el.innerHTML = '');
    }

    function position(fen) {
        state.currentFen = fen;
        const placement = fen.split(/\s+/)[0];
        const rows = placement.split('/');
        const rankOrder = state.orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
        clearPieces();
        for (let r = 0; r < 8; r++) {
            const rank = rankOrder[r];
            let fileIndex = 0;
            for (const ch of rows[r]) {
                if (/\d/.test(ch)) {
                    fileIndex += Number(ch);
                } else {
                    const f = (state.orientation === 'white') ? files[fileIndex] : files.slice().reverse()[fileIndex];
                    const sq = f + rank;
                    const pieceId = fenCharToPieceId(ch);
                    if (pieceId) {
                        const img = document.createElement('img');
                        img.draggable = false;
                        img.className = 'cc-piece';
                        const src = (typeof state.cfg.pieceTheme === 'function')
                            ? state.cfg.pieceTheme(pieceId)
                            : `https://cdnjs.cloudflare.com/ajax/libs/chessboardjs/1.0.0/img/chesspieces/wikipedia/${pieceId}.png`;
                        img.src = src;
                        img.dataset.piece = pieceId;
                        img.dataset.from = sq;
                        squareEls[sq].appendChild(img);
                    }
                    fileIndex++;
                }
            }
        }
    }

    function topPieceEl(square) {
        const el = squareEls[square];
        if (!el) return null;
        return el.querySelector('.cc-piece');
    }

    function onSquareClick(e) {
        const sq = e.currentTarget.dataset.square;
        const pieceEl = topPieceEl(sq);
        if (!state.selected) {
            if (!pieceEl) return;
            if (typeof state.cfg.onDragStart === 'function') {
                const cancelled = state.cfg.onDragStart(sq, pieceEl.dataset.piece);
                if (cancelled === false) return;
            }
            state.selected = sq;
            squareEls[sq].classList.add('selected');
        } else {
            const from = state.selected;
            const to = sq;
            squareEls[from].classList.remove('selected');
            const pieceElFrom = topPieceEl(from);
            let result;
            if (typeof state.cfg.onDrop === 'function') {
                result = state.cfg.onDrop(from, to, pieceElFrom ? pieceElFrom.dataset.piece : null);
            }
            if (result !== 'snapback' && result !== false && pieceElFrom) {
                const clone = pieceElFrom.cloneNode(true);
                pieceElFrom.remove();
                const tgt = topPieceEl(to);
                if (tgt) tgt.remove();
                squareEls[to].appendChild(clone);
                clone.dataset.from = to;
            }
            state.selected = null;
            if (typeof state.cfg.onSnapEnd === 'function') {
                state.cfg.onSnapEnd();
            }
        }
    }

    const api = {
        position,
        orientation: (o) => {
            state.orientation = o;
            renderEmptyBoard();
            if (state.currentFen) {
                position(state.currentFen);
            }
        },
        destroy: () => {
            container.innerHTML = '';
        }
    };

    if (config.position) {
        if (config.position === 'start') {
            position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
        } else {
            position(config.position);
        }
    }

    return api;
}
