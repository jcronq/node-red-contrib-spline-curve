exports.CurveView = function CurveView(canvas, curve){
    'use strict';

    this.currentPoint = -1;
    this.curve          = curve;
    this.c 				= canvas;
    this.ctx 			= this.c.getContext('2d');
    this.height 		= this.c.height;
    this.width 			= this.c.width;
    this.redraw			= 0;
    this.onChange		= config.callback;
    this.stepSize       = 1.0/this.width;
    this.redrawInterval = 50;

    this.point_selection_threshold = config.point_select_threshold || 0.1;

    if (this.height != this.width) {
        console.error("ERROR: Canvas must have same width and height.");
        return undefined;
    }

    var me = this;

    this.c.addEventListener('mousedown', function(ev) {
        me.mouseDown(ev);
    }, false);

    this.c.addEventListener('contextmenu', function(ev){
        me.rightClick(ev);
    }, false);

    this.c.addEventListener('mouseup',  function(ev) {
        me.mouseUp(ev);
    }, false);
    
    this.c.addEventListener('mousemove',  function(ev) {
        me.mouseMove(ev);
    }, false);

    // Compare 2 points
    this.isEqual = function(p1,p2)
    {
        'use strict';

        if (p1.x == p2.x && p1.y == p2.y) {
            return true;
        } else {
            return false;
        }
    }

    this.render = function() {
        'use strict';

        const points = me.curve.points;
        const ctx = me.ctx;
        const width = me.width; const height = me.height;
        const stepSize = me.stepSize;
        
        const moveTo = function(x,y){
            ctx.moveTo(x*width,(1.0-y)*height);
        };

        const lineTo = function(x,y){
            ctx.lineTo(x*width,(1.0-y)*height);
        };

        ctx.clearRect(0, 0, width, height);
        me.drawGrid(ctx);
        me.drawBorder(ctx);

        if(points.length == 1){
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            moveTo(0, points[0].y );
            lineTo(width, points[0].y);
            ctx.stroke();
        }
        else{
            me.ctx.beginPath();
            moveTo(0.0, points[0]);
            for(var i=0.0; i<=1.0 + stepSize; i+=stepSize) {
                lineTo(i, me.curve.getValueAt(i));
            }
            ctx.stroke();
        }
        me.drawPoints(lineTo, moveTo);
    }

    // The background border
    this.drawBorder = function(ctx) {
        'use strict';
       
        const height = me.height; const width = me.width;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.rect(0,0,width,height);
        ctx.stroke();
    }

    // The background grid
    this.drawGrid = function(ctx) {
        'use strict';

        const width = me.width;
        const height = me.height;

        var space = width/4.0;

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#aaaaaa';

        for(var i=0;i<this.height-space;i+=space)
        {
            ctx.moveTo(0, i+space); ctx.lineTo(height, i+space);
        }
        for(var i=0;i<this.height-space;i+=space)
        {
            ctx.moveTo(i+space, 0); ctx.lineTo(i+space, height);
        }
        ctx.stroke();
    }

    // Draw the control points
    this.drawPoints = function(lineTo, moveTo) {
        'use strict';

        const ctx = me.ctx;
        const points = me.curve.points;
        const width = me.width; const height = me.height;
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();

        for(var i=0;i<points.length;i++)
        {
            moveTo(points[i].x, points[i].y);
            ctx.arc(points[i].x*width,height-(points[i].y*height), 3, 0 , 2 * Math.PI, false);
        }
        me.ctx.fill();
    }

    this.getCoordinateFromEvent = function(event){
        if(!event) var event = window.event;
        var canvasRect = this.c.getBoundingClientRect();
        var pointerCoordinate = {
            x: (event.pageX-canvasRect.left)/this.width,
            y: 1.0-((event.pageY-canvasRect.top)/this.height)
        }
        return pointerCoordinate;
    }

    this.mouseDown = function(event) {
        'use strict';
        var pointerCoordinate = this.getCoordinateFromEvent(event);
        var clickedPoint = this.curve.getClosestPointToCoordinate(pointerCoordinate, this.point_selection_threshold);

        if (clickedPoint !== -1 ){
            this.currentPoint = clickedPoint;
        }
        else{
            this.currentPoint = this.curve.addPoint(pointerCoordinate);
        }
    }

    this.rightClick = function(event) {
        'use strict';
        var pointerCoordinate = this.getCoordinateFromEvent(event);
        var clickedPoint = this.curve.getClosestPointToCoordinate(pointerCoordinate, this.point_selection_threshold);

        if (clickedPoint !== -1 ){
            this.curve.removePoint(clickedPoint);
        }
    }

    this.mouseUp = function(event) {
       'use strict';
        this.currentPoint = -1;
    }

    this.mouseMove = function(event) {
        if (this.currentPoint == -1) return;
        var canvasRect = this.c.getBoundingClientRect();
        var newPosition = {
            x: (event.pageX-canvasRect.left)/this.width,
            y: 1.0-((event.pageY-canvasRect.top)/this.height)
        };
        this.movePoint(this.currentPoint, newPosition);
    }
    
    this.movePoint = function(index, newPosition){
       'use strict';

        var prevx,nextx;
        const points = this.curve.points;
        try{
            if (index > 0.0)
                prevx = points[index-1].x;
            else
                prevx = -0.000000001;
            if (index==points.length-1)
                nextx = 1.000000001;
            else
                nextx = points[index+1].x;
           
            if(newPosition.x > prevx && newPosition.x < nextx) {
                this.curve.movePoint(index, newPosition);
            }
        }
        catch(e){
        }
    }
    setInterval(this.render, this.redrawInterval); 
}

