var mouseX = 0;
var mouseY = 0;
var windowWidth = 0;
var windowHeight = 0;

var gravity = 0.04;
var airResistance = 0.01;
var bounceResistance = 0.5;
var friction = 0.05;
var boxSize = 20;
var springLength = 100;

var tempBoxSize = boxSize;

var gravityActivated = true;
var springDrawingActivated = true;
var pointDrawingActivated = true;

var middleMouseDown = false;

var points = [];
var springs = [];

var lastMouseDown = [0, 0, 0];
var draggedExists = false;


// Main function, called on document load.
var main = function () {

    document.onkeydown = function (evt) {
        if (evt.which == 32) { // spacebar
            gravityActivated = !gravityActivated;
        }
        else if (evt.which == 83) { // s key
            springDrawingActivated = !springDrawingActivated;
        }
        else if (evt.which == 80) { // p key
            if (pointDrawingActivated) {
                
                tempBoxSize = boxSize;
                boxSize = 1;
            }
            else {
                boxSize = tempBoxSize;
            }
            pointDrawingActivated = !pointDrawingActivated;
        }
        else if (evt.which == 46) { // delete key
            points = [];
            springs = [];
        }
    }

    document.body.onmousedown = function (evt) {
        if (evt.button == 2) {
            SelectPoints();
            console.log(100);
        }
        if (evt.button == 1) {
            middleMouseDown = true;
        }
        if (evt.button == 0) {
            CreatePoint();
        }
    }

    document.body.onmouseup = function (evt) {
        if (evt.button == 1) {
            middleMouseDown = false;
        }
    }

    document.onmousemove = function (evt) {
        mouseX = evt.clientX;
        mouseY = evt.clientY;
    }
    setInterval(doFrame, 5);
}

// Draws the scene.
var draw = function () {
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    
    for (var i = 0; i < springs.length; i++) {
        springs[i].draw(ctx);
    }

    for (var i = 0; i < points.length; i++) {
        points[i].draw(ctx);
    }
}

// Set up canvas, resize it to fit the screen and clear every frame.
var setUpCanvas = function () {
    var c = document.getElementById("myCanvas");

    var ctx = c.getContext("2d");

    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    ctx.canvas.width = windowWidth;
    ctx.canvas.height = windowHeight;
}

// Updates the scene.
var update = function () {
    for (var i = 0; i < points.length; i++) {
        points[i].update();
    }

    for (var i = 0; i < springs.length; i++) {
        springs[i].update();
    }
    
    ConnectPoints();
    DragPoints();
}

// Called every frame, updates and draws the scene.
var doFrame = function () {
    setUpCanvas();
    draw();
    update();
}

// Drags points using the middle mouse button.
var DragPoints = function () {
    for (var i = 0; i < points.length; i++) {
        if (middleMouseDown) {
            if (new Vector(mouseX, mouseY).subtract(points[i].position).length() < 20) {
                if (!points[i].isDragged && !draggedExists) {
                    points[i].isDragged = true;
                    draggedExists = true;
                }
                if (points[i].isDragged) {
                    points[i].position = new Vector(mouseX, mouseY);
                    points[i].velocity = new Vector(0, 0);
                }

            }
            else {
                if (points[i].isDragged) {
                    points[i].position = new Vector(mouseX, mouseY);
                    points[i].velocity = new Vector(0, 0);
                }
                else {
                    points[i].isDragged = false;
                }
            }
        }
        else {
            points[i].isDragged = false;
            draggedExists = false;
        }
    }
}

// Creates a mass point with the mouse position.
var CreatePoint = function () {
    points.push(new MassPoint(mouseX, mouseY));
}

// Selects points that are next to the mouse cursor when you right click.
var SelectPoints = function () {
    for (var i = 0; i < points.length; i++) {
        if (new Vector(mouseX, mouseY).subtract(points[i].position).length() < 20) {
            points[i].isSelected = true;
        }
    }
}

// checks whether or not the spring exists.
var SpringExists = function (otherSpring) {
    for (var i = 0; i < springs.length; i++) {
        if (springs[i].equals(otherSpring)) {
            return true;
        }
    }
    return false;
}

