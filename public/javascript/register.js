// ==============================
// INIT REGISTRATIE FORM
// ==============================
document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector(".multi-step-form")
    if (!form) return // Stop als geen form aanwezig
  
    const steps = form.querySelectorAll(".form-step")
    let currentStep = 0
  
    // ==============================
    // FUNCTIE: Toon huidige stap
    // ==============================
    function showStep(index) {
      steps.forEach(step => step.classList.remove("form-active"))
      steps[index].classList.add("form-active")
    }
  
    // ==============================
    // FUNCTIE: Validatie van stap
    // ==============================
    function validateStep(index) {
      const step = steps[index]
      const inputs = step.querySelectorAll("input[required], select[required], textarea[required]")
      let allValid = true
  
      //Required veld check
      inputs.forEach(input => {
        if (!input.checkValidity()) {
          allValid = false;
          input.reportValidity();
        }
      });
  
      // Password checks (alleen stap 0)
      if (allValid && index === 0) {
        const password = form.querySelector('input[name="password"]')
        const confirmPassword = form.querySelector('input[name="confirmPassword"]')
  
        if (password && confirmPassword) {
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
  
    // ==============================
    // LIVE PASSWORD CHECK
    // ==============================
    const passwordInput = document.getElementById("password")
    const confirmPasswordInput = document.getElementById("confirmPassword")
    const passwordError = document.getElementById("passwordError")
  
    function checkPasswordsLive() {
      if (!passwordInput || !confirmPasswordInput || !passwordError) return
  
      if (confirmPasswordInput.value === "") {
        passwordError.textContent = ""
        return
      }
  
      passwordError.textContent =
        passwordInput.value !== confirmPasswordInput.value
          ? "Wachtwoorden komen niet overeen"
          : ""
    }
  
    passwordInput?.addEventListener("input", checkPasswordsLive)
    confirmPasswordInput?.addEventListener("input", checkPasswordsLive)
  
    // ==============================
    // LIVE EMAIL CHECK
    // ==============================
    const emailInput = document.getElementById("email")
    const emailError = document.getElementById("emailError")
  
    function checkEmailLive() {
      if (!emailInput || !emailError) return
  
      if (emailInput.value === "") {
        emailError.textContent = "Email is verplicht"
        return
      }
  
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      emailError.textContent = !emailPattern.test(emailInput.value)
        ? "Ongeldig e-mailadres"
        : ""
    }
  
    emailInput?.addEventListener("input", checkEmailLive)
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