// hamburger menu
const deButton = document.querySelector("header button");
const deNav = document.querySelector("header nav");


deButton.onclick = toggleMenu;

function toggleMenu () {
  deButton.classList.toggle("is-open");
  deNav.classList.toggle("is-open");
}
