class SRQ {
	constructor() {
		// Queue with the requests to be made
		this.queue = [];

		// Holds the int of the last completed request
		this.last_completed = 0;

		// Tells whether the queue was paused
		this.bpaused = false;

		// Tells whether the queue ended
		this.bended = false;

		// Tells whether the next() function is still running
		this.bbusy = false;
	}

	add_to_queue(element) {
		// Element can either be a single object or an array of them
		function fill_data_template(new_object) {
			var template = {
				"link": null,
				"fallback": {
					"link": null,
					"method": "GET",
					"post_data": null,
					"headers": null,
					"timeout": 0,
					"row": null,
					"successful": false,
					"error": false,
					"timed_out": false,
					"response": null
				},
				"fallback_requested": false,
				"method": "GET",
				"post_data": null,
				"headers": null,
				"timeout": 0,
				"row": null,
				"successful": false,
				"error": false,
				"timed_out": false,
				"response": null
			};

			return Object.assign(template, new_object);
		}

		if (Array.isArray(element)) {
			for(var i = 0; i < element.length; i++) {
				this.queue.push(fill_data_template(element[i]));
			}
		} else {
			this.queue.push(fill_data_template(element));
		}

		if (this.bended) {
			this.bended = false;
		}
	}

	pause() {
		this.bpaused = true;
	}

	is_busy() {
		return this.bbusy;
	}

	start(callback) {
		if (this.bpaused) {
			this.bpaused = false;
		}

		if (this.bbusy === false && this.bended === false) {
			this.next(callback);
		}
	}

	next(callback) {
		if (this.bpaused) {
			this.bbusy = false;
		} else if (this.last_completed > this.queue.length - 1) {
			this.bended = true;
			this.bbusy = false;
		} else if (this.bpaused === false) {
			this.bbusy = true;
			this.request(callback);
		}
	}

	finish_request(requested_obj, response, fallback = false, successful = false, error = false, timed_out = false) {
		if (fallback) {
			requested_obj.fallback_requested = true;
			requested_obj.fallback.successful = successful;
			requested_obj.fallback.error = error;
			requested_obj.fallback.timed_out = timed_out;
			requested_obj.fallback.response = response;
		} else {
			requested_obj.successful = successful;
			requested_obj.error = error;
			requested_obj.timed_out = timed_out;
			requested_obj.response = response;
		}

		this.last_completed++;
	}

	request(callback) {
		var request_obj = this.queue[this.last_completed];
		var srq = this;

		GM_xmlhttpRequest({
			method: request_obj.method,
			url: request_obj.link,
			timeout: request_obj.timeout,
			data: request_obj.post_data,
			headers: request_obj.headers,
			ontimeout: function(response) {
				if (request_obj.fallback.link !== null) {
					request_obj.timed_out = true;
					request_obj.response = response;
					srq.fallback_request(srq, request_obj, callback);
				} else {
					srq.finish_request(request_obj, response, false, false, false, true);
					srq.next(callback);
					callback(request_obj);
				}
			},
			onerror: function(response) {
				if (request_obj.fallback.link !== null) {
					request_obj.error = true;
					request_obj.response = response;
					srq.fallback_request(srq, request_obj, callback);
				} else {
					srq.finish_request(request_obj, response, false, false, true);
					srq.next(callback);
					callback(request_obj);
				}
			},
			onload: function(response) {
				srq.finish_request(request_obj, response, false, true);
				srq.next(callback);
				callback(request_obj);
			}
		});
	}

	fallback_request(srq, request_obj, callback) {
		GM_xmlhttpRequest({
			method: request_obj.fallback.method,
			url: request_obj.fallback.link,
			timeout: request_obj.fallback.timeout,
			data: request_obj.fallback.post_data,
			headers: request_obj.fallback.headers,
			ontimeout: function(response) {
				srq.finish_request(request_obj, response, true, false, false, true);
				srq.next(callback);
				callback(request_obj);
			},
			onerror: function(response) {
				srq.finish_request(request_obj, response, true, false, true);
				srq.next(callback);
				callback(request_obj);
			},
			onload: function(response) {
				srq.finish_request(request_obj, response, true, true);
				srq.next(callback);
				callback(request_obj);
			}
		});
	}
}
