var navbar = document.getElementById("navbar");
var navbarReact = navbar.getBoundingClientRect();
var navParent = navbar.parentElement;
var navParentReact = navParent.getBoundingClientRect();

window.addEventListener("scroll", function () {
    // console.log("window: " + window.scrollY + "| nav: " + navbarReact.height);
    // console.log("navParentHeight: " + navParentReact.height);
    if (window.scrollY > navParentReact.height) {
        navbar.classList.add("sticky");
    } else {
        navbar.classList.remove("sticky");
    }
});