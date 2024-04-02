function updateTitleWithEffect(text, intervalMs, {deletable = false, deleteDelayMs = 2000, callback = null} = {}) {
    let currentText = '';
    let cursorVisible = true;
    let index = 0;
    let isDeleting = false;
    let hasCompleted = false;

    const updateTitle = () => {
        cursorVisible = !cursorVisible;

        if (!isDeleting) {
            if (index < text.length) {
                currentText += text[index++];
            } else if (deletable && !hasCompleted) {
                setTimeout(() => isDeleting = true, deleteDelayMs); // Delay before deleting
                hasCompleted = true;
            }
        } else {
            if (currentText.length > 0) {
                cursorVisible = true;
                currentText = currentText.slice(0, -1);
            } else {
                clearInterval(intervalId); // Stop when deletion completes
                if (callback) callback();
            }
        }
        document.title = currentText + (cursorVisible ? '_' : '');
    };

    const intervalId = setInterval(updateTitle, intervalMs);
}

// Example usage
updateTitleWithEffect("Hello World!", 350, {
    deletable: true,
    deleteDelayMs: 2000,
    callback: () => {
        console.log('Text deletion complete. Ready to set a new title.');
        updateTitleWithEffect("I'm Gavin Collier ", 350);
    }
});