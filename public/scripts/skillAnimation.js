var preferanceDelay = -.5;

const startAnimation = async (entries, observer) => {
    entries.forEach(async entry => {
        if (entry.isIntersecting) {
        entry.target.classList.toggle("skillAnimation", entry.isIntersecting);
        observer.unobserve(entry.target);
        }
    });
};

const observer = new IntersectionObserver(startAnimation);
const options = { root: null, rootMargin: '0px', threshold: 1 };

const elements = document.querySelectorAll('.skill');
elements.forEach(el => {
    observer.observe(el, options);
    el.style.setProperty('--randTime', preferanceDelay + 3 + (Math.random() * 1) + 's');
    preferanceDelay += .1;
});