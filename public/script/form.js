// ==========================================
// MULTI-STEP FORM
// ==========================================
document.querySelectorAll(".multi-step-form").forEach(form => {
  const steps = form.querySelectorAll(".form-step")
  let currentStep = 0

  function showStep(index) {
    steps.forEach(step => step.classList.remove("form-active"))
    steps[index].classList.add("form-active")
  }

  // Controleer of alle required inputs geldig zijn
  function validateStep(index) {
    const step = steps[index]
    const inputs = step.querySelectorAll("input[required], select[required], textarea[required]")
    let allValid = true

    inputs.forEach(input => {
      if (!input.checkValidity()) {
        allValid = false
        input.reportValidity() // browser toont foutmelding
      }
    })

    // Password check alleen als de velden ook écht bestaan
  if (allValid && index === 0) {
    const password = form.querySelector('input[name="password"]')
    const confirmPassword = form.querySelector('input[name="confirmPassword"]')

    if (password && confirmPassword) { // ← null-check toegevoegd
      if (password.value.length < 8) {
        allValid = false
        password.setCustomValidity("Wachtwoord moet minimaal 8 tekens bevatten")
        password.reportValidity()
        password.setCustomValidity("")
      }

      if (password.value !== confirmPassword.value) {
        allValid = false
        confirmPassword.setCustomValidity("Wachtwoorden komen niet overeen")
        confirmPassword.reportValidity()
        confirmPassword.setCustomValidity("")
      }
    }
  }

    return allValid
  }

  // Volgende knop
  form.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!validateStep(currentStep)) return; // stop als niet geldig
      if (currentStep < steps.length - 1) {
        currentStep++
        showStep(currentStep)
      }
    })
  })

  // Vorige knop
  form.querySelectorAll("[data-prev]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--
        showStep(currentStep)
      }
    })
  })

  showStep(currentStep)
})

// ==========================================
// CHECKBOX LIMIT (max 5 interesses)
// ==========================================
const checkboxes = document.querySelectorAll('input[name="interests"]')
const max = 5

checkboxes.forEach(box => {
  box.addEventListener('change', () => {
    const checked = document.querySelectorAll('input[name="interests"]:checked')
    if (checked.length > max) {
      box.checked = false
      alert(`Je mag maximaal ${max} interesses kiezen.`)
    }
  })
})

// ==========================================
// DROPDOWN MENU (leeftijd of opties)
// ==========================================
const dropdowns = document.querySelectorAll('.dropdown-checkbox')
dropdowns.forEach(dropdown => {
  const button = dropdown.querySelector('button')
  if (!button) return

  button.addEventListener('click', () => {
    dropdown.classList.toggle('open')
  })
})


// ==========================================
// FILTEREN (matchen & discover)
// ==========================================
// Variabelen

const filterButtons = document.querySelectorAll(".genders .filter-btn") //Alleen gender knoppen
const continentButtons = document.querySelectorAll(".continents .filter-btn") // Continent knoppen
const toggleButton = document.getElementById("toggleFilter")
const filterMenu = document.getElementById("filterMenu")
const closeButton = document.getElementById("closeMenu")

let items; //aanmaken van een variabele
if (document.querySelectorAll(".reizen li").length > 0) { //zoekt alle list items in de reizen lijst, length controleert of er minstens 1 in de lijst staat
  items = document.querySelectorAll(".reizen li") // zo ja, items wordt alle list elementen in de lijst reizen
} else if (document.querySelectorAll(".match-card").length > 0) { //als  er geen reizen lijst is, maar wel minstens 1 match card
  items = document.querySelectorAll(".match-card") // zo ja, items wordt alle match card elementen
}

const dateFilter = document.getElementById("dateFilter")

const birthdaySlider = document.getElementById("birthday")
const birthdayValue = document.getElementById("birthdayValue")

let activeFilters = new Set()      // houdt geselecteerde gender filters bij
let activeContinents = new Set()   // houdt geselecteerde continenten filters bij


// ==========================================
// Open en close menu
// ==========================================

toggleButton.addEventListener("click", () => {
  filterMenu.classList.add("show")
  toggleButton.style.display = "none"
});

closeButton.addEventListener("click", () => {
  filterMenu.classList.remove("show")
  toggleButton.style.display = "block"
})


