let mediaRecorder;
let audioChunks = [];
let startTime; 
const recordBtn = document.getElementById('record-btn');
const deckContainer = document.getElementById('deck-container');
const statusText = document.getElementById('status-text');
const emptyMsg = document.getElementById('empty-msg');

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
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus' };
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
    audio.autoplay = true; 
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Autoplay blocked:", error);
        });
    }

    const card = document.createElement('div');
    card.className = 'card';
    
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const durationString = durationInSeconds.toFixed(1) + "s"; 

    card.innerHTML = `
        <div class="card-left">
            <button class="play-btn-mini">▶</button>
            <div class="card-info">
                <strong>Audio Clip</strong>
                <span class="meta-data">${timeString} • ${durationString}</span>
            </div>
        </div>
        <button class="delete-btn" aria-label="Delete">×</button>
    `;

    const playBtn = card.querySelector('.play-btn-mini');
    playBtn.addEventListener('click', () => {
        audio.currentTime = 0;
        audio.play();
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