import { previewImage } from './previewImage.js';

async function setupSession() {
  const id = "4";
  const htmlContent = `
    <div class="w-full sm:w-1/2 md:w-1/2 lg:w-1/3">
      <div class="w-full">
        <div class="m-4 wow fadeInRight" data-wow-delay="3.5s">
          <div class="flex items-center justify-between">
            <p id="playCount${id}" class="text-gray-600 mb-0">画好了，点击拍照+上传。点击这里:</p>
            <button id="listenButton${id}" class="loadNext btn ml-2" data-wow-delay="3.5s">
              <img src="assets/img/favicon.png" alt="Next">
            </button>
          </div>
          <form id="uploadForm${id}" style="display: none">
            <div class="mb-3">
              <label for="image${id}" class="form-label">- 打开摄像头 -</label>
              <input type="file" id="image${id}" name="image" class="form-control" required accept="image/*">
              <img id="imagePreview${id}" src="#" alt="Image Preview" class="mt-2 img-thumbnail" style="display: none;">
            </div>
          </form>
          <div class="flex justify-center">
            <audio id="audio${id}" class="audioControl" controls hidden></audio>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insert the HTML content dynamically into a specific element, like a content container
  document.dispatchEvent(new CustomEvent('displayContent', { detail: { htmlContent } }));

  // Now, directly add event listeners
  addEventListeners(id);
}

function addEventListeners(id) {
  const listenButton = document.getElementById(`listenButton${id}`);
  const uploadForm = document.getElementById(`uploadForm${id}`);
  const imageInput = document.getElementById(`image${id}`);
  const statusText = document.getElementById(`playCount${id}`);

  listenButton.addEventListener('click', () => {
    listenButton.style.visibility = 'hidden';
    uploadForm.style.display = 'block';
    statusText.innerHTML = '拍照+发送...';
  });

  imageInput.addEventListener('change', async () => {
    previewImage(imageInput, `imagePreview${id}`); // Call previewImage to display the image preview
    const formData = new FormData(uploadForm);
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
        console.log( "😃 我们的分析如下: " , resText)

        document.dispatchEvent(new CustomEvent('loadNextSession', {
          detail: { sessionNum: 5 }  // Move to next session
      }));
  

  } catch (error) {

        console.error('Error calling API:', error);
        console.log( "😃 错误: " , error)

  }
    
  });
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

export { setupSession };

