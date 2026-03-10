// multipage form verwijderen en tonen pages
document.querySelectorAll(".multi-step-form").forEach(form => {

  const steps = form.querySelectorAll(".form-step");
  let currentStep = 0;

  function showStep(index) {
    steps.forEach(step => step.classList.remove("form-active"));
    steps[index].classList.add("form-active");
  }

  form.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
    });
  });

  form.querySelectorAll("[data-prev]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
  });

});



// dropdown menu voor checkboxes (leeftijd)
const dropdown = document.querySelector('.dropdown-checkbox');
const button = dropdown.querySelector('button');

button.addEventListener('click', () => {
  dropdown.classList.toggle('open');
});