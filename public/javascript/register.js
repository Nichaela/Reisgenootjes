// ==============================
// CUSTOM VALIDATIE VOOR REGISTRATIE
// ==============================
window.customStepValidation = function (form, index) {
    // Alleen checken op de eerste stap
    if (index !== 0) return true

    const password = form.querySelector('input[name="password"]')
    const confirmPassword = form.querySelector('input[name="confirmPassword"]')

    if (!password || !confirmPassword) return true

    // Minimaal 8 tekens
    if (password.value.length < 8) {
        password.setCustomValidity("Wachtwoord moet minimaal 8 tekens bevatten")
        password.reportValidity()
        password.setCustomValidity("")
        return false
    }

    // Wachtwoorden komen overeen?
    if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity("Wachtwoorden komen niet overeen")
        confirmPassword.reportValidity()
        confirmPassword.setCustomValidity("")
        return false
    }

    return true
}

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

        inputs.forEach(input => {
            if (!input.checkValidity()) {
                allValid = false;
                input.reportValidity();
            }
        });

        // Extra custom validatie indien aanwezig
        if (allValid && typeof window.customStepValidation === "function") {
            allValid = window.customStepValidation(form, index)
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
const toggles = document.querySelectorAll('.toggle-password')

toggles.forEach(toggle => {
    toggle.addEventListener('click', function () {
        const wrapper = this.parentElement
        const input = wrapper.querySelector('input')
        const img = this.querySelector('img')

        if (input.type === 'password') {
            input.type = 'text'
            img.src = 'img/Eye.svg'
        } else {
            input.type = 'password'
            img.src = 'img/Eyeclose.svg'
        }
    })
})

function previewImage(inputId) {
    const input = document.getElementById(inputId)
    const preview = document.getElementById('preview-' + inputId)

    if (input.files && input.files[0]) {
        const reader = new FileReader()
        reader.onload = function(e) {
            preview.src = e.target.result
            preview.hidden = false
        }
        reader.readAsDataURL(input.files[0])
    }
}

['profileImg','image1','image2','image3'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => previewImage(id))
})