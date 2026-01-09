let mediaRecorder;
let audioChunks = [];
let startTime; 
let audioContext;
let currentlyPlaying = null; // Track currently playing audio
let isInitialized = false; // Track if app is initialized
const recordBtn = document.getElementById('record-btn');
const deckContainer = document.getElementById('deck-container');
const statusText = document.getElementById('status-text');

// Initialize audio context and setup on start button click
async function initializeApp() {
    if (isInitialized) return;
    
    try {
        // Initialize audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        // Setup audio recording
        await setupAudio();
        
        // Switch button to record mode
        recordBtn.classList.remove('start-mode');
        
        isInitialized = true;
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to initialize audio. Please check permissions.');
    }
}

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }
}

// Stop any currently playing audio
function stopCurrentAudio() {
    if (currentlyPlaying && !currentlyPlaying.paused) {
        currentlyPlaying.pause();
        currentlyPlaying.currentTime = 0;
        // Update play button to show play icon
        const playBtn = currentlyPlaying.playButton;
        if (playBtn) {
            playBtn.textContent = '▶';
            playBtn.classList.remove('playing');
        }
    }
    currentlyPlaying = null;
}

async function setupAudio() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Browser does not support audio recording.');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        let options = {};
        // iOS prefers mp4, but fallback to webm for other browsers
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
        }

        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const duration = (Date.now() - startTime) / 1000; 
            createAudioCard(duration);
        };

    } catch (err) {
        console.error('Mic Error:', err);
        alert('Please allow microphone access.');
    }
}

// Event listeners
recordBtn.addEventListener('mousedown', handleButtonPress);
recordBtn.addEventListener('mouseup', handleButtonRelease);
recordBtn.addEventListener('mouseleave', handleButtonRelease);

recordBtn.addEventListener('touchstart', handleButtonPress);
recordBtn.addEventListener('touchend', handleButtonRelease);

// Handle single click for start mode
recordBtn.addEventListener('click', (e) => {
    if (!isInitialized) {
        e.preventDefault();
        // Click is handled by handleButtonPress
    }
});

function handleButtonPress(e) {
    e.preventDefault();
    
    if (!isInitialized) {
        // First click - initialize the app
        initializeApp();
        return;
    }
    
    // Already initialized - start recording
    startRecording(e);
}

function handleButtonRelease() {
    if (!isInitialized) return;
    
    // Stop recording
    stopRecording();
}

function startRecording(e) {
    if (!mediaRecorder) return;
    if (mediaRecorder.state === 'recording') return;

    audioChunks = [];
    startTime = Date.now(); 
    mediaRecorder.start();
    
    recordBtn.classList.add('recording');
    statusText.classList.add('visible');
}

function stopRecording() {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;

    mediaRecorder.stop();

    recordBtn.classList.remove('recording');
    statusText.classList.remove('visible');
}

function createAudioCard(durationInSeconds) {
    const type = (audioChunks[0] && audioChunks[0].type) || 'audio/mp4';
    const blob = new Blob(audioChunks, { type: type });
    const audioUrl = URL.createObjectURL(blob);
    
    const audio = new Audio(audioUrl);
    
    // iOS-friendly audio setup
    audio.preload = 'auto';
    audio.load();
    
    // Since user just interacted (recorded), we can autoplay immediately
    // Stop any currently playing audio first
    stopCurrentAudio();
    
    // Set this as currently playing
    currentlyPlaying = audio;
    
    // Small delay to ensure blob is ready
    setTimeout(() => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay blocked:", error);
                currentlyPlaying = null;
            });
        }
    }, 100);

    const card = document.createElement('div');
    card.className = 'card';
    
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const durationString = durationInSeconds.toFixed(1) + "s"; 

    card.innerHTML = `
        <div class="card-left">
            <button class="play-btn-mini" title="Tap to play/stop">▶</button>
            <div class="card-info">
                <strong>Audio Clip</strong>
                <span class="meta-data">${timeString} • ${durationString}</span>
            </div>
        </div>
        <button class="delete-btn" aria-label="Delete">×</button>
    `;

    const playBtn = card.querySelector('.play-btn-mini');
    
    // Store reference to play button on audio object
    audio.playButton = playBtn;
    
    // Handle play/pause toggle
    playBtn.addEventListener('click', async () => {
        try {
            if (currentlyPlaying === audio && !audio.paused) {
                // Stop current audio
                audio.pause();
                audio.currentTime = 0;
                playBtn.textContent = '▶';
                playBtn.classList.remove('playing');
                currentlyPlaying = null;
            } else {
                // Stop any other playing audio
                stopCurrentAudio();
                
                // Play this audio
                audio.currentTime = 0;
                await audio.play();
                playBtn.textContent = '⏸';
                playBtn.classList.add('playing');
                currentlyPlaying = audio;
            }
        } catch (error) {
            console.log("Playback failed:", error);
            // Fallback: try to reload and play
            audio.load();
            setTimeout(async () => {
                try {
                    await audio.play();
                    playBtn.textContent = '⏸';
                    playBtn.classList.add('playing');
                    currentlyPlaying = audio;
                } catch (retryError) {
                    console.log("Retry playback failed:", retryError);
                }
            }, 100);
        }
    });
    
    // Reset button when audio ends
    audio.addEventListener('ended', () => {
        playBtn.textContent = '▶';
        playBtn.classList.remove('playing');
        if (currentlyPlaying === audio) {
            currentlyPlaying = null;
        }
    });

    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        // Stop audio if it's currently playing
        if (currentlyPlaying === audio) {
            stopCurrentAudio();
        }
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 200);
    });

    const spacer = document.querySelector('.spacer');
    deckContainer.insertBefore(card, spacer);
    
    spacer.scrollIntoView({ behavior: 'smooth' });
}