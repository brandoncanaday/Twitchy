/*
 * All original javascript code was left in one file so that the number of <script> tags needed inside
 * index.html was minimized. This allows for less resource requests to be made, and, therefore, decreasing 
 * page load time.
 */
$(document).ready(function() {
	//ON PAGE LOAD
	initCookies();
	initWatchLater(); 
	getStreams("","","","0", false);
	
	//COOKIE STUFF
	//if necessary cookies do not exist yet for client, create them
	function initCookies() {  
	  if(!Cookies.get('playlist')) {
	    Cookies.set('playlist', "[]", { expires: 28 });
	  } // if
	} // initCookies

	//updates playlist cookie before user leaves page. also resets expiration timer
	function beforeUnloadHandler() {
	    Cookies.set('playlist', JSON.stringify(playlist), { expires: 28 });
	} // beforeUnloadHandler
	//update cookies right before user nav's away from page/closes browser
	$(window).on('beforeunload', beforeUnloadHandler); 

	//GET LIVE STREAMS STUFF
	//gets streams from Twitch api and displays them
	var c_row;
	function getStreams(_keyword, _game, _channel, _page, overwrite) {
		$.ajax({
	        type: "POST",
	        url: "StreamServlet",
	        data: {f_keyword: _keyword, f_game: _game, f_channel: _channel, page: _page, client_id: "n541yjhwjewnpa7gztgwxqph5fkavr"},
	        success: function(data) { 
	            // populate .stream-container with .stream-row's/.stream's
	            var sc = $('.stream-container');
	            if(overwrite) { // overwrites html instead of appending
	            	sc.empty(); 
	            	c_row = null; 
	            } else { // remove stream-spacer if present
	            	if(c_row != null && c_row.children('.stream-spacer')) { c_row.children('.stream-spacer').remove(); } // if
	            } // if/else
	            // begin dynamically creating stream html from servlet JSON response
	            var str, thumb, head, info;
	            var didFindStreams = false;
	            var STREAMS_PER_ROW = 3;
	            $.each(data, function(i, stream) {
	            	didFindStreams = true;
	            	// every STREAMS_PER_ROW streams added, make a new stream row
	            	if(c_row == null || c_row.children().length == STREAMS_PER_ROW) { 
	            		sc.append("<div class='stream-row'></div>"); 
	            		c_row = $('.stream-row:last'); 
	            	} // if
	            	c_row.append("<div class='stream' "   +
							 		"data-stream-id='"  + stream.stream_id  + "' " +
							 		"data-viewers='" 	+ stream.viewers 	+ "' " +
							 		"data-game='" 		+ ((stream.game) ? stream.game : "[no title]") + "' " +
							 		"data-preview='"	+ stream.preview	+ "' " +
							 		"data-ch-name='"	+ stream.ch_name	+ "' " +
							 		"data-ch-url='"		+ stream.ch_url		+ "' " +
							    "</div>");
		        	str = c_row.children(':last');
		        	str.append("<div class='thumbnail'></div>");
		            	thumb = str.children('.thumbnail');
		            	thumb.append("<div class='heading'></div>");
		            	thumb.append("<div class='info'></div>");
			            	head = thumb.children('.heading');
			            	head.css('backgroundImage','url("'+stream.preview+'")');
			            	if(searchPlaylistForStream(playlist,stream.stream_id) >= 0) {
			            		// append a checkmark icon for watch-later button
			            		head.append("<span class='watch-later added' data-tooltip='Added'>" +
		            							"<i class='fa fa-check' aria-hidden='true'></i>" +
		            						"</span>");
			            	} else {
			            		// append a history icon for watch-later button
			            		head.append("<span class='watch-later' data-tooltip='Watch Later'>" +
		            							"<i class='fa fa-history' aria-hidden='true'></i>" +
		            						"</span>");
			            	} // if
			            	info = thumb.children('.info');
			            	info.append("<div class='game'><span>"+stream.game+"</span></div>");
			            	info.append("<div class='ch_name'>"+
			            					"<a href='"+stream.ch_url+"' " +
			            				    	"target='_blank' " +
			            				    	"rel='noopener'>" + stream.ch_name +
			            					"</a>" +
			            				"</div>");
			            	info.append("<div class='viewers'>"+
			            					"<span>"+stream.viewers.toLocaleString()+"</span>" +
			            				"</div>");
	            }); // end $.each 
	            if(!didFindStreams && !sc.html()) { 
	            	sc.append("<div class='no-results'><span>Woops! No matches were found for your search.</span></div>"); 
	            } else if(c_row.children().length != STREAMS_PER_ROW) {
	            	for(var i = c_row.children().length; i < STREAMS_PER_ROW; i++) {
	            		c_row.append("<div class='stream-spacer'></div>");
	            	} // for
	            } // if
	        },
	        error: function(xhr, error, msg) { // there was some problem in accessing the StreamServlet
	            console.log(msg);
	        }
	    }); // end $.ajax
	} // getStreams

	//INFINITE SCROLL STUFF
	//calls getStreams() on scroll condition. appends new streams instead of overwriting
	var box_count = 18;
	var page = 0;
	var isWorking = false;
	$('.stream-container').scroll(function() {
	    var $this = $(this);
	    var from_inner_top = $this.scrollTop();
	    var innerheight = $this[0].scrollHeight;
	    var initialheight = $this.height();
	    if((from_inner_top/(innerheight-initialheight)) > .999) {
	    	// prevents quick, successive calls to API by someone who keeps repeatedly hitting bottom of scroll bar
	    	if(!isWorking) {
	    		isWorking = true;
	    		getStreams($('#f_keyword').val(), $('#f_game').val(), $('#f_channel').val(), ''+(++page), false);
	    		setTimeout(function(){ isWorking=0; },1500);
	    	} // if
	    } // if
	});

	//FILTERS STUFF
	//disables all other filters when typing. calls getStreams() after done typing. new streams reflect filter text
	var typingTimer; // timer identifier
	$('.filters input').on('input', function() {
		// disable all other filter inputs if one has text inside it
		var $this = $(this);
		var other_inputs = $this.closest('.filters').find('input').not($this);
		if($this.val()) {
			other_inputs.attr('disabled','disabled');
			other_inputs.css('cursor', 'not-allowed');
		} else {
			other_inputs.removeAttr('disabled');
			other_inputs.css('cursor', 'text');
		} // if/else
		
		// update streams in stream container
		clearTimeout(typingTimer); // reset the timer
		typingTimer = setTimeout(function() {
			var id = $this.attr('id');
			if(id == "f_keyword") {
				getStreams($this.val(),"","","0", true)
			} else if(id == "f_game") {
				getStreams("",$this.val(),"","0", true)
			} else {
				getStreams("","",$this.val(),"0", true)
			} // if/else
		}, 800); // waits 0.8s after typing is over to update streams
	});

	//RIPPLE EFFECT STUFF
	//creates js ripples on background image
	$('body').ripples({ resolution: 512, dropRadius: 20, perturbance: 0.05 });
	var on = true;
	$('#ripple-switch').click(function() {
		if(on) {
			$('body').ripples('pause');
			on = false;
		} else {
			$('body').ripples('play');
			on = true;
		} // if/else
	});

	//SIDE NAV STUFF
	//increases width of side nav on hover. enables user to input filter text
	$('.side-nav li:not(:nth-child(1))').mouseenter(function() {
		$('.side-nav').css('width', '30rem');
	}).mouseleave(function() {
		$('.side-nav').css('width', '9.5rem');
	});

	//WATCH LATER TAB STUFF
	//called on page load. initializes watch later tab and playlist[] from cookie('playlist')
	function initWatchLater() {
		var $ul = $('.history-tab ul');
		var watch_later = JSON.parse(Cookies.get('playlist'));
		// copies playlist stored in cookie('playlist') to the global playlist[] var
		playlist = watch_later.slice(); 
		if(!playlist.length) {
			$ul.append("<li class='no-results'><span>No streams for you to watch later :(</span></li>"); 
		} else {
			$.each(playlist, function(i,stream) {
				appendToWatchLaterTab($ul,stream);
			}); // end $.each
		} // if/else
	} // initWatchLater

	//checks if a certain stream is in watch later playlist already
	function searchPlaylistForStream(list, stream_id) {
		//check if already added to playlist[]
		var index = -1;
		$.each(list, function(i,stream) {
			if(stream._id == stream_id) { index = i; return false; } // if
		});
		return index;
	} // searchPlaylistForStream

	//converts 'data-' attr info into JSON obj containing necessary stream info
	function jsonFromStreamMeta($stream) {
		var json = null;
		var stream_id = $stream.attr('data-stream-id');
		var viewers = $stream.attr('data-viewers');
		var game = $stream.attr('data-game');
		var preview = $stream.attr('data-preview');
		var ch_name = $stream.attr('data-ch-name');
		var ch_url = $stream.attr('data-ch-url');
		var json = {
				_id: stream_id,
				_viewers: viewers,
				_game: game,
				_preview: preview,
				_ch_name: ch_name,
				_ch_url: ch_url
			};
		return json;
	} // jsonFromStreamMeta

	//appends stream html to watch later tab interface
	function appendToWatchLaterTab($ul,stream) {
		$ul.append("<li class='thumb-tab stream' data-stream-id='"+stream._id+"' data-ch-name='"+stream._ch_name+"'>"+
						"<i class='remove fa fa-close'></i>"+
						"<div class='thumb-img'></div>"+
						"<p>"+
							"<span class='thumb-title'>"+stream._game+"</span>"+
							"<a class='thumb-channel' href='"+stream._ch_url+"' target='_blank' rel='noopener'>"+stream._ch_name+"</span>"+
						"</p>"+
				   "</li>"); 
		$("[data-stream-id="+stream._id+"] .thumb-img").css('backgroundImage', 'url("'+stream._preview+'")');
	} // appendToWatchLaterTab

	//remove stream html from watch later tab interface
	function removeFromWatchLaterTab($ul,stream) {
		$ul.children('[data-stream-id='+stream._id+']').remove(); // from watch later tab
		if(!$ul.children().length) {
			// add .no-results msg if final stream removed
			$ul.append("<li class='no-results'><span>No streams for you to watch later :(</span></li>");
		} // if
	} // removeFromWatchLaterTab

	//add/remove from watch later via thumbnail watch later button
	var playlist = [];
	$(document).on('click', '.watch-later', function(e) { // has to be (document).on() for dynamically created elements
		e.stopPropagation();
		var $this = $(this);
		var $ul = $('.history-tab ul');
		var $stream = $(this).closest('.stream');
		var stream_json = jsonFromStreamMeta($stream);
		var stream_index = searchPlaylistForStream(playlist, stream_json._id);
		if(stream_index < 0) {
			//add it
			if($ul.children('.no-results').length) $ul.empty(); // remove .no-results msg if its there
			playlist.push(stream_json); // store in array for easy processing
			//dynamically create new watch later tab entry
			appendToWatchLaterTab($ul,stream_json); // store in tab for user viewing
			//update watch later icon to checkmark, and tooltip to 'Added'
			$this.html("<i class='fa fa-check' aria-hidden='true'></i>");
			$this.attr('data-tooltip', 'Added');
			$this.addClass('added');
		} else {
			//remove it
			playlist.splice(stream_index,1); // from playlist[]
			removeFromWatchLaterTab($ul,stream_json); // from watch later tab
			$this.html("<i class='fa fa-history' aria-hidden='true'></i>");
			$this.attr('data-tooltip', 'Watch Later');
			$this.removeClass('added');
		} // if/else
	});

	//remove from watch later via thumb-tab remove button
	$(document).on('click', '.thumb-tab .remove', function() {
		var $ul = $('.history-tab ul');
		var $stream = $(this).closest('.stream');
		var stream_json = jsonFromStreamMeta($stream);
		var stream_index = searchPlaylistForStream(playlist, stream_json._id);
		var corresponding_thumbnail = $('[data-stream-id='+stream_json._id+']');
		playlist.splice(stream_index,1); // from playlist[]
		removeFromWatchLaterTab($ul,stream_json); // from watch later tab
		// if stream thumbnail is located in stream container, change watch later icon back to default
		if(corresponding_thumbnail) {
			corresponding_thumbnail.find('.watch-later').html("<i class='fa fa-history' aria-hidden='true'></i>");
			corresponding_thumbnail.find('.watch-later').attr('data-tooltip', 'Watch Later');
			corresponding_thumbnail.find('.watch-later').removeClass('added');
		} // if
	});

	//pulls out watch later tab
	var out = false;
	$('#history').click(function() {
		var $left = $('.side-nav');
		var $right = $('.history-tab');
		if(!out) {
			$(this).children('i').css('transform', 'rotate(-360deg)');
			$left.css({ 'width': 0, 'display': 'none' });
			$right.css({ 'width': '25rem', 'display': 'block' });
			out = true;
		} else {
			$(this).children('i').css('transform', 'rotate(0deg)');
			$left.css({ 'width': '9.5rem', 'display': 'block' });
			$right.css({ 'width': 0, 'display': 'none' });
			out = false;
		} // if/else
	});

	//MODAL STUFF
	//opens dynamically-created stream player/chat modal on thumbnail click
	$(document).on('click', '.thumbnail .heading, .thumbnail .game, .thumb-tab .thumb-title, .thumb-tab .thumb-img', function() { // has to be (document).on() for dynamically created elements
		var $stream = $(this).closest('.stream');
	    var stream_data = jsonFromStreamMeta($stream);
	    // check if necessary meta-data was recovered
	    if(stream_data) {
	    	// prepare dynamic stream player content
	    	$('.modal-content').append("<iframe id='player' class='player' src='' height='' width='' allowfullscreen></iframe>");
	    	var $player = $('.player');
	    	$player.attr('src',"https://player.twitch.tv/?channel="+stream_data._ch_name);
	    	$player.attr('height',$player.height());
	    	$player.attr('width',$player.width());
			
			// prepare dynamic live chat iframe
	    	$('.modal-content').append("<iframe seamless class='chat' id='' src='' height='' width=''></iframe>");
			var $chat = $('.chat');
			$chat.attr('id',stream_data._ch_name);
			$chat.attr('src',"https://www.twitch.tv/"+stream_data._ch_name+"/chat");
			$chat.attr('height',$chat.height());
			$chat.attr('width',$chat.width());
			
			// appear modal blur
		    $('.stream-container').css('overflow', 'hidden');
		    $('.modal').css('visibility', 'visible');
		    $('.modal').css('background', 'rgba(30,30,30,.7)'); 
		    // appear modal content
		    setTimeout(function() {
		        $('.modal .modal-content').css('visibility', 'visible');
		        $('.modal .modal-content').css('opacity', 1);
		    }, 200);
	    } // if
	});

	//closes and ends stream player/chat modal on 'X' click
	$('.modal .close').click(function() { 
	    // disappear modal content
	    $('.modal .modal-content').css('opacity', 0);
	    $('.modal .modal-content').css('visibility', 'hidden');
	    setTimeout(function() {
	        // disappear the modal blur
	        $('.modal').css('background', 'rgba(105,105,105,0)');
	        $('.modal').css('visibility', 'hidden');
	        $('.player').remove();
	    	$('.chat').remove();
	        $('.stream-container').css('overflow', 'scroll');
	    }, 200);
	});

	//minimizes chat window and expands stream player
	var minimized = false;
	$('.minimize-chat').on('click', function() {
		var $chat = $('.chat');
		var $player = $('.player');
		var $this = $(this);
		if(!minimized) {
			// shrink chat window
			$chat.css('width', 0);
			$player.css('width', '100%');
			$this.html('<i class="fa fa-arrow-left" aria-hidden="true"></i>');
			minimized = true;
		} else {
			// expand chat window
			$chat.css('width', '30%');
			$player.css('width', '70%');
			$this.html('<i class="fa fa-arrow-right" aria-hidden="true"></i>');
			minimized = false;
		} // if/else
	});

	// LAZY LOAD STUFF
	//allows images to lazy load rather than hold up DOM
	$('img').unveil();
}); 