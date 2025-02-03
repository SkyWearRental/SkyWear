/* -------------------- TOGGLE FORMS -------------------- */
const flight_number_selector = document.getElementById("flight-number-selector");
const destination_selector = document.getElementById("destination-selector");
const destination_form = document.getElementById("destination-form");
const flight_number_form = document.getElementById("flight-number-form");

destination_selector.addEventListener("click", function(){
    if(flight_number_selector.classList.contains("active")){
        hide(flight_number_selector);
        hide(flight_number_form);

        show(destination_selector);
        show(destination_form);
    }
});

flight_number_selector.addEventListener("click", function(){
    if(destination_selector.classList.contains("active")){
        hide(destination_selector);
        hide(destination_form);
        show(flight_number_selector);
        show(flight_number_form);
    }
});

function hide(element){
    element.classList.remove("active");
    const inputs = element.querySelectorAll("input");
    inputs.forEach(input => {
        input.value = "";
    });
}

function show(element){
    element.classList.add("active");
}

/* ---------------------  LIMIT THE DATE INPUT ------------------------ */
const arrivalInput = document.getElementById("arrival-date");
const retrievalInput = document.getElementById("retrieval-date");
const fnArrivalInput = document.getElementById("fn-arrival-date");
const fnRetrievalInput = document.getElementById("fn-retrieval-date");

retrievalInput.disabled = true;
fnRetrievalInput.disabled = true;

function getLocalDatetime(){
    const now = new Date();
    return now.toISOString().slice(0, 16);
}

function getLocalDate(){
    const now = new Date();
    return now.toISOString().split("T")[0];
}

let today = getLocalDatetime();
arrivalInput.setAttribute("min", today);

today = getLocalDate();
fnArrivalInput.setAttribute("min", today);

handleRetrievalDateTime(arrivalInput, retrievalInput);
handleRetrievalDate(fnArrivalInput, fnRetrievalInput);

function handleRetrievalDateTime(arrivalInput, retrievalInput){
    arrivalInput.addEventListener("change", function(){
        if(arrivalInput.value){
            const arrivalDate = new Date(arrivalInput.value);
    
            const nextDay = new Date(arrivalDate);
            nextDay.setDate(arrivalDate.getDate() + 1);
    
            const nextDayFormatted = nextDay.toISOString().slice(0, 16);
    
            retrievalInput.min = nextDayFormatted;
            retrievalInput.disabled = false;
        }
        else{
            retrievalInput.disabled = true;
            retrievalInput.value = "";
        }
    })
}

function handleRetrievalDate(arrivalInput, retrievalInput){
    arrivalInput.addEventListener("change", function(){
        if(arrivalInput.value){
            const arrivalDate = new Date(arrivalInput.value);

            const nextDay = new Date(arrivalDate);
            nextDay.setDate(arrivalDate.getDate() + 1);

            const nextDayFormatted = nextDay.toISOString().split("T")[0];

            retrievalInput.min = nextDayFormatted;
            retrievalInput.disabled = false;
        }
        else{
            retrievalInput.disabled = true;
            retrievalInput.value = "";
        }
    })
}
/*------------------------------- AUTO-COMPLETE ------------------------------ */

let destinations = [];

function loadDestinations(){
    fetch("../xml/destinations.xml")
    .then(response => response.text())
    .then(data => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(data, "application/xml");
        const nodes = xml.getElementsByTagName("destination");

        destinations = Array.from(nodes).map(dest => ({
            city: dest.getElementsByTagName("city")[0].textContent,
            country: dest.getElementsByTagName("country")[0].textContent
        }));
    })
    .catch(error => console.error("Error loading destinations:", error));
}

document.addEventListener("DOMContentLoaded", loadDestinations);


document.getElementById("destination-name").addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const autoCompleteList = document.getElementById("autocomplete-list");
    const warning = document.getElementById("warning");
    const submitButton = document.getElementById("submit-button");

    autoCompleteList.innerHTML = ""; // Clear previous results
    warning.style.display="none";
    submitButton.textContent = "Search";


    if (!query) return; // Do nothing if input is empty

    const matches = destinations.filter(dest => dest.city.toLowerCase().startsWith(query));

    if (matches.length === 0) {
        autoCompleteList.innerHTML = `<div class="autocomplete-item">Sorry, we don't have clothes there yet...</div>`;
        warning.style.display = "block";
        submitButton.textContent="Destination must be valid!";
    } else {
        warning.style.display="none";
        submitButton.textContent = "Search";
        matches.forEach(dest => {
            let item = document.createElement("div");
            item.classList.add("autocomplete-item");
            item.innerHTML = `<i class="fa-solid fa-plane-arrival"></i>  ${dest.city}, ${dest.country}`;
            item.addEventListener("click", () => {
                document.getElementById("destination-name").value = dest.city;
                autoCompleteList.innerHTML = ""; // Hide suggestions after selection
            });
            autoCompleteList.appendChild(item);
        });
    }
});

document.addEventListener("click", (event) => {
    if(event.target !== document.getElementById("destination-name")){
        document.getElementById("autocomplete-list").innerHTML = "";
    }
});


/* ----------------------- HANDLE SUBMITION -------------------------- */

document.addEventListener("DOMContentLoaded", function(){
    checkCompletion();
})

function checkCompletion(){
    checkFormCompletion();
    
    document.querySelectorAll(".form input[required]").forEach(input => {
        input.addEventListener("input", checkFormCompletion);
    });    
}

function checkFormCompletion(){
    const submitButton = document.getElementById("submit-button");

    const activeForm = document.querySelector(".form.active");
    if(!activeForm) return;

    const inputs = activeForm.querySelectorAll("input[required]");

    const allFilled = Array.from(inputs).every(input => input.value.trim() !== "");

    let isDestinationValid = true;

    if(activeForm.id === "destination-form"){
        const destinationInput = document.getElementById("destination-name").value.trim().toLowerCase();
        isDestinationValid = destinations.some(dest => dest.city.toLowerCase() === destinationInput);
    }

    submitButton.disabled = !(allFilled && isDestinationValid);
}

document.getElementById("submit-button").addEventListener("click", function() {
    const activeForm = document.querySelector(".form.active");

    if(activeForm.id === "destination-form"){
        const destinationName = document.getElementById("destination-name").value.trim();
        const arrivalDate = document.getElementById("arrival-date").value;
        const retrievalDate = document.getElementById("retrieval-date").value;

        localStorage.setItem("destinationName", destinationName);
        localStorage.setItem("flightNumber", null);
        localStorage.setItem("arrivalDate", arrivalDate);
        localStorage.setItem("retrievalDate", retrievalDate);

        window.location.href = "../html/clothes.html";
    }

    else{
        const flightNumber = document.getElementById("flight-number").value.trim();
        const arrivalDate = document.getElementById("fn-arrival-date").value;
        const retrievalDate = document.getElementById("fn-retrieval-date").value;
        
        localStorage.setItem("destinationName", null);
        localStorage.setItem("flightNumber", flightNumber);
        localStorage.setItem("arrivalDate", arrivalDate);
        localStorage.setItem("retrievalDate", retrievalDate);

        window.location.href = "../html/clothes.html"
    }
})