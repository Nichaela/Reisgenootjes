const form = document.querySelector('#genderFilterForm')

if (form) {
  form.addEventListener('change', () => {
    form.submit()
  })
}