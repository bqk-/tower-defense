
var Timer = function(game, refreshInt, textPh) {
    this.game = game;
    this.text = textPh;
    this.refreshInt = refreshInt;
 
    this.gameTimer = game.time.events.loop(refreshInt, function(){
        this.updateTimer();
    }, this);
};

Timer.prototype.constructor = Timer;

Timer.prototype.updateTimer = function(){
    if(!this.totalTime || this.timeElapsed >= this.totalTime)
    {
        return;
    }
    //Time elapsed in seconds
    this.timeElapsed += this.refreshInt / 1000;
 
    //Time remaining in seconds
    var timeRemaining = this.totalTime - this.timeElapsed; 

    this.text.text = timeRemaining + " sec";

    if(timeRemaining === 0)
    {
        this.end = true;
    }
}

Timer.prototype.start = function(limit)
{
    this.totalTime = limit;
    this.timeElapsed = 0;
    this.end = false;
}


Timer.prototype.isOver = function(limit)
{
    return this.end;
}