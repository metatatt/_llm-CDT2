let state = 0; // global counter

function previewImage(input) {
  const imagePreview = document.getElementById('imagePreview');
  const evalPrompt = document.getElementById('evalPrompt');
  const file = input.files[0];

  if (file) {
      const reader = new FileReader();

      reader.onload = function(e) {
          imagePreview.src = e.target.result;
          imagePreview.style.display = 'block';
      };
      evalPrompt.style.display='block'
      reader.readAsDataURL(file);
  } else {
      imagePreview.src = '#';
      imagePreview.style.display = 'none';
  }
}

async function instructAudio(num) {
    const response = await fetch('/instructAudio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' // This specifies that the body of the request is JSON.
        },
        body: JSON.stringify({request: num}) // Make sure to stringify the body.
    });
    console.log('resp: ',response)

    if (response.ok) {
        const data = await response.json(); // Ensure this is inside the 'ok' check
        const audioElement = document.getElementById(`speech${num}`);
        audioElement.src = ''; // Reset source before setting a new one
        audioElement.src = data.url;
        audioElement.hidden = false;

        audioElement.onended = () => {
            updateState(1);
            audioElement.hidden = true;
            console.log('Audio playback ended and state updated.');
        };

        audioElement.play().then(() => {
            // Handle audio play successfully started
            console.log('Audio playback started');
        }).catch((error) => {
            // Handle audio play start failure
            console.error('Error playing audio:', error);
        });

    } else {
        console.error('Failed to generate audio:', data.message);
    }
}


async function callAPI() {
  document.getElementById('feedBack').textContent = "--"
  const references = document.getElementById('references');
  const feedBackZone = document.getElementById('feedBackZone');
  feedBackZone.style.display='block'
  const evalPrompt = document.getElementById('evalPrompt');
  evalPrompt.style.display='none'
  const form = document.getElementById('apiForm');
  const formData = new FormData(form);

  // Get the original image file from FormData
  const originalImageFile = formData.get('image');

  try {
      // Reduce image size to 800px height by 600px width
      const reducedImageFile = await reduceImageSize(originalImageFile);
      // Update FormData with the reduced image file
      formData.set('image', reducedImageFile);

      const response = await fetch('/api', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to call API');
        }

        const resText = await response.text();
        
        // Display the result
        document.getElementById('feedBack').textContent = "😃 我们的分析如下: " + resText;
        references.style.display='block';
        updateState(1)

  } catch (error) {

        console.error('Error calling API:', error);
        document.getElementById('feedBack').textContent = 'Error calling API';

  }
}

async function reduceImageSize(imageFile) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');

              // Reduce image size to 800px height by 600px width
              const maxWidth = 600;
              const maxHeight = 800;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                  if (width > maxWidth) {
                      height *= maxWidth / width;
                      width = maxWidth;
                  }
              } else {
                  if (height > maxHeight) {
                      width *= maxHeight / height;
                      height = maxHeight;
                  }
              }

              canvas.width = width;
              canvas.height = height;

              // Draw image on canvas
              ctx.drawImage(img, 0, 0, width, height);

              // Convert canvas to blob
              canvas.toBlob((blob) => {
                  resolve(new File([blob], imageFile.name, { type: 'image/jpeg' }));
              }, 'image/jpeg');
          };

          img.onerror = reject;
          img.src = event.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
  });
}


async function updateState(newState) {
    state = state+newState;  // Ensure 'state' is declared appropriately (global or passed)
    console.log("State updated to:", state);

    const divChapters = document.getElementById("Chapters");

    try {
        const response = await fetch(`./assets/js/chapter${state}.txt`);
        const htmlContent = await response.text();
        const divScript = document.createElement("div"); // Create a new div to hold the HTML

        // Set the innerHTML of the div to the fetched HTML content
        divScript.innerHTML = htmlContent;

        // Append the new div to the parent container
        divChapters.appendChild(divScript);
    } catch (error) {
        console.error('Failed to fetch chapter:', error);
    }
}

