; "use strict";

jQuery(function($) {

var mouseX = 0;
var mouseY = 0;
var windowWidth = 0;
var windowHeight = 0;

var gravity = 0.04;
var airResistance = 0.01;
var bounceResistance = 0.5;
var friction = 0.2;
var boxSize = 10;
var tempBoxSize = boxSize;
var draggedExists = false;

var options = {
  gravityActivated: true,
  springDrawingActivated: true,
  pointDrawingActivated: true,
  fixedPointCreationActivated: false,
  paused: false,
  springLength: 100
};

var middleMouseDown = false;
var shiftDown = false;
var leftMouseDown = false;

var pi2 = 2 * Math.PI;

var points = [];
var springs = [];

var ctx = $('#myCanvas')[0].getContext('2d');
ctx.lineWidth = 1;
ctx.strokeStyle = 'black';

$('body').on('update', '.setting', function() {
  var
    $element = $(this)
  , option = this.id || $element.data('option')
  , on = $element.data('on') || 'enabled'
  , off = $element.data('off') || 'disabled'
  ;

  if (typeof options[option] === 'boolean')
    $element.text(options[option] ? on : off);
  else
    $element.text(options[option]);
});

$('.setting').trigger('update');

// Interactions for changing the simulation settings
var keyActions = {
  // space bar
  "32": function() {
      options.gravityActivated = !options.gravityActivated;
    },
  // "s"
  "83": function() {
      options.springDrawingActivated = !options.springDrawingActivated;
    },
  // "p"
  "80": function() {
        if (options.pointDrawingActivated) {

            tempBoxSize = boxSize;
            boxSize = 1;
        }
        else {
            boxSize = tempBoxSize;
        }
        options.pointDrawingActivated = !options.pointDrawingActivated;
      },
  // delete
  "46": function() {
        points = [];
        springs = [];
      },
  // "f"
  "70": function() {
      options.fixedPointCreationActivated = !options.fixedPointCreationActivated;
    },
  // "u"
  "85": function() {
      options.paused = !options.paused;
    },
  // "+"
  "187": function() {
      options.springLength += 10;
    },
  // "-"
  "189": function() {
      options.springLength = Math.max(10, options.springLength - 10);
    },
  // shift
  "16": function() { shiftDown = true; }
};

// Set up the event handlers
$('#body').keydown(function (evt) {
  if (keyActions[evt.which]) {
    keyActions[evt.which]();
    $('.setting').trigger('update');
  }
});

$('body').keyup(function(evt) {
    if (evt.which == 16) {
        shiftDown = false;
    }
});

$('#body').mousedown(function (evt) {
    if (evt.button == 0) {
        leftMouseDown = true;
    }
    if (evt.button == 2) {
        selectPoints();
    }
    if (evt.button == 1) {
        middleMouseDown = true;
    }
    if (evt.button == 0 && !shiftDown) {
        createPoint();
    }
});

$('#body').mouseup(function(evt) {
    if (evt.button == 1) {
        middleMouseDown = false;
    }
    if (evt.button == 0) {
        leftMouseDown = false;
    }
});

$('#body').mousemove(function(evt) {
    mouseX = evt.clientX;
    mouseY = evt.clientY;
});

// Start the animation
setInterval(doFrame, 5);

// Draws the scene.
function draw() {
    var ctx = $('#myCanvas')[0].getContext('2d');
    for (var i = 0; i < springs.length; i++) {
        springs[i].draw(ctx);
    }

    for (var i = 0; i < points.length; i++) {
        points[i].draw(ctx);
    }
}

// Set up canvas, resize it to fit the screen and clear every frame.
function setUpCanvas() {
    if (window.innerWidth !== windowWidth || window.innerHeight !== windowHeight) {
      ctx.canvas.width = windowWidth = window.innerWidth;
      ctx.canvas.height = windowHeight = window.innerHeight;
    }
    else
      ctx.clearRect(0, 0, windowWidth, windowHeight);
}

// Updates the scene.
function update() {
    if (!options.paused) {
        for (var i = 0; i < points.length; i++) {
            points[i].update();
        }

        for (var i = 0; i < springs.length; i++) {
            springs[i].update();
        }
    }

    connectPoints();
    dragPoints();
}

// Called every frame, updates and draws the scene.
function doFrame() {
    setUpCanvas();
    draw();
    update();
}

// Drags points using the middle mouse button or shift click.
function dragPoints() {
    var i, curpos;

    if (middleMouseDown || (shiftDown && leftMouseDown)) {
        curpos = new Vector(mouseX, mouseY);

        for (i = 0; i < points.length; i++) {
            if (curpos.subtract(points[i].position).shorterThan(20)) {
                if (!points[i].isDragged && !draggedExists) {
                    points[i].isDragged = true;
                    draggedExists = true;
                }
                if (points[i].isDragged) {
                    points[i].lastPosition = points[i].position.copy();
                    points[i].position = curpos;
                    points[i].velocity = new Vector(0, 0);
                }

            }
            else {
                if (points[i].isDragged) {
                    points[i].lastPosition = points[i].position.copy();
                    points[i].position = curpos;
                    points[i].velocity = new Vector(0, 0);
                }
                else {
                    points[i].isDragged = false;
                }
            }
        }
    }
    else {
        for (i = 0; i < points.length; i++) {
            points[i].isDragged = false;
            draggedExists = false;
        }
    }
}

// Creates a mass point with the mouse position.
function createPoint() {
    var newPoint = new MassPoint(mouseX, mouseY);
    if (options.fixedPointCreationActivated) {
        newPoint.isFixed = true;
    }
    points.push(newPoint);
}

// Selects points that are next to the mouse cursor when you right click.
function selectPoints() {
    var curpos = new Vector(mouseX, mouseY);
    for (var i = 0; i < points.length; i++) {
        if (curpos.subtract(points[i].position).shorterThan(20)) {
            points[i].isSelected = true;
        }
    }
}

// checks whether or not the spring exists.
function springExists(x, y) {
    for (var i = 0; i < springs.length; i++) {
        if (springs[i].equals(x, y)) {
            return true;
        }
    }
    return false;
}

// Connects all points that are selected with springs.
function connectPoints() {
    var atLeastTwoSelected = false;
    for (var i = 0; i < points.length; i++) {
        for (var j = i + 1; j < points.length; j++) {
            if (points[i].isSelected && points[j].isSelected) {
                atLeastTwoSelected = true;
                if (!springExists(points[i], points[j])) {
                    springs.push(new Spring(points[i], points[j]));
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
function Spring(firstPoint, secondPoint) {
    this.first = firstPoint;
    this.second = secondPoint;
}

Spring.prototype = {
    // checks if the spring is equal to another.
    equals: function (x, y) {
        return (this.first === x && this.second === y) || (this.first === y && this.second === x);
    },
    // updates the spring, attracting the two affected points.
    update: function () {
        var distanceVector = this.second.position.subtract(this.first.position);
        var distance = distanceVector.length();
        var adjustedDistance = distance - options.springLength;
        var velocity = distanceVector.normalize().multiply(1 / 100).multiply(adjustedDistance);
        this.first.velocity = this.first.velocity.add(velocity);
        this.second.velocity = this.second.velocity.subtract(velocity);
    },
    // draws the spring.
    draw: function (ctx) {
        if (options.springDrawingActivated) {
            ctx.beginPath();
            ctx.moveTo(this.first.position.x, this.first.position.y);
            ctx.lineTo(this.second.position.x, this.second.position.y);
            ctx.stroke();
        }
    }
};

// MassPoint object, for storing and operating on points in 2d space.
function MassPoint(posX, posY) {
    this.position = new Vector(posX, posY);
    this.lastPosition = this.position.copy();
    this.velocity = new Vector(0, 0);
    this.isDragged = false;
    this.isSelected = false;
    this.isFixed = false;
}

MassPoint.prototype = {
    // updates the masspoint - moves it and changes the velocity.
    update: function () {
        if (!this.isFixed) {
            if (options.gravityActivated) {
                this.velocity = this.velocity.add(new Vector(0, gravity));
            }
            this.lastPosition = this.position.copy();
            this.position = this.position.add(this.velocity);
            //this.position = this.position.add(this.position.subtract(this.lastPosition));
            this.velocity = this.velocity.multiply(1 - airResistance);
            this.collideWithWalls();
        }
    },
    // draws the masspoint.
    draw: function (ctx) {
        if (options.pointDrawingActivated) {
            if (this.isSelected) {
                ctx.fillStyle = 'green';
            }
            else if (this.isFixed) {
                ctx.fillStyle = 'red';
            }
            else {
                ctx.fillStyle = 'black';
            }
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, boxSize / 2 - 1, 0, pi2, false);
            ctx.fill();
        }
    },
    // handles collision of the masspoint with the sides of the window.
    collideWithWalls: function () {
        var bs2 = boxSize / 2;

        if (this.position.x < bs2) { // if too far left.
            this.position.x = bs2;
            this.velocity.x = Math.abs(this.velocity.x) * (1 - bounceResistance);
            this.velocity.y *= 1 - friction;
        }

        if (this.position.y < bs2) { // if too far up.
            this.position.y = bs2;
            this.velocity.y = Math.abs(this.velocity.y) * (1 - bounceResistance);
            this.velocity.x *= 1 - friction;
        }

        if (this.position.x > windowWidth - bs2) { // if too far to the right.
            this.position.x = windowWidth - bs2;
            this.velocity.x = Math.abs(this.velocity.x) * -1 * (1 - bounceResistance);
            this.velocity.y *= 1 - friction;
        }

        if (this.position.y > windowHeight - bs2) { // if too far to the bottom.
            this.position.y = windowHeight - bs2;
            this.velocity.y = Math.abs(this.velocity.y) * -1 * (1 - bounceResistance);
            this.velocity.x *= 1 - friction;
        }
    }
};

// Vector object for storing and operating on two-dimensional vectors.
function Vector(x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype = {
    add: function (other) {
        return new Vector(this.x + other.x, this.y + other.y);
    },
    subtract: function (other) {
        return this.add(other.multiply(-1));
    },
    multiply: function (scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    },
    length: function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    shorterThan: function(what) {
        return this.x * this.x + this.y * this.y < what * what;
    },
    copy: function () {
        return new Vector(this.x, this.y);
    },
    normalize: function () {
        var len;

        if (this.x !== 0 || this.y !== 0) {
            len = this.length();
            return new Vector(this.x / len, this.y / len);
        }

        return new Vector(0.1, 0.1);
    }
};

});
