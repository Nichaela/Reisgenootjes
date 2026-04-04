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
// INIT NA LADEN VAN DE PAGINA
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    // LIVE WACHTWOORD CHECK
    const passwordInput = document.getElementById("password")
    const confirmPasswordInput = document.getElementById("confirmPassword")
    const passwordError = document.getElementById("passwordError")

    function checkPasswordsLive() {
        if (!passwordInput || !confirmPasswordInput || !passwordError) return

        if (confirmPasswordInput.value === "") {
            passwordError.textContent = ""
            return
        }

        if (passwordInput.value.length < 8) {
            passwordError.textContent = "Wachtwoord moet minimaal 8 tekens bevatten"
            return
        }

        passwordError.textContent =
            passwordInput.value !== confirmPasswordInput.value
                ? "Wachtwoorden komen niet overeen"
                : ""
    }

    passwordInput?.addEventListener("input", checkPasswordsLive)
    confirmPasswordInput?.addEventListener("input", checkPasswordsLive)

    // LIVE EMAIL CHECK
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

    // AFBEELDING PREVIEW
    function previewImage(inputId) {
        const input = document.getElementById(inputId)
        const preview = document.getElementById("preview-" + inputId)

        if (!input || !preview) return

        if (input.files && input.files[0]) {
            const reader = new FileReader()
            reader.onload = function (e) {
                preview.src = e.target.result
                preview.hidden = false
            }
            reader.readAsDataURL(input.files[0])
        }
    }

    ["profileImg", "image1", "image2", "image3"].forEach(id => {
        const el = document.getElementById(id)
        el?.addEventListener("change", () => previewImage(id))
    })
})