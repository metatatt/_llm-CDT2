import { displaySession } from './assets/js/common.js';
import { setupSession as setupSession1 } from './assets/js/session1.js';
import { setupSession as setupSession2 } from './assets/js/session2.js';

let currentSession = 1; // Track the current session state
const totalSessions = 6;  // Assuming there are 6 sessions

document.addEventListener('DOMContentLoaded', () => {
    setupSession1();  // Initialize the first session
});

// Listening for a custom event to display session content
document.addEventListener('displayContent', (e) => {
    displaySession(e.detail.htmlContent);
});

// Listening for a custom event to handle session changes
document.addEventListener('loadNextSession', (e) => {
    console.log('sessionChanged',currentSession)
    const sessionNum = e.detail.sessionNum;
    switch (sessionNum) {
        case 1:
            setupSession1();
            break;
        // Assuming setupSession2, setupSession3, etc., are defined similarly in their respective modules
        case 2:
            setupSession2();
            break;
        case 3:
            setupSession3();
            break;
        case 4:
            setupSession4();
            break;
        case 5:
            setupSession5();
            break;
        case 6:
            setupSession6();
            break;
        default:
            console.log('Session number out of range');
            break;
    }
});
