const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const playerScoreElement = document.getElementById('player-score');
const enemyScoreElement = document.getElementById('enemy-score');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
    {x: 2, y: 2},
    {x: 1, y: 2},
    {x: 0, y: 2},
];
let enemySnake = [
    {x: tileCount - 3, y: tileCount - 3},
    {x: tileCount - 2, y: tileCount - 3},
    {x: tileCount - 1, y: tileCount - 3},
];
let food = {x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2)};
let dx = 1;
let dy = 0;
let enemyDx = -1;
let enemyDy = 0;
let score = 3;
let enemyScore = 3;
let isInvincible = true;
let invincibilityTime = 10000; // 10 seconds
let gameStartTime;

let bombCooldown = 0;
let enemyFrozenTime = 0;
const BOMB_COOLDOWN = 5000; // 5 saniye
const ENEMY_FREEZE_TIME = 2000; // 2 saniye
let bomb = null;
let bombDx = 0;
let bombDy = 0;

let isMultiplayer = false;
let enemyBombCooldown = 0;
let enemyBomb = null;
let enemyBombDx = 0;
let enemyBombDy = 0;
let playerFrozenTime = 0;

function startGame() {
    isMultiplayer = confirm("Multiplayer modunda oynamak ister misiniz?");
    if (isMultiplayer) {
        document.addEventListener('keydown', handleMultiplayerKeyPress);
    } else {
        document.addEventListener('keydown', handleSinglePlayerKeyPress);
    }
    gameStartTime = Date.now();
    setInterval(drawGame, 100);
}

function handleSinglePlayerKeyPress(event) {
    if (event.code === 'Space') {
        throwBomb(snake, dx, dy, 'player');
    } else {
        changeDirection(event, true);
    }
}

function handleMultiplayerKeyPress(event) {
    if (event.code === 'Space') {
        throwBomb(snake, dx, dy, 'player');
    } else if (event.code === 'KeyE') {
        throwBomb(enemySnake, enemyDx, enemyDy, 'enemy');
    } else {
        changeDirection(event, true);
        changeDirection(event, false);
    }
}

function changeDirection(event, isPlayer1) {
    const LEFT_KEY = isPlayer1 ? 37 : 65;  // Left Arrow : A
    const RIGHT_KEY = isPlayer1 ? 39 : 68; // Right Arrow : D
    const UP_KEY = isPlayer1 ? 38 : 87;    // Up Arrow : W
    const DOWN_KEY = isPlayer1 ? 40 : 83;  // Down Arrow : S

    const keyPressed = event.keyCode;
    const goingUp = isPlayer1 ? dy === -1 : enemyDy === -1;
    const goingDown = isPlayer1 ? dy === 1 : enemyDy === 1;
    const goingRight = isPlayer1 ? dx === 1 : enemyDx === 1;
    const goingLeft = isPlayer1 ? dx === -1 : enemyDx === -1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        if (isPlayer1) { dx = -1; dy = 0; } else { enemyDx = -1; enemyDy = 0; }
    }
    if (keyPressed === UP_KEY && !goingDown) {
        if (isPlayer1) { dx = 0; dy = -1; } else { enemyDx = 0; enemyDy = -1; }
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        if (isPlayer1) { dx = 1; dy = 0; } else { enemyDx = 1; enemyDy = 0; }
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        if (isPlayer1) { dx = 0; dy = 1; } else { enemyDx = 0; enemyDy = 1; }
    }
}

function throwBomb(snakeBody, dirX, dirY, player) {
    if (player === 'player' && bombCooldown <= 0 && !bomb) {
        const head = snakeBody[0];
        bomb = { x: head.x, y: head.y };
        bombDx = dirX;
        bombDy = dirY;
        bombCooldown = BOMB_COOLDOWN;
    } else if (player === 'enemy' && enemyBombCooldown <= 0 && !enemyBomb) {
        const head = snakeBody[0];
        enemyBomb = { x: head.x, y: head.y };
        enemyBombDx = dirX;
        enemyBombDy = dirY;
        enemyBombCooldown = BOMB_COOLDOWN;
    }
}

function drawGame() {
    clearCanvas();
    if (playerFrozenTime <= 0) {
        moveSnake(snake, dx, dy);
    } else {
        playerFrozenTime -= 100;
    }
    if (enemyFrozenTime <= 0) {
        if (isMultiplayer) {
            moveSnake(enemySnake, enemyDx, enemyDy);
        } else {
            moveEnemySnakeAI();
        }
    } else {
        enemyFrozenTime -= 100;
    }
    moveBombs();
    drawSnake(snake, 'green');
    drawSnake(enemySnake, 'blue');
    drawFood();
    if (bomb) drawBomb(bomb, 'black');
    if (enemyBomb) drawBomb(enemyBomb, 'purple');
    checkCollision();
    updateScore();
    checkInvincibility();
    updateBombCooldown();
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function moveSnake(snakeBody, dirX, dirY) {
    const head = {x: snakeBody[0].x + dirX, y: snakeBody[0].y + dirY};
    snakeBody.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        if (snakeBody === snake) {
            score++;
        } else {
            enemyScore++;
        }
        generateFood();
    } else {
        snakeBody.pop();
    }
}

