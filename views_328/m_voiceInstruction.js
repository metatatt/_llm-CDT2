let playCount = 0; // Global counter to keep track of how many times the audio has been played

async function voiceInstruction(target, shouldPlay) {
    const num = target.getAttribute('data-num'); // Ensure the target has a 'data-num' attribute for the session number
    const audioElement = document.getElementById(`speech${num}`);

    if (shouldPlay && playCount < 2) {
        try {
            if (playCount === 0) { // Only fetch new audio on the first play
                const response = await fetch('/instructAudio', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({request: num})
                });
                if (!response.ok) throw new Error('Network response was not ok.');
                
                const data = await response.json();
                audioElement.src = data.url;
            }
            
            audioElement.play();
            playCount++;
            target.innerText = `长按-收听 （还剩${2 - playCount}次）`;
        } catch (error) {
            console.error('Error fetching audio:', error);
        }
    } else if (!shouldPlay) {
        audioElement.pause();
        audioElement.currentTime = 0; // Optionally reset the audio to start

        if (playCount >= 2) {
            target.innerText = "收听结束"; // Reset label after two plays
            playCount = 0; // Reset the play count
        }
    }
}

export { voiceInstruction };

