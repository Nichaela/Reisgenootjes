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

    // Password check op eerste stap
    if (allValid && index === 0) {
      const password = form.querySelector('input[name="password"]')
      const confirmPassword = form.querySelector('input[name="confirmPassword"]')

      if (password.value.length < 8) {
        allValid = false
        password.setCustomValidity("Wachtwoord moet minimaal 8 tekens bevatten")
        password.reportValidity()
        password.setCustomValidity("") // reset na tonen
      }

      if (password.value !== confirmPassword.value) {
        allValid = false
        confirmPassword.setCustomValidity("Wachtwoorden komen niet overeen")
        confirmPassword.reportValidity()
        confirmPassword.setCustomValidity("") // reset
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
// ZOEKBALK (browsen door reizen)
// ==========================================

const searchInput = document.getElementById("searchInput");
const reizen = document.querySelectorAll(".reizen li");
const noResults = document.getElementById("noResults"); // het element voor de boodschap

searchInput?.addEventListener("input", (event) => { // is er input door de gebruiker --> dan het volgende event
  const zoekTerm = event.target.value.toLowerCase(); // gebruiker kan in zowel lower als uppercase typen
  let anyResults = false; // houdt bij of er een match is

  reizen.forEach(li => {
    const titel = li.querySelector(".post-title")?.textContent.toLowerCase() || ""; // Haalt de titel op en maakt er kleinletters van OF lege string om fout te voorkomen
    const locatie = li.querySelector(".post-location")?.textContent.toLowerCase() || "";

    // als titel of locatie zoekterm bevat, toon item, anders verberg
    if (titel.includes(zoekTerm) || locatie.includes(zoekTerm)) {
      li.style.display = "block";
      anyResults = true; // er is minstens één match
    } else {
      li.style.display = "none";
    }
  });

  // als er geen resultaten zijn, laat boodschap zien, anders verberg
  noResults.style.display = anyResults ? "none" : "block";
});

