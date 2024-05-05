async function callAPI(formData) {
    try {
        const response = await fetch('/api', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to call API');

        const resultText = await response.text();
        document.getElementById('feedBack').textContent = "😃 我们的分析如下: " + resultText;
    } catch (error) {
        document.getElementById('feedBack').textContent = 'Error calling API: ' + error;
    }
}

export { callAPI };
