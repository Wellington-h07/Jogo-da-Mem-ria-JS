document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('game-board');
    const scoreDisplay = document.getElementById('player-score');
    const restartButton = document.getElementById('restart');
    const difficultySelect = document.getElementById('difficulty');
    const rankingList = document.getElementById('ranking-list');
    const playerNameInput = document.getElementById('player-name');
    const gameContainer = document.getElementById('game');

    let emojis = ["🐶", "🐱", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔"];
    let cardsArray = [];
    let playerScore = 0;
    let firstCard, secondCard;
    let hasFlippedCard = false;
    let lockBoard = false;
    let gameStarted = false;
    let startTime, timerInterval;
    let pairPoints = 50;

    function bottonVisible(startVisible) {
        restartButton.style.display = startVisible ? 'inline-block' : 'none';
        difficultySelect.style.display = startVisible ? 'inline-block' : 'none';
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function displayCards(numPairs = 8) {
        cardsArray = emojis.slice(0, numPairs).flatMap(emoji => [emoji, emoji]);
        shuffle(cardsArray);

        board.innerHTML = '';
        cardsArray.forEach(cardValue => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.dataset.value = cardValue;
            cardElement.innerHTML = "?";
            board.appendChild(cardElement);
        });
    }

    function startGame(difficulty = 'fácil') {
        board.innerHTML = '';
        bottonVisible(false); 
        
        let numPairs;
        switch (difficulty) {
            case 'difícil':
                numPairs = 15;
                board.classList.add('difficulty-mode');
                break;
            default:
                numPairs = 8;
                board.classList.remove('difficulty-mode');
        }
        displayCards(numPairs);
        const cardElements = document.querySelectorAll('.card');
        cardElements.forEach(card => card.addEventListener('click', flipCard));

        resetGame();
        gameStarted = true;
        startTimer();
    }

    function flipCard() {
        if (!gameStarted) {
            alert(`Você precisa inserir seu nome, escolher a dificuldade e clicar em 'Iniciar' para jogar.`);
            return;
        }
        if (lockBoard) return;
        if (this === firstCard) return;

        this.classList.add('flip');
        this.innerHTML = this.dataset.value;

        if (!hasFlippedCard) {
            hasFlippedCard = true;
            firstCard = this;
            return;
        }

        secondCard = this;
        checkForMatch();
    }

    function checkForMatch() {
        let isMatch = firstCard.dataset.value === secondCard.dataset.value;

        if (isMatch) {
            disableCards();
            playerScore += pairPoints;
            updateScore();

            setTimeout(() => {
                const flippedCards = document.querySelectorAll('.card.flip').length;
                if (flippedCards === cardsArray.length) {
                    endGame();
                }
            }, 500);
        } else {
            unflipCards();
        }
    }

    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        resetBoard();
    }

    function unflipCards() {
        lockBoard = true;

        setTimeout(() => {
            firstCard.innerHTML = "?";
            secondCard.innerHTML = "?";
            firstCard.classList.remove('flip');
            secondCard.classList.remove('flip');
            resetBoard();
        }, 1500);
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }

    function updateScore() {
        scoreDisplay.textContent = playerScore;
    }

    function resetGame() {
        playerScore = 0;
        pairPoints = 50;
        updateScore();
        clearInterval(timerInterval);
    }

    function savePlayerScore() {
        const playerName = localStorage.getItem('playerName');
        if (!playerName || playerName.trim() === "") {
            return;
        }

        const ranking = JSON.parse(localStorage.getItem('ranking')) || [];
        const existingPlayer = ranking.find(player => player.name === playerName);

        if (existingPlayer) {
            existingPlayer.score = Math.max(existingPlayer.score, playerScore);
        } else {
            ranking.push({ name: playerName, score: playerScore });
        }

        ranking.sort((a, b) => b.score - a.score);
        localStorage.setItem('ranking', JSON.stringify(ranking));
    }

    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            if (elapsedSeconds > 0 && elapsedSeconds % 15 === 0) {
                pairPoints = Math.max(1, pairPoints - 3);
            }
        }, 1000);
    }

    function endGame() {
        clearInterval(timerInterval);
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

        savePlayerScore();
        loadRanking();

        const playerName = localStorage.getItem('playerName') || 'Jogador';

        alert(`Parabéns ${playerName}! Sua pontuação foi de: ${playerScore} pontos e levou ${elapsedTime} segundos para concluir.`);
        gameStarted = false;

        const playAgainButton = document.createElement('button');
        playAgainButton.textContent = "Jogar Novamente";
        playAgainButton.id = "play-again";
        playAgainButton.addEventListener('click', () => {
            playAgainButton.remove();

            const cardElements = document.querySelectorAll('.card');
            cardElements.forEach(card => {
                card.classList.remove('flip');
                card.innerHTML = "?";
            });

            bottonVisible(true);

            resetGame();
        });
        gameContainer.appendChild(playAgainButton);
    }

    function loadRanking() {
        const ranking = JSON.parse(localStorage.getItem('ranking')) || [];
        rankingList.innerHTML = ranking.map(player => `<li>${player.name}: ${player.score}</li>`).join('');
    }

    function loadPlayerName() {
        const storedName = localStorage.getItem('playerName');
        if (storedName) {
            playerNameInput.value = storedName;
        }
    }

    function savePlayerName() {
        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            alert('Por favor, insira o nome do jogador!');
            return false;
        }
        localStorage.setItem('playerName', playerName);
        return true;
    }

    restartButton.addEventListener('click', () => {
        if (savePlayerName()) {
            const difficulty = difficultySelect.value;
            if (!difficulty) {
                alert('Por favor, selecione uma dificuldade.');
                return;
            }
            startGame(difficulty);
        }
    });

    displayCards();
    loadRanking();
    loadPlayerName();
});