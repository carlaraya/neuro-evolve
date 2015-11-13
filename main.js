/*
 * TODO: Make table for each trial
 * TODO: Add another output for threshold (so it's not always 0.5)
 * TODO: Try modifying L
 */

pipes = [];
pipeNums = [];
bird = 0;
birds = [];
ground = 0;
outputs = [];
population = [];
popScores = [];
allPopScores = [];
trialScores = [];
birdsRemaining = 0;

genHighestScore = 0;
highScores = [];


isPaused = false;

var canvas = document.getElementById('mainCanvas');
var ctx = canvas.getContext('2d');
var pipeSpacing = 300;
var score = 0.0;
var groundHeight = 50;

var playerHighScore = 0;

var popSize = 20;
var generation = 0;
var trial = 0;
var numTrials = 3;

var crossoverRate = 0.05;
var mutationRate = 0.05;


var A = 4;
var B = 1;
var C = 1;
var D = 5;

for (var i = 0; i < popSize; i++) {
    popScores.push(0);
    trialScores.push(0);
}

function export_save() {
    if (aiOn) {
        var text = generation.toString() + " ";
        for (var i = 0; i < popSize; i++) {
            weights = population[i].get_weights();
            for (var j = 0; j < weights.length; j++) {
                text += weights[j] + " ";
            }
        }

        window.prompt("Press ctrl+c to copy save data, then press enter.", text);
    }
}

function import_save() {
    if (aiOn) {
        var text = window.prompt("Paste save data here");
        var nums = text.split(" ").map(Number);
        var k = 1;
        temppop = [];
        for (var i = 0; i < popSize; i++) {
            temppop.push(new NeuralNet(A, B, C, D));
            var numWeights = temppop[i].get_weights().length;
            var weights = [];
            for (var j = 0; j < numWeights; j++) {
                if (k >= nums.length)
                {
                    alert("Error: Invalid data");
                    return;
                }
                weights.push(nums[k++]);
            }
            temppop[i].set_weights(weights);
        }
        for (var i = 0; i < popSize; i++) {
            population[i] = temppop[i];
        }

        popScores = [];
        for (var i = 0; i < popSize; i++) {
            popScores.push(0);
        }
        trial = 0;
        generation = nums[0];
        init_environment();
        draw_highscoreboard();
    }
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
        document.getElementById("creature-scores").innerHTML = "";
    }
}


function init_button_text() {
    if (aiOn) {
        document.getElementById("toggle-mode").innerHTML = "Switch to 1-player";
        document.getElementById("export-save").innerHTML = "Export save data";
        document.getElementById("import-save").innerHTML = "Import save data";
    } else {
        document.getElementById("toggle-mode").innerHTML = "Switch to 0-player";
        document.getElementById("export-save").innerHTML = "";
        document.getElementById("import-save").innerHTML = "";
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
        ctx.fillText("0-player mode", canvas.width - 115, canvas.height - 10);
        ctx.fillText("Generation " + (generation + 1).toString(), 10, 70);
        ctx.fillText("Trial " + (trial + 1).toString(), 10, 90);
    } else {
        ctx.fillText("1-player mode", canvas.width - 115, canvas.height - 10);
        ctx.fillText("Highscore " + playerHighScore.toFixed(1).toString(),
                10, 70);
    }
}

function draw_scoreboard() {
    listHtml = "<ol>";
    for (var i = 0; i < popScores.length; i++) {
        listHtml += "<li>";
        if (trialScores[i] != 0) {
            listHtml += trialScores[i].toFixed(1).toString();
        }
        listHtml += "</li>";
    }
    listHtml += "</ol>";
    document.getElementById("creature-scores").innerHTML = listHtml;
}

function draw_highscoreboard() {
    listHtml = "<ol>";
    for (var i = 0; i < highScores.length; i++) {
        listHtml += "<li>";
        listHtml += highScores[i].toFixed(1).toString();
        listHtml += "</li>";
    }
    listHtml += "</ol>";
    document.getElementById("gen-scores").innerHTML = listHtml;
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
    for (var i = 0; i < popSize; i++) {
        if (trialScores[i] > genHighestScore) {
            genHighestScore = trialScores[i];
        }
        popScores[i] += trialScores[i];
        trialScores[i] = 0;
    }
    trial++;
    if (trial == numTrials) {
        highScores.push(genHighestScore);
        genHighestScore = 0;
        for (var i = 0; i < popSize; i++) {
            popScores[i] /= numTrials;
        }
        generation++;
        trial = 0;
        //genalg_cosyne();
        genalg_basic();
    }
    init_environment();
    draw_highscoreboard();
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
    if (e.keyCode == 80) {
        isPaused = !isPaused;
        if (isPaused) {
            ctx.font = "24px arial";
            ctx.fillStyle = "#000000";
            ctx.fillText("PAUSED", canvas.width / 2 - 60, canvas.height / 2);
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
                    inputs.push(1);
                    inputs.push(1);
                }
                outputs = population[k].update(inputs);
                //console.log(inputs);
                //console.log(outputs);

                // interpret output
                /*
                if (outputs[0] * canvas.height < birds[k].yPos + birds[k].RADIUS)
                {
                    birds[k].flap();
                    birds[k].release();
                }
                */
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
                        trialScores[k] = score;
                        birdsRemaining--;
                        draw_scoreboard();
                    }
                }
                if (birds[k].yPos + birds[k].RADIUS >= canvas.height - ground.HEIGHT) {
                    birds[k] = 0;
                    trialScores[k] = score;
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

function random_weighted(n) {
    var randnum = Math.random() * n * (n + 1) / 2;
    var total = 0;
    for (var i = n; i > 0; i--) {
        total += i;
        if (randnum < total) {
            return n - i;
        }
    }
}

// http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
}

