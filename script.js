'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let map, mapEvent;

if (navigator.geolocation) {
  const successFunction = function (position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Handling clicks on map
    map.on('click', function (mapE) {
      mapEvent = mapE;
      form.classList.remove('hidden');
      inputDistance.focus();
    });
  };

  navigator.geolocation.getCurrentPosition(successFunction, e =>
    console.error(e.message)
  );
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const date = new Date();
  const selected_option = inputType.options[inputType.selectedIndex].value;
  const popup_content = `${
    inputType.value.charAt(0).toUpperCase() + inputType.value.substring(1)
  } on ${date.getDate()}th ${months[date.getMonth()]}`;
  const { lat, lng } = mapEvent.latlng;

  // Setting the popup-marker on map
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxHeight: 100,
        maxWidth: 250,
        autoClose: false,
        closeOnClick: false,
        className: `${selected_option}-popup`,
      })
    )
    .setPopupContent(popup_content)
    .openPopup();

  // Adding a list of workouts
  const html = `<li class="workout workout--running" data-id="1234567890">
          <h2 class="workout__title">Running on April 14</h2>
          <div class="workout__details">
            <span class="workout__icon">🏃‍♂️</span>
            <span class="workout__value">5.2</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">24</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">4.6</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">178</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;

  containerWorkouts.insertAdjacentHTML('beforeend');

  // Setting all the value empty after the submit
  inputCadence.value =
    inputDistance.value =
    inputDuration.value =
    inputElevation.value =
      '';
});

// changing the the cycling-or-elevation
inputType.addEventListener('change', () => {
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});
