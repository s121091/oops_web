// List of all product images for the card game
var allImages = [
    '../image/americano.png', '../image/mixedFruitTea.png',
    '../image/cappuccino.png', '../image/chamomileTea.png',
    '../image/earltGreyTea.png', '../image/espresso.png',
    '../image/jasmineGreenTea.png', '../image/latte.png',
    '../image/mocha.png', '../image/roastedOolongTea.png',
    '../image/teaLeaves.png', '../image/coffeeBeans.png'
];

// Game state variables
var hasFlippedCard = false;     // Is card already flipped?
var lockBoard = false;          // Prevents clicking while checking/match animation
var firstCard, secondCard;      // Store the two flipped cards
var board = document.getElementById('game-board');

// Start a new game with chosen difficulty level
function initGame(level) {
    currentLevel = level;       // Store current level
    board.innerHTML = '';       // Clear the game board
    board.className = 'board ' + level + '-grid';       // Set grid size (basic = 4x4, advanced = 4x5)

    var pairCount;
    if (level === 'basic') {
        pairCount = 8;          // 8 pairs = 16 cards (4x4 grid)
    } else {
        pairCount = 12;         // 12 pairs = 24 cards (4x6 grid)
    }

    // Take the first 'pairCount' images from allImages
    var selectedImages = allImages.slice(0, pairCount);
    // Duplicate to make pairs, then shuffle
    var gameCards = selectedImages.concat(selectedImages);
    gameCards.sort(function() {
        return 0.5 - Math.random();
    });

    // Create each card and add to board
    for (var i = 0; i < gameCards.length; i++) {
        var imgSrc = gameCards[i];
        var card = document.createElement('div');
        
        card.classList.add('card');
        card.setAttribute('data-img', imgSrc);      // Store image path
        card.innerHTML = '?';                       // Show question mark when face down
        card.addEventListener('click', flipCard);
        board.appendChild(card);
    }

    resetBoard();   // Reset game state
}

// Reset the game to the same difficulty
var restart = document.getElementById("btn-reset");
restart.onclick = function resetGame() {
    initGame(currentLevel);
}

// Handle when a player clicks on a card
function flipCard() {
    if (lockBoard) return;              // Can't flip if board is locked
    if (this === firstCard) return;     // Can't flip the same card twice

    // Show the card's image (flip it face up)
    this.innerHTML = '<img src="' + this.getAttribute('data-img') + '">';

    if (!hasFlippedCard) {
        // First card flipped, store it and wait for second card
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    // Second card flipped, check if they match
    secondCard = this;
    checkForMatch();
}

// Check if the two flipped cards match
function checkForMatch() {
    var isMatch = firstCard.getAttribute('data-img') === secondCard.getAttribute('data-img');

    if (isMatch) {
        // Cards match, mark as matched (they stay face up)
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        resetBoard();
    } else {
        // No match, lock board, show images briefly, then flip back
        lockBoard = true;
        setTimeout(function() {
            firstCard.innerHTML = '?';
            secondCard.innerHTML = '?';
            resetBoard();   // Unlock board and reset state
        }, 1000);           // Wait 1 second before flipping back
    }
}

// Peek function, briefly show all cards
function peekAllCards() {
    if (lockBoard) return;
    lockBoard = true;

    var cards = document.getElementsByClassName('card');

    // Show all cards
    for (var i = 0; i < cards.length; i++) {
        if (!cards[i].classList.contains('matched')) {
            cards[i].innerHTML = '<img src="' + cards[i].getAttribute('data-img') + '">';
        }
    }

    // After 2 seconds, flip them all back to face down
    setTimeout(function() {
        for (var i = 0; i < cards.length; i++) {
            if (!cards[i].classList.contains('matched')) {
                cards[i].innerHTML = '?';
            }
        }
        lockBoard = false;  // Unlock board after peeking
    }, 2000);
}

// Reset game state
function resetBoard() {
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
}

// Start basic game (8 pairs)
document.getElementById('btn-basic').addEventListener('click', function() {
    initGame('basic');
});

// Start advanced game (10 pairs)
document.getElementById('btn-advanced').addEventListener('click', function() {
    initGame('advanced');
});

// Peek button
document.getElementById('btn-peek').addEventListener('click', peekAllCards);