// Connects all points that are selected with springs.
var ConnectPoints = function () {
    var atLeastTwoSelected = false;
    for (var i = 0; i < points.length; i++) {
        for (var j = i + 1; j < points.length; j++) {
            if (points[i].isSelected && points[j].isSelected) {
                atLeastTwoSelected = true;
                var newSpring = new Spring(points[i], points[j])
                if (!SpringExists(newSpring)) {
                    springs.push(newSpring);
                }
            }
        }
    }

    if (atLeastTwoSelected) {
        for (var i = 0; i < points.length; i++) {
            points[i].isSelected = false;
        }
    }
}

// Spring object, used for attracting points to eachother.
var Spring = function (firstPoint, secondPoint) {
    this.first = firstPoint;
    this.second = secondPoint;

    // checks if the spring is equal to another.
    this.equals = function (spring) {
        if (this.first == spring.first && this.second == spring.second) {
            return true;
        }
        return false;
    }

    // updates the spring, attracting the two affected points.
    this.update = function () {
        var distanceVector = this.second.position.subtract(this.first.position);
        var distance = distanceVector.length();
        var adjustedDistance = distance - springLength;
        var velocity = distanceVector.normalize().multiply(1 / 100).multiply(adjustedDistance);
        this.first.velocity = this.first.velocity.add(velocity);
        this.second.velocity = this.second.velocity.subtract(velocity);
    }

    // draws the spring.
    this.draw = function (ctx) {
        if (springDrawingActivated) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.beginPath();
            ctx.moveTo(this.first.position.x, this.first.position.y);
            ctx.lineTo(this.second.position.x, this.second.position.y);
            ctx.stroke();
        }
    }
}

// MassPoint object, for storing and operating on points in 2d space.
var MassPoint = function (posX, posY) {
    this.position = new Vector(posX, posY);
    this.velocity = new Vector(0, 0);
    this.isDragged = false;
    this.isSelected = false;

    // updates the masspoint - moves it and changes the velocity.
    this.update = function () {
        if (gravityActivated) {
            this.velocity = this.velocity.add(new Vector(0, gravity));
        }
        this.position = this.position.add(this.velocity);
        this.velocity = this.velocity.multiply(1 - airResistance);
        this.collideWithWalls();
    }

    this.draw = function (ctx) {
        if (pointDrawingActivated) {
            if (this.isSelected) {
                ctx.fillStyle = 'green';
            }
            else {
                ctx.fillStyle = 'black';
            }
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, boxSize / 2 - 1, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.stroke();
        }
    }

    // handles collision of the masspoint with the sides of the window.
    this.collideWithWalls = function () {
        if (this.position.x < boxSize / 2) { // if too far left.
            this.position.x = boxSize / 2;
            this.velocity.x = Math.abs(this.velocity.x) * (1 - bounceResistance);
            this.velocity.y *= 1 - friction;
        }

        if (this.position.y < boxSize / 2) { // if too far up.
            this.position.y = boxSize / 2;
            this.velocity.y = Math.abs(this.velocity.y) * (1 - bounceResistance);
            this.velocity.x *= 1 - friction;
        }

        if (this.position.x > windowWidth - boxSize / 2) { // if too far to the right.
            this.position.x = windowWidth - boxSize / 2;
            this.velocity.x = Math.abs(this.velocity.x) * -1 * (1 - bounceResistance);
            this.velocity.y *= 1 - friction;
        }

        if (this.position.y > windowHeight - boxSize / 2) { // if too far to the bottom.
            this.position.y = windowHeight - boxSize / 2;
            this.velocity.y = Math.abs(this.velocity.y) * -1 * (1 - bounceResistance);
            this.velocity.x *= 1 - friction;
        }
    }
}

// Vector object for storing and operating on two-dimensional vectors.
var Vector = function (x, y) {
    this.x = x;
    this.y = y;

    this.add = function (other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    this.subtract = function (other) {
        return this.add(other.multiply(-1));
    }

    this.multiply = function (scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    this.length = function () {
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    }

    this.normalize = function () {
        if (this.length() > 0) {
            return new Vector(this.x / this.length(), this.y / this.length());
        }
        else {
            return new Vector(0.1, 0.1);
        }
    }
}