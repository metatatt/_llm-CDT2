export function previewImage(input, imagePreviewId) {
    const file = input.files[0];
    const imagePreview = document.getElementById(imagePreviewId);
  
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.src = '#';
      imagePreview.style.display = 'none';
    }
  }
  