window.addEventListener('load', function() {
    updateState(1); // Increment state when page loads
});

document.addEventListener('DOMContentLoaded', function() {
    setupAudioVisuals();
    setupClickListeners();
});

function setupAudioVisuals() {
    const audios = document.querySelectorAll('[id^="speech"]');
    audios.forEach(audio => {
        const visualId = `${audio.id}_visual`;
        const visual = document.getElementById(visualId);

        audio.addEventListener('play', () => {
            visual.style.display = 'flex';
        });
        audio.addEventListener('pause', () => {
            visual.style.display = 'none';
        });
        audio.addEventListener('ended', () => {
            visual.style.display = 'none';
            updateState(1); // Ensure this function exists and is accessible in this scope
        });
    });
}


function setupClickListeners() {
    document.addEventListener('click', function(event) {
        if (event.target.tagName === 'BUTTON') {
           // event.target.style.display = 'none';
        }
    });
}


document.getElementById('talkButton').addEventListener('pointerdown', startRecording);
document.getElementById('talkButton').addEventListener('pointerup', stopRecording);
document.getElementById('talkButton').addEventListener('pointerleave', stopRecording); // Optional: stops recording if the pointer leaves the button

var recognition = new webkitSpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

function startRecording(event) {
    // Prevents mouse events from firing if the event is from a touch input
    if (event.pointerType === 'touch') {
        event.preventDefault();
    }
    recognition.start();
    console.log("Recording started");
}

function stopRecording(event) {
    if (event.pointerType === 'touch') {
        event.preventDefault();
    }
    recognition.stop();
    console.log("Recording stopped");
}

recognition.onresult = function(event) {
    var speechResult = event.results[0][0].transcript;
    console.log('Recognized speech:', speechResult);
    processSpeech(speechResult);
};

function processSpeech(inputText) {
    fetch('/generateResponse', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({text: inputText}),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Generated response:', data.reply);
        speak(data.reply);
    });
}

function speak(text) {
    var utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}

document.addEventListener('DOMContentLoaded', () => {
    const voiceCommand = new VoiceCommand();

    const talkButton = document.getElementById('talkButton');
    talkButton.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' || event.pointerType === 'touch') {
            voiceCommand.start();  // Start recognition when button is held
            console.log("Recognition started");
        }
    });

    talkButton.addEventListener('pointerup', () => {
        voiceCommand.recognition.stop();  // Stop recognition when button is released
        console.log("Recognition stopped");
    });
});

export class VoiceCommand {
    constructor() {
        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
        this.phrases = ['check', 'check again'];
        this.recognition = new this.SpeechRecognition();
        this.setupRecognition();
    }

    setupRecognition() {
        if (this.SpeechGrammarList) {
            const speechRecognitionList = new this.SpeechGrammarList();
            const grammar = '#JSGF V1.0; grammar phrases; public <phrase> = ' + this.phrases.join(' | ') + ' </phrase>;';
            speechRecognitionList.addFromString(grammar, 1);
            this.recognition.grammars = speechRecognitionList;
        }
        this.recognition.continuous = true;
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        this.recognition.onresult = this.handleResults.bind(this);
        this.recognition.onnomatch = () => console.log("I didn't recognize that command.");
        this.recognition.onerror = (event) => console.log('Error occurred in recognition: ', event.error);
        this.recognition.onend = () => {
            console.log("SessionEnd restarting: ");
            this.start();  // Automatically restart recognition
        };
    }

    handleResults(event) {
        let phrase = event.results[event.results.length - 1][0].transcript;
        console.log('listen->', phrase);
        if (phrase.includes('check')) {
            const voiceEvent = new Event('voiceCommandCheck');
            window.dispatchEvent(voiceEvent);
        }
        console.log('Confidence-> ' + event.results[event.results.length - 1][0].confidence);
    }

    start() {
        this.recognition.start();
    }
}
