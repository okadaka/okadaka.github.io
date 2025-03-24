// Add this just before the PuzzleGame class definition
const puzzleImages = [
    'images/image1.jpg',
    'images/image2.jpg',
    'images/image3.jpg'
];

class PuzzleGame {
    constructor(imagePath, puzzlePieces = 64) {
        // Handle array of images
        if (Array.isArray(imagePath)) {
            const randomIndex = Math.floor(Math.random() * imagePath.length);
            this.imagePath = imagePath[randomIndex];
            this.allImages = imagePath; // Store all images for potential reuse
        } else {
            this.imagePath = imagePath;
            this.allImages = [imagePath]; // Convert single image to array
        }
        
        // Game configuration
        this.puzzlePieces = puzzlePieces;
        this.gridSize = Math.sqrt(puzzlePieces); // Assuming square grid
        
        // Game state
        this.image = new Image();
        this.pieces = [];
        this.nextPieces = [];
        this.placedPieces = 0;
        this.isDragging = false;
        this.currentPiece = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Sound state
        this.soundsUnlocked = false;
        
        // DOM elements
        this.puzzleArea = document.getElementById('puzzle-area');
        this.piecesContainer = document.getElementById('pieces-container');
        this.winScreen = document.getElementById('win-screen');
        this.playAgainBtn = document.getElementById('play-again');
        
        // Check if DOM elements exist
        if (!this.puzzleArea) console.error("Missing puzzle-area element!");
        if (!this.piecesContainer) console.error("Missing pieces-container element!");
        if (!this.winScreen) console.error("Missing win-screen element!");
        if (!this.playAgainBtn) console.error("Missing play-again button!");
        
        // Sound configuration
        this.initSounds();
        
        // Initialize the game
        this.init();
    }
    
    init() {
        // Log image loading status
        console.log("Starting to load image:", this.imagePath);
        
        this.image.onload = () => {
            console.log("Image loaded successfully!");
            this.createPuzzlePieces();
            this.setupInitialPieces();
            this.setupNextPieces();
            this.setupEventListeners();
        };
        
        this.image.onerror = () => {
            console.error("Failed to load image:", this.imagePath);
            alert("Could not load puzzle image. Please check the image path.");
        };
        
        this.image.src = this.imagePath;
        
        // Setup play again button
        this.playAgainBtn.addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    initSounds() {
        // Define arrays of sounds for each action
        const snapSounds = [
            'sounds/mixkit-correct-answer-tone-2870.wav',
            'sounds/mixkit-gaming-lock-2848.wav',
            'sounds/mixkit-happy-young-girl-2258.wav',
            'sounds/mixkit-hard-pop-click-2364.wav',
            'sounds/mixkit-interface-option-select-2573.wav',
            'sounds/mixkit-long-pop-2358.wav',
            'sounds/mixkit-message-pop-alert-2354.mp3'
        ];
        
        const wrongSounds = [
            'sounds/mixkit-boing-hit-sound-2894.wav',
            'sounds/mixkit-cartoon-character-sneeze-2209.wav',
            'sounds/mixkit-cartoon-fart-sound-2891.wav',
            'sounds/mixkit-cartoon-girl-saying-no-no-no-2257.wav',
            'sounds/mixkit-cartoon-laugh-voice-2882.wav',
            'sounds/mixkit-cartoon-quick-splat-2890.wav',
            'sounds/mixkit-cartoon-sad-party-horn-527.wav',
            'sounds/mixkit-cartoon-strong-fart-3050.wav',
            'sounds/mixkit-cartoon-voice-laugh-343.wav',
            'sounds/mixkit-falling-male-scream-391.wav',
            'sounds/mixkit-funny-cartoon-fast-splat-2889.wav',
            'sounds/mixkit-funny-giggling-2885.wav',
            'sounds/mixkit-funny-system-break-down-2955.wav',
            'sounds/mixkit-kid-giggle-laugh-431.wav',
            'sounds/mixkit-little-boy-gibberish-talk-2260.wav',
            'sounds/mixkit-little-child-sneeze-2211.wav',
            'sounds/mixkit-lost-kid-sobbing-474.wav',
            'sounds/mixkit-sad-game-over-trombone-471.wav',
            'sounds/mixkit-trombone-disappoint-744.wav'
        ];
        
        const winSounds = [
            'sounds/mixkit-ending-show-audience-clapping-478.wav'
        ];
        
        // Create a single Howl instance with all sounds for better mobile handling
        this.allSounds = {
            snap: snapSounds.map(src => new Howl({ 
                src: [src], 
                preload: true,
                html5: true // This is important for iOS
            })),
            wrong: wrongSounds.map(src => new Howl({ 
                src: [src], 
                preload: true,
                html5: true
            })),
            win: winSounds.map(src => new Howl({ 
                src: [src], 
                preload: true,
                html5: true
            }))
        };
        
        // Store sound arrays directly for easy access
        this.snapSounds = this.allSounds.snap;
        this.wrongSounds = this.allSounds.wrong;
        this.winSounds = this.allSounds.win;
    }
    
    createPuzzlePieces() {
        console.log("Creating puzzle pieces...");
        const pieceWidth = this.image.width / this.gridSize;
        const pieceHeight = this.image.height / this.gridSize;
        
        console.log("Image dimensions:", this.image.width, "x", this.image.height);
        console.log("Piece dimensions:", pieceWidth, "x", pieceHeight);
        
        // Determine if we're on iPad or other mobile device
        const isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        // Apply scaling factor for mobile devices
        const scalingFactor = isIPad ? 0.85 : 1.0;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const piece = {
                    id: row * this.gridSize + col,
                    row,
                    col,
                    x: col * pieceWidth,
                    y: row * pieceHeight,
                    width: pieceWidth,
                    height: pieceHeight,
                    scalingFactor: scalingFactor, // Store scaling factor for later use
                    placed: false,
                    element: null
                };
                
                this.pieces.push(piece);
            }
        }
        
