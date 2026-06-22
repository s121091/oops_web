/* ==========================================================================
    0. 国际化 (i18n) 双语系统
    ========================================================================== */
const translations = {
    zh: {
        langBtn: "EN",
        backHome: "返回主页",
        dayLabel: "今日",
        timeLabel: "时间",
        movesLabel: "尝试步数",
        matchedLabel: "已匹配",
        toyTitle: "解压咖啡站",
        pourBtn: "倒咖啡",
        drinkBtn: "喝掉",
        gameTitle: "Coffee & Tea Memory",
        gameSub: "-- 测试你的瞬间记忆力 / Test Your Memory --",
        btnBasic: "基础模式 (4x4)",
        btnAdv: "进阶模式 (4x6)",
        btnPeek: "偷看卡牌",
        btnReset: "重置游戏",
        winTitle: "🎉 恭喜通关！",
        winDesc1: "你总共使用了 ",
        winDesc2: " 步完成匹配。",
        winBtn: "再来一局",
        footerText: "© 2026 oops. 保留一切权利."
    },
    en: {
        langBtn: "中",
        backHome: "Back to Home",
        dayLabel: "Date",
        timeLabel: "Time",
        movesLabel: "Moves",
        matchedLabel: "Matched",
        toyTitle: "Coffee Station",
        pourBtn: "Pour",
        drinkBtn: "Drink",
        gameTitle: "Coffee & Tea Memory",
        gameSub: "-- Test Your Memory --",
        btnBasic: "Basic (4x4)",
        btnAdv: "Advanced (4x6)",
        btnPeek: "Peek Cards",
        btnReset: "Reset Game",
        winTitle: "🎉 Congratulations!",
        winDesc1: "You completed the game in ",
        winDesc2: " moves.",
        winBtn: "Play Again",
        footerText: "© 2026 oops. All rights reserved."
    }
};

let currentLang = localStorage.getItem('gameLang') || 'zh';

function applyTranslations() {
    const data = translations[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (data[key]) {
            el.innerText = data[key];
        }
    });
    document.getElementById('lang-switch').innerText = data.langBtn;
}

function toggleLanguage() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('gameLang', currentLang);
    applyTranslations();
}

function initApp() {
    applyTranslations();
    initGame('basic');
    Clock();
}

/* ==========================================================================
    1. 咖啡互动小玩具逻辑
    ========================================================================== */
var pourInterval;
var liquidLevel = 0;
var liquidEl = document.getElementById('coffee-liquid');
var steamEl = document.getElementById('steam-effect');

function startPouring(e) {
    if(e) e.preventDefault(); 
    if (liquidLevel >= 100) return;
    
    clearInterval(pourInterval);
    liquidEl.style.transition = 'height 0.1s linear';
    
    pourInterval = setInterval(() => {
        liquidLevel += 3;
        if (liquidLevel >= 100) {
            liquidLevel = 100;
            stopPouring();
            steamEl.classList.add('active'); 
        }
        liquidEl.style.height = liquidLevel + '%';
    }, 40);
}

function stopPouring(e) {
    if(e) e.preventDefault();
    clearInterval(pourInterval);
    if(liquidLevel >= 80) {
        steamEl.classList.add('active');
    }
}

function drinkCoffee() {
    liquidLevel = 0;
    steamEl.classList.remove('active');
    liquidEl.style.transition = 'height 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)';
    liquidEl.style.height = '0%';
}

/* ==========================================================================
    2. GAME LOGIC (游戏核心逻辑)
    ========================================================================== */
var allImages = [
    '../image/americano.png', '../image/mixedFruitTea.png',
    '../image/cappuccino.png', '../image/chamomileTea.png',
    '../image/earltGreyTea.png', '../image/espresso.png',
    '../image/jasmineGreenTea.png', '../image/latte.png',
    '../image/mocha.png', '../image/roastedOolongTea.png',
    '../image/teaLeaves.png', '../image/coffeeBeans.png'
];

var hasFlippedCard = false;
var lockBoard = false;
var firstCard, secondCard;
var board = document.getElementById('game-board');
var currentLevel = 'basic';

var moves = 0;
var matchedPairs = 0;
var totalPairs = 8;

function updateStats() {
    document.getElementById('move-counter').innerText = moves;
    document.getElementById('match-counter').innerText = matchedPairs + '/' + totalPairs;
    
    if(matchedPairs === totalPairs) {
        setTimeout(() => {
            document.getElementById('final-moves').innerText = moves;
            document.getElementById('win-banner').classList.add('show');
        }, 500);
    }
}

