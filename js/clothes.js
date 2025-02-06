function loadXML(file){
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", file, true);
        xhr.responseType = "document";
        xhr.overrideMimeType("text/xml");
        xhr.onload = () =>{
            if(xhr.status === 200){
                resolve(xhr.responseXML);
            }
            else{
                reject(`Failed to load XML file: ${xhr.status}`);
            }
        };
        xhr.onerror = ()=>reject("An error occurred during the request.");
        xhr.send();
    });
}

function createClothingCard(item){
    const card = document.createElement("div");
    card.className = "clothing-card";

    const imgContainer = document.createElement("div");
    imgContainer.className = "img-container";

    const carousel = document.createElement("div");
    imgContainer.className = "carousel";

    const images = item.querySelectorAll("image");
    let imageIndex = 0;

    images.forEach((image, index) => {
        const img = document.createElement("img");
        img.src = image.textContent;
        img.alt = item.querySelector("name").textContent;
        img.classList.add("carousel-image");
        img.style.display = index === 0 ? "block" : "none";
        carousel.appendChild(img);
    });
    imgContainer.appendChild(carousel);

    const numImages = images.length;

    if(numImages > 1){
        const prevButton = document.createElement("button");
        prevButton.className = "carousel-button prev";
        prevButton.innerHTML = "<i class='fa-solid fa-chevron-left'></i>";
        prevButton.addEventListener("click", () => changeImage(-1));

        const nextButton = document.createElement("button");
        nextButton.className = "carousel-button next";
        nextButton.innerHTML = "<i class='fa-solid fa-chevron-right'></i>";
        nextButton.addEventListener("click", () => changeImage(1));

        function changeImage(direction){
            const images = carousel.querySelectorAll("img");
            images[imageIndex].style.display = "none";
            imageIndex = (imageIndex + direction + images.length) % images.length;
            images[imageIndex].style.display = "block";
        }

        imgContainer.appendChild(prevButton);
        imgContainer.appendChild(nextButton);
    }

    const descriptionContainer = document.createElement("div"); 
    descriptionContainer.className = "description-container";

    const description = document.createElement("p");
    description.textContent = item.querySelector("name").textContent;

    descriptionContainer.appendChild(description);
    card.appendChild(imgContainer);
    card.appendChild(descriptionContainer);

    addModalBehavior(card, item);

    return card;
}

function populateClothingRows(xml){
    const clothingData = xml.querySelectorAll("type");
    const body = document.querySelector("body");

    clothingData.forEach((type, typeIndex) => {
        const rowContainer = document.createElement("div");
        rowContainer.className="row-container";

        const title = document.createElement("h2");
        title.textContent = type.getAttribute("name");
        rowContainer.appendChild(title);

        const row = document.createElement("div");
        row.className = "row";

        const items = type.querySelectorAll("item");
        items.forEach(item => {
            const card = createClothingCard(item);
            row.appendChild(card);
        });

        rowContainer.appendChild(row);
        body.appendChild(rowContainer);
    });
}

function closeModal(){
    const modal = document.getElementById("clothing-modal");
    modal.style.display = "none";
}

async function initializePage(){
    try{
        const xml = await loadXML("../xml/clothes.xml");
        populateClothingRows(xml);
    }
    catch(error){
        console.error(error);
    }
}

initializePage();

let resizeTimeout;
function changeLogo(){
    const logo = document.getElementById("logo");
    if(resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if(window.innerWidth <= 450){
            logo.src = "../images/logo/logo_name.png";
        }
        else{
            logo.src = "../images/logo/logo.png";
        }
    }, 300);
}

changeLogo();

window.addEventListener("resize", changeLogo);

