// js-crunch01/script.js

import { mazes } from "./mazes.js";

let currentMaze = [];
let start = null;
let end = null;
let speed = 100;

// DOM элементы
const canvas = document.getElementById("maze-canvas");
const ctx = canvas.getContext("2d");

const mazeSelect = document.getElementById("maze-select");
const speedSelect = document.getElementById("speed");
const customContainer = document.getElementById("custom-maze-container");
const customInput = document.getElementById("custom-maze");
const resetBtn = document.getElementById("reset-btn");
const startBtn = document.getElementById("start-btn");
const generateBtn = document.getElementById("generate-btn");

// === 🆕 Функция для синхронизации размеров canvas ===
function resizeCanvasToMatchDisplaySize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

// Смена лабиринта
mazeSelect.addEventListener("change", (e) => {
    const selected = e.target.value;

    if (selected === "custom") {
        customContainer.style.display = "flex";
    } else {
        customContainer.style.display = "none";
        currentMaze = structuredClone(mazes[selected]);
        start = end = null;
        resizeCanvasToMatchDisplaySize(); // 🆕
        renderMaze(currentMaze);
    }
});

// Смена скорости
speedSelect.addEventListener("change", (e) => {
    const speeds = {
        fast: 30,
        normal: 100,
        slow: 250,
    };
    speed = speeds[e.target.value] || 100;
});

// Сброс
resetBtn.addEventListener("click", () => location.reload());

generateBtn.addEventListener("click", () => {
    const raw = customInput.value.trim();

    try {
        const parsed = raw
            .split("\n")
            .map((line) => {
                const trimmed = line.trim();
                if (trimmed === "") return [];

                const parts = /\s/.test(trimmed)
                    ? trimmed.split(/\s+/)
                    : trimmed.split("");

                const numbers = parts.map((ch) => {
                    if (ch !== "0" && ch !== "1") {
                        throw new Error("Карта может содержать только символы 0 и 1.");
                    }
                    return Number(ch);
                });

                return numbers;
            })
            .filter(row => row.length > 0);

        const allSameLength = parsed.every(row => row.length === parsed[0].length);
        if (!allSameLength) {
            alert("❌ Ошибка: Все строки должны быть одинаковой длины.");
            return;
        }

        currentMaze = parsed;
        start = null;
        end = null;
        resizeCanvasToMatchDisplaySize(); // 🆕
        renderMaze(currentMaze);
        customContainer.style.display = "none";
        alert("✅ Карта загружена. Выберите старт и финиш кликом по полю.");
    } catch (err) {
        alert(`❌ ${err.message}`);
    }
});

// Старт поиска
startBtn.addEventListener("click", () => {
    if (!start || !end) {
        alert("⚠️ Выберите старт и финиш кликом по полю");
        return;
    }

    if (start[0] === end[0] && start[1] === end[1]) {
        alert("❌ Старт и финиш не могут быть в одной ячейке.");
        return;
    }

    bfs(currentMaze, start, end);
});

// Клик по canvas
canvas.addEventListener("click", (e) => {
    if (!currentMaze.length) return;

    const cols = currentMaze[0].length;
    const cellSize = Math.floor(canvas.width / cols);
    const x = Math.floor(e.offsetX / cellSize);
    const y = Math.floor(e.offsetY / cellSize);

    if (currentMaze[y][x] === 1) return;

    if (!start) {
        start = [y, x];
    } else if (!end) {
        end = [y, x];
    } else {
        start = [y, x];
        end = null;
    }

    renderMaze(currentMaze);
});

// Отрисовка лабиринта
function renderMaze(maze) {
    const rows = maze.length;
    const cols = maze[0].length;
    const cellSize = Math.floor(canvas.width / cols);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const val = maze[y][x];
            ctx.fillStyle = getColor(val);
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

            ctx.strokeStyle = "#ccc";
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

            if (start && y === start[0] && x === start[1]) {
                ctx.fillStyle = "blue";
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }

            if (end && y === end[0] && x === end[1]) {
                ctx.fillStyle = "red";
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
}

function getColor(val) {
    switch (val) {
        case 0: return "#ffffff";
        case 1: return "#000000";
        case 2: return "#90caf9";
        case 3: return "#43a047";
        default: return "#ff00ff";
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function bfs(maze, start, end) {
    const rows = maze.length;
    const cols = maze[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const parent = Array.from({ length: rows }, () => Array(cols).fill(null));
    const queue = [[...start]];
    visited[start[0]][start[1]] = true;

    while (queue.length) {
        const [y, x] = queue.shift();

        if (y === end[0] && x === end[1]) {
            return markFinalPath(parent, start, end);
        }

        for (const [dy, dx] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
            const ny = y + dy;
            const nx = x + dx;

            if (
                ny >= 0 && ny < rows &&
                nx >= 0 && nx < cols &&
                maze[ny][nx] === 0 &&
                !visited[ny][nx]
            ) {
                visited[ny][nx] = true;
                parent[ny][nx] = [y, x];
                maze[ny][nx] = 2;
                queue.push([ny, nx]);
                renderMaze(maze);
                await sleep(speed);
            }
        }
    }

    alert("❌ Путь не найден");
}

async function markFinalPath(parent, start, end) {
    let [y, x] = end;

    while (!(y === start[0] && x === start[1])) {
        currentMaze[y][x] = 3;
        [y, x] = parent[y][x];
        renderMaze(currentMaze);
        await sleep(speed);
    }

    currentMaze[start[0]][start[1]] = 3;
    renderMaze(currentMaze);
    alert("✅ Путь найден!");
}

// === Генерация select с лабиринтами ===
const select = document.getElementById("maze-select");

function generateMazeOptions() {
    Object.keys(mazes).forEach((key, index) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = `Лабиринт ${index + 1}`;
        select.appendChild(option);
    });

    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.textContent = "Своя карта";
    select.appendChild(customOption);
}
generateMazeOptions();

// Инициализация
mazeSelect.dispatchEvent(new Event("change"));
