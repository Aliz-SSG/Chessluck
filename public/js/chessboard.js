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
        currentFen: null,
        dragging: null
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
      .cc-board {border-radius:8px; overflow:hidden; touch-action:none; position:relative;}
      .cc-square {position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; user-select:none;}
      .cc-piece {width:80%; height:80%; touch-action:none; cursor:grab; pointer-events:auto; position:relative; z-index:2;}
      .cc-piece.dragging {cursor:grabbing; opacity:0.7; position:absolute; z-index:5; pointer-events:none;}
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
        // reset mapping
        Object.keys(squareEls).forEach(k => { delete squareEls[k]; });
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
        clearPieces();
        for (let r = 0; r < 8; r++) {
            const rank = 8 - r;
            let fileIndex = 0;
            for (const ch of rows[r]) {
                if (/\d/.test(ch)) {
                    fileIndex += Number(ch);
                } else {
                    const fileLetter = files[fileIndex];
                    const sq = fileLetter + rank;
                    const pieceId = fenCharToPieceId(ch);
                    if (pieceId) {
                        const img = document.createElement('img');
                        img.draggable = false;
                        img.className = 'cc-piece';
                        const primarySrc = (typeof state.cfg.pieceTheme === 'function')
                            ? state.cfg.pieceTheme(pieceId)
                            : `https://cdnjs.cloudflare.com/ajax/libs/chessboardjs/1.0.0/img/chesspieces/wikipedia/${pieceId}.png`;
                        let triedFallback = false;
                        img.onerror = () => {
                            if (triedFallback) return;
                            triedFallback = true;
                            img.src = `https://chessboardjs.com/img/chesspieces/wikipedia/${pieceId}.png`;
                        };
                        img.src = primarySrc;
                        img.dataset.piece = pieceId;
                        img.dataset.from = sq;

                        // drag listeners
                        if (state.cfg.draggable) {
                            img.addEventListener('mousedown', onDragStartMouse);
                        }

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

    // --- Dragging handlers ---
    function onDragStartMouse(e) {
        const pieceEl = e.target;
        const from = pieceEl.dataset.from;
        if (typeof state.cfg.onDragStart === 'function') {
            const cancelled = state.cfg.onDragStart(from, pieceEl.dataset.piece);
            if (cancelled === false) return;
        }
        // Fix the visual size by freezing current pixel size before moving out of square
        const preRect = pieceEl.getBoundingClientRect();
        pieceEl.style.width = preRect.width + 'px';
        pieceEl.style.height = preRect.height + 'px';
        state.dragging = { pieceEl, from, originalParent: pieceEl.parentElement };
        pieceEl.classList.add('dragging');
        // Move piece into board layer so absolute coords are relative to board
        boardEl.appendChild(pieceEl);
        movePieceWithMouse(e);
        document.addEventListener('mousemove', onDraggingMouse);
        document.addEventListener('mouseup', onDragEndMouse);
    }

    function onDraggingMouse(e) {
        if (!state.dragging) return;
        movePieceWithMouse(e);
    }

    function movePieceWithMouse(e) {
        const { pieceEl } = state.dragging;
        const rect = boardEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        pieceEl.style.left = `${x - pieceEl.offsetWidth / 2}px`;
        pieceEl.style.top = `${y - pieceEl.offsetHeight / 2}px`;
    }

    function onDragEndMouse(e) {
        if (!state.dragging) return;
        const { pieceEl, from } = state.dragging;
        pieceEl.classList.remove('dragging');
        pieceEl.style.left = '';
        pieceEl.style.top = '';
        document.removeEventListener('mousemove', onDraggingMouse);
        document.removeEventListener('mouseup', onDragEndMouse);

        // find drop square
        const rect = boardEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor((x / rect.width) * 8);
        const row = Math.floor((y / rect.height) * 8);
        const rankOrder = state.orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
        const fileOrder = state.orientation === 'white' ? files : files.slice().reverse();
        const to = fileOrder[col] + rankOrder[row];

        let result;
        if (typeof state.cfg.onDrop === 'function') {
            result = state.cfg.onDrop(from, to, pieceEl.dataset.piece);
        }

        if (result !== 'snapback' && result !== false) {
            // valid drop
            const tgt = topPieceEl(to);
            if (tgt) tgt.remove();
            squareEls[to].appendChild(pieceEl);
            pieceEl.dataset.from = to;
        } else {
            // snap back
            squareEls[from].appendChild(pieceEl);
            pieceEl.dataset.from = from;
        }

        // Restore responsive sizing managed by CSS inside squares
        pieceEl.style.width = '';
        pieceEl.style.height = '';

        if (typeof state.cfg.onSnapEnd === 'function') {
            state.cfg.onSnapEnd();
        }

        state.dragging = null;
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
