const grid = document.getElementById('grid');
var cells;
var socket;

(() => {
    grid.style.height = window.innerHeight - 60 + 'px';
    grid.style.width = window.innerWidth - 40 + 'px';
})();

// range :: int -> [int]
const range = (n) => [...Array(n).keys()];

// styleCell :: HTMLElement -> ()
const styleCell = (c, left, width, top, height) => {
    c.style.position = 'absolute';
    c.style.left = left + '%';
    c.style.width = width + '%';
    c.style.top = top + '%';
    c.style.height = height + '%';
    c.setAttribute('type', 'text');
    // c.setAttribute('maxlength', '1');
};

// spillOver :: HTMLElement -> ()
const spillOver = function(e) {
    let c = e.data;

    if (!e.data) {
        c = ' '
        let prev = e.target.previousElementSibling;
        if (prev != null) {
            prev.focus();
        }
    } else {
        let next = e.target.nextElementSibling;
        if (next != null) {
            next.focus();
        }
    }

    e.target.value = c;
    socket.emit('edit_cell', {
        X: e.target.viewX,
        Y: e.target.viewY,
        value: c
    });
}

// onload :: window ~> ()
window.onload = () => {
    // window width/height in pixels
    const wPix = grid.clientWidth;
    const hPix = grid.clientHeight;
    // cell width and height in pixels
    const cellLPix = 25;
    // cell width/height in percent
    const cellWPrc = (cellLPix / wPix) * 100;
    const cellHPrc = (cellLPix / hPix) * 100;
    // number of cells wide/hight
    const nCellsW = Math.round(wPix / cellLPix);
    const nCellsH = Math.round(hPix / cellLPix);

    // create cell, style, and append to grid
    cells = range(nCellsH).map((nH) => {
        return range(nCellsW).map((nW) => {
            let left = nW * cellWPrc;
            let top = nH * cellHPrc;
            let cell = document.createElement('input');
            styleCell(cell, left, cellWPrc, top, cellHPrc);
            cell.viewX = nW;
            cell.viewY = nH;
            cell.addEventListener('input', spillOver);

            grid.appendChild(cell);
            return cell;
        });
    });

    socket = io();

    socket.on('connect', () => {
        socket.emit('initialize', {
            n_cells_w: nCellsW,
            n_cells_h: nCellsH
        });
    });

    socket.on('update_grid', (data) => {
        Object.keys(data).forEach((x, i) => {
            Object.keys(data[x]).forEach((y, j) => {
                cells[j][i].value = data[x][y]
            });
        });
    });
    socket.on('update_cell', (data) => {
        cells[data['Y']][data['X']].value = data['value']
    });
};