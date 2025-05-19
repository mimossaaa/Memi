document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const uploadPageEl = document.getElementById('uploadPage');
    const flashcardsPageEl = document.getElementById('flashcardsPage');
    const viewFlashcardsBtn = document.getElementById('viewFlashcardsBtn');
    const backToUploadBtn = document.getElementById('backToUploadBtn');

    // Flashcard UI elements
    const cardTitleEl = document.getElementById('cardTitle');
    const cardDefinitionEl = document.getElementById('cardDefinition');
    // Scope selectors to the flashcardsPage to ensure they are unique if similar structures existed elsewhere
    const flashcardEl = document.querySelector('#flashcardsPage .flashcard');
    const prevCardBtn = document.getElementById('prevCard');
    const nextCardBtn = document.getElementById('nextCard');
    const shuffleCardsBtn = document.getElementById('shuffleCards');
    const starButton = document.querySelector('#flashcardsPage .star-button');
    const starIcon = starButton ? starButton.querySelector('i') : null; // Guard starIcon
    const currentCardNumEl = document.getElementById('currentCardNum');
    const totalCardNumEl = document.getElementById('totalCardNum');
    const showStarredToggle = document.getElementById('showStarredToggle');

    // Upload UI elements
    const jsonFileUpload = document.getElementById('jsonFile');
    const jsonPasteArea = document.getElementById('jsonPasteArea');
    const loadPastedJsonBtn = document.getElementById('loadPastedJson');
    const uploadMessageArea = document.getElementById('uploadMessageArea');

    let allFlashcards = [];
    let displayedFlashcards = [];
    let currentCardIndex = 0;
    let starredCardIds = new Set(JSON.parse(localStorage.getItem('starredFlashcards')) || []);
    let isShowingStarred = false;

    // --- Page Navigation ---
    function showPage(pageIdToShow) {
        const pages = document.querySelectorAll('.page-content');
        pages.forEach(page => {
            if (page.id === pageIdToShow) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });

        if (pageIdToShow === 'flashcardsPage') {
            updateDisplayedFlashcards(); // Refresh cards when navigating to this page
        } else if (pageIdToShow === 'uploadPage') {
            // Optionally, clear any lingering flashcard-specific messages or states if needed
        }
    }

    // --- Message Display (targets uploadMessageArea) ---
    function showUploadMessage(text, type = 'info') {
        if (!uploadMessageArea) return;
        uploadMessageArea.textContent = text;
        uploadMessageArea.className = 'message-area'; // Reset classes for this specific message area
        if (type === 'success') uploadMessageArea.classList.add('success');
        else if (type === 'error') uploadMessageArea.classList.add('error');
        else if (type === 'info') uploadMessageArea.classList.add('info');
        
        setTimeout(() => {
            if (uploadMessageArea.textContent === text) { // Only clear if it's still this message
                uploadMessageArea.textContent = '';
                uploadMessageArea.className = 'message-area';
            }
        }, 5000);
    }

    // --- Data Processing ---
    function processAndDisplayCards(jsonDataString) {
        try {
            const parsedData = JSON.parse(jsonDataString);
            if (!Array.isArray(parsedData)) throw new Error("JSON data must be an array.");
            if (parsedData.length > 0) {
                const firstCard = parsedData[0];
                if (typeof firstCard !== 'object' || firstCard === null ||
                    !firstCard.hasOwnProperty('id') || typeof firstCard.id !== 'string' ||
                    !firstCard.hasOwnProperty('title') || typeof firstCard.title !== 'string' ||
                    !firstCard.hasOwnProperty('definition') || typeof firstCard.definition !== 'string') {
                    throw new Error("Card objects must have 'id', 'title', 'definition' (all strings).");
                }
            }
            
            allFlashcards = parsedData;
            currentCardIndex = 0; 
            isShowingStarred = false; // Reset filter when new deck is loaded
            if(showStarredToggle) showStarredToggle.checked = false;


            if (allFlashcards.length > 0) {
                showUploadMessage(`Loaded ${allFlashcards.length} flashcards! Click "View Flashcards".`, 'success');
                if (viewFlashcardsBtn) viewFlashcardsBtn.disabled = false;
            } else {
                showUploadMessage("Loaded an empty set of flashcards.", 'info');
                if (viewFlashcardsBtn) viewFlashcardsBtn.disabled = true;
            }
            if(jsonPasteArea) jsonPasteArea.value = '';

        } catch (error) {
            console.error("Error processing JSON data:", error);
            showUploadMessage(`Invalid JSON: ${error.message}. Check format.`, 'error');
            if (viewFlashcardsBtn) viewFlashcardsBtn.disabled = true;
        }
    }

    // --- Initial App Load ---
    async function initializeAppWithDefault() {
        if (viewFlashcardsBtn) viewFlashcardsBtn.disabled = true; // Disable by default
        try {
            const response = await fetch('flashcards.json');
            if (response.ok) {
                const defaultCardsText = await response.text();
                if (allFlashcards.length === 0) { // Only load if no user data yet
                     processAndDisplayCards(defaultCardsText); 
                     // Message is handled by processAndDisplayCards
                }
            } else {
                 console.warn("Default flashcards.json not found or couldn't be loaded.");
                 if (allFlashcards.length === 0) {
                    showUploadMessage("No default flashcards. Please upload or paste JSON.", "info");
                 }
            }
        } catch (error) {
            console.error("Error loading default flashcards.json:", error);
            if (allFlashcards.length === 0) {
                showUploadMessage("Error loading default data. Upload or paste JSON.", "error");
            }
        }
        showPage('uploadPage'); // Ensure starting on upload page
    }

    // --- Flashcard UI Functions ---
    function updateDisplayedFlashcards() {
        if (isShowingStarred) {
            displayedFlashcards = allFlashcards.filter(card => starredCardIds.has(card.id));
        } else {
            displayedFlashcards = [...allFlashcards];
        }
        currentCardIndex = Math.max(0, Math.min(currentCardIndex, displayedFlashcards.length - 1));
        if(displayedFlashcards.length === 0 && currentCardIndex !== 0) currentCardIndex = 0;
        displayCard();
    }

    function displayCard() {
        if (!flashcardEl || !cardTitleEl || !cardDefinitionEl) return;
        flashcardEl.classList.remove('is-flipped'); 

        if (displayedFlashcards.length === 0) {
            cardTitleEl.textContent = "No Cards Available";
            cardDefinitionEl.textContent = allFlashcards.length === 0 ? "Go back and upload JSON data." : "No cards match current filter.";
            if (currentCardNumEl) currentCardNumEl.textContent = 0;
            if (totalCardNumEl) totalCardNumEl.textContent = allFlashcards.length; 
            if (starButton) starButton.style.display = 'none';
        } else {
            if (currentCardIndex >= displayedFlashcards.length) currentCardIndex = displayedFlashcards.length - 1;
            if (currentCardIndex < 0) currentCardIndex = 0;

            const card = displayedFlashcards[currentCardIndex];
            cardTitleEl.textContent = card.title;
            cardDefinitionEl.textContent = card.definition;
            if (starButton) starButton.style.display = 'block';
            updateStarIcon();
        }
        updateButtonStates();
        updateCardCounter();
    }
    
    function updateButtonStates() {
        if (!prevCardBtn || !nextCardBtn || !shuffleCardsBtn || !starButton) return;
        const M = displayedFlashcards.length;
        prevCardBtn.disabled = currentCardIndex === 0 || M <= 1;
        nextCardBtn.disabled = currentCardIndex === M - 1 || M <= 1;
        shuffleCardsBtn.disabled = M <= 1;
        starButton.style.display = M > 0 ? 'block' : 'none';
    }

    function updateStarIcon() {
        if (!starIcon || !starButton) return;
        if (displayedFlashcards.length > 0 && displayedFlashcards[currentCardIndex]) {
            const currentCardId = displayedFlashcards[currentCardIndex].id;
            if (starredCardIds.has(currentCardId)) {
                starButton.classList.add('starred');
                starIcon.classList.remove('far'); starIcon.classList.add('fas');
            } else {
                starButton.classList.remove('starred');
                starIcon.classList.remove('fas'); starIcon.classList.add('far');
            }
        } else {
            starButton.classList.remove('starred');
            starIcon.classList.remove('fas'); starIcon.classList.add('far');
        }
    }
    
    function updateCardCounter() {
        if (!currentCardNumEl || !totalCardNumEl) return;
        currentCardNumEl.textContent = displayedFlashcards.length > 0 ? currentCardIndex + 1 : 0;
        totalCardNumEl.textContent = displayedFlashcards.length;
    }

    function flipCard() { if (flashcardEl && displayedFlashcards.length > 0) flashcardEl.classList.toggle('is-flipped'); }
    function showNextCard() { if (currentCardIndex < displayedFlashcards.length - 1) { currentCardIndex++; displayCard(); } }
    function showPrevCard() { if (currentCardIndex > 0) { currentCardIndex--; displayCard(); } }
    function shuffleDisplayedCards() {
        if (displayedFlashcards.length <= 1) return;
        for (let i = displayedFlashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [displayedFlashcards[i], displayedFlashcards[j]] = [displayedFlashcards[j], displayedFlashcards[i]];
        }
        currentCardIndex = 0; displayCard();
    }
    function toggleStar() {
        if (!starButton || displayedFlashcards.length === 0 || !displayedFlashcards[currentCardIndex]) return;
        const currentCardId = displayedFlashcards[currentCardIndex].id;
        if (starredCardIds.has(currentCardId)) starredCardIds.delete(currentCardId);
        else starredCardIds.add(currentCardId);
        localStorage.setItem('starredFlashcards', JSON.stringify(Array.from(starredCardIds)));
        updateStarIcon();
        if (isShowingStarred && !starredCardIds.has(currentCardId)) updateDisplayedFlashcards(); 
    }
    function handleShowStarredToggle() { if(showStarredToggle) isShowingStarred = showStarredToggle.checked; updateDisplayedFlashcards(); }
    function handleKeyboardNavigation(e) {
        if (e.target === jsonPasteArea) return; 
        if (flashcardsPageEl && flashcardsPageEl.classList.contains('active')) {
            if (e.key === "ArrowRight") showNextCard();
            else if (e.key === "ArrowLeft") showPrevCard();
            else if (e.key === " " && document.activeElement !== jsonPasteArea) { e.preventDefault(); flipCard(); }
            else if (e.key.toLowerCase() === "s" && document.activeElement !== jsonPasteArea) toggleStar();
        }
    }
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => processAndDisplayCards(e.target.result);
            reader.onerror = () => showUploadMessage("Error reading file.", 'error');
            reader.readAsText(file);
            event.target.value = null; 
        }
    }
    function handlePasteLoad() {
        const pastedJson = jsonPasteArea ? jsonPasteArea.value.trim() : "";
        if (pastedJson) processAndDisplayCards(pastedJson);
        else showUploadMessage("Textarea is empty. Paste JSON data.", 'info');
    }

    // Attach Event Listeners (with null checks for robustness)
    if (viewFlashcardsBtn) viewFlashcardsBtn.addEventListener('click', () => {
        if (allFlashcards.length === 0) {
            showUploadMessage('Please load flashcards first!', 'info');
            return;
        }
        showPage('flashcardsPage');
    });
    if (backToUploadBtn) backToUploadBtn.addEventListener('click', () => showPage('uploadPage'));
    if (flashcardEl) flashcardEl.addEventListener('click', flipCard);
    if (nextCardBtn) nextCardBtn.addEventListener('click', showNextCard);
    if (prevCardBtn) prevCardBtn.addEventListener('click', showPrevCard);
    if (shuffleCardsBtn) shuffleCardsBtn.addEventListener('click', shuffleDisplayedCards);
    if (starButton) starButton.addEventListener('click', (e) => { e.stopPropagation(); toggleStar(); });
    if (showStarredToggle) showStarredToggle.addEventListener('change', handleShowStarredToggle);
    if (jsonFileUpload) jsonFileUpload.addEventListener('change', handleFileUpload);
    if (loadPastedJsonBtn) loadPastedJsonBtn.addEventListener('click', handlePasteLoad);
    document.addEventListener('keydown', handleKeyboardNavigation);

    initializeAppWithDefault(); 
});
