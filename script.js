// Oil Rig Snake Game - Retro Arcade Edition

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameStatus = document.getElementById('gameStatus');
const statusMessage = document.getElementById('statusMessage');
const finalScore = document.getElementById('finalScore');

// Game Constants
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const INITIAL_SPEED = 6;
const SPEED_INCREMENT = 0.3;

// Game States
const GAME_STATE = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// Oil-themed collectibles
const COLLECTIBLE_TYPES = {
    OIL_BARREL: { name: 'oil_barrel', color: '#ff6b35', points: 10 },
    OIL_TOWER: { name: 'oil_tower', color: '#ffaa00', points: 25 },
    FUEL_CAN: { name: 'fuel_can', color: '#ff3333', points: 50 }
};

// Game Variables
let gameState = GAME_STATE.IDLE;
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let collectible = null;
let score = 0;
let level = 1;
let gameSpeed = INITIAL_SPEED;
let frameCount = 0;
let pausedTime = false;

// Initialize
function init() {
    snake = [
        { x: Math.floor(TILE_COUNT / 2), y: Math.floor(TILE_COUNT / 2) }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    level = 1;
    gameSpeed = INITIAL_SPEED;
    frameCount = 0;
    collectible = null;
    gameStatus.style.display = 'none';
    startBtn.style.display = 'inline-block';
    restartBtn.style.display = 'none';
    updateDisplay();
    spawnCollectible();
    draw();
}

// Spawn a new collectible
function spawnCollectible() {
    let x, y, overlap;
    do {
        overlap = false;
        x = Math.floor(Math.random() * TILE_COUNT);
        y = Math.floor(Math.random() * TILE_COUNT);
        for (let segment of snake) {
            if (segment.x === x && segment.y === y) {
                overlap = true;
                break;
            }
        }
    } while (overlap);

    const types = Object.values(COLLECTIBLE_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    collectible = { x, y, type: randomType };
}

// Update game state
function update() {
    if (gameState !== GAME_STATE.PLAYING) return;

    frameCount++;
    if (frameCount < (10 / gameSpeed)) return;
    frameCount = 0;

    // Update direction
    direction = nextDirection;

    // Calculate new head position
    const head = snake[0];
    const newHead = {
        x: (head.x + direction.x + TILE_COUNT) % TILE_COUNT,
        y: (head.y + direction.y + TILE_COUNT) % TILE_COUNT
    };

    // Check collision with self
    for (let segment of snake) {
        if (newHead.x === segment.x && newHead.y === segment.y) {
            endGame();
            return;
        }
    }

    // Add new head
    snake.unshift(newHead);

    // Check if collectible is eaten
    if (collectible && newHead.x === collectible.x && newHead.y === collectible.y) {
        score += collectible.type.points;
        level = Math.floor(score / 100) + 1;
        gameSpeed = INITIAL_SPEED + (level - 1) * SPEED_INCREMENT;
        playCollectSound();
        spawnCollectible();
    } else {
        snake.pop();
    }

    updateDisplay();
}

// Draw game
function draw() {
    // Clear canvas with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(10, 10, 30, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (subtle)
    drawGrid();

    // Draw collectible
    if (collectible) {
        drawCollectible(collectible);
    }

    // Draw snake
    drawSnake();

    // Draw game over overlay if needed
    if (gameState === GAME_STATE.GAME_OVER) {
        drawGameOverOverlay();
    }
}

// Draw grid background
function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= TILE_COUNT; i++) {
        const pos = i * GRID_SIZE;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
    }
}

// Draw snake (pipeline style)
function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;

        if (i === 0) {
            // Head - brighter and larger
            ctx.fillStyle = '#00ff00';
            ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
            
            // Eye
            ctx.fillStyle = '#000';
            const eyeSize = 4;
            ctx.fillRect(x + 8, y + 8, eyeSize, eyeSize);
        } else {
            // Body segments - gradient from bright to dim
            const intensity = 1 - (i / snake.length) * 0.5;
            const green = Math.floor(255 * intensity);
            ctx.fillStyle = `rgba(0, ${green}, 0, ${intensity})`;
            ctx.shadowColor = `rgba(0, 255, 0, ${intensity * 0.6})`;
            ctx.shadowBlur = 8;
            ctx.fillRect(x + 3, y + 3, GRID_SIZE - 6, GRID_SIZE - 6);
        }
    }
    ctx.shadowColor = 'transparent';
}

