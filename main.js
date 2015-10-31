var canvas = document.getElementById('mainCanvas');
var ctx = canvas.getContext('2d');
var pipeSpacing = 300;
var score = 0.0;
var groundHeight = 50;

function is_collide(bird, pipe) {
    return bird.X_POS + bird.RADIUS >= pipe.xPos
        && bird.X_POS <= pipe.xPos + pipe.WIDTH
        && (bird.yPos + bird.RADIUS >= pipe.GAP_POS + pipe.GAP_SIZE
        || bird.yPos - bird.RADIUS <= pipe.GAP_POS);
}

function draw_score() {
    ctx.font = "48px serif";
    ctx.fillStyle = "#FF0000";
    ctx.fillText(score.toFixed(1).toString(), 10, 50);
}


function game_over() {
    alert("DEAD: Score = " + score.toFixed(1).toString());
    init();
}

function init() {
    pipes = [];
    pipes.push(new Pipe(ctx, canvas.width, canvas.height));
    bird = new Bird(ctx, canvas.width, canvas.height);
    ground = new Ground(ctx, canvas.width, canvas.height, groundHeight);
    score = 0;
}

var pipes;
var bird;
var ground;

init();

canvas.addEventListener('click', function() {
    bird.flap();
}, false);
window.addEventListener('keydown', function(e) {
    if (e.keyCode == 74) {
        bird.flap();
    }
}, true);
window.addEventListener('keyup', function(e) {
    bird.release();
}, true);
function loop() {
    // LOGIC
    // ai_stuff
    for (var i = 0; i < pipes.length; i++) {
        if (is_collide(bird, pipes[i])) {
            game_over();
        }
    }
    if (bird.yPos + bird.RADIUS >= canvas.height - ground.HEIGHT) {
        game_over();
    }

    score += 0.1;
    
    if (pipes[pipes.length - 1].xPos < canvas.width - pipeSpacing) {
        pipes.push(new Pipe(ctx, canvas.width, canvas.height));
    }
    if (pipes[0].xPos < -pipes[0].WIDTH) {
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
    ground.draw();
    draw_score();
}
setInterval(loop, 20);



function Pipe(ctx, canvasWidth, canvasHeight) {
    this.WIDTH = 100;
    this.GAP_SIZE = 200;
    this.GAP_POS = Math.random() *
        (canvasHeight - this.GAP_SIZE - groundHeight);

    this.xPos = canvasWidth;
    this.draw = function(){
        ctx.fillStyle = "#00AF00";
        ctx.fillRect(this.xPos, this.GAP_POS+ this.GAP_SIZE,
                this.WIDTH, canvasHeight - (this.GAP_POS+ this.GAP_SIZE));
        ctx.fillRect(this.xPos, 0,
                this.WIDTH, this.GAP_POS);
    }
    this.update = function(){
        this.xPos += -3;
    }
}

function Bird(ctx, canvasWidth, canvasHeight) {
    this.X_POS = canvasWidth / 4;
    this.RADIUS = 20;
    this.DEFAULT_Y_VEL = 15;
    this.GRAVITY = -1;

    this.yPos = canvasHeight / 2;
    this.yVel = this.DEFAULT_Y_VEL;
    this.isFlapped = false;
    this.flap = function(){
        if (!this.isFlapped)
        {
            this.yVel = this.DEFAULT_Y_VEL;
            this.isFlapped = true;
        }
    }
    this.release = function(){
        this.isFlapped = false;
    }
    this.draw = function(){
        ctx.beginPath();
        ctx.arc(this.X_POS, this.yPos, this.RADIUS, 0, 2*Math.PI, false);
        ctx.fillStyle = "#DF2222";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000000";
        ctx.stroke();
    }
    this.update = function(){
        this.yVel += this.GRAVITY;
        this.yPos -= this.yVel;
    }
}

function Ground(ctx, canvasWidth, canvasHeight, groundHeight) {
    this.HEIGHT = groundHeight;
    this.draw = function(){
        ctx.fillStyle="#9F5F00";
        ctx.fillRect(0, canvasHeight - this.HEIGHT, canvasWidth, this.HEIGHT);
    }
}
