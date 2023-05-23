('use strict');

class Workout {
  type;
  date = new Date();
  id = Date.now() + ''.slice(-10);

  constructor(coords, distance) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
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
  constructor(coords, distance) {
    super(coords, distance);
    this._setDescription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, elevationGain) {
    super(coords, distance);
    // this.elevationGain = elevationGain;
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
const workoutList = document.querySelector('.workoutList');
// const inputDistance = document.querySelector('.form__input--distance');
// const inputDuration = document.querySelector('.form__input--duration');
// const inputCadence = document.querySelector('.form__input--cadence');
// const inputElevation = document.querySelector('.form__input--elevation');
const sidebar = document.querySelector('.sidebar');
const full_arrow_1 = document.querySelector('.full_arrow_1');
const full_arrow_2 = document.querySelector('.full_arrow_2');
const popup_message = document.querySelector('.popup_message');

class App {
  // [rivate properties  | private fields
  #map;
  #mapZoomLevel = 14;
  #mapEvent;
  #workout = [];
  #data;
  #currentCoords;

  constructor() {
    navigator.geolocation.getCurrentPosition(
      this._getCurrentLocation.bind(this),
      e => console.error(e.message)
    );
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
    full_arrow_2.addEventListener('click', this._fullScreen.bind(this));
    full_arrow_1.addEventListener('click', this._mapFullScreen);
  }
  _getCurrentLocation(e) {
    const { latitude: lat, longitude: lng } = e.coords;
    this.#currentCoords = { lat, lng };
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

    // marking the curretn location
    // this._renderWorkoutMarker(
    //   {
    //     description: 'live',
    //     coords: this.#currentCoords,
    //     type: 'none',
    //   },
    //   100,
    //   200
    // );

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
  _makeSidebarFull() {
    full_arrow_2.innerHTML = '';
    full_arrow_2.innerHTML =
      '<svg class="close" xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="white" viewBox="0 0 256 256"><path d="M210.83,50.83,153.66,108H192a4,4,0,0,1,0,8H144a4,4,0,0,1-4-4V64a4,4,0,0,1,8,0v38.34l57.17-57.17a4,4,0,1,1,5.66,5.66ZM112,140H64a4,4,0,0,0,0,8h38.34L45.17,205.17a4,4,0,0,0,5.66,5.66L108,153.66V192a4,4,0,0,0,8,0V144A4,4,0,0,0,112,140Z"></path></svg>';
    sidebar.style.height = '90%';
  }
  _makeSidebarSmall() {
    full_arrow_2.innerHTML = '';
    full_arrow_2.innerHTML =
      '<svg class="open" xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="white" viewBox="0 0 256 256"><path d="M212,48V96a4,4,0,0,1-8,0V57.66l-57.17,57.17a4,4,0,0,1-5.66-5.66L198.34,52H160a4,4,0,0,1,0-8h48A4,4,0,0,1,212,48ZM109.17,141.17,52,198.34V160a4,4,0,0,0-8,0v48a4,4,0,0,0,4,4H96a4,4,0,0,0,0-8H57.66l57.17-57.17a4,4,0,0,0-5.66-5.66Z"></path></svg>';

    /*
        this code is not working properly there might be some bugs in here
        1. the first if condition is working properly
        2. but the second else if not getting executed even the other condition is true
        */
    sidebar.style.height = '35%';
    /*
      if (this.#workout) {
        sidebar.style.height = '35%';
      } else if (!this.#workout) {
        sidebar.style.height = '6%';
      }
      */
  }
  _fullScreen(e) {
    console.log(e);
    if (e.target.classList == 'open') {
      this._makeSidebarFull();
    } else {
      this._makeSidebarSmall();
    }
  }

  _mapFullScreen(e) {
    if (e.target.classList == 'open') {
      sidebar.style.height = '8%';
      e.target.classList.remove('open');
      e.target.classList.add('close');
    } else if (e.target.classList == 'close') {
      sidebar.style.height = '35%';
      e.target.classList.remove('close');
      e.target.classList.add('open');
    }
  }
  _showForm(mapE) {
    // sidebar.addEventListener('click', this._cancel.bind(this));

    this.#mapEvent = mapE;
    form.style.display = 'block';
    form.classList.remove('hidden');
    inputType.focus();
    full_arrow_2.style.transform = 'translateY(0rem)';
    full_arrow_1.style.transform = 'translateY(0rem)';
    if (screen.width <= 412) {
      sidebar.style.height = '35%';
    }
  }
  _hideform() {
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

    sidebar.style.height = '8%';
    const polyline = L.polyline([
      this.#currentCoords,
      { lat: workout[0], lng: workout[1] },
    ]).addTo(this.#map);

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
    sidebar.style.height = '35%';

    const { lat, lng } = this.#mapEvent.latlng;

    // Get common data from form
    const type = inputType.value;

    //prettier-ignore
    const distance =Math.trunc(this.#map.distance(this.#currentCoords, { lat, lng }) / 1000,2);

    // If activity running, create running object
    if (type === 'running') {
      // calling class inside a class
      workout = new Running([lat, lng], distance); //, distance, duration, cadence
    }

    // If activity cycling, create cycling object
    if (type === 'cycling') {
      // calling class inside a class
      workout = new Cycling([lat, lng], distance); //, distance, duration, elevation
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

    //display popup-message
    popup_message.style.transform = 'translateY(4rem)';
    if (workout.type === 'running') {
      popup_message.style.background = 'var(--color-brand--2)';
    } else {
      popup_message.style.background = 'var(--color-brand--1)';
    }
    popup_message.textContent = `${workout.type[0].toUpperCase()}${workout.type.slice(
      1
    )} popup added`;
    setTimeout(
      () => (popup_message.style.transform = 'translateY(-5rem)'),
      1000
    );

    // Set all the items to the local storage
    // this._setLocalStorage();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <div class="main__div">
    <div class="workout__details">
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
            </div>
            <div class="top__elements">
                  <h2 class="workout__title">${workout.description.substring(
                    4
                  )}</h2>
                  
                  </div>
          </li>
`;
    workoutList.insertAdjacentHTML('beforeend', html);
  }

  _renderWorkoutMarker(workout, maxHeight = 100, maxWidth = 250) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxHeight: maxHeight,
          maxWidth: maxWidth,
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
