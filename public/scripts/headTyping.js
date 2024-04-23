function animatedTitle(...texts) {
    if (texts.length === 0) return;

    let currentText = 0;
    let isDeleting = false;
    let displayText = '';
    let textIndex = 0;
    const cursor = '_';
    const typingSpeed = 250;    

    let cursorVisible = true;
    let blinkTimeout;

    function blinkCursor() {
        cursorVisible = !cursorVisible;
        updateTitle();
        blinkTimeout = setTimeout(blinkCursor, 250);
    }

    function updateTitle() {
        document.title = displayText + (cursorVisible ? cursor : '');
    }

    function typeText() {
        if (isDeleting) {
            if (textIndex > 0) {
                textIndex--;
                displayText = texts[currentText].substring(0, textIndex);
                updateTitle();
                setTimeout(typeText, 100);
            } else {
                isDeleting = false;
                currentText++;
                if (currentText >= texts.length) {
                    clearTimeout(blinkTimeout);
                    document.title = displayText; 
                    return;
                }
                setTimeout(typeText, typingSpeed);
            }
        } else {
            if (textIndex < texts[currentText].length) {
                displayText += texts[currentText][textIndex];
                textIndex++;
                updateTitle();
                setTimeout(typeText, typingSpeed);
            } else {
                if (currentText < texts.length - 1) {
                    setTimeout(() => {
                        isDeleting = true;
                        textIndex = texts[currentText].length;
                        typeText();
                    }, 2000);
                } else {
                    clearTimeout(blinkTimeout); 
                    cursorVisible = false;
                    updateTitle();
                }
            }
        }
    }

    blinkCursor(); 
    typeText();    
}