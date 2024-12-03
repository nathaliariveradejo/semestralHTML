let nextEvent = document.querySelector('.next__slide');
let prevEvent = document.querySelector('.prev__slide');

nextEvent.addEventListener('click', function() {
    let items = document.querySelectorAll('.eventos__image');
    document.querySelector('.eventos__slider').appendChild(items[0]);
});

prevEvent.addEventListener('click', function() {
    let items = document.querySelectorAll('.eventos__image');
    document.querySelector('.eventos__slider').prepend(items[items.length - 1]); 
});







let items = document.querySelectorAll('.main__locaciones .aire__libre .locaciones__imagen');
let next = document.getElementById('next');
let prev = document.getElementById('prev');
let thumbnails = document.querySelectorAll('.locaciones__small__img .locaciones__imagen');




// Config parameters
let countItem = items.length;
let itemActive = 0;

// Event for next button click
next.onclick = function () {
    itemActive = itemActive + 1;
    if (itemActive >= countItem) {
        itemActive = 0;
    }
    showSlider();
};

// Event for previous button click
prev.onclick = function () {
    itemActive = itemActive - 1;
    if (itemActive < 0) {
        itemActive = countItem - 1;
    }
    showSlider();
};

// Auto-run slider
let refreshInterval = setInterval(() => {
    next.click();
}, 5000);

// Function to update the slider view
function showSlider() {
    // Remove the active class from the old active item and thumbnail
    let itemActiveOld = document.querySelector('.main__locaciones .aire__libre .locaciones__imagen.activo');
    let thumbnailActiveOld = document.querySelector('.locaciones__small__img .locaciones__imagen.activo');
    itemActiveOld.classList.remove('activo');
    thumbnailActiveOld.classList.remove('activo');

    // Add the active class to the new active item and thumbnail
    items[itemActive].classList.add('activo');
    thumbnails[itemActive].classList.add('activo');

    // Update thumbnail position
    setPositionThumbnail();

    // Reset auto-run slider interval
    clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        next.click();
    }, 5000);
}

// Function to adjust the position of active thumbnails
function setPositionThumbnail() {
    let thumbnailActive = document.querySelector('.locaciones__small__img .locaciones__imagen.activo');
    let rect = thumbnailActive.getBoundingClientRect();
    if (rect.left < 0 || rect.right > window.innerWidth) {
        thumbnailActive.scrollIntoView({ behavior: 'smooth', inline: 'nearest' });
    }
}

// Add click events to thumbnails
thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => {
        itemActive = index;
        showSlider();
    });
});






let showPassword = document.getElementById('showPassword');
let inputPassword = document.getElementById('inputPassword');
showPassword.onclick = function(){
    if(inputPassword.type == 'password'){
        inputPassword.type = 'text';
        showPassword.classList.add('show');
    }else{
        inputPassword.type = 'password';
        showPassword.classList.remove('show');
    }
}

//header

document.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});