// Draw collectible with animation
function drawCollectible(collectible) {
    const x = collectible.x * GRID_SIZE;
    const y = collectible.y * GRID_SIZE;
    const centerX = x + GRID_SIZE / 2;
    const centerY = y + GRID_SIZE / 2;
    const pulse = Math.sin(Date.now() / 200) * 2;

    ctx.shadowColor = collectible.type.color;
    ctx.shadowBlur = 15 + pulse;
    ctx.fillStyle = collectible.type.color;

    switch (collectible.type.name) {
        case 'oil_barrel':
            // Draw barrel
            ctx.fillRect(x + 4, y + 2, GRID_SIZE - 8, GRID_SIZE - 4);
            ctx.fillRect(x + 6, y + 6, GRID_SIZE - 12, 4);
            break;

        case 'oil_tower':
            // Draw tower/drilling rig
            ctx.fillRect(x + 8, y + 2, 4, GRID_SIZE - 4);
            ctx.fillRect(x + 6, y + 4, 8, 4);
            ctx.fillRect(x + 4, y + 12, 12, 4);
            break;

        case 'fuel_can':
            // Draw fuel can
            ctx.fillRect(x + 5, y + 3, GRID_SIZE - 10, GRID_SIZE - 6);
            ctx.fillRect(x + 7, y + 1, GRID_SIZE - 14, 3);
            break;
    }

    ctx.shadowColor = 'transparent';
}

// Draw game over overlay
function drawGameOverOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Update display
function updateDisplay() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    gameState = GAME_STATE.GAME_OVER;
    statusMessage.textContent = 'GAME OVER';
    finalScore.textContent = `Final Score: ${score}`;
    gameStatus.style.display = 'block';
    startBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
    playGameOverSound();
}

// Start game
function startGame() {
    gameState = GAME_STATE.PLAYING;
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
}

// Restart game
function restartGame() {
    init();
    startGame();
}

// Toggle pause
function togglePause() {
    if (gameState === GAME_STATE.PLAYING) {
        gameState = GAME_STATE.PAUSED;
        statusMessage.textContent = 'PAUSED';
        gameStatus.style.display = 'block';
    } else if (gameState === GAME_STATE.PAUSED) {
        gameState = GAME_STATE.PLAYING;
        gameStatus.style.display = 'none';
    }
}

// Sound effects (simple beeps using Web Audio API)
function playCollectSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Audio API not available
    }
}

function playGameOverSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Audio API not available
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
        togglePause();
        return;
    }

    if (gameState !== GAME_STATE.PLAYING) return;

    const key = e.key.toLowerCase();

    // Arrow keys and WASD
    if (key === 'arrowup' || key === 'w') {
        if (direction.y === 0) nextDirection = { x: 0, y: -1 };
    } else if (key === 'arrowdown' || key === 's') {
        if (direction.y === 0) nextDirection = { x: 0, y: 1 };
    } else if (key === 'arrowleft' || key === 'a') {
        if (direction.x === 0) nextDirection = { x: -1, y: 0 };
    } else if (key === 'arrowright' || key === 'd') {
        if (direction.x === 0) nextDirection = { x: 1, y: 0 };
    }
});

// Button event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

// Mobile touch controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    if (gameState !== GAME_STATE.PLAYING) return;
    e.preventDefault();

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const threshold = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > threshold && direction.x === 0) {
            nextDirection = { x: 1, y: 0 };
            touchStartX = touchEndX;
        } else if (diffX < -threshold && direction.x === 0) {
            nextDirection = { x: -1, y: 0 };
            touchStartX = touchEndX;
        }
    } else {
        if (diffY > threshold && direction.y === 0) {
            nextDirection = { x: 0, y: 1 };
            touchStartY = touchEndY;
        } else if (diffY < -threshold && direction.y === 0) {
            nextDirection = { x: 0, y: -1 };
            touchStartY = touchEndY;
        }
    }
});

// Start the game loop and initialize
init();
gameLoop();
