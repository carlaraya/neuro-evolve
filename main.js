looperVar = 0;

pipes = [];
pipeNums = [];
bird = 0;
birds = [];
ground = 0;
outputs = [];
population = [];
popScores = [];
birdsRemaining = 0;


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

var crossoverRate = 0.05;
var mutationRate = 0.20;

var A = 4;
var B = 1;
var C = 1;
var D = 2;

for (var i = 0; i < popSize; i++) {
    popScores.push(0);
}

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
    } else {
        ctx.fillText("Highscore " + playerHighScore.toFixed(1).toString(),
                10, 70);
    }
}

function draw_output_line() {
    ctx.beginPath();
    ctx.moveTo(0, outputs[0] * canvas.height + bird.RADIUS * 2);
    ctx.lineTo(canvas.width, outputs[0] * canvas.height + bird.RADIUS * 2);
    ctx.stroke();
}

function draw_scoreboard() {
    listHtml = "<ol>";
    for (var i = 0; i < popScores.length; i++) {
        listHtml += "<li>";
        if (popScores[i] != 0) {
            listHtml += popScores[i].toFixed(1).toString();
        }
        listHtml += "</li>";
    }
    listHtml += "</ol>";
    document.getElementById("scores-list").innerHTML = listHtml;
}

function game_over() {
    ctx.font = "24px arial";
    ctx.fillStyle = "#000000";
    ctx.fillText("DEAD (Press space)", 30, canvas.height / 2);
    isPaused = true;
    if (score > playerHighScore) {
        playerHighScore = score;
    }
    init_environment();
}

function init_environment() {
    pipes = [];
    birds = [];
    pipeNums = [];
    pipes.push(new Pipe(ctx, canvas.width, canvas.height));
    pipeNums.push(1);
    if (aiOn) {
        for (var i = 0; i < popSize; i++) {
            birds.push(new Bird(ctx, canvas.width, canvas.height));
        }
        birdsRemaining = popSize;
    } else {
        bird = new Bird(ctx, canvas.width, canvas.height);
    }
    score = 0;

}

function move_on_to_next() {
    //console.log(popScores);


    generation++;
    // run genetic algorithm
    //gen_alg_meh();
    gen_alg_1best();
    init_environment();
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
        } else if (e.keyCode == 32) {
            isPaused = false;
        }
    }
    if (e.keyCode == 75) {
        turbo = !turbo;
        //turboChanged = true;
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
        for (var k = 0; k < popSize; k++) {
            if (birds[k] != 0) {
                // get inputs
                var inputs = [];
                inputs.push(birds[k].yPos / canvas.height * 2 - 1);
                inputs.push(birds[k].yVel / 50);
                var i;
                for (i = 0; pipes[i].xPos + pipes[i].WIDTH < birds[k].X_POS; i++);

                if (pipes[i]) {
                    inputs.push(pipes[i].xPos / canvas.width * 2 - 1);
                    inputs.push(pipes[i].GAP_POS / canvas.height * 2 - 1);
                } else {
                    inputs.push(0);
                    inputs.push(0);
                }
                outputs = population[k].update(inputs);
                //console.log(inputs);
                //console.log(outputs);

                // interpret output
                if (outputs[0] > 0.5) {
                    birds[k].flap();
                } else {
                    birds[k].release();
                }
            }
        }
    }
    // check if bird/s died
    if (aiOn) {
        for (var k = 0; k < popSize; k++) {
            if (birds[k] != 0) {
                for (var i = 0; i < pipes.length; i++) {
                    if (is_collide(birds[k], pipes[i])) {
                        birds[k] = 0;
                        popScores[k] = score;
                        birdsRemaining--;
                        draw_scoreboard();
                    }
                }
                if (birds[k].yPos + birds[k].RADIUS >= canvas.height - ground.HEIGHT) {
                    birds[k] = 0;
                    popScores[k] = score;
                    birdsRemaining--;
                    draw_scoreboard();
                }
            }
        }
        if (birdsRemaining == 0) {
            move_on_to_next();
        }
    } else {
        for (var i = 0; i < pipes.length; i++) {
            if (is_collide(bird, pipes[i])) {
                game_over();
            }
        }
        if (bird.yPos + bird.RADIUS >= canvas.height - ground.HEIGHT) {
            game_over();
        }
    }

    if (!isPaused) {
        score += 0.1;

        // update environment
        if (pipes[pipes.length - 1].xPos < canvas.width - pipeSpacing) {
            pipes.push(new Pipe(ctx, canvas.width, canvas.height));
            pipeNums.push(pipeNums[pipeNums.length - 1] + 1);
        }
        if (pipes[0].xPos < -pipes[0].WIDTH) {
            pipes.shift();
            pipeNums.shift();
        }

        for (var i = 0; i < pipes.length; i++) {
            pipes[i].update();
        }
        if (aiOn) {
            for (var k = 0; k < popSize; k++) {
                if (birds[k] != 0) {
                    birds[k].update();
                }
            }
        } else {
            bird.update();
        }

        // RENDERING

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!turbo) {
            for (var i = 0; i < pipes.length; i++) {
                pipes[i].draw();
                ctx.font = "24px arial";
                ctx.fillStyle = "#000000";
                ctx.fillText(pipeNums[i].toString(), pipes[i].xPos - 50, 25);
            }

            if (aiOn) {
                for (var k = 0; k < popSize; k++) {
                    if (birds[k] != 0) {
                        birds[k].draw();
                    }
                }
            } else {
                bird.draw();
            }
            ground.draw();
            /*
            if (aiOn) {
                draw_output_line();
            }
            */
            draw_stats();
        }


    }
    
}

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
        this.xPos += -4;
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
        if (aiOn) {
            ctx.globalAlpha=0.2;
        }
        ctx.beginPath();
        ctx.arc(this.X_POS, this.yPos, this.RADIUS, 0, 2*Math.PI, false);
        ctx.fillStyle = "#DF2222";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000000";
        ctx.stroke();
        if (aiOn) {
            ctx.globalAlpha=1;
        }
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

