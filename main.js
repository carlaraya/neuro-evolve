var canvas = document.getElementById('mainCanvas');
var ctx = canvas.getContext('2d');
var pipeSpacing = 200;
var pipeWidth = 100;
var pipeGapSize = 200;
var birdxPos = 100;
var birdDefaultYVel = 15;
var birdGravity = -1;
var groundHeight = 50;


function Pipe() {
    this.gapPos = Math.random() * (canvas.height - pipeGapSize - groundHeight);
    this.xPos = canvas.width + pipeWidth;
    this.draw = function(){
        ctx.fillStyle = "#00AF00";
        ctx.fillRect(this.xPos, this.gapPos + pipeGapSize,
                pipeWidth, canvas.height - (this.gapPos + pipeGapSize));
        ctx.fillRect(this.xPos, 0,
                pipeWidth, this.gapPos);
    }
    this.update = function(){
        this.xPos += -3;
    }
}

function Bird() {
    this.yPos = 300;
    this.yVel = birdDefaultYVel;
    this.flap = function(){
        this.yVel = birdDefaultYVel;
    }
    this.draw = function(){
        ctx.beginPath();
        ctx.arc(birdxPos, this.yPos, 20, 0, 2*Math.PI, false);
        ctx.fillStyle = "#DF2222";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000000";
        ctx.stroke();
    }
    this.update = function(){
        this.yVel += birdGravity;
        this.yPos -= this.yVel;
    }
}

var pipes = [];
pipes.push(new Pipe());

var bird = new Bird();

document.addEventListener('click', function() {
    bird.flap();
}, false);
var isFlapped = false;
document.addEventListener('keydown', function(e) {
    if (e.keyCode == 32) {
        if (!isFlapped) {
            bird.flap();
            isFlapped = true;
        }
    }
}, true);
document.addEventListener('keyup', function(e) {
    isFlapped = false;
}, true);

function loop() {
    // LOGIC
    if (pipes[pipes.length - 1].xPos < canvas.width - pipeSpacing) {
        pipes.push(new Pipe());
    }
    if (pipes[0].xPos < -pipeWidth) {
        pipes.shift();
    }
    for (var i = 0; i < pipes.length; i++) {
        pipes[i].update();
    }
    bird.update();

    // RENDERING
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < pipes.length; i++) {
        pipes[i].draw();
    }
    bird.draw();
    ctx.fillStyle="#9F5F00";
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
}
setInterval(loop, 20);
