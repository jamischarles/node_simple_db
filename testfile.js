//re-factoring to allow for event based messaging via pub / sub...
//for now, I'm assuming that each child controls what it is subscribed to. is this the observer pattern or pub/sub? I guess we'll see...
// nothing is wrong at this point .This is simply about getting it to work.
 
//NEXT: write JS test cases... Try crocks thing...?
 
// Then try YUI test cases...
 
window.session = {};
 
session.timer = function(){
        //custom events
        var _events = {};
       
       
        //UI hooks
        var _CURRENT_ITERATION_NODE = document.getElementById('iteration');
        var _TIME_DISPLAY_NODE = document.getElementById('timer');
       
        //timer settings
        var _time_remaining = { //initially set by _getInitialRemaining()
                hours: 0,
                minutes: 0,
                seconds: 0
        };
       
        var _timer_minutes; //FIXME: clean this up. This is currently used to track whether it's a pomodoro or not.
       
        var _current_time; //will contain the JS date of the current time (that is counting down)
       
        //default date obj value for time we're counting down to
        var _target_time = new Date("October 13, 1975 12:00:00");
       
        var _current_iteration = localStorage.getItem("j_timer_iteration") || 0;
       
        var _current_state = "sleeping"; //sleeping | paused | running //Q: change from sleeping to paused?
               
        //init should be a constructor function?
        function _init(testing){
                //set up custom events... Everything should be as self-contained as possible, so you can pull out one piece, and it all keeps working. No errors.
                _events.init = new Observer("timer:init"); //timer sets up and is ready
                _events.start = new Observer("timer:start"); //timer starts
                _events.end = new Observer("timer:end"); //when timer rings
                _events.sleep = new Observer("timer:sleep"); //when timer rings
                _events.pause = new Observer("timer:pause"); //timer is paused
                _events.resume = new Observer("timer:resume"); //timer is resumed
       
                //handle event subscriptions, since those shouldn't be called, and added every time the fn is called.
                _events.init.subscribe(_getInitialRemaining); //init will get the inital time
                _events.init.subscribe(_start); //init will call start
                _events.start.subscribe(_countdown); //start event will call countdown fn
               
                _events.resume.subscribe(_countdown);//resume event calls countdown
                _events.end.subscribe(_sleep);//timer end calls sleep (sleep state)
               
                //update the iteration count in the UI
                document.getElementById('iteration').innerHTML = _current_iteration;
               
               
                //attach handlers
               
                //attach listener to reset
                document.getElementsByClassName('counter_reset_link')[0].addEventListener('click', _resetIterationCounter, false);
               
                //attach listener to pause / un-pause
                _TIME_DISPLAY_NODE.addEventListener('click', _togglePauseStart, false);
               
                //attach show/hide for reset counter
                _CURRENT_ITERATION_NODE.addEventListener('mouseover', function(){
                        //add classname to parent      
                        document.getElementsByClassName('iteration_container')[0].className += " active";
                }, false);
               
                document.getElementsByClassName('counter_reset_link')[0].addEventListener('mouseout', function(e){
                        //remove active class name
                        document.getElementsByClassName('iteration_container')[0].className = document.getElementsByClassName('iteration_container')[0].className.replace("active", "");
                }, false);
               
                //if runing through test cases, don't fire the init. FIXME: there MUST be a better way to do this. Just not sure what it is ...
                if (testing === true) { return;}
               
                //console.log(this);
                _events.init.fire();
                //start timer
                //_start();
               
        } //_init
 
        //public functions
       
        function _start(){
                //get the amount of time remaining
               
               
                //update the UI for the first value
                _displayTimeRemaining();
               
                //wind the clock. create new time PLUS amount of minutes passed in.
                _current_time = new Date(_target_time.getTime() + _time_remaining.minutes * 1000 * 60);
               
               
                //change BG hue
                document.body.className = "end_color";
                //hardcode the transition duration based on the length of the timer....
                document.body.style['-webkit-transition-duration'] = _time_remaining.minutes * 60 + 's';
               
               
                //fire the start() custom event
                _events.start.fire();
               
               
                //start the timer
                //_countdown();
       
        }
       
        function _togglePauseStart(){
                //if you're paused, start running
                if (_current_state === "paused"){
                        _current_state = "running";    
                        //remove paused className
                        _TIME_DISPLAY_NODE.className = _TIME_DISPLAY_NODE.className.replace("paused", "");
                       
                        _events.resume.fire();
                        //start counting down again.
                        //_countdown();
                       
                } else {
                        _current_state = "paused";
                        _TIME_DISPLAY_NODE.className += " paused";
                        document.title = "Paused: " + _time_remaining.minutes + ":" + _time_remaining.seconds + "s";
                        _events.pause.fire();
                }
        }
       
        function _pause(){
                //should this be done by canceling the timeout, or making a global flag?
               
                //stop the countdown timer
               
               
                //update the UI
               
                //add the hook to start playing it again
        }
       
        function _countdown(){
                //console.log(_current_time.getTime());
               
                if (_current_state === "paused"){
                        return;
                }
               
                //decrement timer by 1 second
                _current_time = new Date(_current_time.getTime() - 1000);
               
                //update the timer object
                _time_remaining.minutes = _current_time.getMinutes();
                _time_remaining.seconds = _current_time.getSeconds();
               
                //update the UI
                _displayTimeRemaining();
               
                //console.log(_time_remaining.minutes);
                //console.log(_time_remaining.seconds);
 
                //check to see if it's done.
               
                //check for timer completion. If not, rewind so it'll go again in 1 second.
                if (_current_time <= _target_time){
                        console.log("BEEP");
                       
                        //if the timer was set for 25 min, increase the timer
                        if (_timer_minutes == 25){
                                //FIXME: should this be a custom event too? Probably...
                                _increment_iteration();
                        }
                       
                        _events.end.fire();
                        //_sleep();
                               
                //rewind so it'll continue.    
                } else {
                        setTimeout(_countdown, 1000);
                }
               
        }
 
        //called upon completion
        function _sleep(){
                //update the UI showing completiong
                document.getElementById('timer').className += " done";
               
                setTimeout( function(){
                        alert("Time's up");
                }, 300);
               
                //
                _events.sleep.fire();
        }
       
        function _increment_iteration(){
                var iteration = parseInt(localStorage.getItem('j_timer_iteration')) + 1;
                                       
                localStorage.setItem('j_timer_iteration', iteration); //how many PMs have we had? This should only increment if the timer was 25 min...
                               
                //update in UI
                document.getElementById('iteration').innerHTML = iteration;
               
        }
       
       
        //Helper Functions
       
        //get initial time remaining from URL
        function _getInitialRemaining(){
                //get hours, min, seconds from URL
               
                //set the time object
                _time_remaining.minutes = _getUrlParam("timer"); //if we were fancy we'd use custom events to speak to each other.
                _timer_minutes = _time_remaining.minutes; //FIXME: we shoulnd't need this... How can we clean this up?
               
               
                //TODO: add logic to get hours, seconds, minutes, days etc...
               
               
        }
       
        function _calcTimeRemaining(){
               
        }
       
        //UI Updating functions
       
        function _resetIterationCounter(){
                //set the localStorage to 0
                localStorage.setItem('j_timer_iteration', 0);
               
                //update the UI from localStorage
                document.getElementById('iteration').innerHTML = localStorage.getItem('j_timer_iteration');
        }
       
        //should this be here? Where should we define that? Each public function will have a portion to update the UI
        //pass in node, or id
        function _displayTimeRemaining(){
                //logic for how to calculate / show remainig time
               
                //if seconds is single digit, make it double digit.
                var seconds = _time_remaining.seconds;
                if (seconds < "10"){
                        seconds = "0" + seconds;   
                }
               
                var message = _time_remaining.minutes + ":" + seconds;
               
                _updateUI(_TIME_DISPLAY_NODE, message);
               
                //update the title
                document.title = _time_remaining.minutes + " minutes " + seconds + " seconds";
        }
       
        function _updateUI(el, message){
                //should this provide a test to be able to pass an id or a node?
                if(typeof el === "string"){
                        el = document.getElementById(el);      
                }
               
                el.innerHTML = message;
        }
 
        //return amount of milliseconds for amount of hours, minutes, seconds
        function _convertToMilliseconds(timeObj){
               
        }
 
        //get any url param value
        function _getUrlParam(paramName){
        //if obj exists return the requested value, else get the params from the url
        if (typeof _urlParams !== "undefined" ){
            return _urlParams[paramName] || "false"; //return the value of the param asked for, or if it isn't there, false
        }
 
        _urlParams = {};
 
        //use regular expression to replace everything prior to '?' with ""
        var paramStr = window.location.href.replace(/.*\?/, "");
        //split the remainder into an array
        var array = paramStr.split("&");
 
        for (var i=0; i < array.length; i++){
            //split the remainder pieces in to key:value pairs and add them to the _urlParams obj.
            var nameValuePair = array[i].split("=");
            _urlParams[nameValuePair[0]] = nameValuePair[1];
        }
 
        return _urlParams[paramName] || false;
    };
 
 
        return{
                init: _init,
               
                //for my test case, make them all public. How do you test for closures?
                increment_iteration: _increment_iteration,
                resetIterationCounter: _resetIterationCounter,
                countdown: _countdown,
                start: _start,
                getInitialRemaining: _getInitialRemaining,
                events: _events,
                current_iteration: _current_iteration
        }
 
} //timer
 
//abstracted and placed on the page for testing purposes. Not sure what the best thing to do with this is...
//var pageTimer = new session.timer();
//pageTimer.init();
 
//technically you could now run multiple timers with this...? You would just need separate UI hooks...
//console.log(pageTimer);