package edu.uga.cs4300.model;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import edu.uga.cs4300.controller.InputCleaner;
import edu.uga.cs4300.controller.MyHTTP;

/**
 * Servlet implementation class StreamServlet
 */
@WebServlet("/StreamServlet")
public class StreamServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static final String API_BASE = "https://api.twitch.tv/kraken";
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public StreamServlet() {
        super();
    } // Constructor

	/**
	 * @see Servlet#init(ServletConfig)
	 */
	public void init(ServletConfig config) throws ServletException {
		
	} // init

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		PrintWriter out = getMyWriter(response); // use this to return JSON to ajax
		response.setContentType("application/json"); // allows us to return JSON obj to ajax
		String f_keyword, client_id, page; // passed here in ajax request
		
		// checks to see if everything we need has been set correctly
		if((f_keyword = InputCleaner.sanitize(request.getParameter("f_keyword"))) != null && 
		   (client_id = InputCleaner.sanitize(request.getParameter("client_id"))) != null &&
		   (page 	  = InputCleaner.sanitize(request.getParameter("page"))) 	  != null) {
			
			// prepares the full URL for the API call
			String ENDPOINT = "/streams"; // will be default endpoint for Twitch API. requests ALL live streams
			String QSTRING = "?"; // will be default query string
			int LIMIT = 36; // will be default stream return limit. 36 so it corresponds to 12 stream rows, or 2 pages worth of scrolling
			if(!f_keyword.isEmpty()) { 
				ENDPOINT = "/search/streams"; 
				QSTRING = "?query="+URLEncoder.encode(f_keyword, "UTF-8")+"&"; 
			} // if
			
			// prepares all request headers for the API call
			Map<String,String> header_map = new HashMap<String,String>();
			header_map.put("Accept", "application/vnd.twitchtv.v5+json");
			header_map.put("Client-ID", client_id);
			
			// makes the SYNCHRONOUS call to Twitch API
			try {
				// full Twitch API JSON response
				JSONObject body = MyHTTP.GET(API_BASE+ENDPOINT, 
						   					 header_map, 
						   					 QSTRING+
						   					 "limit="+LIMIT+
						   					 "&offset="+Integer.toString(Integer.valueOf(page)*LIMIT));
		    	JSONArray resp = new JSONArray(); // setup our own, smaller JSON to return to ajax
		    	try { // try to convert Twitch response to usable JSON
		    		JSONArray twitch_streams = body.getJSONArray("streams"); // gets JSON array of streams from Twitch response 
	    			for(int i = 0, size = twitch_streams.length(); i < size; i++) {
	    				JSONObject stream = twitch_streams.getJSONObject(i); // gets i'th stream from Twitch response
	    				Integer stream_id; 
	    				// stream id will be null if live stream has ended
	    				if((stream_id = stream.getInt("_id")) != null) { 
	    					// pull relevant info from stream obj and store as JSON obj
	    					JSONObject s = new JSONObject();
	    					s.put("stream_id", stream_id);
	    					s.put("viewers", stream.getInt("viewers"));
	    					s.put("game", stream.getString("game"));
	    					s.put("preview", stream.getJSONObject("preview").getString("medium"));
	    					s.put("ch_name", stream.getJSONObject("channel").getString("name"));
	    					s.put("ch_url", stream.getJSONObject("channel").getString("url")); 
	    					resp.put(s);
	    				} // if
	    			} // for
		    	} catch(JSONException e) { 
		    		// this exception seems to only be thrown when body.getJSONArray("streams")
		    		// is called by an attempt to search for a game title that doesn't exist
		    		// or for a channel name that doesn't exist. it is not, however, thrown
		    		// when a keyword is typed that doesn't match anything. This may be a 
		    		// problem with the Twitch API itself, aka not returning an empty JSON array
		    		// when it should, as it does when the keyword endpoint doesn't match anything
		    		e.printStackTrace();
		    	} // try/catch
		    	
		    	// try to send back the relevant JSON we created from the Twitch stream data
		    	// this will then be transformed into HTML we can insert into our stream container
		    	out.print(resp);
		    	out.flush();
			} catch (NumberFormatException e) {
				e.printStackTrace();
			} catch (Exception e) {
				System.out.println("Something went wrong with MyHTTP.GET()");
				e.printStackTrace();
			} // try/catch
		} else { // 
			System.out.println("Something went wrong between ajax and StreamServlet. Not all parameters were set.");
		} // if/else
	} // doGet

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	} // doPost
	
	// --- MISC METHODS --- //
//	/**
//	 * Solves a limitation of the Twitch API that disallows searching of live streams by the
//	 * actual channel name. This method takes in the channel the user wants to watch, and then it
//	 * sends a GET request to the Twitch API endpoint associated with converting channel names to 
//	 * user IDs. Only with the user ID can the subsequent API call be made to grab the live stream 
//	 * associated with the channel name originally specified by the user.
//	 * 
//	 * @param f_channel the channel name(s) whose live stream(s) the user wants to watch
//	 * @param client_id the Twitch API key associated with the developer's application
//	 * @return as specified by the Twitch API, the string of comma-separated user IDs
//	 */
//	private String userIDsFromChannelNames(String f_channel, String client_id) {
//		// prepares all request headers for the API call
//		Map<String,String> header_map = new HashMap<String,String>();
//		header_map.put("Accept", "application/vnd.twitchtv.v5+json");
//		header_map.put("Client-ID", client_id);
//		String channel_ids = "";
//		try {
//			JSONObject body = MyHTTP.GET(API_BASE+"/users", 
//  					 		  header_map, 
//  					 		  "?login="+URLEncoder.encode(f_channel, "UTF-8"));
//			JSONArray channels = body.getJSONArray("users");
//			for(int i = 0, size = channels.length(); i < size; i++) {
//				channel_ids += channels.getJSONObject(i).getString("_id");
//				if(i != size-1) channel_ids += ",";
//			} // for
//		} catch (UnsupportedEncodingException e) {
//			e.printStackTrace();
//		} catch (JSONException e) {
//			e.printStackTrace();
//		} catch (Exception e) {
//			System.out.println("Something went wrong with MyHTTP.GET()");
//			e.printStackTrace();
//		} // try/catch
//		return channel_ids;
//	} // userIDsFromChannelNames
	
	/**
	 * Helper method that encapsulates the try/catch block necessary to grab the PrintWriter
	 * object from the HttpServletResponse object.
	 * 
	 * @param r the response object from which the PrintWriter is grabbed
	 * @return the PrintWriter of r
	 */
	private PrintWriter getMyWriter(HttpServletResponse r) {
		PrintWriter out = null;
		try {
			out = r.getWriter();
		} catch (IOException e) {
			e.printStackTrace();
		} // try/catch
		return out;
	} // getMyWriter

} // StreamServlet
