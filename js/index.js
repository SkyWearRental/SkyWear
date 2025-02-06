document.addEventListener("DOMContentLoaded", async() => {
    // UI Elements
    const flightNumberSelector = document.getElementById("flight-number-selector");
    const destinationSelector  = document.getElementById("destination-selector");
    
    const flightNumberForm     = document.getElementById("flight-number-form");
    const destinationForm      = document.getElementById("destination-form");

    const destinationInput     = document.getElementById("destination-name");
    const arrivalDateInput     = document.getElementById("arrival-date");
    const retrievalDateInput   = document.getElementById("retrieval-date");
    
    const fnGoingInput         = document.getElementById("flight-number-going");
    const fnBackInput          = document.getElementById("flight-number-back");
    const fnArrivalDateInput   = document.getElementById("fn-arrival-date");
    const fnRetrievalDateInput = document.getElementById("fn-retrieval-date");
    
    const submitButton         = document.getElementById("submit-button");

    // Available Destinations
    async function loadDestinations(){
        if(sessionStorage.getItem("destinations")){
            return JSON.parse(sessionStorage.getItem("destinations"));
        }
        const response = await fetch("xml/destinations.xml");
        const data = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(data, "application/xml");
        const nodes = xml.getElementsByTagName("destination");

        const destinations = Array.from(nodes).map(dest => ({
            city: dest.getElementsByTagName("city")[0].textContent,
            country: dest.getElementsByTagName("country")[0].textContent
        }));

        sessionStorage.setItem("destinations", JSON.stringify(destinations));
        return destinations;
    }
    const destinations = await loadDestinations();
    console.log(destinations);

    // Initial State
    function getStartingState(){
        let currentState = "flight-number";
        
        const storedData = {
            destinationName   : localStorage.getItem("destinationName"),
            flightNumberGoing : localStorage.getItem("flightNumberGoing"),
            flightNumberBack  : localStorage.getItem("flightNumberBack"), 
            arrivalDate       : localStorage.getItem("arrivalDate"),
            retrievalDate     : localStorage.getItem("retrievalDate")
        }

        if(storedData.destinationName && storedData.destinationName != "null"){
            currentState = "destination-name";
            destinationInput.value = storedData.destinationName;
            arrivalDateInput.value = storedData.arrivalDate;
            retrievalDateInput.value = storedData.retrievalDate;
        }
        else if(storedData.flightNumberGoing && storedData.flightNumberGoing != "null"){
            fnGoingInput.value = storedData.flightNumberGoing;
            fnArrivalDateInput.value = storedData.arrivalDate;
            fnRetrievalDateInput.value = storedData.retrievalDate;
            if(storedData.flightNumberBack && storedData.flightNumberBack != "null"){
                fnBackInput.value = storedData.flightNumberBack;
            }
        }

        return currentState;
    }

    let currentForm;
    let currentState = getStartingState();
    updateUI();

    // Switching forms
    flightNumberSelector.addEventListener("click", () => {
        currentState = "flight-number";
        updateUI();
    });
    destinationSelector.addEventListener("click", () => {
        currentState = "destination-name";
        updateUI();
    });

    function updateUI(){
        switch(currentState){
            case "flight-number":
                setForm(flightNumberForm, flightNumberSelector, destinationForm, destinationSelector);
            break;
            case "destination-name":
                setForm(destinationForm, destinationSelector, flightNumberForm, flightNumberSelector);
            break;
        };
        handleState();
    } 

    function setForm(form, selector, hideForm, hideSelector){
        currentForm = form;
        form.classList.add("active");
        selector.classList.add("active");

        hideForm.classList.remove("active");
        hideSelector.classList.remove("active");
    }  

    function handleState(){
        const inputs = currentForm.querySelectorAll("input[required]");
        handleBtnState(inputs);
        
        Array.from(inputs).forEach(input => {
            input.addEventListener("input", () => {
                handleBtnState(inputs);
            });
        });
    }

    function handleBtnState(inputs){
        const btnState = getBtnState(inputs); 
        switch(btnState){
            case "submit":
                submitButton.disabled = false;
                submitButton.textContent = "Search";    
            break;
            case "invalid":
                submitButton.disabled = true;
                submitButton.textContent = "Destination must be valid!";
            break;
            case "incomplete":
                submitButton.disabled = true;
                submitButton.textContent = "All fields must be filled";
            break;
        }
    }

    function getBtnState(inputs){
        let btnState = "submit";

        if(!checkCompletion(inputs)){
            btnState = "incomplete";
        }
        else if(currentState === "destination-name" && !checkDestination()){
            btnState = "invalid";
        }

        return btnState
    }

    function checkDestination(){
        const destinationName = destinationInput.value.trim().toLowerCase();
        console.log(destinationName);
        destinations.forEach(dest => console.log(dest.city.toLowerCase()));
        return destinations.some(dest => dest.city.toLowerCase() === destinationName);
    }

    function checkCompletion(inputs){
        return Array.from(inputs).every(input => input.value.trim() !== "");
    }

    // AutoComplete
    function handleQuery(query, warning, autoCompleteList){
        const matches = destinations.filter(dest => dest.city.toLowerCase().startsWith(query));

        if(matches.length === 0){
            autoCompleteList.innerHTML = `<div class="autocomplete-item">Sorry, we don't have clothes there yet...</div>`;
            warning.style.display = "block";
        }
        else{
            warning.style.display = "none";
            matches.forEach(dest => {
                let item = document.createElement("div");
                item.classList.add("autocomplete-item");
                item.innerHTML = `<i class="fa-solid fa-plane-arrival"></i> ${dest.city}, ${dest.country}`;
                item.addEventListener("click", () => {
                    destinationInput.value = dest.city;
                    autoCompleteList.innerHTML = "";
                    
                    destinationInput.dispatchEvent(new Event("input", {bubbles: true}));
                });

                autoCompleteList.appendChild(item);
            });
        }
    }
    destinationInput.addEventListener("input", function(){
        const query = this.value.toLowerCase();
        const autoCompleteList = document.getElementById("autocomplete-list");
        const warning = document.getElementById("warning");

        autoCompleteList.innerHTML = "";
        warning.style.display = "none";

        if(!query) return;
        handleQuery(query, warning, autoCompleteList);
    });
    this.addEventListener("click", (event) => {
        if(event.target !== destinationInput){
            document.getElementById("autocomplete-list").innerHTML = "";
        }
    });

    // Date Input restrictions
    function getLocalDateTime(){
        const now = new Date();
        return now.toISOString().slice(0, 16);
    }
    function getLocalDate(){
        const now = new Date();
        return now.toISOString().split("T")[0];
    }
    let today = getLocalDateTime();
    arrivalDateInput.setAttribute("min", today);
    
    today = getLocalDate();
    fnArrivalDateInput.setAttribute("min", today);

    const bool = (localStorage.getItem("retrievalDate") && localStorage.getItem("retrievalDate") !== "null")
    retrievalDateInput.disabled   = !bool;
    fnRetrievalDateInput.disabled = !bool;

    function setMinDate(){
        const arrivalDate = arrivalDateInput.value;
        if(arrivalDate && arrivalDate != ""){
            const arrivalDateObj = new Date(arrivalDate);

            const nextDay = new Date(arrivalDateObj);
            nextDay.setDate(arrivalDateObj.getDate() + 1);

            const nextDayFormatted = nextDay.toISOString().slice(0, 16);

            retrievalDateInput.min      = nextDayFormatted;
            retrievalDateInput.disabled = false;
        }
        else{
            retrievalDateInput.disabled = true;
            retrievalDateInput.value = "";
        }
    }

    setMinDate();
    
    arrivalDateInput.addEventListener("change", () =>{
        setMinDate();
    });

    fnArrivalDateInput.addEventListener("change", () => {
        const arrivalDate = fnArrivalDateInput.value;
        if(arrivalDate && arrivalDate != ""){
            const arrivalDateObj = new Date(arrivalDate);

            const nextDay = new Date(arrivalDateObj);
            nextDay.setDate(arrivalDateObj.getDate() + 1);

            const nextDayFormatted = nextDay.toISOString().split("T")[0];

            fnRetrievalDateInput.min = nextDayFormatted;
            fnRetrievalDateInput.disabled = false;
        }
        else{
            fnRetrievalDateInput.value = "";
            fnRetrievalDateInput.disabled = true;
        }
    });

    //Submit
    submitButton.addEventListener("click", ()=>{
        const formFields = (currentState === "destination-name") 
            ?{
                destinationName: destinationInput.value.trim(),
                flightNumberGoing: null,
                flightNumberBack: null,
                arrivalDate: arrivalDateInput.value,
                retrievalDate: retrievalDateInput.value
            }
            : {
                destinationName: null,
                flightNumberGoing: fnGoingInput.value.trim(),
                flightNumberBack:  (fnBackInput.value && fnBackInput.value !== "") ? fnBackInput.value : null,
                arrivalDate: fnArrivalDateInput.value,
                retrievalDate: fnRetrievalDateInput.value
            };
        
        Object.entries(formFields).forEach(([key, value]) => localStorage.setItem(key, value));

        window.location.href = "html/clothes.html";
    });
});