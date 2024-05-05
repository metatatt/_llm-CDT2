function setupSession() {
  const id = "3"
  const htmlContent = `
  <div class="w-full sm:w-1/2 md:w-1/2 lg:w-1/3">
  <div class="m-4 wow fadeInRight" data-wow-delay="2.5s">
      <div class="icon text-5xl">
          <i class="lni lni-layers"></i>
      </div>
      <div>
          <h3 class="service-title">第二步：画图</h3>
          <p class="text-gray-600">准备好笔与纸，按照语音提示去画图。我会说两次。<br><br></p>
      </div>
  </div>
  <div class="w-full">
      <div class="m-4 wow fadeInRight" data-wow-delay="3.5s">
          <div class="flex items-center justify-between">
              <p id ="playCount${id}" class=" text-gray-600 mb-0">点击收听（第1/2次）:</p>
                  <button id="listenButton${id}" class="loadNext btn ml-2" data-wow-delay="3.5s">
                      <img src="assets/img/favicon.png" alt="Next">
              </button>
          </div>
          <div class="flex justify-center">
              <audio id="audio${id}" class="audioControl" controls hidden></audio>
          </div>
      </div>
  </div>
</div>

  `;

  // Dispatch the event to display session content through the main application logic
  document.dispatchEvent(new CustomEvent('displayContent', { detail: { htmlContent } }));

  const listenButton = document.getElementById(`listenButton${id}`);
  const audioElement = document.getElementById(`audio${id}`);
  const statusText = document.getElementById(`playCount${id}`); 

  setupAudioControl(listenButton,audioElement,statusText);  // Function to manage audio controls
}

function setupAudioControl(listenButton,audioElement,statusText) {
  let playCount = 0;
// Ensure this selector accurately targets your <p> tag

  // Update text on initial click and handle audio play
  listenButton.addEventListener('click', async () => {
      console.log('play', playCount);

      if (playCount < 2) {
         listenButton.style.visibility = 'hidden'; // Hide button when playing
         statusText.innerHTML = `加载中 <img src="assets/img/loading_animation.gif" alt="Playing" style="vertical-align: middle;">`;
         playCount++; // Increment the play count after starting playback

          if (playCount === 1) { // Fetch and play audio only on the first play
              await playAudio(audioElement, listenButton, statusText);
          } else {
              audioElement.play();
          }
          console.log('p2', playCount);
      }
  });

  audioElement.addEventListener('play', () => {
    statusText.innerHTML = `播放中（第${playCount}/2次） <img src="/assets/img/waveform.gif" alt="Playing" style="vertical-align: middle;">`;
  });

  // Handle audio completion
  audioElement.addEventListener('ended', () => {
      console.log('ended', playCount);
      if (playCount < 2) {
          listenButton.style.visibility = 'visible'; // Show button again to allow another play
          statusText.textContent = `点击收听（第${playCount+1}/2次）`;
      } else {
          listenButton.style.visibility = 'hidden'; // Keep button hidden after all plays are done
          statusText.textContent = "播放结束";
          document.dispatchEvent(new CustomEvent('loadNextSession', {
              detail: { sessionNum: 4 }  // Move to next session
          }));
      }
  });
}

async function playAudio(audioElement, listenButton, statusText) {
  try {
      audioElement.src = './assets/mp3/drawingInstruction.mp3';
      await audioElement.play();
  } catch (error) {
      console.error('Error fetching audio:', error);
      listenButton.style.visibility = 'visible'; // Make button visible again if fetch fails
      statusText.textContent = "加载失败，请重试";
      // Do not decrement play count here; allow for another try without penalty
  }
}



export { setupSession };