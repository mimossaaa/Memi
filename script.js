document.addEventListener('DOMContentLoaded', () => {
    const cardTitleEl = document.getElementById('cardTitle');
    const cardDefinitionEl = document.getElementById('cardDefinition');
    const flashcardEl = document.querySelector('.flashcard');
    const flashcardInnerEl = document.querySelector('.flashcard-inner');
    const prevCardBtn = document.getElementById('prevCard');
    const nextCardBtn = document.getElementById('nextCard');
    const shuffleCardsBtn = document.getElementById('shuffleCards');
    const starButton = document.querySelector('.star-button');
    const starIcon = starButton.querySelector('i');
    const currentCardNumEl = document.getElementById('currentCardNum');
    const totalCardNumEl = document.getElementById('totalCardNum');
    const showStarredToggle = document.getElementById('showStarredToggle');

    let allFlashcards = [];
    let displayedFlashcards = []; // Could be all or just starred
    let currentCardIndex = 0;
    let starredCardIds = new Set(JSON.parse(localStorage.getItem('starredFlashcards')) || []);
    let isShowingStarred = false;

    // --- Data Loading and Initialization ---
    async function loadFlashcards() {
        try {
            const response = await fetch('flashcards.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allFlashcards = await response.json();
            if (allFlashcards.length === 0) {
                showError("No flashcards found. Please add some to flashcards.json.");
                return;
            }
            updateDisplayedFlashcards(); // This will initially set displayedFlashcards to allFlashcards
            // displayCard(); // Now called by updateDisplayedFlashcards
        } catch (error) {
            console.error("Failed to load flashcards:", error);
            showError("Could not load flashcards. Check console for details.");
        }
    }

    function updateDisplayedFlashcards() {
        if (isShowingStarred) {
            displayedFlashcards = allFlashcards.filter(card => starredCardIds.has(card.id));
            if (displayedFlashcards.length === 0 && allFlashcards.length > 0) {
                // If no starred cards, but there are cards, show a message or revert
                alert("No starred cards to show. Displaying all cards.");
                showStarredToggle.checked = false; // uncheck toggle
                isShowingStarred = false;
                displayedFlashcards = [...allFlashcards];
            }
        } else {
            displayedFlashcards = [...allFlashcards];
        }
        currentCardIndex = 0; // Reset index when card set changes
        if (displayedFlashcards.length === 0 && allFlashcards.length > 0 && isShowingStarred) {
             // This case is handled above, but as a fallback:
            totalCardNumEl.textContent = allFlashcards.length; // Show total of all cards
            showError("No starred cards. Uncheck 'Show Only Starred' to see all cards.");
        } else if (displayedFlashcards.length === 0 && allFlashcards.length === 0) {
            showError("No flashcards available.");
        }
        else {
            displayCard();
        }
    }


    function displayCard() {
        if (displayedFlashcards.length === 0) {
            cardTitleEl.textContent = "No cards to display";
            cardDefinitionEl.textContent = isShowingStarred ? "Try starring some cards or uncheck 'Show Only Starred'." : "Add cards to flashcards.json";
            currentCardNumEl.textContent = 0;
            totalCardNumEl.textContent = allFlashcards.length; // show total of all
            updateButtonStates();
            updateStarIcon(); // To clear star if no card
            return;
        }

        // Ensure index is within bounds
        if (currentCardIndex < 0) currentCardIndex = 0;
        if (currentCardIndex >= displayedFlashcards.length) currentCardIndex = displayedFlashcards.length - 1;
        
        const card = displayedFlashcards[currentCardIndex];
        cardTitleEl.textContent = card.title;
        cardDefinitionEl.textContent = card.definition;

        // Reset flip state
        flashcardEl.classList.remove('is-flipped');

        updateButtonStates();
        updateStarIcon();
        updateCardCounter();
    }

    function showError(message) {
        cardTitleEl.textContent = "Error";
        cardDefinitionEl.textContent = message;
        currentCardNumEl.textContent = 0;
        totalCardNumEl.textContent = allFlashcards.length; // Show total of all cards available
        prevCardBtn.disabled = true;
        nextCardBtn.disabled = true;
        shuffleCardsBtn.disabled = allFlashcards.length === 0;
        starButton.style.display = 'none'; // Hide star if error
    }


    // --- UI Updates ---
    function updateButtonStates() {
        prevCardBtn.disabled = currentCardIndex === 0 || displayedFlashcards.length <= 1;
        nextCardBtn.disabled = currentCardIndex === displayedFlashcards.length - 1 || displayedFlashcards.length <= 1;
        shuffleCardsBtn.disabled = displayedFlashcards.length <= 1; // Can't shuffle one card
        starButton.style.display = displayedFlashcards.length > 0 ? 'block' : 'none';
    }

    function updateStarIcon() {
        if (displayedFlashcards.length > 0) {
            const currentCardId = displayedFlashcards[currentCardIndex].id;
            if (starredCardIds.has(currentCardId)) {
                starButton.classList.add('starred');
                starIcon.classList.remove('far'); // Use regular
                starIcon.classList.add('fas');   // Use solid
            } else {
                starButton.classList.remove('starred');
                starIcon.classList.remove('fas');
                starIcon.classList.add('far');
            }
        } else {
            // No card, ensure star is reset
            starButton.classList.remove('starred');
            starIcon.classList.remove('fas');
            starIcon.classList.add('far');
        }
    }
    
    function updateCardCounter() {
        currentCardNumEl.textContent = displayedFlashcards.length > 0 ? currentCardIndex + 1 : 0;
        totalCardNumEl.textContent = displayedFlashcards.length; // This shows count of currently displayed set
    }

    // --- Event Handlers ---
    function flipCard() {
        if (displayedFlashcards.length > 0) {
           flashcardEl.classList.toggle('is-flipped');
        }
    }

    function showNextCard() {
        if (currentCardIndex < displayedFlashcards.length - 1) {
            currentCardIndex++;
            displayCard();
        }
    }

    function showPrevCard() {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            displayCard();
        }
    }

    function shuffleDisplayedCards() {
        if (displayedFlashcards.length <= 1) return; // No need to shuffle
        
        // Fisher-Yates Shuffle
        for (let i = displayedFlashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [displayedFlashcards[i], displayedFlashcards[j]] = [displayedFlashcards[j], displayedFlashcards[i]];
        }
        currentCardIndex = 0;
        displayCard();
    }

    function toggleStar() {
        if (displayedFlashcards.length === 0) return;

        const currentCardId = displayedFlashcards[currentCardIndex].id;
        if (starredCardIds.has(currentCardId)) {
            starredCardIds.delete(currentCardId);
        } else {
            starredCardIds.add(currentCardId);
        }
        localStorage.setItem('starredFlashcards', JSON.stringify(Array.from(starredCardIds)));
        updateStarIcon();

        // If showing only starred and the current card is unstarred, refresh the view
        if (isShowingStarred && !starredCardIds.has(currentCardId)) {
            updateDisplayedFlashcards();
        }
    }
    
    function handleShowStarredToggle() {
        isShowingStarred = showStarredToggle.checked;
        updateDisplayedFlashcards();
    }

    function handleKeyboardNavigation(e) {
        if (e.key === "ArrowRight") {
            showNextCard();
        } else if (e.key === "ArrowLeft") {
            showPrevCard();
        } else if (e.key === " ") { // Space to flip
            e.preventDefault(); // Prevent page scroll
            flipCard();
        } else if (e.key.toLowerCase() === "s") { // 's' to star
            toggleStar();
        }
    }

    // --- Attach Event Listeners ---
    flashcardEl.addEventListener('click', flipCard);
    nextCardBtn.addEventListener('click', showNextCard);
    prevCardBtn.addEventListener('click', showPrevCard);
    shuffleCardsBtn.addEventListener('click', shuffleDisplayedCards);
    starButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card flip when clicking star
        toggleStar();
    });
    showStarredToggle.addEventListener('change', handleShowStarredToggle);
    document.addEventListener('keydown', handleKeyboardNavigation);

    // --- Initialize ---
    loadFlashcards();
});