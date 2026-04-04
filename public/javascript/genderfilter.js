// selecteer het form
const form = document.querySelector('#genderFilterForm')

// check of het form bestaat (veiligheid)
if (form) {
  form.addEventListener('change', () => {
    form.submit() // verzendt het form bij selectie
  })
}