        // Shuffle the pieces
        this.shufflePieces();
    }
    
    shufflePieces() {
        // Fisher-Yates shuffle
        for (let i = this.pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.pieces[i], this.pieces[j]] = [this.pieces[j], this.pieces[i]];
        }
    }
    
    setupInitialPieces() {
        // Place 2 random pieces on the board to start
        const initialPieces = [this.pieces[0], this.pieces[1]];
        
        // Make sure they're not adjacent
        while (this.areAdjacent(initialPieces[0], initialPieces[1])) {
            this.shufflePieces();
            initialPieces[0] = this.pieces[0];
            initialPieces[1] = this.pieces[1];
        }
        
        // Place the initial pieces
        initialPieces.forEach(piece => {
            this.placePiece(piece, true);
        });
    }
    
    areAdjacent(piece1, piece2) {
        // Check if two pieces would be adjacent in the final puzzle
        return (
            (Math.abs(piece1.row - piece2.row) === 1 && piece1.col === piece2.col) ||
            (Math.abs(piece1.col - piece2.col) === 1 && piece1.row === piece2.row)
        );
    }
    
    setupNextPieces() {
        // Find 3 pieces that can connect to the currently placed pieces
        const connectablePieces = this.findConnectablePieces();
        
        // Add them to the right panel
        this.nextPieces = connectablePieces.slice(0, 3);
        this.renderNextPieces();
    }
    
    findConnectablePieces() {
        // Find pieces that can connect to the currently placed pieces
        const placedPieceIds = this.pieces
            .filter(p => p.placed)
            .map(p => p.id);
        
        const connectablePieces = [];
        
        for (const piece of this.pieces) {
            if (piece.placed) continue;
            
            // Check if this piece can connect to any placed piece
            for (const placedId of placedPieceIds) {
                const placedPiece = this.pieces.find(p => p.id === placedId);
                
                if (this.areAdjacent(piece, placedPiece)) {
                    connectablePieces.push(piece);
                    break;
                }
            }
        }
        
        // If no connectable pieces are found (shouldn't happen with a valid puzzle),
        // just return some unplaced pieces
        if (connectablePieces.length === 0) {
            return this.pieces.filter(p => !p.placed).slice(0, 3);
        }
        
        return connectablePieces;
    }
    
    renderNextPieces() {
        // Clear the right panel
        this.piecesContainer.innerHTML = '';
        
        // Calculate scale factor to match the pieces in the main puzzle area
        const scale = Math.min(
            this.puzzleArea.clientWidth / this.image.width,
            this.puzzleArea.clientHeight / this.image.height
        ) * 0.9;
        
        const pieceWidth = this.image.width / this.gridSize * scale;
        const pieceHeight = this.image.height / this.gridSize * scale;
        
        // Determine a reasonable width for the pieces in the right panel (80% of panel width)
        const panelWidth = this.piecesContainer.clientWidth;
        const rightPanelScale = Math.min(1, (panelWidth * 0.8) / pieceWidth);
        
        // Add the next pieces
        this.nextPieces.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('next-piece');
            
            // Set size to match the main puzzle area pieces
            pieceElement.style.width = `${pieceWidth * rightPanelScale}px`;
            pieceElement.style.height = `${pieceHeight * rightPanelScale}px`;
            
            // Calculate background position to show the correct part of the image
            const bgSize = this.image.width * scale * rightPanelScale;
            const bgPosX = piece.x * scale * rightPanelScale;
            const bgPosY = piece.y * scale * rightPanelScale;
            
            pieceElement.style.backgroundImage = `url(${this.imagePath})`;
            pieceElement.style.backgroundPosition = `-${bgPosX}px -${bgPosY}px`;
            pieceElement.style.backgroundSize = `${bgSize}px ${bgSize * (this.image.height / this.image.width)}px`;
            
            pieceElement.dataset.id = piece.id;
            
            this.piecesContainer.appendChild(pieceElement);
        });
    }
    
    placePiece(piece, isInitial = false) {
        console.log("Placing piece:", piece.id, "Initial:", isInitial);
        
        // Calculate the actual position in the puzzle area
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust scale based on device
        const deviceAdjustment = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 0.9 : 1.0;
        
        const scale = Math.min(
            (this.puzzleArea.clientWidth / this.image.width) * deviceAdjustment,
            (this.puzzleArea.clientHeight / this.image.height) * deviceAdjustment
        ) * 0.9; // 90% of available space
        
        const puzzleWidth = this.image.width * scale;
        const puzzleHeight = this.image.height * scale;
        
        const offsetX = (this.puzzleArea.clientWidth - puzzleWidth) / 2;
        const offsetY = (this.puzzleArea.clientHeight - puzzleHeight) / 2;
        
        const pieceWidth = piece.width * scale;
        const pieceHeight = piece.height * scale;
        
        const pieceX = piece.col * pieceWidth + offsetX;
        const pieceY = piece.row * pieceHeight + offsetY;
        
        // Create piece element if it doesn't exist
        if (!piece.element) {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('puzzle-piece');
            pieceElement.dataset.id = piece.id;
            pieceElement.style.backgroundImage = `url(${this.imagePath})`;
            pieceElement.style.backgroundSize = `${this.image.width * scale}px ${this.image.height * scale}px`;
            
            piece.element = pieceElement;
            this.puzzleArea.appendChild(pieceElement);
        }
        
        // Update piece properties
        piece.placed = true;
        piece.element.classList.add('snapped');
        piece.element.style.width = `${pieceWidth}px`;
        piece.element.style.height = `${pieceHeight}px`;
        piece.element.style.backgroundPosition = `-${piece.x * scale}px -${piece.y * scale}px`;
        piece.element.style.left = `${pieceX}px`;
        piece.element.style.top = `${pieceY}px`;
        
        this.placedPieces++;
        
        // Play sound except for initial pieces
        if (!isInitial) {
            this.playRandomSound(this.snapSounds);
        }
        
        // Check if the puzzle is complete
        if (this.placedPieces === this.puzzlePieces) {
            this.handleWin();
        } else if (!isInitial) {
            // Update the next pieces
            this.setupNextPieces();
        }
    }
    
    handleWin() {
        // Play win sound
        this.playRandomSound(this.winSounds);
        
        // Show win screen
        setTimeout(() => {
            this.winScreen.classList.remove('hidden');
            
            // Launch confetti
            this.launchConfetti();
        }, 500);
    }
    
    launchConfetti() {
        const confettiContainer = document.getElementById('confetti-container');
        
        // Use confetti.js or your preferred confetti library
        // The implementation below is a placeholder
        const confetti = window.confetti;
        if (confetti) {
            confetti({
                particleCount: 200,
                spread: 160,
                origin: { y: 0.6 }
            });
            
            // Fire multiple bursts
            let count = 0;
            const interval = setInterval(() => {
                confetti({
                    particleCount: 100,
                    spread: 100,
                    origin: { x: Math.random(), y: Math.random() * 0.3 + 0.1 }
                });
                
                count++;
                if (count > 5) clearInterval(interval);
            }, 800);
        }
    }
    
    setupEventListeners() {
        // Mouse events for the puzzle area
        this.puzzleArea.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Touch events for the puzzle area
        this.puzzleArea.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Events for the next pieces container
        this.piecesContainer.addEventListener('mousedown', this.handleNextPieceMouseDown.bind(this));
        this.piecesContainer.addEventListener('touchstart', this.handleNextPieceTouchStart.bind(this), { passive: false });
        
        // Prevent iOS Safari zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Prevent document zooming and scrolling on iOS
        document.addEventListener('touchmove', function(event) {
            if (event.scale !== 1) {
                event.preventDefault();
            }
        }, { passive: false });
        
        // Add new puzzle button if it exists
        const newPuzzleBtn = document.getElementById('new-puzzle-btn');
        if (newPuzzleBtn) {
            newPuzzleBtn.addEventListener('click', () => {
                this.changeToRandomImage();
            });
        }
    }
    
    handleMouseDown(e) {
        const pieceElement = e.target.closest('.puzzle-piece:not(.snapped)');
        if (!pieceElement) return;
        
        const pieceId = parseInt(pieceElement.dataset.id);
        const piece = this.pieces.find(p => p.id === pieceId);
        
        this.startDragging(piece, pieceElement, e.clientX, e.clientY);
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const pieceElement = document.elementFromPoint(touch.clientX, touch.clientY).closest('.puzzle-piece:not(.snapped)');
        if (!pieceElement) return;
        
        const pieceId = parseInt(pieceElement.dataset.id);
        const piece = this.pieces.find(p => p.id === pieceId);
        
        this.startDragging(piece, pieceElement, touch.clientX, touch.clientY);
    }
    
    handleNextPieceMouseDown(e) {
        const pieceElement = e.target.closest('.next-piece');
        if (!pieceElement) return;
        
        const pieceId = parseInt(pieceElement.dataset.id);
        const piece = this.nextPieces.find(p => p.id === pieceId);
        
        this.startDraggingFromPanel(piece, e.clientX, e.clientY);
    }
    
    handleNextPieceTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const pieceElement = document.elementFromPoint(touch.clientX, touch.clientY).closest('.next-piece');
        if (!pieceElement) return;
        
        const pieceId = parseInt(pieceElement.dataset.id);
        const piece = this.nextPieces.find(p => p.id === pieceId);
        
        this.startDraggingFromPanel(piece, touch.clientX, touch.clientY);
    }
    
    startDragging(piece, pieceElement, clientX, clientY) {
        this.isDragging = true;
        this.currentPiece = piece;
        
        // Calculate the drag offset (difference between mouse position and piece top-left corner)
        const rect = pieceElement.getBoundingClientRect();
        this.dragOffset = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
        
        pieceElement.classList.add('dragging');
    }
    
    startDraggingFromPanel(piece, clientX, clientY) {
        // Create a new piece element in the puzzle area
        const pieceElement = document.createElement('div');
        pieceElement.classList.add('puzzle-piece', 'dragging');
        pieceElement.dataset.id = piece.id;
        
        // Calculate scale to match the main puzzle area
        const scale = Math.min(
            this.puzzleArea.clientWidth / this.image.width,
            this.puzzleArea.clientHeight / this.image.height
        ) * 0.9;
        
        const pieceWidth = piece.width * scale;
        const pieceHeight = piece.height * scale;
        
        pieceElement.style.width = `${pieceWidth}px`;
        pieceElement.style.height = `${pieceHeight}px`;
        pieceElement.style.backgroundImage = `url(${this.imagePath})`;
        pieceElement.style.backgroundPosition = `-${piece.x * scale}px -${piece.y * scale}px`;
        pieceElement.style.backgroundSize = `${this.image.width * scale}px ${this.image.height * scale}px`;
        
        // Position the piece at the mouse/touch location with appropriate offset
        const puzzleRect = this.puzzleArea.getBoundingClientRect();
        const x = clientX - puzzleRect.left - pieceWidth / 2;
        const y = clientY - puzzleRect.top - pieceHeight / 2;
        
        pieceElement.style.left = `${x}px`;
        pieceElement.style.top = `${y}px`;
        
        piece.element = pieceElement;
        this.puzzleArea.appendChild(pieceElement);
        
        // Set up dragging state
        this.isDragging = true;
        this.currentPiece = piece;
        this.dragOffset = {
            x: pieceWidth / 2,
            y: pieceHeight / 2
        };
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || !this.currentPiece) return;
        
        // Update the piece position
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        
        this.updateDragPosition(x, y);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging || !this.currentPiece) return;
        
        const touch = e.touches[0];
        const x = touch.clientX - this.dragOffset.x;
        const y = touch.clientY - this.dragOffset.y;
        
        this.updateDragPosition(x, y);
    }
    
    updateDragPosition(x, y) {
        // Convert to relative position in the puzzle area
        const puzzleRect = this.puzzleArea.getBoundingClientRect();
        const relativeX = x - puzzleRect.left;
        const relativeY = y - puzzleRect.top;
        
        this.currentPiece.element.style.left = `${relativeX}px`;
        this.currentPiece.element.style.top = `${relativeY}px`;
    }
    
    handleMouseUp(e) {
        if (!this.isDragging || !this.currentPiece) return;
        
        this.checkPiecePlacement(e.clientX, e.clientY);
    }
    
    handleTouchEnd(e) {
        if (!this.isDragging || !this.currentPiece) return;
        
        // Use the last touch position
        const lastTouch = e.changedTouches[0];
        this.checkPiecePlacement(lastTouch.clientX, lastTouch.clientY);
    }
    
    checkPiecePlacement(clientX, clientY) {
        const puzzleRect = this.puzzleArea.getBoundingClientRect();
        const rightPanelRect = this.piecesContainer.getBoundingClientRect();
        
        // If the piece is dropped in the right panel, return it
        if (
            clientX > rightPanelRect.left && 
            clientX < rightPanelRect.right &&
            clientY > rightPanelRect.top && 
            clientY < rightPanelRect.bottom
        ) {
            this.returnPieceToPanel();
            return;
        }
        
        // If the piece is dropped in the puzzle area, check if it's near its correct position
        if (
            clientX > puzzleRect.left && 
            clientX < puzzleRect.right &&
            clientY > puzzleRect.top && 
            clientY < puzzleRect.bottom
        ) {
            // Calculate the actual position in the puzzle area
            const scale = Math.min(
                this.puzzleArea.clientWidth / this.image.width,
                this.puzzleArea.clientHeight / this.image.height
            ) * 0.9;
            
            const puzzleWidth = this.image.width * scale;
            const puzzleHeight = this.image.height * scale;
            
            const offsetX = (this.puzzleArea.clientWidth - puzzleWidth) / 2;
            const offsetY = (this.puzzleArea.clientHeight - puzzleHeight) / 2;
            
            const pieceWidth = this.currentPiece.width * scale;
            const pieceHeight = this.currentPiece.height * scale;
            
            const correctX = this.currentPiece.col * pieceWidth + offsetX;
            const correctY = this.currentPiece.row * pieceHeight + offsetY;
            
            // Get current position relative to puzzle area
            const currentX = parseFloat(this.currentPiece.element.style.left);
            const currentY = parseFloat(this.currentPiece.element.style.top);
            
            // Check if piece is near its correct position (within snapDistance)
            const snapDistance = 50; // Increased snap distance
            if (
                Math.abs(currentX - correctX) < snapDistance &&
                Math.abs(currentY - correctY) < snapDistance
            ) {
                // Snap the piece to the correct position
                this.placePiece(this.currentPiece);
            } else {
                // If not near the correct position, return the piece to the panel
                this.returnPieceToPanel();
            }
        } else {
            // If dropped outside both panels, return the piece to the panel
            this.returnPieceToPanel();
        }
        
        // Reset dragging state
        this.isDragging = false;
        if (this.currentPiece && this.currentPiece.element) {
            this.currentPiece.element.classList.remove('dragging');
        }
        this.currentPiece = null;
    }
    
    returnPieceToPanel() {
        // If the piece was from the panel, remove it from the puzzle area
        if (this.currentPiece && this.currentPiece.element && !this.currentPiece.placed) {
            this.puzzleArea.removeChild(this.currentPiece.element);
            this.currentPiece.element = null;
            
            // Play wrong placement sound
            this.playRandomSound(this.wrongSounds);
        }
    }
    
    resetGame() {
        // Clear the puzzle area
        this.puzzleArea.innerHTML = '';
        
        // Reset game state
        this.pieces.forEach(piece => {
            piece.placed = false;
            piece.element = null;
        });
        this.placedPieces = 0;
        this.nextPieces = [];
        
        // Shuffle the pieces
        this.shufflePieces();
        
        // Setup initial and next pieces
        this.setupInitialPieces();
        this.setupNextPieces();
        
        // Hide win screen
        this.winScreen.classList.add('hidden');
    }
    
    // Helper method to play a random sound from an array
    playRandomSound(soundsArray) {
        if (soundsArray.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * soundsArray.length);
        soundsArray[randomIndex].play();
    }
    
    // Add a method to change to a new random image
    changeToRandomImage() {
        // Choose a different image than the current one
        let availableImages = this.allImages.filter(img => img !== this.imagePath);
        
        // If no other images available, use the current one
        if (availableImages.length === 0) {
            availableImages = this.allImages;
        }
        
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        this.imagePath = availableImages[randomIndex];
        
        // Reset and restart the game with the new image
        this.resetGame();
    }
}

// Create confetti.js script
const confettiScript = document.createElement('script');
confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
document.head.appendChild(confettiScript);

// Initialize the game when the page is loaded
window.addEventListener('load', () => {
    // Pass the entire array to the game constructor
    const game = new PuzzleGame(puzzleImages, 64);
}); 