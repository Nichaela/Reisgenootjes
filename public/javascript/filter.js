// ==========================================
// FILTEREN (matchen & discover)
// ==========================================

// Variabelen
const continentButtons = document.querySelectorAll(".continents .filter-btn") // Continent knoppen
const toggleButton = document.getElementById("toggleFilter")
const filterMenu = document.getElementById("filterMenu")
const closeButton = document.getElementById("closeMenu")

const items = document.querySelectorAll(".trips li") // alle list elementen in de lijst reizen

const dateFilter = document.getElementById("dateFilter")

const birthdaySlider = document.getElementById("birthday")
const birthdayValue = document.getElementById("birthdayValue")

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
  const visibleItems = Array.from(items).filter(item => { // array van list, controleer wat NIET verborgen is
    return item.style.display !== "none"
  })

  noResults.style.display = visibleItems.length === 0 ? "block" : "none" // tonen/verbergen van 'noResults'
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

function calculateAge(birthday) { 
  if (!birthday) return null // geen birthday = geen filtering
  const today = new Date() 
  const birthDate = new Date(birthday) 

  let age = today.getFullYear() - birthDate.getFullYear() 
  const month = today.getMonth() - birthDate.getMonth() 

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age-- 
  }

  return age 
}

// ==========================================
// Filter functie
// ==========================================

function filterItems() {
  const selectedDate = dateFilter.value 
  const selectedAge = parseInt(birthdaySlider.value) 

  items.forEach(item => {
    const continent = item.dataset.continent?.toLowerCase().trim()
    const date = item.dataset.date
    const itemBirthday = item.dataset.birthday
    const age = calculateAge(itemBirthday)

    let showItem = true

    // ----------------------
    // Continent filter
    // ----------------------
    if (activeContinents.size > 0 && !activeContinents.has(continent)) {
      showItem = false
    }

    // ----------------------
    // Datum filter (alleen vanaf geselecteerde datum)
    // ----------------------
    if (selectedDate) {
      const selected = new Date(selectedDate)
      const itemDate = new Date(date)
      if (itemDate < selected) showItem = false
    }

    // ----------------------
    // Leeftijd filter: ±5 jaar marge
    // ----------------------
    const ageMargin = 5
    if (age !== null && (age < selectedAge - ageMargin || age > selectedAge + ageMargin)) {
      showItem = false
    }

    // Toepassen van zichtbaar/onzichtbaar
    item.style.display = showItem ? "block" : "none"
  })

  checkNoResults() 
}

// ==========================================
// Eventlisteners voor de knoppen
// ==========================================

//Continenten
continentButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.continent?.toLowerCase().trim() 

    if (activeContinents.has(filter)) {
      activeContinents.delete(filter) 
      btn.classList.remove("active")
    } else {
      activeContinents.add(filter) 
      btn.classList.add("active")
    }

    filterItems() 
  })
})

//Datum
dateFilter.addEventListener("change", filterItems) 

// ==========================================
// Filter reset + eventlisteners
// ==========================================

resetButton.addEventListener("click", () => {
  activeContinents.clear() 

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active") 
  })

  dateFilter.value = "" 

  birthdaySlider.value = birthdaySlider.min 
  birthdayValue.textContent = birthdaySlider.min 

  items.forEach(item => item.style.display = "block") 

  checkNoResults() 
})

// ==========================================
// ZOEKBALK (browsen door reizen)
// ==========================================

searchInput?.addEventListener("input", (event) => { 
  const zoekTerm = event.target.value.toLowerCase() 

  items.forEach(li => {
    const titel = li.querySelector(".post-title")?.textContent.toLowerCase() || "" 
    const locatie = li.querySelector(".post-location")?.textContent.toLowerCase() || "" 

    if (titel.includes(zoekTerm) || locatie.includes(zoekTerm)) { 
      li.style.display = "block" 
    } else {
      li.style.display = "none" 
    }
  })

  checkNoResults() 
})
