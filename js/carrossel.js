// =====================================================
// CARROSSEL DO STELLIFER
// =====================================================

const slides = document.querySelectorAll(".carousel-slide");
const indicators = document.querySelectorAll(".indicator");

const previousButton = document.querySelector(".carousel-button.prev");
const nextButton = document.querySelector(".carousel-button.next");

let currentSlide = 0;

// Tempo entre as imagens: 5 segundos
const carouselTime = 5000;

let carouselInterval;



// =====================================================
// MOSTRAR SLIDE
// =====================================================

function showSlide(index) {

    // Se não houver slides, não faz nada
    if (slides.length === 0) {
        return;
    }

    // Se chegar depois do último slide,
    // volta para o primeiro
    if (index >= slides.length) {
        currentSlide = 0;
    }

    // Se voltar antes do primeiro,
    // vai para o último
    else if (index < 0) {
        currentSlide = slides.length - 1;
    }

    else {
        currentSlide = index;
    }


    // Remove "active" de todos os slides
    slides.forEach(function(slide) {
        slide.classList.remove("active");
    });


    // Remove "active" de todos os indicadores
    indicators.forEach(function(indicator) {
        indicator.classList.remove("active");
    });


    // Ativa o slide atual
    slides[currentSlide].classList.add("active");


    // Ativa a bolinha correspondente
    if (indicators[currentSlide]) {
        indicators[currentSlide].classList.add("active");
    }
}


// =====================================================
// PRÓXIMO SLIDE
// =====================================================

function nextSlide() {

    showSlide(currentSlide + 1);

    restartCarousel();
}


// =====================================================
// SLIDE ANTERIOR
// =====================================================

function previousSlide() {

    showSlide(currentSlide - 1);

    restartCarousel();
}


// =====================================================
// BOTÃO "PRÓXIMO"
// =====================================================

if (nextButton) {

    nextButton.addEventListener("click", function() {

        nextSlide();

    });
}


// =====================================================
// BOTÃO "ANTERIOR"
// =====================================================

if (previousButton) {

    previousButton.addEventListener("click", function() {

        previousSlide();

    });
}


// =====================================================
// INDICADORES
// =====================================================

indicators.forEach(function(indicator, index) {

    indicator.addEventListener("click", function() {

        showSlide(index);

        restartCarousel();

    });

});


// =====================================================
// CARROSSEL AUTOMÁTICO
// =====================================================

function startCarousel() {

    carouselInterval = setInterval(function() {

        showSlide(currentSlide + 1);

    }, carouselTime);
}


// =====================================================
// REINICIAR CONTADOR
// =====================================================

function restartCarousel() {

    clearInterval(carouselInterval);

    startCarousel();
}


// =====================================================
// INICIAR
// =====================================================

showSlide(0);

startCarousel();