// http://www.jmlr.org/papers/volume9/gomez08a/gomez08a.pdf
function genalg_cosyne() {
    var quarter = (popSize) / 4 | 0;
    var L = (popSize) / 4 | 0;
    var popAndScores = [];
    for (var i = 0; i < popSize; i++) {
        popAndScores.push([popScores[i], new NeuralNet(A, B, C, D)]);
        popAndScores[i][1].set_weights(population[i].get_weights());
    }
    for (var i = 0; i < popSize; i++) {
        var best = i;
        for (var j = i; j < popSize; j++) {
            if (popAndScores[j][0] > popAndScores[best][0]) {
                best = j;
            }
        }
        var swapVar = popAndScores[best];
        popAndScores[best] = popAndScores[i];
        popAndScores[i] = swapVar;
    }


    var bestWeights = [];
    for (var i = 0; i < quarter; i++) {
        bestWeights.push(popAndScores[i][1].get_weights());
    }

    var newWeights = [];
    for (var i = 0; i < (L + 1) / 2; i++) {
        var mom = random_weighted(quarter);
        var dad = random_weighted(quarter - 1);
        if (dad >= mom) {
            dad++;
        }
        var momWeights = bestWeights[mom];
        var dadWeights = bestWeights[dad];

        for (var j = 0; j < momWeights.length; j++) {
            // crossover
            if (Math.random() < crossoverRate) {
                var swapVar = momWeights[j];
                momWeights[j] = dadWeights[j];
                dadWeights[j] = swapVar;
            }
            // mutation
            if (Math.random() < mutationRate) {
                momWeights[j] = random_normal_offset(momWeights[j]);
            }
            if (Math.random() < mutationRate) {
                dadWeights[j] = random_normal_offset(dadWeights[j]);
            }
        }
        newWeights.push(momWeights);
        newWeights.push(dadWeights);
    }
    if (L % 2 == 1) {
        newWeights.pop();
    }

    for (var i = 0; i < L; i++) {
        popAndScores[popSize - i - 1][1].set_weights(newWeights[i]);
    }

    var popWeights = [];
    for (var i = 0; i < popSize; i++) {
        popWeights.push(popAndScores[i][1].get_weights());
    }

    for (var i = 0; i < popWeights.length; i++) {
        subpopWeights = [];
        for (var j = 0; j < popSize - L; j++) {
            subpopWeights.push(popWeights[j][i]);
        }
        shuffle(subpopWeights);
        for (var j = 0; j < popSize - L; j++) {
            popWeights[j][i] = subpopWeights[j];
        }
    }

    for (var i = 0; i < popSize; i++) {
        population[i].set_weights(popWeights[i]);
    }

    popScores = [];
    for (var i = 0; i < popSize; i++) {
        popScores.push(0);
    }
}

function genalg_basic() {
    var numBest = popSize / 4 | 0;
    var L = popSize - numBest | 0;
    var popAndScores = [];
    for (var i = 0; i < popSize; i++) {
        popAndScores.push([popScores[i], new NeuralNet(A, B, C, D)]);
        popAndScores[i][1].set_weights(population[i].get_weights());
    }
    for (var i = 0; i < popSize; i++) {
        var best = i;
        for (var j = i; j < popSize; j++) {
            if (popAndScores[j][0] > popAndScores[best][0]) {
                best = j;
            }
        }
        var swapVar = popAndScores[best];
        popAndScores[best] = popAndScores[i];
        popAndScores[i] = swapVar;
    }


    var bestWeights = [];
    for (var i = 0; i < numBest; i++) {
        bestWeights.push(popAndScores[i][1].get_weights());
    }

    var newWeights = [];
    for (var i = 0; i < (L + 1) / 2; i++) {
        var mom = random_weighted(numBest);
        var dad = random_weighted(numBest - 1);
        if (dad >= mom) {
            dad++;
        }

        var momWeights = bestWeights[mom];
        var dadWeights = bestWeights[dad];

        for (var j = 0; j < momWeights.length; j++) {
            // crossover
            if (Math.random() < crossoverRate) {
                var swapVar = momWeights[j];
                momWeights[j] = dadWeights[j];
                dadWeights[j] = swapVar;
            }
            // mutation
            if (Math.random() < mutationRate) {
                momWeights[j] = random_normal_offset(momWeights[j]);
            }
            if (Math.random() < mutationRate) {
                dadWeights[j] = random_normal_offset(dadWeights[j]);
            }
        }
        newWeights.push(momWeights);
        newWeights.push(dadWeights);
    }
    if (L % 2 == 1) {
        newWeights.pop();
    }

    for (var i = 0; i < L; i++) {
        popAndScores[popSize - i - 1][1].set_weights(newWeights[i]);
    }

    var popWeights = [];
    for (var i = 0; i < popSize; i++) {
        population[i].set_weights(popAndScores[i][1].get_weights());
    }

    popScores = [];
    for (var i = 0; i < popSize; i++) {
        popScores.push(0);
    }
}

setInterval(loop, 20);
