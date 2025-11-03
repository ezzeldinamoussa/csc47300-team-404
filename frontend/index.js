document.addEventListener('DOMContentLoaded', () => {
    
    const mascot = document.getElementById('signup-mascot');

    if (mascot) {
        
        setTimeout(() => {
            mascot.classList.add('visible'); 
        }, 2000); 

        mascot.addEventListener('click', () => {
            window.location.href = 'signup.html'; 
        });
    }

});