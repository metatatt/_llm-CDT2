// common.js
function displaySession(htmlContent) {
    const sessionsBlock = document.getElementById("sessionsBlock");
    if (sessionsBlock) {
        // Append the new HTML content at the end of the sessionsBlock
        sessionsBlock.insertAdjacentHTML('beforeend', '<hr><hr>'+htmlContent);
    } else {
        console.error('Failed to find the session block element');
    }
}


function registerButtonEvents(totalSessions) {
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('loadNext')) {
            // Increment session and handle wrapping
            window.currentSession = (window.currentSession % totalSessions) + 1;
            console.log("Current Session:", window.currentSession);

            // Dispatch the session change event
            document.dispatchEvent(new CustomEvent('sessionChange', { detail: { sessionNum: window.currentSession } }));

            // Assuming button ID corresponds to a div ID that needs to be hidden
            const divToHide = document.getElementById(target.id);
            if (divToHide) {
                divToHide.style.display = 'none';
            }
        }
    });
}




export { displaySession, registerButtonEvents };
