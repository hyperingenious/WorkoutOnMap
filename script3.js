('use strict');

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

    // prettier-ignore
    this.description = `${this.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    // this.cadence = cadence;
    // this.calcPace();
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
    // this.elevationGain = elevationGain;
    // this.calcSpeed();
    // this._setDescription();
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
// const inputDistance = document.querySelector('.form__input--distance');
// const inputDuration = document.querySelector('.form__input--duration');
// const inputCadence = document.querySelector('.form__input--cadence');
// const inputElevation = document.querySelector('.form__input--elevation');
const sidebar = document.querySelector('.sidebar');

class App {
  // [rivate properties  | private fields
  #map;
  #mapZoomLevel = 14;
  #mapEvent;
  #workout = [];
  #data;

  constructor() {
    // this._getLocalStorage();
    this._getPosition();
    // inputType.addEventListener('change', this._toggleElevationField);

    /*
    The solution of this error is to use bind method to set the this keyword

    script3.js:155 Uncaught TypeError: Cannot read private member #mapEvent from an object whose class did not declare it
    at HTMLFormElement._newWorkout (script3.js:155:31)
    */
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
    // destructuring object
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
  // _cancel(e) {
  //   if (e.target == sidebar) {
  //     this._hideform();
  //   }
  // }

  _showForm(mapE) {
    // sidebar.addEventListener('click', this._cancel.bind(this));

    this.#mapEvent = mapE;
    form.style.display = 'block';
    form.classList.remove('hidden');
    inputType.focus();
    if (screen.width <= 412) {
      sidebar.style.height = '30%';
    }
  }
  _hideform() {
    console.log('closeme');
    form.style.display = 'none';
    form.classList.add('hidden');
    // setTimeout(() => ((form.style.display = 'grid'), 1000));
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

  // _toggleElevationField() {
  //   inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  //   inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  // }

  _newWorkout(e) {
    e.preventDefault();
    let workout;

    // Making the height of sidebar normal
    sidebar.style.height = '30%';

    // helper functions
    const validInputs = (...inputs) => inputs.every(e => Number.isFinite(e));
    const allPositive = (...inputs) => inputs.every(e => e > 0);

    const { lat, lng } = this.#mapEvent.latlng;

    // Get common data from form
    const type = inputType.value;

    // If activity running, create running object
    if (type === 'running') {
      // calling class inside a class
      workout = new Running([lat, lng]); //, distance, duration, cadence
    }

    // If activity cycling, create cycling object
    if (type === 'cycling') {
      // calling class inside a class
      workout = new Cycling([lat, lng]); //, distance, duration, elevation
    }

    // Add new object to workout array
    console.log(workout);
    this.#workout.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // adding the delete event Listner
    // document
    //   .querySelector('.delete')
    //   .addEventListener('click', this._deleteWorkout.bind(this));

    // Hiding the form
    this._hideform();

    // Set all the items to the local storage
    // this._setLocalStorage();
  }

  _renderWorkout(workout) {
    const backchod = function (e) {
      {
        const { latitude: lat, longitude: lng } = e.coords;
        const currentLatLng = { lat, lng };
        const currentMarkerCoords = this.#map._popup._latlng;
        const distance = Math.trunc(
          this.#map.distance(currentLatLng, currentMarkerCoords) / 1000,
          2
        );

        let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <div class="top__elements">
          <h2 class="workout__title">${workout.description.substring(4)}</h2>
          
          </div>
          <div class="main__div">
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">    </span>
            <span class="workout__unit">min</span>
          </div>
`;
        if (workout.type === 'running') {
          html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">  </span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">   </span>
            <span class="workout__unit">spm</span>
          </div>
          </div>
        </li>`;
        }
        if (workout.type === 'cycling') {
          html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">    </span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">    </span>
            <span class="workout__unit">m</span>
          </div>
          </div>
        </li>`;
        }
        form.insertAdjacentHTML('afterend', html);
      }
    };
    navigator.geolocation.getCurrentPosition(backchod.bind(this), e =>
      console.error(e.message)
    );
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxHeight: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }

  // _deleteWorkout(e) {
  //   const workout = e.target.closest('.workout');
  //   // removing from the list
  //   workout.remove();

  //   // getting from local storage
  //   const data = JSON.parse(localStorage.getItem('workouts'));
  //   const item = data.findIndex(item => item.id === workout.dataset.id);

  //   // remove from map
  //   const markerCoords = data.find(coords => coords.id === workout.dataset.id);

  //   // removing from local storage
  //   data.splice(item, 1);
  //   localStorage.setItem('workouts', JSON.stringify(data));
  // }

  // local storage
  // _setLocalStorage() {
  //   localStorage.setItem('workouts', JSON.stringify(this.#workout));
  // }
  // _getLocalStorage() {
  //   this.#data = JSON.parse(localStorage.getItem('workouts'));

  //   if (!this.#data) return;

  //   this.#workout = this.#data; // cuz #workout is empty & _moveMap don't work onload
  //   this.#data.forEach(work => this._renderWorkout(work));
  // }
  _getMarker(data) {
    if (!data) return;
    data.forEach(work => this._renderWorkoutMarker(work));
  }
}
const app = new App();
