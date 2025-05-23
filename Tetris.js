import { tetrominos } from "./Tetrominos.js";

const HORRIZONTALSIZE = 10;
const VERTICALLYSIZE = 20;

let tetrominoCoordinates = [];
let fixedBlocks = [];
let currentRotation = '';
let currentShape = '';
let currentCoordinates = [HORRIZONTALSIZE / 2, VERTICALLYSIZE - 19];
let newTetrominoCoordinates = [];
let speed = 800;

playGame();

function playGame() {
    currentCoordinates = [Math.floor(HORRIZONTALSIZE / 2), VERTICALLYSIZE - 19];
    drawGameBoard();
    const selectedTetromino = selectShape();
    coordinates(selectedTetromino);
    drop();
}

function drawGameBoard() {
    let gameBoard = "";

    for (let y = 0; y < VERTICALLYSIZE; y++) {
        for (let x = 0; x < HORRIZONTALSIZE; x++) {
            if (blockVariations(newTetrominoCoordinates, x, y)) {
                gameBoard += `<div class="futureCoords" data-id-X="${x}" data-id-Y="${y}"></div>`;
            } else if (blockVariations(tetrominoCoordinates, x, y) || blockVariations(fixedBlocks, x, y)) {
                gameBoard += `<div class="block" data-id-X="${x}" data-id-Y="${y}"></div>`;
            } else {
                gameBoard += `<div class="background" data-id-X="${x}" data-id-Y="${y}"></div>`;
            }
        }
    }

    document.body.innerHTML = gameBoard;
}

function blockVariations(array, x, y) {
    return array.some((element) => element[0] === x && element[1] === y);
}

function selectShape() {
    const tetrominoNumber = Math.round(Math.random() * 6);
    const shape = Object.keys(tetrominos)[tetrominoNumber];
    const shapeInfo = tetrominos[shape];
    const rotation = Math.round(Math.random() * (shapeInfo.length - 1));
    const pickRotation = shapeInfo[rotation];

    currentRotation = pickRotation;
    currentShape = shape;
    return pickRotation;
}

function rotate() {
    let originalIndex = tetrominos[currentShape].indexOf(currentRotation);
    let currentIndex = originalIndex + 1;
    let nextIndex = currentIndex % 4;

    currentRotation = tetrominos[currentShape][nextIndex];

    if (currentRotation) {
        coordinates(currentRotation);
        if (tetrominoCoordinates.some(([x, y]) => collision(x, y))) {
            let steps = Math.ceil(currentRotation.length / 3);

            if (canMove(0, 1)) {
                pushBlock(0, 1);
            } else if (canMove(-steps)) {
                pushBlock(-steps);
            } else if (canMove(steps)) {
                pushBlock(steps);
            } else {
                currentRotation = tetrominos[currentShape][originalIndex];
                coordinates(currentRotation);
            }
        }
        dropToBottom();
        drawGameBoard();
    }
}

function canMove(x = 0, y = 0) {
    return tetrominoCoordinates.every(([tx, ty]) => !collision(tx + x, ty + y));
}

function pushBlock(x = 0, y = 0) {
    for (let i = 0; i < tetrominoCoordinates.length; i++) {
        tetrominoCoordinates[i][1] -= y;
        tetrominoCoordinates[i][0] += x;
    }
    currentCoordinates[0] += x;
    dropToBottom();
}

function nextRound() {
    return tetrominoCoordinates.some(
        (element) => element[1] === VERTICALLYSIZE - 1 || collision(element[0], element[1] + 1)
    );
}

function solidState() {
    fixedBlocks.push(...tetrominoCoordinates);
    tetrominoCoordinates = [];
}

function dropToBottom() {
    newTetrominoCoordinates = tetrominoCoordinates.map(coords => coords.slice());
    while (newTetrominoCoordinates.every(([x, y]) => !collision(x, y + 1))) {
        newTetrominoCoordinates.forEach(coord => coord[1]++);
    }
    drawGameBoard();
}

async function drop() {
    if (!nextRound()) {
        tetrominoCoordinates.forEach((element) => element[1] += 1);
        currentCoordinates[1] += 1;
        dropToBottom();
        setTimeout(drop, speed);
        drawGameBoard();
    } else if (gameOver()) {
        fixedBlocks = [];
        tetrominoCoordinates = [];
        newTetrominoCoordinates = [];
    } else {
        solidState();
        completeLine();
        playGame();
    }
}

function gameOver() {
    return tetrominoCoordinates.some(element => element[1] > 10);
}

function collision(x, y) {
    if (x >= HORRIZONTALSIZE || x < 0 || y >= VERTICALLYSIZE) {
        return true;
    }
    return fixedBlocks.some(([fx, fy]) => fx === x && fy === y);
}

async function completeLine() {
    let rowCount = {};
    let blocksToBeCleared = [];

    fixedBlocks.forEach(block => {
        const row = block[1];
        rowCount[row] = (rowCount[row] || 0) + 1;
    });

    for (let row in rowCount) {
        if (rowCount[row] === HORRIZONTALSIZE) {
            speed *= 0.95;
            const targetRow = parseInt(row);

            blocksToBeCleared = fixedBlocks.filter(block => block[1] === targetRow);
            fixedBlocks = fixedBlocks.filter(block => block[1] !== targetRow);

            fixedBlocks.forEach(block => {
                if (block[1] < targetRow) {
                    block[1]++;
                }
            });
        }
    }
}

function coordinates(selectedTetromino) {
    tetrominoCoordinates = [];
    for (let y = 0; y < selectedTetromino.length; y++) {
        for (let x = 0; x < selectedTetromino[y].length; x++) {
            if (selectedTetromino[y][x] === 1) {
                tetrominoCoordinates.push([
                    x + currentCoordinates[0],
                    y + currentCoordinates[1]
                ]);
            }
        }
    }
    drawGameBoard();
}

function moveToBottom() {
    tetrominoCoordinates = newTetrominoCoordinates;
    drawGameBoard();
}

function move(direction = 0) {
    if (canMove(direction)) {
        pushBlock(direction);
    }
    dropToBottom();
    drawGameBoard();
}

document.onkeydown = function (e) {
    switch (e.keyCode) {
        case 37: move(-1); break;
        case 38: rotate(); break;
        case 39: move(1); break;
        case 32: moveToBottom(); break;
    }
};
