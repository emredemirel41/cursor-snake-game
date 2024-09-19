import { Snake } from './snake.js';
import { Food } from './food.js';
import { Bomb } from './bomb.js';
import { setupInput } from './input.js';
import { render } from './render.js';
import { checkCollision, resetGame, checkInvincibility } from './utils.js';

let canvas, ctx, scoreElement, playerScoreElement, enemyScoreElement;
let snake, enemySnake, food;
let isMultiplayer = false;
let gameStartTime;

export function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    playerScoreElement = document.getElementById('player-score');
    enemyScoreElement = document.getElementById('enemy-score');

    isMultiplayer = confirm("Multiplayer modunda oynamak ister misiniz?");
    
    snake = new Snake(2, 2, 'green');
    enemySnake = new Snake(canvas.width / 20 - 3, canvas.width / 20 - 3, 'blue');
    food = new Food(canvas.width / 20);

    setupInput(isMultiplayer, snake, enemySnake);
    
    gameStartTime = Date.now();
    setInterval(gameLoop, 100);
}

function gameLoop() {
    snake.move();
    if (isMultiplayer) {
        enemySnake.move();
    } else {
        enemySnake.moveAI(food);
    }
    
    Bomb.moveBombs();
    checkCollision(snake, enemySnake, food);
    checkInvincibility(snake, gameStartTime);
    
    render(ctx, canvas, snake, enemySnake, food);
    updateScore();
    Bomb.updateBombCooldown();
}

function updateScore() {
    scoreElement.textContent = `Your Score: ${snake.score} | Enemy Score: ${enemySnake.score}`;
    playerScoreElement.textContent = snake.score;
    enemyScoreElement.textContent = enemySnake.score;
}

initGame();