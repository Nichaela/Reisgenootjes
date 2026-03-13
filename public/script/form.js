// multipage form verwijderen en tonen pages
document.querySelectorAll(".multi-step-form").forEach(form => {
  const steps = form.querySelectorAll(".form-step")
  let currentStep = 0

  function showStep(index) {
    steps.forEach(step => step.classList.remove("form-active"))
    steps[index].classList.add("form-active")
    updateNextButton(index)
  }

  function updateNextButton(index) {
    const step = steps[index]
    const nextBtn = step.querySelector("[data-next]")
    const inputs = step.querySelectorAll("input[required], select[required], textarea[required]")
  
    if (!nextBtn) return
  
    let allFilled = true
  
    inputs.forEach(input => {
      if (!input.checkValidity()) {
        allFilled = false
      }
    })
  
    // wachtwoord check op eerste stap
    if (allFilled && index === 0) {
      const password = form.querySelector("#password")
      const confirmPassword = form.querySelector("#confirmPassword")
  
      if (password.value.length < 8) {
        allFilled = false
      }
  
      if (password.value !== confirmPassword.value) {
        allFilled = false
      }
    }
  
    nextBtn.disabled = !allFilled
  }

  // controle bij typen of selecteren
  steps.forEach((step, index) => {
    const inputs = step.querySelectorAll("input, select, textarea")
    
    inputs.forEach(input => {
      input.addEventListener("input", () => updateNextButton(index))
      input.addEventListener("change", () => updateNextButton(index))
    })
  })

  form.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep < steps.length - 1) {
        currentStep++
        showStep(currentStep)
      }
    })
  })

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


// Aanmeld form checkbox
const checkboxes = document.querySelectorAll('input[name="interests"]')
const max = 5;

checkboxes.forEach(box => {
  box.addEventListener('change', () => {
    const checked = document.querySelectorAll('input[name="interests"]:checked')
    if (checked.length > max) {
      box.checked = false;
      alert("Je mag maximaal 5 interesses kiezen.")
    }
  });
})
// dropdown menu voor checkboxes (leeftijd)
const dropdown = document.querySelector('.dropdown-checkbox')
const button = dropdown.querySelector('button')

button.addEventListener('click', () => {
  dropdown.classList.toggle('open');
})