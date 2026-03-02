function animateCounter(id, target) {
    let count = 0;
    let speed = 20;

    let update = setInterval(function () {
        count++;
        document.getElementById(id).innerText = count;

        if (count >= target) {
            clearInterval(update);
        }
    }, speed);
}

// For now give some default values
animateCounter("rescueCount", 10);
animateCounter("pendingCount", 5);
animateCounter("resolvedCount", 3);