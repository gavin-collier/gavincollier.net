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
            } else if (!hasCompleted) {
                setTimeout(() => isDeleting = true, deleteDelayMs); // Delay before deleting
                hasCompleted = true;
                if (!deletable){
                    clearInterval(intervalId);
                }
            }
        } else {
            cursorVisible = true;
            if (currentText.length > 0) {
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