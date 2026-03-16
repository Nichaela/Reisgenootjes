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
birthdayValue.textContent = birthdaySlider.value; // startwaarde laten zien
birthdaySlider.addEventListener("input", () => {
  birthdayValue.textContent = birthdaySlider.value; // realtime nummer updaten
  filterItems(); // filter meteen updaten bij slider beweging
});

// =======================
// Filter functie
// =======================
function filterItems() {
  const selectedDate = dateFilter.value; //datum wordt uit inputveld gehaald
  const selectedDays = daysFilter.value ? parseInt(daysFilter.value) : null; //maakt van het ingevoerde getal (string) een getal
  const selectedAge = birthdaySlider.value ? parseInt(birthdaySlider.value) : null; // leeftijd uit slider

  items.forEach(item => {
    const gender = item.dataset.gender; //data uit html halen
    const continent = item.dataset.continent; 
    const date = item.dataset.date;
    const days = parseInt(item.dataset.days); //hetzelfde, maar omzetten string naar getal

    const itemBirthday = item.dataset.birthday; // birthday van item
    const age = calculateAge(itemBirthday); // bereken leeftijd

    let showItem = true; //standaard = item laten zien, kan later veranderen naar false

    if (activeFilters.size > 0 && !activeFilters.has(gender)) showItem = false; //als er een filter is geselecteerd EN het item hoort niet bij het filter = verberg item
    if (activeContinents.size > 0 && !activeContinents.has(continent)) showItem = false;
    if (selectedDate && date !== selectedDate) showItem = false; //als een datum is gekozen EN datum van item is anders = verberg item
    if (selectedDays !== null && days < selectedDays) showItem = false; //als er datum is gekozen EN item heeft minder dagen = verberg item
    
    const ageMargin = 5; // marge van 10 jaar
    if (selectedAge !== null && (age < selectedAge - ageMargin || age > selectedAge + ageMargin)) {
      showItem = false;
    } //controle of er leeftijd is ingevuld EN komt de leeftijd van item overeen met ingoerde leeftijd

    item.style.display = showItem ? "block" : "none"; //bij showitem -> display block & bij else -> display none
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
daysFilter.addEventListener("input", filterItems); // er wordt opnieuw gefilterd als de dagen wordt veranderd


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