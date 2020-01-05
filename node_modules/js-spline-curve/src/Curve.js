exports.Curve = function Curve(config){
    'use strict';

    this.uid_seed       = 0;
    this.points 		= [];
    this.onAddPoint		= config.onAddPoint || function(index, point){};
    this.onMovePoint    = config.onMovePoint || function(index, point){};
    this.onRemovePoint  = config.onRemovePoint || function(index, point){};
    this.recalculate    = false;

    this.pointMap = {};
    
    this.addPoint = function(point){
        this.recalculate = true;
        point.uid = this.uid_seed;
        this.uid_seed += 1;
        var insertIndex = 0;
        if(this.points.length == 0 || point.x > this.points[this.points.length-1].x){
            this.points.push(point);
        }
        else if(point.x < this.points[0].x){
            this.points.splice(0,0,point);
        }
        else{
            for (insertIndex=0; insertIndex<this.points.length -1; insertIndex++){
                if(this.points[insertIndex].x < point.x && this.points[insertIndex+1].x > point.x){
                    this.points.splice(insertIndex+1, 0, point);
                    break;
                }
            }
        }
        point.index = insertIndex;
        this.pointMap[point.uid] = point;
        this.onAddPoint(insertIndex, point);
    }

    this.removePoint = function(pointIndex, notify=true){
        this.recalculate = true;
        const point = this.points[pointIndex];
        const uid = point.uid;
        this.points.splice(pointIndex, 1);
        if(notify)
            this.onRemovePoint(pointIndex, point, this.pointMap[point.uid]);
        delete this.pointMap[uid];
    }

    this.movePoint = function(pointIndex, newValue){
        this.recalculate = true;
        this.points[pointIndex].x = newValue.x;
        this.points[pointIndex].y = newValue.y;
        newValue.index = pointIndex;
        newValue.uid = this.points[pointIndex].uid;
        this.onMovePoint(pointIndex, newValue);
    }

    this.getPositionOfPoint = function(uid){
        for(var i=0; i < this.points.length; i++){
            if(this.points[i].uid == uid)
                return i;
        }
        return -1;
    };

    // Compare 2 points
    this.isEqual = function(p1,p2){
        return(p1.x == p2.x && p1.y == p2.y);
   }

    this.getClosestPointToCoordinate = function(coordinate, threshold=0.1){
        var pointerX = coordinate.x;
        var pointerY = coordinate.y;

        var dis = 10000;
        var clickedPoint = -1;

        for (var i=0;i<this.points.length;i++)
        {
            var x1 = pointerX-this.points[i].x;
            var y1 = pointerY-this.points[i].y;

            var tdis = Math.sqrt(x1*x1+y1*y1);
            if (tdis < dis && tdis < threshold) { 
                dis = tdis;
                clickedPoint = i;
            }
        }	
        return clickedPoint;
    }

    this.linearValueAt = function(xpos){
        const p1 = this.points[0];
        const p2 = this.points[1];
        // y = mx+b
        const m = (p2.y-p1.y) / (p2.x-p1.x);
        const b = p1.y - (m * p1.x);
        return m * xpos + b;
    }

    this.getValueAt = function(xpos) {
        'use strict';
    
        var retVal = 0;

        if(this.points.length <= 0)
            retVal = 0;
        else if(this.points.length == 1)
            retVal = this.points[0].y;
        else{
            if(xpos <= this.points[0].x)
                retVal = this.points[0].y;
            else if(xpos >= this.points[this.points.length-1].x)
                retVal = this.points[this.points.length-1].y;
            else{
                if(this.points.length == 2)
                    retVal = this.linearValueAt(xpos);
                else{
                    if(this.recalculate){
                        this.recalculate = false;
                        this.xs = this.points.map(function(p){return p.x});
                        this.ys = this.points.map(function(p){return p.y});
                        this.ks = [];
                        CSPL.getNaturalKs(this.xs, this.ys, this.ks);
                    }
                    retVal = CSPL.evalSpline(xpos, this.xs, this.ys, this.ks);
                } 
            }
        }

        if (retVal < 0.0) return 0.0;
        if (retVal > 1.0) return 1.0;

        return retVal;
    }
    
    if (config.points){
        for (var i=0; i < config.points.length; i++ )
            this.addPoint(config.points[i]);
    }
}

