/*
 * TODO: Test gen alg for bugs
 * TODO: Test neural inputs for bugs
 */
pipes = 0;
bird = 0;
ground = 0;
outputs = [];
population = [];
popScores = [];

isPaused = false;

var canvas = document.getElementById('mainCanvas');
var ctx = canvas.getContext('2d');
var pipeSpacing = 300;
var score = 0.0;
var groundHeight = 50;

var playerHighScore = 0;

var popSize = 20;
var tourneySize = 20;
var generation = 0;
var creature = 0;

var A = 8;
var B = 1;
var C = 0;
var D = 8;

function toggle_mode() {
    aiOn = !aiOn;
    isPaused = false;
    init_button_text();
    init_environment();
    if (population.length == 0) {
        init_simulation();
    }
    if (!aiOn) {
        document.getElementById("scores-list").innerHTML = "";
    }
}

function init_button_text() {
    if (aiOn) {
        document.getElementById("toggle-mode").innerHTML = "Switch to 1-player";
    } else {
        document.getElementById("toggle-mode").innerHTML = "Switch to 0-player";
    }
}

function is_collide(bird, pipe) {
    return bird.X_POS + bird.RADIUS >= pipe.xPos
        && bird.X_POS <= pipe.xPos + pipe.WIDTH
        && (bird.yPos + bird.RADIUS >= pipe.GAP_POS + pipe.GAP_SIZE
        || bird.yPos - bird.RADIUS <= pipe.GAP_POS);
}

function draw_stats() {
    ctx.font = "48px serif";
    ctx.fillStyle = "#FF0000";
    ctx.fillText(score.toFixed(1).toString(), 10, 50);
    ctx.font = "18px arial";
    ctx.fillStyle = "#000000";
    if (aiOn) {
        ctx.fillText("Generation " + generation.toString(), 10, 70);
        ctx.fillText("Creature " + (creature+1).toString(), 10, 90);
    } else {
        ctx.fillText("Highscore " + playerHighScore.toFixed(1).toString(), 10, 70);
    }
}

function draw_output_line() {
    ctx.beginPath();
    ctx.moveTo(0, outputs[0] * canvas.height + bird.RADIUS * 2);
    ctx.lineTo(canvas.width, outputs[0] * canvas.height + bird.RADIUS * 2);
    ctx.stroke();
}

function game_over() {
    ctx.font = "24px arial";
    ctx.fillStyle = "#000000";
    ctx.fillText("DEAD (Press space)", 10, canvas.height / 2);
    isPaused = true;
    if (score > playerHighScore) {
        playerHighScore = score;
    }
    init_environment();
}

function init_environment() {
    pipes = [];
    pipes.push(new Pipe(ctx, canvas.width, canvas.height));
    bird = new Bird(ctx, canvas.width, canvas.height);
    score = 0;

}

function move_on_to_next() {
    popScores.push(score);
    //console.log(popScores);

    listHtml = "<ol>";
    for (var i = 0; i < popScores.length; i++) {
        listHtml += "<li>" + popScores[i].toFixed(1).toString() + "</li>";
    }
    listHtml += "</ol>";
    document.getElementById("scores-list").innerHTML = listHtml;

    creature++;
    if (creature == popSize) {
        creature = 0;
        generation++;

        // gen alg goes here. delete the stuff after this
        newPopulation = [];
        for (var i = 0; i < popSize / 2; i++) {
            var prnts = [];
            var prntsWeights = [];
            for (var prnt = 0; prnt < 2; prnt++) {
                var battlers = random_nums(popSize, tourneySize);
                var bestGuy = 0;
                var bestGuyScore = 0;
                for (var j = 0; j < tourneySize; j++) {
                    if (popScores[battlers[j]] > bestGuyScore) {
                        bestGuy = battlers[j];
                        bestGuyScore = popScores[battlers[j]];
                    }
                }
                prnts.push(new NeuralNet(A, B, C, D));
                prntsWeights.push(population[bestGuy].get_weights());
                prnts[prnt].set_weights(prntsWeights[prnt]);
            }

            for (var j = 0; j < prntsWeights[0].length; j++) {
                // crossover
                if (Math.random() < 0.1) {
                    var tmp = prntsWeights[0][j];
                    prntsWeights[0][j] = prntsWeights[1][j];
                    prntsWeights[1][j] = tmp;
                }

                // mutation
                for (var child = 0; child < 2; child++) {
                    if (Math.random() < 0.12) {
                        prntsWeights[child][j] = Math.random() * 2 - 1;
                    }
                }
            }

            //console.log(prntsWeights[0]);
            //console.log(prntsWeights[1]);
            prnts[0].set_weights(prntsWeights[0]);
            prnts[1].set_weights(prntsWeights[1]);
            newPopulation.push(prnts[0]);
            newPopulation.push(prnts[1]);
        }
        if (popSize % 2 == 1) {
            newPopulation.pop();
        }
        population = newPopulation;
        popScores = [];
        /*
        population = [];
        for (var i = 0; i < popSize; i++) {
            population.push(new NeuralNet(8, 1, 0, 8));
        }
        */
        
    }
} 

