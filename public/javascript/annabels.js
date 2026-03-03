// Selecteer de lijst en knoppen
const ul = document.querySelector("ul");
const filterButtons = document.querySelectorAll(".filter-btn");
const toggleButton = document.getElementById("toggleFilter");
const filterMenu = document.querySelector(".filter-menu");

// Toggle dropdown menu bij klikken op de filter-knop
toggleButton.addEventListener("click", () => {
  filterMenu.classList.toggle("show");
});

// Filter functionaliteit
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;

    // Filteren van de lijst
    ul.className = "";
    ul.classList.add(filter);

    // Active class instellen
    filterButtons.forEach(b => b.classList.remove("active")); // verwijder active van andere buttons
    btn.classList.add("active");                             // voeg active toe aan geklikte button
  });
});