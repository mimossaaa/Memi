// script.js

document.addEventListener('DOMContentLoaded', () => {
    const cardTitleEl = document.getElementById('cardTitle');
    const cardDefinitionEl = document.getElementById('cardDefinition');
    const flashcardEl = document.querySelector('.flashcard');
    // const flashcardInnerEl = document.querySelector('.flashcard-inner'); // Not directly used after setup
    const prevCardBtn = document.getElementById('prevCard');
    const nextCardBtn = document.getElementById('nextCard');
    const shuffleCardsBtn = document.getElementById('shuffleCards');
    const starButton = document.querySelector('.star-button');
    const starIcon = starButton.querySelector('i');
    const currentCardNumEl = document.getElementById('currentCardNum');
    const totalCardNumEl = document.getElementById('totalCardNum');
    const showStarredToggle = document.getElementById('showStarredToggle');

    // New elements for data loading
    const jsonFileUpload = document.getElementById('jsonFile');
    const jsonPasteArea = document.getElementById('jsonPasteArea');
    const loadPastedJsonBtn = document.getElementById('loadPastedJson');
    const messageArea = document.getElementById('messageArea');


    let allFlashcards = [];
    let displayedFlashcards = [];
    let currentCardIndex = 0;
    let starredCardIds = new Set(JSON.parse(localStorage.getItem('starredFlashcards')) || []);
    let isShowingStarred = false;

    // --- Message Display ---
    function showMessage(text, type = 'info') { // type can be 'success', 'error', 'info'
        messageArea.textContent = text;
        messageArea.className = 'message-area'; // Reset classes
        if (type === 'success') {
            messageArea.classList.add('success');
        } else if (type === 'error') {
            messageArea.classList.add('error');
        } else if (type === 'info') { // <<< THIS CONDITION WAS ADDED/CORRECTED
            messageArea.classList.add('info');
        }
        
        setTimeout(() => {
            if (messageArea.textContent === text) { // Only clear if it's still the same message
                messageArea.textContent = '';
                messageArea.className = 'message-area';
            }
        }, 5000); // Clear message after 5 seconds
    }


    // --- Data Processing and Display ---
    function processAndDisplayCards(jsonDataString) {
        try {
            const parsedData = JSON.parse(jsonDataString);
            if (!Array.isArray(parsedData)) {
                throw new Error("JSON data must be an array of flashcard objects.");
            }

            // Basic validation of card structure
            if (parsedData.length > 0) {
                const firstCard = parsedData[0];
                if (typeof firstCard !== 'object' || firstCard === null ||
                    !firstCard.hasOwnProperty('id') || typeof firstCard.id !== 'string' ||
                    !firstCard.hasOwnProperty('title') || typeof firstCard.title !== 'string' ||
                    !firstCard.hasOwnProperty('definition') || typeof firstCard.definition !== 'string') {
                    throw new Error("Each flashcard object must have 'id' (string), 'title' (string), and 'definition' (string) properties.");
                }
            }
            
            allFlashcards = parsedData;
            currentCardIndex = 0;
            // isShowingStarred = false; // Reset filter on new data load
            // showStarredToggle.checked = false;
            // starredCardIds = new Set(); // Optionally reset stars or keep them if IDs match
            // localStorage.removeItem('starredFlashcards');

            updateDisplayedFlashcards(); // This will re-render with new data
            if (allFlashcards.length > 0) {
                showMessage(`Successfully loaded ${allFlashcards.length} flashcards!`, 'success');
            } else {
                showMessage("Loaded an empty set of flashcards. Add data to your JSON.", 'info');
            }
            jsonPasteArea.value = ''; // Clear textarea after successful load

        } catch (error) {
            console.error("Error processing JSON data:", error);
            showMessage(`Invalid JSON data: ${error.message}. Please check format and content.`, 'error');
        }
    }

    // --- Initial App Load (tries to load default flashcards.json) ---
    async function initializeAppWithDefault() {
        try {
            const response = await fetch('flashcards.json');
            if (response.ok) {
                const defaultCardsText = await response.text();
                if (allFlashcards.length === 0) {
                     processAndDisplayCards(defaultCardsText);
                     showMessage("Loaded default flashcards. You can upload your own above.", "info");
                }
            } else {
                 console.warn("Default flashcards.json not found or couldn't be loaded.");
                 if (allFlashcards.length === 0) { 
                    displayCard(); 
                 }
            }
        } catch (error) {
            console.error("Error loading default flashcards.json:", error);
            if (allFlashcards.length === 0) {
                displayCard();
            }
        }
        updateButtonStates();
        updateCardCounter();
    }


    function updateDisplayedFlashcards() {
        if (isShowingStarred) {
            displayedFlashcards = allFlashcards.filter(card => starredCardIds.has(card.id));
            if (displayedFlashcards.length === 0 && allFlashcards.length > 0) {
                showMessage("No starred cards to show. Uncheck 'Show Only Starred' or star some cards.", "info");
            }
        } else {
            displayedFlashcards = [...allFlashcards];
        }
        currentCardIndex = Math.max(0, Math.min(currentCardIndex, displayedFlashcards.length - 1));
        if(displayedFlashcards.length === 0 && currentCardIndex !== 0) currentCardIndex = 0; // Ensure index is 0 if no cards displayed

        displayCard();
    }


    function displayCard() {
        flashcardEl.classList.remove('is-flipped'); 

        if (displayedFlashcards.length === 0) {
            cardTitleEl.textContent = "No cards to display";
            cardDefinitionEl.textContent = allFlashcards.length > 0 ? "No matching starred cards. Uncheck filter or star some." : "Upload or paste JSON data above to get started.";
            currentCardNumEl.textContent = 0;
            totalCardNumEl.textContent = allFlashcards.length; 
            starButton.style.display = 'none';
        } else {
            if (currentCardIndex >= displayedFlashcards.length) currentCardIndex = displayedFlashcards.length - 1;
            if (currentCardIndex < 0) currentCardIndex = 0;

            const card = displayedFlashcards[currentCardIndex];
            cardTitleEl.textContent = card.title;
            cardDefinitionEl.textContent = card.definition;
            starButton.style.display = 'block';
            updateStarIcon();
        }
        updateButtonStates();
        updateCardCounter();
    }

    function updateButtonStates() {
        const M = displayedFlashcards.length;
        prevCardBtn.disabled = currentCardIndex === 0 || M <= 1;
        nextCardBtn.disabled = currentCardIndex === M - 1 || M <= 1;
        shuffleCardsBtn.disabled = M <= 1;
        starButton.style.display = M > 0 ? 'block' : 'none';
    }

    function updateStarIcon() {
        if (displayedFlashcards.length > 0 && displayedFlashcards[currentCardIndex]) {
            const currentCardId = displayedFlashcards[currentCardIndex].id;
            if (starredCardIds.has(currentCardId)) {
                starButton.classList.add('starred');
                starIcon.classList.remove('far');
                starIcon.classList.add('fas');
            } else {
                starButton.classList.remove('starred');
                starIcon.classList.remove('fas');
                starIcon.classList.add('far');
            }
        } else {
            starButton.classList.remove('starred');
            starIcon.classList.remove('fas');
            starIcon.classList.add('far');
        }
    }
    
    function updateCardCounter() {
        currentCardNumEl.textContent = displayedFlashcards.length > 0 ? currentCardIndex + 1 : 0;
        totalCardNumEl.textContent = displayedFlashcards.length;
    }

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
        if (displayedFlashcards.length <= 1) return;
        for (let i = displayedFlashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [displayedFlashcards[i], displayedFlashcards[j]] = [displayedFlashcards[j], displayedFlashcards[i]];
        }
        currentCardIndex = 0;
        displayCard();
    }

    function toggleStar() {
        if (displayedFlashcards.length === 0 || !displayedFlashcards[currentCardIndex]) return;

        const currentCardId = displayedFlashcards[currentCardIndex].id;
        if (starredCardIds.has(currentCardId)) {
            starredCardIds.delete(currentCardId);
        } else {
            starredCardIds.add(currentCardId);
        }
        localStorage.setItem('starredFlashcards', JSON.stringify(Array.from(starredCardIds)));
        updateStarIcon();

        if (isShowingStarred && !starredCardIds.has(currentCardId)) {
            updateDisplayedFlashcards(); 
        }
    }
    
    function handleShowStarredToggle() {
        isShowingStarred = showStarredToggle.checked;
        updateDisplayedFlashcards();
    }

    function handleKeyboardNavigation(e) {
        if (e.target === jsonPasteArea) return; 

        if (e.key === "ArrowRight") {
            showNextCard();
        } else if (e.key === "ArrowLeft") {
            showPrevCard();
        } else if (e.key === " " && document.activeElement !== jsonPasteArea) { 
            e.preventDefault(); 
            flipCard();
        } else if (e.key.toLowerCase() === "s" && document.activeElement !== jsonPasteArea) { 
            toggleStar();
        }
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                processAndDisplayCards(e.target.result);
            };
            reader.onerror = () => {
                showMessage("Error reading file.", 'error');
            }
            reader.readAsText(file);
            event.target.value = null; // Reset file input
        }
    }

    function handlePasteLoad() {
        const pastedJson = jsonPasteArea.value.trim();
        if (pastedJson) {
            processAndDisplayCards(pastedJson);
        } else {
            showMessage("Textarea is empty. Paste your JSON data first.", 'info'); // Changed to info
        }
    }

    flashcardEl.addEventListener('click', flipCard);
    nextCardBtn.addEventListener('click', showNextCard);
    prevCardBtn.addEventListener('click', showPrevCard);
    shuffleCardsBtn.addEventListener('click', shuffleDisplayedCards);
    starButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStar();
    });
    showStarredToggle.addEventListener('change', handleShowStarredToggle);
    document.addEventListener('keydown', handleKeyboardNavigation);

    jsonFileUpload.addEventListener('change', handleFileUpload);
    loadPastedJsonBtn.addEventListener('click', handlePasteLoad);

    initializeAppWithDefault();
}); 