function initGame(level) {
    currentLevel = level;
    board.innerHTML = '';
    board.className = 'board ' + level + '-grid';

    document.getElementById('btn-basic').classList.toggle('active-mode', level === 'basic');
    document.getElementById('btn-advanced').classList.toggle('active-mode', level === 'advanced');

    totalPairs = (level === 'basic') ? 8 : 12;

    var selectedImages = allImages.slice(0, totalPairs);
    var gameCards = selectedImages.concat(selectedImages);
    gameCards.sort(function() { return 0.5 - Math.random(); });

    for (var i = 0; i < gameCards.length; i++) {
        var imgSrc = gameCards[i];
        var card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-img', imgSrc);
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front"></div>
                <div class="card-back">
                    <img src="${imgSrc}" alt="Product" onerror="this.src='https://via.placeholder.com/100?text=Image'">
                </div>
            </div>
        `;
        card.addEventListener('click', flipCard);
        board.appendChild(card);
    }

    resetBoard();
    moves = 0;
    matchedPairs = 0;
    updateStats();
}

document.getElementById('btn-reset').addEventListener('click', function() { initGame(currentLevel); });

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flipped');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    moves++; 
    updateStats();
    checkForMatch();
}

function checkForMatch() {
    var isMatch = firstCard.getAttribute('data-img') === secondCard.getAttribute('data-img');

    if (isMatch) {
        setTimeout(() => {
            firstCard.classList.add('matched');
            secondCard.classList.add('matched');
            matchedPairs++;
            updateStats();
        }, 400);
        resetBoard();
    } else {
        lockBoard = true;
        setTimeout(function() {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetBoard();
        }, 1000);
    }
}

function peekAllCards() {
    if (lockBoard) return;
    lockBoard = true;
    var cards = document.getElementsByClassName('card');
    for (var i = 0; i < cards.length; i++) {
        if (!cards[i].classList.contains('matched')) {
            cards[i].classList.add('flipped');
        }
    }
    setTimeout(function() {
        for (var i = 0; i < cards.length; i++) {
            if (!cards[i].classList.contains('matched')) {
                cards[i].classList.remove('flipped');
            }
        }
        lockBoard = false;
    }, 2000);
}

document.getElementById('btn-basic').addEventListener('click', function() { initGame('basic'); });
document.getElementById('btn-advanced').addEventListener('click', function() { initGame('advanced'); });
document.getElementById('btn-peek').addEventListener('click', peekAllCards);

function resetBoard() { hasFlippedCard = false; lockBoard = false; firstCard = null; secondCard = null; }

/* ==========================================================================
    3. 时钟动画
    ========================================================================== */
function updateClock() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');

    document.getElementById("day").innerText = year + "/" + month + "/" + day;
    document.getElementById("time").innerText = hours + ":" + minutes + ":" + seconds;
}

function Clock(){ setInterval(updateClock, 1000); }

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let radius = canvas.height / 2;
ctx.translate(radius, radius);
radius = radius * 0.90;

function drawClock() {
    drawFace(ctx, radius);
    drawMarks(ctx, radius);
    drawTime(ctx, radius);
}

function drawFace(ctx, radius) {
    const grad = ctx.createRadialGradient(0, 0 ,radius * 0.95, 0, 0, radius * 1.05);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = grad;
    ctx.lineWidth = radius * 0.05;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.08, 0, 2 * Math.PI);
    ctx.fillStyle = '#2E3038';
    ctx.fill();
}

function drawMarks(ctx, radius) {
    ctx.lineCap = 'round';
    for(let num = 0; num < 60; num++){
        let ang = num * Math.PI / 30;
        ctx.rotate(ang);
        if(num % 5 === 0){
            ctx.strokeStyle = '#2E3038';
            ctx.lineWidth = radius * 0.04;
            ctx.beginPath();
            ctx.moveTo(0, -radius * 0.75);
            ctx.lineTo(0, -radius * 0.95);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = radius * 0.015;
            ctx.beginPath();
            ctx.moveTo(0, -radius * 0.85);
            ctx.lineTo(0, -radius * 0.95);
            ctx.stroke();
        }
        ctx.rotate(-ang);
    }
}

function drawTime(ctx, radius) {
    const now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();
    
    hour = hour % 12;
    hour = (hour * Math.PI / 6) + (minute * Math.PI / (6 * 60)) + (second * Math.PI / (360 * 60));
    drawHand(ctx, hour, radius * 0.5, radius * 0.07, '#2E3038');
    
    minute = (minute * Math.PI / 30) + (second * Math.PI / (30 * 60));
    drawHand(ctx, minute, radius * 0.75, radius * 0.05, '#2E3038');
    
    second = (second * Math.PI / 30);
    drawHand(ctx, second, radius * 0.85, radius * 0.03, '#FF6B35'); 
}

function drawHand(ctx, pos, length, width, color) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(0,0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
}

setInterval(drawClock, 1000);