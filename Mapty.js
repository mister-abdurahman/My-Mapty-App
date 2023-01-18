'use strict';

// prettier-ignore
// const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// PROJECT PLANNING (seec screenshot)

// 1. User Stories // 2. Features // 3. Flowchart // 4. Architecture

// NB: Async in the flowchart means that it is an operation that takes some time and only when it loads
// can other operations that depend on it also load


// USING THE GEOLOCATION API.

// It is called an API cos its a browser API (i.e a data we get from the browser) like 
// internationalization and timers. Also its a modern one.😎

// it takes in 2 call back functions. Success one (this one takes a position para) and Error one.

//


// DISPLAY A MAP USING A THIRD PARTY - LEAFTLET

// There are several ways to use a library, such as 'Using a hosted version' (for now) and installing the 'npm'

// 'L' in the Leaflet code represents a namespace like the "Intl" on which we can call a number of methods
// in this case methods like map, tileLayer, marker

// NOTE: any variable that is global in a script would be made available to 
// other scripts as long as they come before the script in HTML

// The map displayed is made of small tiles, we're using openstreetmap here but 
// you can use others like goggle map.(They're more like map themes)  

// READING DOUCUMENTATIONS IS PART OF THE JOB. !!! YEAH


//

// let map, mapEvent;

// Using the architecture plan =>

//* The Constructor gets executed immediately an object is created.
//* Remember that bind returns a new function and manually assigns the this keyword which points to the 
// current object. (Unlike .call, bind only returns a new function, doesn't call it)
//* Its official, Whenever using an event listener on a method, we need to manually assign the this keyword
// cos it initially points to the Event handler that its attached to.

