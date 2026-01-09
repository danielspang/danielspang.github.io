let mediaRecorder;
let audioChunks = [];
let startTime; 
let audioContext;
const recordBtn = document.getElementById('record-btn');
const deckContainer = document.getElementById('deck-container');
const statusText = document.getElementById('status-text');
const emptyMsg = document.getElementById('empty-msg');

// Initialize audio context on first user interaction (iOS requirement)
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }
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

setupAudio();

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
    // Small delay to ensure blob is ready
    setTimeout(() => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay blocked:", error);
                // If autoplay fails, user can still manually play
            });
        }
    }, 100);

    const card = document.createElement('div');
    card.className = 'card';
    
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const durationString = durationInSeconds.toFixed(1) + "s"; 

    card.innerHTML = `
        <div class="card-left">
            <button class="play-btn-mini" title="Tap to play">▶</button>
            <div class="card-info">
                <strong>Audio Clip</strong>
                <span class="meta-data">${timeString} • ${durationString}</span>
            </div>
        </div>
        <button class="delete-btn" aria-label="Delete">×</button>
    `;

    const playBtn = card.querySelector('.play-btn-mini');
    playBtn.addEventListener('click', async () => {
        try {
            audio.currentTime = 0;
            await audio.play();
        } catch (error) {
            console.log("Playback failed:", error);
            // Fallback: try to reload and play
            audio.load();
            setTimeout(async () => {
                try {
                    await audio.play();
                } catch (retryError) {
                    console.log("Retry playback failed:", retryError);
                }
            }, 100);
        }
    });

    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 200);
    });

    const spacer = document.querySelector('.spacer');
    deckContainer.insertBefore(card, spacer);
    
    spacer.scrollIntoView({ behavior: 'smooth' });
}