// ==========================================
// FILTEREN (matchen & discover)
// ==========================================
// Variabelen

const filterButtons = document.querySelectorAll(".genders .filter-btn") //Alleen gender knoppen
const continentButtons = document.querySelectorAll(".continents .filter-btn") // Continent knoppen
const toggleButton = document.getElementById("toggleFilter")
const filterMenu = document.getElementById("filterMenu")
const closeButton = document.getElementById("closeMenu")

const items = document.querySelectorAll(".reizen li") // alle list elementen in de lijst reizen

const dateFilter = document.getElementById("dateFilter")

const birthdaySlider = document.getElementById("birthday")
const birthdayValue = document.getElementById("birthdayValue")

const activeFilters = new Set()      // houdt geselecteerde gender filters bij
const activeContinents = new Set()   // houdt geselecteerde continenten filters bij

const resetButton = document.querySelector(".reset-filters")
const searchInput = document.getElementById("searchInput")
const noResults = document.getElementById("noResults") // het element voor de boodschap

// ==========================================
// Open en close filter menu
// ==========================================

toggleButton.addEventListener("click", () => {
  filterMenu.classList.add("show")
  toggleButton.style.display = "none"
})

closeButton.addEventListener("click", () => {
  filterMenu.classList.remove("show")
  toggleButton.style.display = "block"
})

// ==========================================
// Controle van resultaten
// ==========================================

function checkNoResults() {
  const visibleItems = Array.from(items).filter(item => { //array van list, controleer wat NIET verborgen is
    return item.style.display !== "none"
  })

  noResults.style.display = visibleItems.length === 0 ? "block" : "none" //het tonen of verbergen van afbeelding 'noResults'
}

// ==========================================
// Leeftijd slider
// ==========================================

birthdayValue.textContent = birthdaySlider.value // startwaarde laten zien (18)

birthdaySlider.addEventListener("input", () => {
  birthdayValue.textContent = birthdaySlider.value // realtime nummer updaten
  filterItems() // filter meteen updaten bij slider beweging
})

// ==========================================
// Birthday naar leeftijd
// ==========================================

function calculateAge(birthday) { // hier staat eigenlijk: calculateAge("12-02-2004")
  if (!birthday) return null // geen birthday = geen filtering
  const today = new Date() // geeft de datum van vandaag 
  const birthDate = new Date(birthday) // maakt van een string een echte datum om mee te rekenen

  let age = today.getFullYear() - birthDate.getFullYear() // age = datumvandaag en jaar - geboortedatum en jaar, niet altijd correct dus:
  const month = today.getMonth() - birthDate.getMonth() // berekent of verjaardag nog moet komen (negatieve uitkomst = verjaardag moet nog komen)

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age-- // als verjaardagmaand nog moet komen OF de verjaardagdag moet nog komen, dan wordt er 1 jaar afgetrokken van leeftijd
  }

  return age // geeft berekende leeftijd terug
}

// ==========================================
// Filter functie
// ==========================================

function filterItems() {
  const selectedDate = dateFilter.value //haalt data op uit input
  const selectedAge = parseInt(birthdaySlider.value) // sliderwaarde gebruiken

  items.forEach(item => {
    const gender = item.dataset.gender
    const continent = item.dataset.continent
    const date = item.dataset.date
    const itemBirthday = item.dataset.birthday
    const age = calculateAge(itemBirthday)

    let showItem = true

    // Gender
    if (activeFilters.size > 0 && !activeFilters.has(gender)) showItem = false

    // Continent
    if (activeContinents.size > 0 && !activeContinents.has(continent)) showItem = false

    // Datum filter (alleen vanaf geselecteerde datum)
    if (selectedDate) {
      const selected = new Date(selectedDate)
      const itemDate = new Date(date)
      if (itemDate < selected) showItem = false
    }

    // Leeftijd filter: ±5 jaar marge
    const ageMargin = 5
    if (age !== null && (age < selectedAge - ageMargin || age > selectedAge + ageMargin)) {
      showItem = false
    }

    item.style.display = showItem ? "block" : "none"
  })

  checkNoResults() //laatste check of er resultaten zijn
}

// ==========================================
// Eventlisteners voor de knoppen
// ==========================================

//Gender
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.gender // waarde wordt opgehaald (man/vrouw/anders)

    if (activeFilters.has(filter)) {
      activeFilters.delete(filter) // als filter al actief is -> verwijder filter
      btn.classList.remove("active") // active class wordt verwijderd
    } else {
      activeFilters.add(filter) // filter was nog niet actief -> toevoegen
      btn.classList.add("active") // krijgt active class
    }

    filterItems() // opnieuw filteren
  })
})

//Continenten
continentButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.continent // waarde ophalen

    if (activeContinents.has(filter)) {
      activeContinents.delete(filter) // filter verwijderen
      btn.classList.remove("active")
    } else {
      activeContinents.add(filter) // filter toevoegen
      btn.classList.add("active")
    }

    filterItems() // opnieuw filteren
  })
})

//Datum
dateFilter.addEventListener("change", filterItems) // er wordt opnieuw gefilterd als de datum wordt veranderd

// ==========================================
// Filter reset + eventlisteners
// ==========================================

resetButton.addEventListener("click", () => {
  activeFilters.clear()
  activeContinents.clear()  //Alle actieve buttons verwijderen

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active") //Active class verwijderen (style)
  })

  dateFilter.value = "" //Datum resetten

  birthdaySlider.value = birthdaySlider.min //zet slider weer op de minimale leeftijd (18)
  birthdayValue.textContent = birthdaySlider.min //de text boven de slider ook weer naar 18

  items.forEach(item => item.style.display = "block") // alles zichtbaar maken bij reset

  checkNoResults() //check of alles zichtbaar is, zodat afbeelding 'noResults' verdwijnt
})

// ==========================================
// ZOEKBALK (browsen door reizen)
// ==========================================

searchInput?.addEventListener("input", (event) => { // is er input door de gebruiker, dan het volgende event
  const zoekTerm = event.target.value.toLowerCase() // gebruiker kan in zowel lower als uppercase typen

  items.forEach(li => {
    const titel = li.querySelector(".post-title")?.textContent.toLowerCase() || "" // Haalt de titel op en maakt er kleinletters van OF lege string om fout te voorkomen
    const locatie = li.querySelector(".post-location")?.textContent.toLowerCase() || "" //Hetzelde geldt voor locatie

    if (titel.includes(zoekTerm) || locatie.includes(zoekTerm)) { // Als titel of locatie zoekterm bevat
      li.style.display = "block" //Toon
    } else {
      li.style.display = "none" //Verberg
    }
  })

  checkNoResults() //laatste check of er resultaten zijn
})
