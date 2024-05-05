// m_voiceChat.js
export function setupVoiceChat() {
    const talkButton = document.getElementById('talkButton');
    let mediaRecorder;
    let audioChunks = [];

    talkButton.addEventListener('pointerdown', async () => {
        if (!mediaRecorder) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
                mediaRecorder.onstart = () => document.getElementById('feedBack').textContent = "Recording...";
                mediaRecorder.start();
            } catch (err) {
                console.error('Error accessing the microphone:', err);
                document.getElementById('feedBack').textContent = "Failed to access microphone. Please allow access.";
            }
        }
    });

    talkButton.addEventListener('pointerup', () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            document.getElementById('feedBack').textContent = "Processing...";
        }
    });

    talkButton.addEventListener('pointerleave', () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            document.getElementById('feedBack').textContent = "Processing...";
        }
    });

    mediaRecorder?.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        fetch('/speech-to-text', { method: 'POST', body: formData })
            .then(response => response.text())
            .then(transcriptionText => {
                document.getElementById('feedBack').textContent = "Transcription: " + transcriptionText;
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('feedBack').textContent = "Error processing your speech.";
            });

        // Reset the recorder and chunks for the next recording
        audioChunks = [];
        mediaRecorder = null;
    };
}
