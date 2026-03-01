function animateCounter(id, target){
    let count = 0;
    let speed = 20;
    let update = setInterval(function(){
        count++;
        document.getElementById(totalcount).innerText = count;
        if(count >= target){
            clearInterval(update);
        }
    }, speed);
}

animateCounter("rescueCount",);
animateCounter("pendingCount",);
animateCounter("resolvedCount",);