function init_new() {
    init_environment();
    init_button_text();
    ground = new Ground(ctx, canvas.width, canvas.height, groundHeight);
    if (aiOn) {
        init_simulation();
    }
}

function init_simulation() {
    creature = 0;
    for (var i = 0; i < popSize; i++) {
        population.push(new NeuralNet(A, B, C, D));
    }
}


init_new();

canvas.addEventListener('click', function() {
    if (!aiOn) {
        bird.flap();
        bird.release();
    }
}, false);

window.addEventListener('keydown', function(e) {
    if (!aiOn) {
        if (e.keyCode == 74) {
            bird.flap();
        }
        if (e.keyCode == 32) {
            isPaused = false;
        }
    }

}, true);
window.addEventListener('keyup', function(e) {
    if (!aiOn) {
        bird.release();
    }
}, true);
function loop() {
    if (isPaused) return;
    // LOGIC
    // ai_stuff
    if (aiOn) {
        var inputs = [];
        inputs.push(bird.yPos / canvas.height * 2 - 1);
        inputs.push(bird.yVel / 50);
        var i;
        for (i = 0; pipes[i].xPos + pipes[i].WIDTH < bird.X_POS; i++);

        var first = i;
        while (i - first < 3 &&  i < pipes.length) {
            inputs.push(pipes[i].xPos / canvas.width * 2 - 1);
            inputs.push(pipes[i].GAP_POS / canvas.height * 2 - 1);
            i++;
        }
        if (i - first < 3) {
            for (; i - first < 3; i++) {
                inputs.push(-1);
                inputs.push(-1);
            }
        }
        outputs = population[creature].update(inputs);
        console.log(inputs);
        //console.log(outputs);

        // interpret output
        /*
        if (outputs[0] > 0.5) {
            bird.flap();
        } else {
            bird.release();
        }
        */
        if (outputs[0] * canvas.height < bird.yPos) {
            bird.flap();
            bird.release();
        }
    }
    // check if bird died
    for (var i = 0; i < pipes.length; i++) {
        if (is_collide(bird, pipes[i])) {
            if (aiOn) {
                move_on_to_next();
                init_environment();
            } else {
                game_over();
            }
        }
    }
    if (bird.yPos + bird.RADIUS >= canvas.height - ground.HEIGHT) {
        if (aiOn) {
            move_on_to_next();
            init_environment();
        } else {
            game_over();
        }
    }

    if (!isPaused) {
        score += 0.1;

        // update environment
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
        draw_stats();

        if (aiOn) {
            draw_output_line();
        }

    }
    
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


// randomly select k unique ints in the range [0, n)
function random_nums(n, k) {
    var nums = [];
    var randoms = [];
    for (var i = 0; i < n; i++) {
        nums.push(i);
    }
    for (var i = 0; i < k; i++) {
        var numPick = (Math.random() * (n - i) + i) | 0;
        randoms.push(nums[numPick]);
        var tmp = nums[numPick];
        nums[numPick] = nums[i];
        nums[i] = tmp;
    }
    //console.log(randoms);
    return randoms;
}
