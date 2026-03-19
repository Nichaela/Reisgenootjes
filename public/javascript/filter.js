// ============
// Variabelen
// ============
const filterButtons = document.querySelectorAll(".genders .filter-btn"); // Alleen gender knoppen
const continentButtons = document.querySelectorAll(".continents .filter-btn"); // Continent knoppen
const toggleButton = document.getElementById("toggleFilter");
const filterMenu = document.getElementById("filterMenu");
const closeButton = document.getElementById("closeMenu");
const items = document.querySelectorAll(".all li");

const dateFilter = document.getElementById("dateFilter");
const daysFilter = document.getElementById("daysFilter");

const birthdaySlider = document.getElementById("birthday");
const birthdayValue = document.getElementById("birthdayValue");

let activeFilters = new Set();       // gender
let activeContinents = new Set();    // continent

// =======================
// Realtime slider update
// =======================
if (birthdaySlider && birthdayValue) {

  birthdayValue.textContent = birthdaySlider.value; // startwaarde laten zien

  birthdaySlider.addEventListener("input", () => {
    birthdayValue.textContent = birthdaySlider.value; // realtime nummer updaten
    filterItems(); // filter meteen updaten bij slider beweging
  });

}
// =======================
// Filter functie
// =======================
function filterItems() {
  const selectedDate = dateFilter.value;
  const selectedAge = birthdaySlider ? parseInt(birthdaySlider.value) : null;

  items.forEach(item => {
    const gender = item.dataset.gender;
    const continent = item.dataset.continent;
    const date = item.dataset.date;
    const itemBirthday = item.dataset.birthday;
    const age = calculateAge(itemBirthday);

    let showItem = true;

    // Gender filter
    if (activeFilters.size > 0 && !activeFilters.has(gender)) showItem = false;

    // Continent filter
    if (activeContinents.size > 0 && !activeContinents.has(continent)) showItem = false;

    // Datum filter (alleen vanaf geselecteerde datum)
    if (selectedDate) {
      const selected = new Date(selectedDate);
      const itemDate = new Date(date);
      if (itemDate < selected) showItem = false;
    }

    // Leeftijd filter
    const ageMargin = 5;
    if (selectedAge !== null && (age < selectedAge - ageMargin || age > selectedAge + ageMargin)) {
      showItem = false;
    }

    item.style.display = showItem ? "block" : "none";
  });
}
// =======================
// Open/close menu
// =======================
toggleButton.addEventListener("click", () => {
  filterMenu.classList.add("show");
  toggleButton.style.display = "none";
});

closeButton.addEventListener("click", () => {
  filterMenu.classList.remove("show");
  toggleButton.style.display = "block";
});


// =======================
// Gender filters
// =======================
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.gender; // waarde wordt opgehaald (man/vrouw/anders)

    if (activeFilters.has(filter)) {
      activeFilters.delete(filter); // als filter al actief is -> verwijder filter
      btn.classList.remove("active"); // active class wordt verwijderd
    } else {
      activeFilters.add(filter); // filter was nog niet actief -> toevoegen
      btn.classList.add("active"); // krijgt active class
    }

    filterItems(); // opnieuw filteren
  });
});


// =======================
// Continent filters
// =======================
continentButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.continent; // waarde ophalen

    if (activeContinents.has(filter)) {
      activeContinents.delete(filter); // filter verwijderen
      btn.classList.remove("active");
    } else {
      activeContinents.add(filter); // filter toevoegen
      btn.classList.add("active");
    }

    filterItems(); // opnieuw filteren
  });
});


// =======================
// Datum & dagen filters
// =======================
dateFilter.addEventListener("change", filterItems); // er wordt opnieuw gefilterd als de datum wordt veranderd
if (daysFilter) {
  daysFilter.addEventListener("input", filterItems);
}


// =======================
// Birthday naar leeftijd berekenen
// =======================
function calculateAge(birthday) { // hier staat eigenlijk: calculateAge("12-02-2004")
  const today = new Date(); // geeft de datum van vandaag 
  const birthDate = new Date(birthday); // maakt van een string een echte datum om mee te rekenen

  let age = today.getFullYear() - birthDate.getFullYear(); // age = datumvandaag en jaar - geboortedatum en jaar, niet altijd correct dus:
  const month = today.getMonth() - birthDate.getMonth(); // berekent of verjaardag nog moet komen (negatieve uitkomst = verjaardag moet nog komen)

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--; // als verjaardagmaand nog moet komen OF de verjaardagdag moet nog komen, dan wordt er 1 jaar afgetrokken van leeftijd
  }

  return age; // geeft berekende leeftijd terug
}