function addModalBehavior(card, item){
    card.addEventListener("click", function(event) {
        if(!event.target.closest(".prev") && !event.target.closest(".next")){
            const modal = document.getElementById("clothing-modal");
            modal.addEventListener("click", function(event){
                if(!event.target.closest(".modal-content")){
                    closeModal();
                }
            });

            const modalCarouselContainer = modal.querySelector(".modal-carousel-container");
            const modalDescriptionContainer = modal.querySelector(".modal-description-container");

            modalCarouselContainer.innerHTML = "";
            modalDescriptionContainer.innerHTML = "";

            const name = item.querySelector("name").textContent;
            const brand = item.querySelector("brand") ? item.querySelector("brand").textContent : "Unknown Brand";
            const description = item.querySelector("description").textContent;
            const price = item.querySelector("retail-price") ? item.querySelector("retail-price").textContent : "Price not available";
            const sizes = item.querySelectorAll("size");

            const itemId = item.querySelector("id").textContent.trim();
            const itemType = item.closest("type").getAttribute("name");

            const carousel = document.createElement("div");
            carousel.className = "modal-carousel";

            const images = item.querySelectorAll("image");
            let imageIndex = 0;
 
            images.forEach((image, index) => {
                const img = document.createElement("img");
                img.src = image.textContent;
                img.alt = name;
                img.classList.add("modal-carousel-image");
                img.style.display = index === 0 ? "block" : "none";
                carousel.appendChild(img);
            });

            if(images.length > 1){
                const prevButton = document.createElement("button");
                prevButton.className = "carousel-button prev";
                prevButton.innerHTML = "<i class='fa-solid fa-chevron-left'></i>";
                prevButton.addEventListener("click", () => changeModalImage(-1));

                const nextButton = document.createElement("button");
                nextButton.className = "carousel-button next";
                nextButton.innerHTML = "<i class='fa-solid fa-chevron-right'></i>";
                nextButton.addEventListener("click", () => changeModalImage(+1));

                function changeModalImage(direction){
                    const images = modal.querySelectorAll(".modal-carousel-image");
                    images[imageIndex].style.display = "none";
                    imageIndex = (imageIndex + direction + images.length) % images.length;
                    images[imageIndex].style.display = "block";
                }

                modalCarouselContainer.appendChild(prevButton);
                modalCarouselContainer.appendChild(nextButton);
            }

            modalCarouselContainer.appendChild(carousel);

            const sizesElem = document.createElement("div");
            sizesElem.classList.add("sizes-container");

            let selectedSize = null;

            sizes.forEach(size => {
                const sizeValue = size.childNodes[0].nodeValue.trim();
                const available = size.querySelector("available")  ? parseInt(size.querySelector("available").textContent) : 0;

                const sizeButton = document.createElement("button");
                sizeButton.textContent = sizeValue;
                sizeButton.classList.add("size-button");
                sizeButton.disabled = available <= 0;

                sizeButton.addEventListener("click", () => {
                    const isSelected = sizeButton.classList.contains("selected");
                    document.querySelectorAll(".size-button").forEach(btn => btn.classList.remove("selected"));                            
                    if(!isSelected){
                        sizeButton.classList.add("selected");
                        selectedSize = sizeValue;
                        if(!cartContains(itemType, itemId, selectedSize)){
                            addToCartButton.textContent = "Add To Cart";
                            addToCartButton.disabled = false;
                        }
                        else{
                            addToCartButton.textContent = "Item Already Added To Cart"
                        }
                        
                    }
                    else{
                        sizeButton.classList.remove("selected");
                        selectedSize = null;
                        addToCartButton.disabled = true;
                        addToCartButton.textContent = "Select a Size";
                    }
                });

                sizesElem.appendChild(sizeButton);
            });

            const nameElem = document.createElement("h2");
            nameElem.textContent = name;

            const brandElem = document.createElement("p");
            brandElem.innerHTML = `<strong>Brand:</strong> ${brand}`;

            const descElem = document.createElement("p");
            descElem.innerHTML = `<strong>Description:</strong> ${description}`;

            const addToCartButton = document.createElement("button");
            addToCartButton.className = "add-to-cart-button";
            addToCartButton.textContent = "Select a Size";
            addToCartButton.disabled = true;

            addToCartButton.addEventListener("click", () => {
                if(addToCart(itemType, itemId, name, selectedSize, images[0].textContent)){
                    addToCartButton.textContent = "Item Already Added to Cart!"
                    addToCartButton.disabled = true;
                    
                }
            });
            
            const priceElem = document.createElement("p");
            priceElem.innerHTML = `<strong>Avg. Retail Price:</strong> ${price}`;
            
            modalDescriptionContainer.appendChild(sizesElem);
            modalDescriptionContainer.appendChild(nameElem);
            modalDescriptionContainer.appendChild(brandElem);
            modalDescriptionContainer.appendChild(descElem);
            if(price != null && price != ""){
                modalDescriptionContainer.appendChild(priceElem);
            }

            modalDescriptionContainer.appendChild(addToCartButton);
            
            modal.style.display = "flex";   
        }
    });
}

