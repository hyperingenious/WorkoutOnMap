'use strict';

class Workout {
  type;
  date = new Date();
  id = Date.now() + ''.slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${
      this.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
    } ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
// APLLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workout = [];
  #data;

  constructor() {
    this._getLocalStorage();
    this._getPosition();
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveMap.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), e =>
        console.error(e.message)
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Setting the storage markers
    this._getMarker(this.#data);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideform() {
    // Clear input fields
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => ((form.style.display = 'grid'), 1000));
  }
  _moveMap(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) {
      return;
    }

    const workout = this.#workout.find(
      obj => obj.id === workoutEl.dataset.id
    ).coords; // getting the coords of current object

    this.#map.setView(workout, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    }); // ([lat, lng], zoomValue , {options})
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    let workout;

    const validInputs = (...inputs) => inputs.every(e => Number.isFinite(e));
    const allPositive = (...inputs) => inputs.every(e => e > 0);

    const { lat, lng } = this.#mapEvent.latlng;

    // Get common data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // If activity running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If activity cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    console.log(workout);
    this.#workout.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // adding the delete event Listner
    document.querySelector('.delete').addEventListener('click', function (e) {
      const workout = e.target.closest('.workout').dataset.id;
      console.log(workout);
    });

    // Hiding the form
    this._hideform();

    // Set all the items to the local storage
    this._setLocalStorage();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <div class="top__elements">
          <h2 class="workout__title">${workout.description.substring(4)}</h2>
          <div class="all_svg">
              <svg
              class="edit"
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                fill="#757575"
                viewBox="0 0 256 256"
              >
                <path
                  d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"
                ></path>
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="delete"
                width="22"
                height="22"
                fill="#757575"
                viewBox="0 0 256 256"
              >
                <path
                  d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"
                ></path>
              </svg>
            </div>
          </div>
          <div class="main__div">
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
`;
    if (workout.type === 'running') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
          </div>
        </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  // _renderWorkoutMarker(workout) {
  //   L.marker(workout.coords)
  //     .addTo(this.#map)
  //     .bindPopup(
  //       L.popup({
  //         maxHeight: 100,
  //         maxWidth: 250,
  //         autoClose: false,
  //         closeOnClick: false,
  //         className: `${workout.type}-popup`,
  //       })
  //     )
  //     .setPopupContent(`${workout.description}`)
  //     .openPopup();
  // }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }
  _getLocalStorage() {
    this.#data = JSON.parse(localStorage.getItem('workouts'));

    if (!this.#data) return;

    this.#workout = this.#data; // cuz #workout is empty & _moveMap don't work onload
    this.#data.forEach(work => this._renderWorkout(work));
  }
  _getMarker(data) {
    if (!data) return;
    data.forEach(work => this._renderWorkoutMarker(work));
  }
}
const app = new App();