function moveEnemySnakeAI() {
    // Simple AI: move towards food
    const head = enemySnake[0];
    if (food.x < head.x) enemyDx = -1, enemyDy = 0;
    else if (food.x > head.x) enemyDx = 1, enemyDy = 0;
    else if (food.y < head.y) enemyDx = 0, enemyDy = -1;
    else if (food.y > head.y) enemyDx = 0, enemyDy = 1;

    const newHead = {x: head.x + enemyDx, y: head.y + enemyDy};
    enemySnake.unshift(newHead);
    if (newHead.x === food.x && newHead.y === food.y) {
        enemyScore++;
        score = Math.max(1, score - 1);
        generateFood();
    } else {
        enemySnake.pop();
    }
}

function moveBombs() {
    if (bomb) {
        bomb.x += bombDx;
        bomb.y += bombDy;
        if (bomb.x < 0 || bomb.x >= tileCount || bomb.y < 0 || bomb.y >= tileCount) {
            bomb = null;
        }
    }
    if (enemyBomb) {
        enemyBomb.x += enemyBombDx;
        enemyBomb.y += enemyBombDy;
        if (enemyBomb.x < 0 || enemyBomb.x >= tileCount || enemyBomb.y < 0 || enemyBomb.y >= tileCount) {
            enemyBomb = null;
        }
    }
}

function drawSnake(snakeBody, color) {
    ctx.fillStyle = color;
    if (isInvincible && Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.fillStyle = 'light' + color;
    }
    snakeBody.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function drawFood() {
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
}

function checkCollision() {
    const head = snake[0];
    const enemyHead = enemySnake[0];
    
    // Teleport to opposite side if hitting a wall
    head.x = (head.x + tileCount) % tileCount;
    head.y = (head.y + tileCount) % tileCount;
    enemyHead.x = (enemyHead.x + tileCount) % tileCount;
    enemyHead.y = (enemyHead.y + tileCount) % tileCount;

    if (!isInvincible) {
        // Check for collision with self or enemy
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                resetGame();
            }
        }
        for (let i = 0; i < enemySnake.length; i++) {
            if (head.x === enemySnake[i].x && head.y === enemySnake[i].y) {
                resetGame();
            }
        }
    }

    // Check if player snake eats food
    if (head.x === food.x && head.y === food.y) {
        score++;
        enemyScore = Math.max(1, enemyScore - 1);
        generateFood();
    }

    if (bomb) {
        const hitEnemy = enemySnake.some(segment => segment.x === Math.floor(bomb.x) && segment.y === Math.floor(bomb.y));
        if (hitEnemy) {
            enemyFrozenTime = ENEMY_FREEZE_TIME;
            bomb = null;
        }
    }
    if (enemyBomb) {
        const hitPlayer = snake.some(segment => segment.x === Math.floor(enemyBomb.x) && segment.y === Math.floor(enemyBomb.y));
        if (hitPlayer) {
            playerFrozenTime = ENEMY_FREEZE_TIME;
            enemyBomb = null;
        }
    }
}

function drawBomb(bombObj, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc((bombObj.x + 0.5) * gridSize, (bombObj.y + 0.5) * gridSize, gridSize / 3, 0, 2 * Math.PI);
    ctx.fill();
}

function updateBombCooldown() {
    if (bombCooldown > 0) {
        bombCooldown -= 100;
    }
    if (enemyBombCooldown > 0) {
        enemyBombCooldown -= 100;
    }
    
    const bombStatus = document.getElementById('bomb-status');
    bombStatus.textContent = `P1 Bomb: ${bombCooldown <= 0 ? 'Ready' : Math.ceil(bombCooldown / 1000) + 's'} | P2 Bomb: ${enemyBombCooldown <= 0 ? 'Ready' : Math.ceil(enemyBombCooldown / 1000) + 's'}`;
    bombStatus.style.color = bombCooldown <= 0 && enemyBombCooldown <= 0 ? 'green' : 'red';
}

function resetGame() {
    alert(`Game Over! Your score was ${score}, Enemy score was ${enemyScore}`);
    snake = [{x: 2, y: 2}, {x: 1, y: 2}, {x: 0, y: 2}];
    enemySnake = [{x: tileCount - 3, y: tileCount - 3}, {x: tileCount - 2, y: tileCount - 3}, {x: tileCount - 1, y: tileCount - 3}];
    food = {x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2)};
    dx = 1;
    dy = 0;
    enemyDx = -1;
    enemyDy = 0;
    score = 3;
    enemyScore = 3;
    isInvincible = true;
    gameStartTime = Date.now();
}

function checkInvincibility() {
    if (isInvincible && Date.now() - gameStartTime > invincibilityTime) {
        isInvincible = false;
    }
}

function updateScore() {
    scoreElement.textContent = `Your Score: ${score} | Enemy Score: ${enemyScore}`;
    playerScoreElement.textContent = score;
    enemyScoreElement.textContent = enemyScore;
}

startGame();