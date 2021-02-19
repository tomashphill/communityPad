const grid = document.getElementById('grid');
console.log(io)
var socket;

(() => {
    grid.style.height = window.innerHeight + 'px';
    grid.style.width = window.innerWidth + 'px';
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
    c.setAttribute('maxlength', '1');
};

// spillOver :: HTMLElement -> ()
const addSpillOver = (el) => {
    el.onkeyup = function(e) {
        socket.emit('edit_cell', {
            X: e.target.viewX,
            Y: e.target.viewY,
            value: e.target.value
        });
        const maxLength = 1;
        let myLength = e.target.value.length;
        if (myLength >= maxLength) {
            let next = e.target;
            while (next = next.nextElementSibling) {
                if (next == null) 
                    break;
                next.focus();
                break;
            }
        }
    }
}

window.onload = () => {
    // window width/height in pixels
    const wPix = window.innerWidth;
    const hPix = window.innerHeight;
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
            addSpillOver(cell);

            grid.appendChild(cell);
            return cell;
        });
    });

    socket = io();

    socket.on('connect', () => {
        socket.emit('initialize', 'Connected!');
    });
};