//We need Id's to identify our objects in an array, Never create an Id yourself rather use a library (more later)

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10); 
    clicks = 0;
    constructor(coords, distance, duration){
        this.coords = coords; // [lat, lng]
        this.distance = distance; //in km
        this.duration = duration; //in min
    }
    _setDescription(){        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 
        'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} 
        ${this.date.getDate()}`
    }
    click(){
        this.clicks++;
    }
}

class Running extends Workout {
    type = 'running';   

    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration)
        this.cadence = cadence;
        this.calcPace();
        this._setDescription()
    }

    calcPace(){
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration)
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        // km/hr
        this.speed = this.distance / (this.duration / 60)
        return this.speed;
    }
}

// const run1 = new Running([120, -23], 120, 29, 123)  // Testing Successful
// const cycling1 = new Cycling([120, -23], 220, 29, 323)
// console.log(run1, cycling1)


///////////////////////////////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const clearData = document.querySelector('.clear-data');

// APPLICATION ARCHITECTURE

class App {
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    

    constructor(){
        // Get User's Position
        this._getPositon();

        // Get data from local storage
        this._getLocalStorage();

        // Attach Event Handlers 
        form.addEventListener('submit', this._newWorkout.bind(this))
         
        inputType.addEventListener('change', this._toggleElevationField) //'this' not important here

        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this)) //Using the idea of Event Bubbling 
        
        // clearData.addEventListener('click', this._reset())
    }
    _getPositon(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
            alert('Could not get your position')
    });
    }

    }
    _loadMap(position){
            const {latitude} = position.coords; 
            const {longitude} = position.coords;
            
            const coords = [latitude, longitude]
        
            this.#map = L.map('map').setView(coords, this.#mapZoomLevel); 

            L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);
        
            // Handliing clicks on Map 
            this.#map.on('click', this._showForm.bind(this))

            // To show markers of objects in local storage on load
            this.#workouts.forEach(work => this._renderWorkoutMarker(work))
        
    }
    _showForm(mapE){
        this.#mapEvent = mapE
        // Rendering Workout Input Form    
        form.classList.remove('hidden')
        inputDistance.focus()
    }
    _hideForm(){
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
        
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000)
    }
    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e){
        e.preventDefault();
        // Helper functions
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat, lng} = this.#mapEvent.latlng;
        let workout;

        // If workout running, create running object
        if(type === 'running'){
            const cadence = +inputCadence.value;
            // Check if data is valid
            if(!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)){
                return alert('Inputs have to be positive numbers !')}
            
            workout = new Running([lat, lng], distance, duration, cadence);
        }
        // If workout cycling, create cycling object
        if(type === 'cycling'){
            const elevationGain = +inputElevation.value;
            if(!validInputs(distance, duration, elevationGain) || !allPositive(distance, duration)){
                return alert('Inputs have to be positive numbers !')}

                workout = new Cycling([lat, lng], distance, duration, elevationGain);
            }
        
        // Add new object to workout array
            
        this.#workouts.push(workout);
        // console.log(workout);
        // Render workout on map as a a marker
        // const {lat, lng} = this.#mapEvent.latlng;
        
        // Display Marker
        this._renderWorkoutMarker(workout);

        // Render workout on list
            this._renderWorkout(workout);

        // Hide form and clear input fields
       this._hideForm();

        // Set local storage to all workouts
        this._setLocalStorage();

    }
    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        })).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`).openPopup();
    }
    _renderWorkout(workout){
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `

        if(workout.type === 'running'){
            html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
        </div>
        </li>
            `
        }

        if(workout.type === 'cycling'){
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
            `
        }

        // console.log(html)
        form.insertAdjacentHTML('afterend', html)
        
    }
    _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
        
        if(!workoutEl) return;

        const workout = this.#workouts.find( work => work.id === workoutEl.dataset.id);
        // console.log(workout)

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {duration: 1,},
        })

        // Just interacting with the Public Interface.
        // workout.click(); //gives an error after storing in Localstorage cos the prototype chain is gone
    }
    _setLocalStorage(){
        // local storage is an API that the browser provides for us. It takes a key:value parameter(both strings)
        localStorage.setItem('workouts', JSON.stringify(this.#workouts)) //JSON.stringify converts {} = '...'
    }
    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workouts'));
  ;
        if(!data) return;

        this.#workouts = data;

        // console.log(data)
        this.#workouts.forEach(work => this._renderWorkout(work))
        
    }
    _reset(){
        // if(!localStorage.getItem('workouts')) return console.log('Key does not exist');

            localStorage.removeItem('workouts');
            location.reload();
    }
}

const app = new App();

////////////////////////////////////////////////////////////////////
// Just to ensure we dont get an error incase of an old browser, lets set a condition

// if(navigator.geolocation)
// navigator.geolocation.getCurrentPosition(function(position){
//     // console.log(position);
//     const {latitude} = position.coords; //we could do "position.coords.latitude" but we used destructuring 
//     // cos this would then create a var called latitude based out of the latitude property of 
//     // the (position.coords) object.
//     const {longitude} = position.coords;
    
//     // console.log(`https://www.google.com/maps/@${latitude},${longitude}`)  

//     const coords = [latitude, longitude]

//     //leaflet code=================

//     map = L.map('map').setView(coords, 13); //13 is the zoom level

//     L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//     }).addTo(map);

//     // Handliing clicks on Map 
    
//     map.on('click', function(mapE){
//     mapEvent = mapE
//     // Rendering Workout Input Form
    
//     form.classList.remove('hidden')
//     inputDistance.focus()

//     })

//     }, 
//     function(){
//         alert('Could not get your position')
//     });


    // form.addEventListener('submit', function(e){
    // e.preventDefault();

    // // Clear Input Fields
    // inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';

    // // Display Marker
    // // console.log(mapEvent)    
    // const {lat, lng} = mapEvent.latlng;

    // // the code for our marker popup. All the methods we used, we got from the Documentation (thanks Jonas!) 
    // // These methods are chainable cos they return the this keyword
    // L.marker([lat, lng]).addTo(map).bindPopup(L.popup({
    //     maxWidth: 250,
    //     minWidth: 100,
    //     autoClose: false,
    //     closeOnClick: false,
    //     className: 'running-popup'
    // })).setPopupContent('WorkOut').openPopup();

    // })

    // // Event for Changing Input type
    // // Remember that 'closest' selects its closest parent which is thier respective divs in this case.
    // inputType.addEventListener('change', function(){
    //     inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    //     inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    // })


    // the data attribute in html can be said to be used to build a bridge btw our UI and data collection (more later)

    // When you're more confident, try the challenges at the end of the Mapty project. 
    
    // INSHA ALLAH ILL BE BACK 💪💪🏻💪🏿