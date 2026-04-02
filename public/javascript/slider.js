// ==========================================
// Leeftijd slider
// ==========================================

// Selecteer slider en waarde-element
const birthdaySlider = document.getElementById("birthday");
const birthdayValue = document.getElementById("birthdayValue");

// Controleer of de elementen bestaan
if (birthdaySlider && birthdayValue) {
  // Startwaarde laten zien
  birthdayValue.textContent = birthdaySlider.value;

  // Eventlistener voor realtime update bij slider beweging
  birthdaySlider.addEventListener("input", () => {
    birthdayValue.textContent = birthdaySlider.value;
    // Hier kan eventueel extra logica voor filterItems() komen
    // filterItems(); // uncomment als je filterfunctie wilt triggeren
  });
}