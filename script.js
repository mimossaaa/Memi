document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const uploadPageEl = document.getElementById('uploadPage');
    const flashcardsPageEl = document.getElementById('flashcardsPage');
    const viewFlashcardsBtn = document.getElementById('viewFlashcardsBtn');
    const backToUploadBtn = document.getElementById('backToUploadBtn');

    // Flashcard UI elements (ensure these are correctly scoped if they move)
    const cardTitleEl = document.getElementById('cardTitle');
    const cardDefinitionEl = document.getElementById('cardDefinition');
    const flashcardEl = document.querySelector('#flashcardsPage .flashcard'); // Scope to flashcardsPage
    const prevCardBtn = document.getElementById('prevCard');
    const nextCardBtn = document.getElementById('nextCard');
    const shuffleCardsBtn = document.getElementById('shuffleCards');
    const starButton = document.querySelector('#flashcardsPage .star-button'); // Scope
    const starIcon = starButton.querySelector('i');
    const currentCardNumEl = document.getElementById('currentCardNum');
    const totalCardNumEl = document.getElementById('totalCardNum');
    const showStarredToggle = document.getElementById('showStarredToggle');

    // Upload UI elements
    const jsonFileUpload = document.getElementById('jsonFile');
    const jsonPasteArea = document.getElementById('jsonPasteArea');
    const loadPastedJsonBtn = document.getElementById('loadPastedJson');
    const uploadMessageArea = document.getElementById('uploadMessageArea'); // Updated ID


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
                // Add 'leaving' class to others for exit animation (optional)
                // For simplicity, just remove active and add to target
                page.classList.remove('leaving'); // Ensure no leaving state
                page.classList.add('active');
            } else {
                if (page.classList.contains('active')) {
                    page.classList.add('leaving'); // Add leaving class for exit animation
                    // Remove active class after transition (or immediately if no exit anim)
                    // Using setTimeout for a simple fade-out before display:none from .active removal
                    // This part is tricky with pure CSS transitions from display:flex to display:none
                    // A simpler approach is to just rely on the entry animation of the new page.
                    page.classList.remove('active');
                }
                // page.classList.remove('active');
            }
        });

        // If navigating to flashcards, refresh display
        if (pageIdToShow === 'flashcardsPage') {
            updateDisplayedFlashcards(); // Ensure cards are up-to-date
        }
    }


    // --- Message Display (targets uploadMessageArea) ---
    function showMessage(text, type = 'info') {
        uploadMessageArea.textContent = text;
        uploadMessageArea.className = 'message-area'; // Reset classes
        if (type === 'success') {
            uploadMessageArea.classList.add('success');
        } else if (type === 'error') {
            uploadMessageArea.classList.add('error');
        } else if (type === 'info') {
            uploadMessageArea.classList.add('info');
        }
        
        setTimeout(() => {
            if (uploadMessageArea.textContent === text) {
                uploadMessageArea.textContent = '';
                uploadMessageArea.className = 'message-area';
            }
        }, 5000);
    }

    // --- Data Processing and Display ---
    function processAndDisplayCards(jsonDataString) {
        try {
            const parsedData = JSON.parse(jsonDataString);
            // ... (rest of validation logic remains the same)
            if (!Array.isArray(parsedData)) {
                throw new Error("JSON data must be an array of flashcard objects.");
            }
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
            // updateDisplayedFlashcards(); // Called when navigating to flashcards page or by initializeAppWithDefault

            if (allFlashcards.length > 0) {
                showMessage(`Successfully loaded ${allFlashcards.length} flashcards! You can now view them.`, 'success');
                viewFlashcardsBtn.disabled = false; // Enable button if cards are loaded
            } else {
                showMessage("Loaded an empty set of flashcards. Add data to your JSON.", 'info');
                viewFlashcardsBtn.disabled = true; // Disable if no cards
            }
            jsonPasteArea.value = '';

        } catch (error) {
            console.error("Error processing JSON data:", error);
            showMessage(`Invalid JSON data: ${error.message}. Please check format and content.`, 'error');
            viewFlashcardsBtn.disabled = true; // Disable on error
        }
    }

    // --- Initial App Load ---
    async function initializeAppWithDefault() {
        try {
            const response = await fetch('flashcards.json');
            if (response.ok) {
                const defaultCardsText = await response.text();
                if (allFlashcards.length === 0) { // Only load if no user data yet
                     processAndDisplayCards(defaultCardsText); // This will call showMessage
                     // showMessage("Loaded default flashcards. You can upload your own.", "info"); // Redundant
                }
            } else {
                 console.warn("Default flashcards.json not found or couldn't be loaded.");
                 if (allFlashcards.length === 0) {
                    showMessage("No default flashcards found. Please upload or paste your JSON data.", "info");
                    viewFlashcardsBtn.disabled = true;
                 }
            }
        } catch (error) {
            console.error("Error loading default flashcards.json:", error);
            if (allFlashcards.length === 0) {
                showMessage("Error loading default data. Please upload or paste your JSON.", "error");
                viewFlashcardsBtn.disabled = true;
            }
        }
        // Initial page setup
        showPage('uploadPage'); // Start on upload page
        // displayCard(); // No, this should only happen on flashcardsPage
        // updateButtonStates(); // These are for flashcard controls
        // updateCardCounter();
    }

    // --- Flashcard UI Functions (largely the same, but ensure correct element scope) ---
    function updateDisplayedFlashcards() {
        // ... (same logic)
        if (isShowingStarred) {
            displayedFlashcards = allFlashcards.filter(card => starredCardIds.has(card.id));
            if (displayedFlashcards.length === 0 && allFlashcards.length > 0 && flashcardsPageEl.classList.contains('active')) {
                // If on flashcards page and no starred cards, show a message there
                // This is now implicitly handled by displayCard's "No cards to display" logic
            }
        } else {
            displayedFlashcards = [...allFlashcards];
        }
        currentCardIndex = Math.max(0, Math.min(currentCardIndex, displayedFlashcards.length - 1));
        if(displayedFlashcards.length === 0 && currentCardIndex !== 0) currentCardIndex = 0;

        displayCard();
    }

    function displayCard() {
        if (!flashcardEl) return; // In case this is called when flashcardsPage isn't fully ready (should not happen)
        flashcardEl.classList.remove('is-flipped'); 

        if (displayedFlashcards.length === 0) {
            cardTitleEl.textContent = "No Cards Available";
            if (allFlashcards.length === 0) {
                cardDefinitionEl.textContent = "Go back to upload JSON data.";
            } else if (isShowingStarred) {
                cardDefinitionEl.textContent = "No starred cards match. Uncheck filter or star some cards.";
            } else {
                 cardDefinitionEl.textContent = "Something went wrong. Try reloading data."; // Fallback
            }
            currentCardNumEl.textContent = 0;
            totalCardNumEl.textContent = allFlashcards.length; 
            if (starButton) starButton.style.display = 'none';
        } else {
            // ... (rest of displayCard logic is the same) ...
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
    
    // ... (updateButtonStates, updateStarIcon, updateCardCounter, flipCard, etc. remain the same) ...
    // Ensure all DOM manipulations inside these functions target elements within #flashcardsPage if they were global before.
    // For example, flashcardEl, starButton already scoped. Buttons like prevCardBtn are fine as IDs are unique.

    function updateButtonStates() {
        if (!prevCardBtn) return; // Guard for elements not on current page
        const M = displayedFlashcards.length;
        prevCardBtn.disabled = currentCardIndex === 0 || M <= 1;
        nextCardBtn.disabled = currentCardIndex === M - 1 || M <= 1;
        shuffleCardsBtn.disabled = M <= 1;
        if (starButton) starButton.style.display = M > 0 ? 'block' : 'none';
    }

    function updateStarIcon() {
        if (!starIcon || !starButton) return;
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
        if (!currentCardNumEl || !totalCardNumEl) return;
        currentCardNumEl.textContent = displayedFlashcards.length > 0 ? currentCardIndex + 1 : 0;
        totalCardNumEl.textContent = displayedFlashcards.length;
    }

    function flipCard() {
        if (flashcardEl && displayedFlashcards.length > 0) {
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
        if (!starButton || displayedFlashcards.length === 0 || !displayedFlashcards[currentCardIndex]) return;

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

        // Only apply flashcard keyboard nav if on flashcards page
        if (flashcardsPageEl.classList.contains('active')) {
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
            event.target.value = null; 
        }
    }

    function handlePasteLoad() {
        const pastedJson = jsonPasteArea.value.trim();
        if (pastedJson) {
            processAndDisplayCards(pastedJson);
        } else {
            showMessage("Textarea is empty. Paste your JSON data first.", 'info');
        }
    }

    // --- Attach Event Listeners ---
    // Page navigation
    viewFlashcardsBtn.addEventListener('click', () => {
        if (allFlashcards.length === 0) {
            showMessage('Please load some flashcards first!', 'info');
            return;
        }
        showPage('flashcardsPage');
    });
    backToUploadBtn.addEventListener('click', () => showPage('uploadPage'));

    // Flashcard interactions (ensure these are only active/relevant on flashcards page)
    if (flashcardEl) flashcardEl.addEventListener('click', flipCard); // Guarding
    if (nextCardBtn) nextCardBtn.addEventListener('click', showNextCard);
    if (prevCardBtn) prevCardBtn.addEventListener('click', showPrevCard);
    if (shuffleCardsBtn) shuffleCardsBtn.addEventListener('click', shuffleDisplayedCards);
    if (starButton) starButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStar();
    });
    if (showStarredToggle) showStarredToggle.addEventListener('change', handleShowStarredToggle);
    
    document.addEventListener('keydown', handleKeyboardNavigation);

    // Upload interactions
    jsonFileUpload.addEventListener('change', handleFileUpload);
    loadPastedJsonBtn.addEventListener('click', handlePasteLoad);

    // --- Initialize ---
    initializeAppWithDefault(); 
});
