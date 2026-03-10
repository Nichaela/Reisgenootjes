// ============
// Variabelen
// ============
const filterButtons = document.querySelectorAll(".filter-btn"); // Alle gender knoppen
const toggleButton = document.getElementById("toggleFilter");  // Filter menu toggle knop
const filterMenu = document.getElementById("filterMenu");      // Filter menu container
const closeButton = document.getElementById("closeMenu");      // Sluitknop menu
const items = document.querySelectorAll(".all li");            // Alle lijstitems

const dateFilter = document.getElementById("dateFilter");      // Datum input
const daysFilter = document.getElementById("daysFilter");      // Aantal dagen input

let activeFilters = new Set(); // Houdt bij welke gender filters actief zijn


// =======================
// Filter functie
// =======================
function filterItems() {
  const selectedDate = dateFilter.value; // datum filter
  const selectedDays = daysFilter.value ? parseInt(daysFilter.value) : null; // Zet string om naar getal

  items.forEach(item => {
    const gender = item.dataset.gender;
    const date = item.dataset.date;
    const days = parseInt(item.dataset.days);

    // Check of dit item aan alle filters voldoet
    let showItem = true;

    // Gender filter controleren
    if (activeFilters.size > 0 && !activeFilters.has(gender)) { 
      // Deze regel doet niks als er geen filter geselecteerd is
      showItem = false; // als gender niet bij activeFilters zit (dus niet geselecteerd), item verbergen
    }

    // Datum filter controleren
    if (selectedDate && date !== selectedDate) {
      showItem = false;
    }

    // Dagen filter (minimaal aantal dagen)
    if (selectedDays !== null && days < selectedDays) {
      showItem = false;
    }

    // Toon of verberg item
    item.style.display = showItem ? "block" : "none";
  });
}


// =======================
// Open/close menu 
// =======================
toggleButton.addEventListener("click", () => {
  filterMenu.classList.add("show"); // Menu krijgt class 'show'
  toggleButton.style.display = "none"; // Filter knop verdwijnt
});

closeButton.addEventListener("click", () => {
  filterMenu.classList.remove("show"); // Class 'show' wordt verwijderd
  toggleButton.style.display = "block"; // Filter knop weer zichtbaar
});


// =======================
// Gender filters
// =======================
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.gender; // Haal value op van de knop
    const allBtn = document.querySelector('[data-gender="all"]'); // 'All' knop apart ophalen

    // Speciale logica voor "all" knop
    if (filter === "all") {
      activeFilters.clear(); // Reset alle gender filters
      filterButtons.forEach(b => b.classList.remove("active")); // Haal highlight van alle knoppen
      btn.classList.add("active"); // Highlight 'All' knop
    } else {
      // Toggle actieve gender filter
      if (activeFilters.has(filter)) {
        activeFilters.delete(filter); // Verwijder filter
        btn.classList.remove("active"); // Verwijder highlight
      } else {
        activeFilters.add(filter); // Voeg filter toe
        btn.classList.add("active"); // Highlight knop
      }
      allBtn.classList.remove("active"); // Zet 'All' uit als andere filters actief zijn
    }

    // Pas filters toe op items
    filterItems();
  });
});


// =======================
// Datum & dagen filters
// =======================
dateFilter.addEventListener("change", filterItems); // Datum filter verandert
daysFilter.addEventListener("input", filterItems);  // Aantal dagen filter verandert