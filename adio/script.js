let mediaRecorder;
let audioChunks = [];
let startTime; 
let audioContext;
let currentlyPlaying = null; // Track currently playing audio
const recordBtn = document.getElementById('record-btn');
const deckContainer = document.getElementById('deck-container');
const statusText = document.getElementById('status-text');
const emptyMsg = document.getElementById('empty-msg');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const mainContent = document.getElementById('main-content');

// Initialize audio context and setup on start button click
async function initializeApp() {
    try {
        // Initialize audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        // Setup audio recording
        await setupAudio();
        
        // Hide start screen and show main content
        startScreen.style.display = 'none';
        mainContent.style.display = 'flex';
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to initialize audio. Please check permissions.');
    }
}

// Initialize audio context on first user interaction (iOS requirement)
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
startBtn.addEventListener('click', initializeApp);

function startRecording(e) {
    e.preventDefault(); 
    
    // Initialize audio context on user gesture (iOS requirement)
    initAudioContext();
    
    if (!mediaRecorder) return;
    if (mediaRecorder.state === 'recording') return;

    audioChunks = [];
    startTime = Date.now(); 
    mediaRecorder.start();
    
    recordBtn.classList.add('recording');
    statusText.classList.add('visible');
    if(emptyMsg) emptyMsg.style.display = 'none';
}

function stopRecording(e) {
    if (e) e.preventDefault();
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;

    mediaRecorder.stop();

    recordBtn.classList.remove('recording');
    statusText.classList.remove('visible');
}

recordBtn.addEventListener('mousedown', startRecording);
recordBtn.addEventListener('mouseup', stopRecording);
recordBtn.addEventListener('mouseleave', stopRecording);

recordBtn.addEventListener('touchstart', startRecording);
recordBtn.addEventListener('touchend', stopRecording);

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