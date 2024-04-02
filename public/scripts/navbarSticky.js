var navbar = document.getElementById("navbar");
var navbarReact = document.getElementById("navbar").getBoundingClientRect();

window.addEventListener("scroll", function () {
    if (window.scrollY > window.innerHeight - navbarReact.height) {
        navbar.classList.add("sticky");
    } else {
        navbar.classList.remove("sticky");
    }
});