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
// JOIN REIS CHECK MELDING
// ==========================================
const joinForm = document.querySelector('form[action*="join"]')

if (joinForm) {
  joinForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const res = await fetch(joinForm.action, {
      method: 'POST',
    })

    if (res.ok) {
      window.location.href = joinForm.action.replace('/join', '')
    } else {
      const text = await res.text()
      alert(text)
    }
  })
}


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
