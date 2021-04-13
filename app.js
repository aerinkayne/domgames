document.addEventListener('DOMContentLoaded', ()=> {
    const doodler = document.getElementById('doodler');
    const gameScreen = document.getElementById('gameScreen');
    const counterDisplay = document.getElementById('counter');

    const GAMEW = 400;
    const GAMEH = 600;
    const CHARW = 40;   
    const MINPLATFORMW = 60;
    const PLATFORMVARIANCE = 20;
    const PLATFORMH = 13;
    const PLATFORMSPEED = 1;
    const PLATFORMSPACING = 150;
    const GRAVITY = 0.4;       //grav acceleration per interval
    const JUMP_V = 12;
    const RUNSPEED = 1;         //run acceleration per interval
    const GROUNDFRICTION = 0.5; //run stop deceleration
    const AIRFRICTION = 0.05;
    const MAXRUNSPEED = 4;
    const MAXFALLSPEED = 3;

    let isMovingLeft = false;
    let isMovingRight = false;
    let isFacingRight = null;
    
    let Vx = 0;  //char x velocity
    let Vy = 0;  //used for character y velocity
    let Px = 0;  //used for char x position
    let Py = 0;  //used for char y position

    let arrPlatforms = [];
    let canJump = true;
    let platformCount = 0; 

    const moveRight = ()=> {
        if(Vx < MAXRUNSPEED) {
            Vx += RUNSPEED;
            if(Vx > MAXRUNSPEED){
                Vx = MAXRUNSPEED;
            }
        }
    }
    const moveLeft = ()=> {
        if(Vx > -MAXRUNSPEED) {
            Vx -= RUNSPEED;
            if(Vx < -MAXRUNSPEED){
                Vx = -MAXRUNSPEED;
            }
        }
    }
    const applyFriction = (friction) => {  
        if (Vx === 0) return;
        isFacingRight = Vx > 0;
        Vx > 0 ? Vx -= friction : Vx += friction;
        // if Vx has changed sign, set Vx = 0 (stop),
        if (isFacingRight !== Vx > 0) {Vx = 0}
    }
    const jump = ()=> {
        canJump = false;
        Vy = -JUMP_V;
    }
    
    const updateVelocities = () => {
        if (isMovingRight){
            moveRight();
        }
        if (isMovingLeft) {
            moveLeft();
        }
        //slow down if not actively moving L or R
        if (canJump && (!isMovingLeft && !isMovingRight)){ 
            applyFriction(GROUNDFRICTION);
        }
        if (!canJump && (!isMovingLeft && !isMovingRight)){
            applyFriction(AIRFRICTION);
        }
        //update Vy if falling.
        if (!canJump && Vy < MAXFALLSPEED){
            Vy += GRAVITY;
            if (Vy > MAXFALLSPEED){
                Vy = MAXFALLSPEED;
            }
        }
    }

    //event keyup
    const stopRunning = ({ keyCode }) => {   
        if(keyCode === 81) {
            isMovingLeft = false;
        }
        if(keyCode === 69) {
            isMovingRight = false;
        }
    }
    //event keydown
    const controls = ({ keyCode })=> {     
        if(keyCode === 32 && canJump){    //spacebar
            jump(); 
        }
        if(keyCode === 81){   //Q 
            isMovingLeft = true; 
        }
        if(keyCode === 69){   //E 
            isMovingRight = true;
        }
    }
    document.addEventListener('keydown', controls);
    document.addEventListener('keyup', stopRunning);

    const hasCollided = (doodler, platform)=> {
        let doodlerBtm = parseInt(doodler.style.bottom);
        let doodlerLeft = parseInt(doodler.style.left);
        let platformBtm = parseInt(platform.style.bottom);
        let platformLeft = parseInt(platform.style.left);
        let platW = parseInt(platform.style.width);
        //only collide from above
        return (Vy >= 0 && 
            doodlerBtm >= platformBtm && doodlerBtm <= platformBtm + PLATFORMH && 
            doodlerLeft + CHARW >= platformLeft && doodlerLeft <= platformLeft + platW);
    } 

    const addPlatform = (height) => { 
        const newPlatform = document.createElement('div');
        newPlatform.style.width = `${MINPLATFORMW + Math.ceil(PLATFORMVARIANCE*Math.random())}px`;
        newPlatform.style.bottom = `${height}px`;  //new platform at top of gameScreen
        newPlatform.style.left = `${parseInt((GAMEW-MINPLATFORMW)*Math.random())}px`;  
        newPlatform.classList.add('platform');
        newPlatform.style.filter = `hue-rotate(${360*Math.random()}deg)`;
        gameScreen.appendChild(newPlatform);
        arrPlatforms.push(newPlatform);
    }

    //run within interval if there are not yet any platforms
    const createPlatforms = ()=> {
        for (let i = 0; i*PLATFORMSPACING < GAMEH; i++ ){
            addPlatform(i*PLATFORMSPACING);
        }
        //put player on first platform created 
        Px = parseInt(arrPlatforms[0].style.left);
        Py = parseInt(arrPlatforms[0].style.bottom) + PLATFORMH;
    }

    const updatePlatforms = ()=> {
        arrPlatforms.forEach(platform => {
            if (hasCollided(doodler, platform)){ 
                doodler.style.bottom = parseInt(platform.style.bottom) + PLATFORMH + 'px';
                Vy = 0;
                canJump = true;
                if (!platform.classList.contains('tagged')){
                    platform.classList.add('tagged');
                    platformCount++;
                }
            } 
            if (Py > 100){
                //if char is on the platform while it's moving, adjust Py too.
                if (canJump && Py === parseInt(platform.style.bottom) + PLATFORMH){
                    Py -= PLATFORMSPEED; //relative to bottom origin
                }
                platform.style.bottom = parseInt(platform.style.bottom) - PLATFORMSPEED + 'px';
            }
            //remove platforms that scroll off bottom, create new platform at top
            if (parseInt(platform.style.bottom) < -PLATFORMH){  
                gameScreen.removeChild(platform);
                arrPlatforms.shift();
                addPlatform(GAMEH); 
            }
        });
    }

    const checkBoundaries = () => {
        //check if char is beyond sides of gameScreen and adjust P, V if so.
        if(Px > GAMEW - CHARW){
            Px = GAMEW - CHARW;
            Vx = 0;
        }
        if(Px < 0){
            Px = 0;
            Vx = 0;
        }
    }

    let timerID = setInterval(() => { //18ms, ~55 calls/sec
        if(!arrPlatforms.length){     //initial platform setup
            createPlatforms();
        }
        updateVelocities();
        Px += Math.round(Vx);         //update char position
        Py += -Math.round(Vy); //negative because position is relative to bottom.
        canJump = false;
        updatePlatforms(); //collision check and repositioning.
        checkBoundaries(); //border bounds check
        
        doodler.style.bottom = `${Py}px`;
        doodler.style.left = `${Px}px`;
        counterDisplay.innerText = platformCount;
    }, 18);
});