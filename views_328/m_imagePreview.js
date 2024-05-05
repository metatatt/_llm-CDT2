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
        evalPrompt.style.display = 'block';
        reader.readAsDataURL(file);
    } else {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        evalPrompt.style.display = 'none';
    }
}

export { previewImage };
