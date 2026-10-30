const navbar = document.getElementById("navbar");
let navbarTop = navbar.getBoundingClientRect().top + window.scrollY;

const updateStickyNavbar = () => {
    navbar.classList.toggle("sticky", window.scrollY >= navbarTop);
};

window.addEventListener("scroll", updateStickyNavbar, { passive: true });
window.addEventListener("resize", () => {
    navbar.classList.remove("sticky");
    navbarTop = navbar.getBoundingClientRect().top + window.scrollY;
    updateStickyNavbar();
});

updateStickyNavbar();