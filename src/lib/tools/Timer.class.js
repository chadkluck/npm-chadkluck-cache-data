/* */
const DebugAndLog = require("./DebugAndLog.class");

class Timer {
	constructor(name, start = false) {
		this.name = name;
		this.startTime = -1;
		this.stopTime = -1;
		this.latestMessage = "";
		
		if (start) {
			this.start();
		} else {
			this.updateMessage("Timer '"+this.name+"' created at  "+this.now());
		}
	};

	async updateMessage(message) {
		this.latestMessage = message;
		DebugAndLog.diag(this.latestMessage);
	};

	/**
	 * Start the timer
	 */
	async start() {
		if ( this.startTime === -1 ) {
			this.startTime = this.now();
			this.updateMessage("Timer '"+this.name+"' started at "+this.startTime);
		}
	};

	/**
	 * Stop the timer
	 * 
	 * @returns {number} The time elapsed in milliseconds
	 */
	stop() {
		if ( this.stopTime === -1 ) {
			this.stopTime = this.now();
			this.updateMessage("Timer '"+this.name+"' stopped at "+this.stopTime+". Time elapsed: "+this.elapsed()+" ms");
		}
		return this.elapsed();
	};

	/**
	 * The amount of time elapsed between the start and stop of the timer.
	 * If the timer is still running it will be the amount of time between
	 * start and now(). If the timer is stopped it will be the amount of
	 * time between the start and stop.
	 * 
	 * @returns {number}
	 */
	elapsed() {
		return ((this.isRunning()) ? this.now() : this.stopTime ) - this.startTime;
	};

	/**
	 * The amount of time elapsed between the start of the timer and now()
	 * Even if the timer is stopped, it will use now() and this value will
	 * continue to increase during execution.
	 * 
	 * Use elapsed() to get the amount of time between start and stop.
	 * 
	 * @returns {number}
	 */
	elapsedSinceStart() {
		return (this.now() - this.startTime);
	};

	/**
	 * The amount of time elapsed since the timer was stopped and will increase
	 * during execution. If the timer has not been stopped, it will 
	 * return -1 (negative one)
	 * 
	 * @returns {number}
	 */
	elapsedSinceStop() {
		return (this.isRunning() ? -1 : this.now() - this.stopTime);
	};

	/**
	 * The time now. Same as Date.now()
	 * 
	 * @returns {number}
	 */
	now() {
		return Date.now();
	};

	/**
	 * Was the timer started
	 * @returns {boolean}
	 */
	wasStarted() {
		return (this.startTime > 0);
	};

	/**
	 * 
	 * @returns {boolean} Returns true if timer has not yet been started
	 */
	notStarted() {
		return !(this.wasStarted());
	};

	/**
	 * 
	 * @returns {boolean} True if the timer is currently running. False if not running
	 */
	isRunning() {
		return (this.wasStarted() && this.stopTime < 0);
	};

	/**
	 * 
	 * @returns {boolean} True if the timer was stopped. False if not stopped
	 */
	wasStopped() {
		return (this.wasStarted() && this.stopTime > 0);
	};

	/**
	 * 
	 * @returns {string} Text string denoting stating. 'NOT_STARTED', 'IS_RUNNING', 'IS_STOPPED'
	 */
	status() {
		var s = "NOT_STARTED";
		if ( this.wasStarted() ) {
			s = (this.isRunning() ? "IS_RUNNING" : "IS_STOPPED");
		}
		return s;
	};

	/**
	 * Messages are internal updates about the status
	 * @returns {string} The latest message from the timer
	 */
	message() {
		return (this.latestMessage);
	};

	/**
	 * For debugging and testing, an object of the timer may be generated
	 * to see the current values of each timer function.
	 * 
	 * @param {boolean} sendToLog Should the timer details object be sent to the console log
	 * @returns { 
	 *   {
	 * 		name: string,
	 * 		status: string,
	 * 		started: boolean,
	 * 		running: boolean,
	 * 		stopped: boolean,
	 * 		start: number,
	 * 		stop: number,
	 * 		elapsed: number,
	 * 		now: number,
	 * 		elapsedSinceStart: number,
	 * 		elapsedSinceStop: number,
	 * 		latestMessage: string
	 *   }
	 * } An object describing the state of the timer
	 */
	details(sendToLog = false) {
		var details = {
			name: this.name,
			status: this.status(),
			started: this.wasStarted(),
			running: this.isRunning(),
			stopped: this.wasStopped(),
			start: this.startTime,
			stop: this.stopTime,
			elapsed: this.elapsed(),
			now: this.now(),
			elapsedSinceStart: this.elapsedSinceStart(),
			elapsedSinceStop: this.elapsedSinceStop(),
			latestMessage: this.message()
		};

		if (sendToLog) {
			DebugAndLog.debug("Timer '"+this.name+"' details",details);
		}

		return details;
	};
};

module.exports = Timer; 