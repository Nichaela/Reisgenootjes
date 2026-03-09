// =======================
// Variabelen & DOM elementen ophalen
// =======================
const filterButtons = document.querySelectorAll(".filter-btn"); // Alle gender knoppen
const toggleButton = document.getElementById("toggleFilter");  // Filter menu toggle knop
const filterMenu = document.getElementById("filterMenu");      // Filter menu container
const closeButton = document.getElementById("closeMenu");      // Sluitknop menu
const items = document.querySelectorAll(".all li");            // Alle lijstitems

const dateFilter = document.getElementById("dateFilter");      // Datum input
const daysFilter = document.getElementById("daysFilter");      // Aantal dagen input

let activeFilters = new Set(); // Houdt bij welke gender filters actief zijn

// =======================
// Functie om items te filteren
// =======================
function filterItems() {
  const selectedDate = dateFilter.value; // Geselecteerde datum
  const selectedDays = daysFilter.value ? parseInt(daysFilter.value) : null; // Minimaal aantal dagen als getal

  items.forEach(item => {
    const itemGender = item.dataset.gender; // Gender van item
    const itemDate = item.dataset.date;     // Datum van item
    const itemDays = parseInt(item.dataset.days); // Aantal dagen van item als getal

    // Controleer gender
    const genderMatch = activeFilters.size === 0 || activeFilters.has(itemGender);
    // Controleer datum
    const dateMatch = !selectedDate || itemDate === selectedDate;
    // Controleer aantal dagen: minimaal aantal dagen
    const daysMatch = !selectedDays || itemDays >= selectedDays;

    // Toon item alleen als alle filters matchen
    item.style.display = (genderMatch && dateMatch && daysMatch) ? "block" : "none";
  });
}

// =======================
// Open/close menu functionaliteit
// =======================
toggleButton.addEventListener("click", () => {
  filterMenu.classList.add("show"); // Menu krijgt class 'show'
  toggleButton.style.display = "none"; // Filter knop verdwijnt
});

closeButton.addEventListener("click", () => {
  filterMenu.classList.remove("show"); // Class 'show' wordt verwijderd
  toggleButton.style.display = "block"; // Filter knop wordt weer zichtbaar
});

// =======================
// Filter functionaliteit voor de gender-knoppen
// =======================
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.gender; // Haal value op van de knop
    const allBtn = document.querySelector('[data-gender="all"]'); // 'All' knop apart ophalen

    // Speciale logica voor "all" knop
    if (filter === "all") {
      if (activeFilters.size === 0) { // Als er geen filters actief zijn
        items.forEach(item => item.style.display = "block"); // Alles zichtbaar
        btn.classList.add("active"); // 'All' knop highlight
      } else { // Als er al filters actief zijn
        activeFilters.clear(); // Alle gender filters uit
        items.forEach(item => item.style.display = "none"); // Items niet zichtbaar
        btn.classList.remove("active"); // 'All' knop highlight weg
      }

      // Haalt active van andere knoppen
      filterButtons.forEach(b => { 
        if (b.dataset.gender !== "all") b.classList.remove("active"); 
      });

      filterItems(); // Pas ook datum/dagen filters toe
      return; // Stop verdere uitvoering voor 'all' knop
    }

    // Toggle actieve gender filter
    if (activeFilters.has(filter)) {
      activeFilters.delete(filter); // Verwijder filter
      btn.classList.remove("active"); // Verwijder highlight
    } else {
      activeFilters.add(filter); // Voeg filter toe
      btn.classList.add("active"); // Highlight knop
    }

    // 'All' knop uitzetten als andere filters actief zijn
    allBtn.classList.remove("active");

    // Pas filters toe op de items
    filterItems();
  });
});

// =======================
// Filter ook als de gebruiker datum of aantal dagen invult
// =======================
dateFilter.addEventListener("change", filterItems); // Datum filter verandert
daysFilter.addEventListener("input", filterItems);  // Aantal dagen filter verandert