let cart = [];

function loadCart(){
    const savedCart = localStorage.getItem("cart");
    if(savedCart){
        cart = JSON.parse(savedCart);
    }
    updateCartUI();
}

function saveCart(){
    localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(itemType, itemId, itemName, selectedSize,  itemImage){
    if(!cartContains(itemType, itemId, selectedSize)){
        cart.push({type: itemType, id: itemId, name: itemName, size: selectedSize, image: itemImage});
        saveCart();
        updateCartUI();
        return true;
    }

    return false;    
}

function removeFromCart(itemType, itemId, size){
    cart = cart.filter(item => !(item.type === itemType && item.id === itemId && item.size === size));

    saveCart();
    updateCartUI();
}

function removeItemFromCart(index){
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    renderCartItems();
}

function updateCartUI(){
    const counter = document.getElementById("counter");
    counter.innerHTML = cart.length;

    const confirmOrderButton = document.getElementById("confirm-order-btn");
    if(cart.length > 0){
        confirmOrderButton.disabled = false;
        confirmOrderButton.textContent="Confirm Order";
    }
    else{
        confirmOrderButton.disabled = true;
        confirmOrderButton.textContent="Cart is Empty";
    }
}

function cartContains(itemType, itemId, size){
    const existingItem = cart.find(item => item.type === itemType && item.id === itemId && item.size === size);
    
    if(existingItem){
        return true;
    }
    return false;
}

document.addEventListener("DOMContentLoaded", loadCart);

function toggleCartModal(){
    renderCartItems();
    const modal = document.getElementById("cart-modal");
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}

function closeCartModal(){
    const modal = document.getElementById("cart-modal");
    modal.style.display = "none";
}

const suitcaseIcon = document.getElementById("suitcase-icon");
suitcaseIcon.addEventListener("click", toggleCartModal);

const closeModalButton = document.getElementById("close-cross-cart");
closeModalButton.addEventListener("click", closeCartModal);

window.addEventListener("click", function(event){
    const modal = this.document.getElementById("cart-modal");
    if(event.target === modal){
        closeCartModal();
    }
});

function renderCartItems(){
    const modalItemsContainer = document.getElementById("modal-items-container");
    modalItemsContainer.innerHTML = "";

    if(cart.length === 0){
        modalItemsContainer.innerHTML = "<p>Your cart is empty</p>";
        return;
    }

    cart.forEach((item, index) => {
        const cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");

        cartItem.innerHTML = `
            <div class ="cart-item-image">
                <img src="${item.image}" alt="${item.name}" />
            </div>
            <div class="cart-item-details">
                <p><strong>${item.name}</strong></p>
                <p>Size: ${item.size}</p>
            </div>
            <div class="cart-item-remove">
                <i class="fa-solid fa-trash-can"></i>
            </div>
        `;

        modalItemsContainer.appendChild(cartItem);
    });

    document.querySelectorAll(".cart-item-remove i").forEach((item, index) => {
        item.addEventListener("click", (e) => {
            removeItemFromCart(index);
        });
    });
}

document.addEventListener("DOMContentLoaded", function(){
    const datesContainer = document.querySelector(".dates-container");
    const arrivalDate = localStorage.getItem("arrivalDate");
    const retrievalDate = localStorage.getItem("retrievalDate");

    if(arrivalDate && retrievalDate){
        const formattedArrival = new Date(arrivalDate).toLocaleDateString();
        const formattedRetrieval = new Date(retrievalDate).toLocaleDateString();

        datesContainer.innerHTML = `
            <div class="date-box" id="arrival-box">
                <i class="fa-solid fa-plane-arrival"></i>
                <span class="date-value">${formattedArrival}</span>
            </div>
            <div class="date-box" id="retrieval-box">
                <i class="fa-solid fa-plane-departure"></i>
                <span class="date-value">${formattedRetrieval}</span>
            </div>
        `;

        datesContainer.addEventListener("click", function(){
            window.location.href = "../index.html";
        });

        datesContainer.style.cursor = "pointer";
    }
});

// Show the email modal when the "Confirm Order" button is pressed
function showEmailModal() {
    document.getElementById('email-modal').style.display = 'flex';
}

// Close the modal when the "×" button is clicked
function closeEmailModal() {
    document.getElementById('email-modal').style.display = 'none';
}

document.getElementById("confirm-order-btn").addEventListener("click", showEmailModal);

emailjs.init("EEjH3nxJxcXECaWFW")

function getOrderDetails(){
    const arrivalDate = localStorage.getItem("arrivalDate");
    const retrievalDate = localStorage.getItem("retrievalDate");
    const flightNumberGoing = localStorage.getItem("flightNumberGoing");
    const flightNumberBack = localStorage.getItem("flightNumberBack");
    const destination = localStorage.getItem("destinationName");
    let cart = localStorage.getItem("cart");
    cart = cart? JSON.parse(cart) : [];
    
    const arrivalDateObj = new Date(arrivalDate)
    const retrievalDateObj = new Date(retrievalDate)
    let formattedArrivalDate = arrivalDateObj.toLocaleString();
    let formattedRetrievalDate = retrievalDateObj.toLocaleString();

    let cartDetails = "--------------------------------\n";
    cart.forEach(item => {
        cartDetails += `Type: ${item.type},\n ID: ${item.id},\n Name: ${item.name},\n Size: ${item.size}\n--------------------------------\n`;
    });

    let orderDetails = ""; 

    if(flightNumberGoing && flightNumberGoing != "null" && flightNumberBack && flightNumberBack != "null"){
        orderDetails = `
            Arrival Date: ${arrivalDateObj.toLocaleDateString()}
            Retrieval Date: ${retrievalDateObj.toLocaleDateString()}
            Outbound Flight Number: ${flightNumberGoing}
            Return Flight Number: ${flightNumberReturn}
            Cart Items:
            ${cartDetails}
        `;
    }

    else if(destination && destination!="null") {
        orderDetails = `
            Arrival Date: ${formattedArrivalDate}
            Retrieval Date: ${formattedRetrievalDate}
            Destination: ${destination}
            Cart Items:
            ${cartDetails}
        `;
    }

    return orderDetails;
}

function sendUserEmail(userEmail, orderDetails){
    emailjs.send("service_6upcf8e", "template_8jjbsw7", {
        user_email: userEmail,
        order_details: orderDetails
    })
    .then(function(response){
        console.log("User email sent successfully!", response);
    }, function(error){
        console.log("Failed to send user email:", error);
    });
}

function sendAdminEmail(userEmail, orderDetails){
    emailjs.send("service_6upcf8e", "template_y8ev1gl", {
        order_details: orderDetails,
        user_email: userEmail
    })
    .then(function(response) {
        console.log("Admin email sent successfully!", response);
    }, function(error){
        console.log("Failed to send admin email", error);
    });
}

// Handle form submission
document.getElementById('email-form').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent the form from submitting

    const userEmail = document.getElementById('email-input').value;
    const errorMessage = document.getElementById('error-message');

    // Validate the email format
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    if (!emailPattern.test(userEmail)) {
        errorMessage.style.display = 'block';  // Show error message
    } else {
        errorMessage.style.display = 'none';  // Hide error message
        // Proceed with the order confirmation logic
        confirmOrder(userEmail);
    }
});

function confirmOrder(userEmail){
    const orderDetails = getOrderDetails();

    sendAdminEmail(userEmail, orderDetails);
    sendUserEmail(userEmail, orderDetails);
    alert(`Your order has been submitted! We will send you a confirmation to ${userEmail}`);
    closeEmailModal();
}