// ==========================================
// Controle van resultaten
// ==========================================

function checkNoResults() {
  const allItems = document.querySelectorAll(".reizen li") //alle reizen elementen worden geselecteerd
  const visibleItems = Array.from(allItems).filter(item => { //er wordt een array gemaakt van de list
    return item.style.display !== "none"
  })

  noResults.style.display = visibleItems.length === 0 ? "block" : "none"
}


// ==========================================
// Leeftijd slider
// ==========================================

if (birthdaySlider && birthdayValue) {

  birthdayValue.textContent = birthdaySlider.value // startwaarde laten zien

  birthdaySlider.addEventListener("input", () => {
    birthdayValue.textContent = birthdaySlider.value // realtime nummer updaten
    filterItems() // filter meteen updaten bij slider beweging
  })

}


// ==========================================
// Filter functie
// ==========================================

function filterItems() {
  const selectedDate = dateFilter.value //haalt data op uit input
  const selectedAge = birthdaySlider ? parseInt(birthdaySlider.value) : null

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

    // Leeftijd
    const ageMargin = 5
    if (selectedAge !== null && (age < selectedAge - ageMargin || age > selectedAge + ageMargin)) {
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
// Birthday naar leeftijd
// ==========================================

function calculateAge(birthday) { // hier staat eigenlijk: calculateAge("12-02-2004")
  const today = new Date() // geeft de datum van vandaag 
  const birthDate = new Date(birthday) // maakt van een string een echte datum om mee te rekenen

  let age = today.getFullYear() - birthDate.getFullYear() // age = datumvandaag en jaar - geboortedatum en jaar, niet altijd correct dus:
  const month = today.getMonth() - birthDate.getMonth() // berekent of verjaardag nog moet komen (negatieve uitkomst = verjaardag moet nog komen)

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--; // als verjaardagmaand nog moet komen OF de verjaardagdag moet nog komen, dan wordt er 1 jaar afgetrokken van leeftijd
  }

  return age; // geeft berekende leeftijd terug
}


// ==========================================
// Filter reset + eventlisteners
// ==========================================

const resetButton = document.querySelector(".reset-filters")

resetButton.addEventListener("click", () => {
  activeFilters.clear()
  activeContinents.clear()  //Alle actieve buttons verwijderen

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active") //Active class verwijderen (style)
  })

  if (dateFilter) dateFilter.value = "" //Datum resetten

  if (birthdaySlider) { //Kijkt of leeftijd slider bestaat op de pagina
    birthdaySlider.value = birthdaySlider.min; //zet slider weer op de minimale leeftijd (18)
    birthdayValue.textContent = birthdaySlider.min; //de text boven de slider ook weer naar 18
  }

  filterItems() //Alles weer zichtbaar maken
})


// ==========================================
// ZOEKBALK (browsen door reizen)
// ==========================================

const searchInput = document.getElementById("searchInput")
const reizen = document.querySelectorAll(".reizen li")
const noResults = document.getElementById("noResults") // het element voor de boodschap

searchInput?.addEventListener("input", (event) => { // is er input door de gebruiker, dan het volgende event
  const zoekTerm = event.target.value.toLowerCase() // gebruiker kan in zowel lower als uppercase typen

  reizen.forEach(li => {
    const titel = li.querySelector(".post-title")?.textContent.toLowerCase() || "" // Haalt de titel op en maakt er kleinletters van OF lege string om fout te voorkomen
    const locatie = li.querySelector(".post-location")?.textContent.toLowerCase() || "" //Hetzelde geldt voor locatie

    if (titel.includes(zoekTerm) || locatie.includes(zoekTerm)) { // Als titel of locatie zoekterm bevat
      li.style.display = "block" //Toon
    } else {
      li.style.display = "none" //Verberg
    }
  })

  checkNoResults() //laatste check of er resultaten zijn
});

// Oogje om wachtwoord zichtbaar te maken
function togglePassword(fieldId, eyeSpan) {
  const input = document.getElementById(fieldId)
  const img = eyeSpan.querySelector('img')

  if (input.type === 'password') {
    input.type = 'text'
    img.src = 'img/Eyeclose.svg' // wissel naar gesloten oog
  } else {
    input.type = 'password'
    img.src = 'img/Eye.svg' // terug naar open oog
  }
}