function CSPL(){};

CSPL._gaussJ = {};
CSPL._gaussJ.solve = function(A, x)	// in Matrix, out solutions
{
    var m = A.length;
    for(var k=0; k<m; k++)	// column
    {
        // pivot for column
        var i_max = 0; var vali = Number.NEGATIVE_INFINITY;
        for(var i=k; i<m; i++) if(Math.abs(A[i][k])>vali) { i_max = i; vali = Math.abs(A[i][k]);}
        CSPL._gaussJ.swapRows(A, k, i_max);
        
        //if(A[k][k] == 0) console.log("matrix is singular!");
        
        // for all rows below pivot
        for(var i=k+1; i<m; i++)
        {
            var cf = (A[i][k] / A[k][k]);
            for(var j=k; j<m+1; j++)  A[i][j] -= A[k][j] * cf;
        }
    }

    for(var i=m-1; i>=0; i--)	// rows = columns
    {
        var v = A[i][m] / A[i][i];
        x[i] = v;
        for(var j=i-1; j>=0; j--)	// rows
        {
            A[j][m] -= A[j][i] * v;
            A[j][i] = 0;
        }
    }
}
CSPL._gaussJ.zerosMat = function(r,c) {var A = []; for(var i=0; i<r; i++) {A.push([]); for(var j=0; j<c; j++) A[i].push(0);} return A;}
CSPL._gaussJ.printMat = function(A){ for(var i=0; i<A.length; i++) console.log(A[i]); }
CSPL._gaussJ.swapRows = function(m, k, l) {var p = m[k]; m[k] = m[l]; m[l] = p;}


CSPL.getNaturalKs = function(xs, ys, ks)	// in x values, in y values, out k values
{
    var n = xs.length-1;
    var A = CSPL._gaussJ.zerosMat(n+1, n+2);
        
    for(var i=1; i<n; i++)	// rows
    {
        A[i][i-1] = 1/(xs[i] - xs[i-1]);
        
        A[i][i  ] = 2 * (1/(xs[i] - xs[i-1]) + 1/(xs[i+1] - xs[i])) ;
        
        A[i][i+1] = 1/(xs[i+1] - xs[i]);
        
        A[i][n+1] = 3*( (ys[i]-ys[i-1])/((xs[i] - xs[i-1])*(xs[i] - xs[i-1]))  +  (ys[i+1]-ys[i])/ ((xs[i+1] - xs[i])*(xs[i+1] - xs[i])) );
    }

    A[0][0  ] = 2/(xs[1] - xs[0]);
    A[0][1  ] = 1/(xs[1] - xs[0]);
    A[0][n+1] = 3 * (ys[1] - ys[0]) / ((xs[1]-xs[0])*(xs[1]-xs[0]));

    A[n][n-1] = 1/(xs[n] - xs[n-1]);
    A[n][n  ] = 2/(xs[n] - xs[n-1]);
    A[n][n+1] = 3 * (ys[n] - ys[n-1]) / ((xs[n]-xs[n-1])*(xs[n]-xs[n-1]));
        
    CSPL._gaussJ.solve(A, ks);		
}

CSPL.evalSpline = function(x, xs, ys, ks)
{
    var i = 1;
    while(xs[i]<x) i++;

    var t = (x - xs[i-1]) / (xs[i] - xs[i-1]);

    var a =  ks[i-1]*(xs[i]-xs[i-1]) - (ys[i]-ys[i-1]);
    var b = -ks[i  ]*(xs[i]-xs[i-1]) + (ys[i]-ys[i-1]);

    var q = (1-t)*ys[i-1] + t*ys[i] + t*(1-t)*(a*(1-t)+b*t);
    return q;
}