// Returns random numbers in the range [-1, 1) distributed normally
function random_normal() {
    var accuracy = 6;
    var n = 0;
    for (var i = 0; i < accuracy; i++) {
        n += Math.random();
    }
    n /= (accuracy / 2);
    n -= 1;
    return n;
}

function random_normal_offset(offset) {
    var n;
    do
    {
        n = random_normal() + offset;
    } while (n >= 1 || n < -1);
    return n;
}

/*
 * Mehhh gen alg. Picks best guy, then does random mutations based on
 * mutation rate.
 */
function gen_alg_meh() {
    newPopulation = [];
    for (var i = 0; i < (popSize + 1) / 2; i++) {
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
            // crossover (does nothing if tourney size is same as pop size)
            if (Math.random() < crossoverRate) {
                var tmp = prntsWeights[0][j];
                prntsWeights[0][j] = prntsWeights[1][j];
                prntsWeights[1][j] = tmp;
            }

            // mutation
            for (var child = 0; child < 2; child++) {
                if (Math.random() < mutationRate) {
                    prntsWeights[child][j] =
                        random_normal_offset(prntsWeights[child][j]);
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
    for (var i = 0; i < popSize; i++) {
        popScores.push(0);
    }
}

/*
 * Another gen alg. Selects 2 best guys that will live to the next generation.
 * They will also be parents of every other creatures in next gen.
 */
function gen_alg_2best() {
    var newPop = [];
    var newPopWeights = [];
    var bestGuy = -1;
    var bestGuyScore = 0;
    var bestGuy2nd = -1;
    var bestGuyScore2nd = 0;
    for (var i = 0; i < popSize; i++) {
        if (popScores[i] >= bestGuyScore) {
            bestGuy = i;
            bestGuyScore = popScores[i];
        }
    }

    for (var i = 0; i < popSize; i++) {
        if (popScores[i] >= bestGuyScore2nd && i != bestGuy) {
            bestGuy2nd = i;
            bestGuyScore2nd = popScores[i];
        }
    }

    newPop.push(new NeuralNet(A, B, C, D));
    newPopWeights.push(population[bestGuy].get_weights());
    newPop[0].set_weights(newPopWeights[0]);
    newPop.push(new NeuralNet(A, B, C, D));
    newPopWeights.push(population[bestGuy2nd].get_weights());
    newPop[1].set_weights(newPopWeights[1]);

    for (var i = 2; i < popSize; i += 2) {
        newPop.push(new NeuralNet(A, B, C, D));
        newPopWeights.push(newPop[0].get_weights());
        newPop.push(new NeuralNet(A, B, C, D));
        newPopWeights.push(newPop[1].get_weights());

        for (var j = 0; j < newPopWeights[i].length; j++) {
            // crossover
            if (Math.random() < crossoverRate) {
                var tmp = newPopWeights[i][j];
                newPopWeights[i][j] = newPopWeights[i+1][j];
                newPopWeights[i+1][j] = tmp;
            }

            // mutation
            for (var child = i; child < i+2; child++) {
                if (Math.random() < mutationRate) {
                    newPopWeights[child][j] =
                        random_normal_offset(newPopWeights[child][j]);
                }
            }
        }
        newPop[i].set_weights(newPopWeights[i]);
        newPop[i+1].set_weights(newPopWeights[i+1]);
    }
    if (popSize % 2 == 1) {
        newPop.pop();
    }
    population = newPop;
    popScores = [];
    for (var i = 0; i < popSize; i++) {
        popScores.push(0);
    }
}
function gen_alg_1best() {
    var newPop = [];
    var newPopWeights = [];
    var bestGuy = -1;
    var bestGuyScore = 0;
    for (var i = 0; i < popSize; i++) {
        if (popScores[i] >= bestGuyScore) {
            bestGuy = i;
            bestGuyScore = popScores[i];
        }
    }
    newPop.push(new NeuralNet(A, B, C, D));
    newPopWeights.push(population[bestGuy].get_weights());
    newPop[0].set_weights(newPopWeights[0]);
    for (var i = 1; i < popSize; i++) {
        newPop.push(new NeuralNet(A, B, C, D));
        newPopWeights.push(newPop[0].get_weights());

        for (var j = 0; j < newPopWeights[i].length; j++) {
            // mutation
            if (Math.random() < mutationRate) {
                newPopWeights[i][j] = Math.random() * 2 - 1;
                    //random_normal_offset(newPopWeights[child][j]);
                }
        }
        newPop[i].set_weights(newPopWeights[i]);
    }
    population = newPop;
    popScores = [];
    for (var i = 0; i < popSize; i++) {
        popScores.push(0);
    }
}


setInterval(loop, 20);
