package edu.uga.cs4300.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

public class MyHTTP {
	/**
	 * This method is meant as a helper function to assist in making a GET request from 
	 * a Java servlet.
	 * 
	 * @param url the url to which the GET request will be made
	 * @param headers the HTTP request headers that need to be set
	 * @param query_string the necessary query-string parameters/values
	 * @return the JSON response from Twitch in JSONObject form
	 */
	public static JSONObject GET(String url, Map<String,String> headers, String query_string) {
		URL obj;
		HttpURLConnection con;
		JSONObject json = null;
		try {
			obj = new URL(url + query_string);
			con = (HttpURLConnection) obj.openConnection();
			// optional default is GET
			con.setRequestMethod("GET");
			//add request headers
			for(Map.Entry<String, String> header : headers.entrySet()) {
				con.setRequestProperty(header.getKey(), header.getValue());
			} // for
			// read in response
			BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
			StringBuffer response = new StringBuffer();
			String inputLine;
			while((inputLine = in.readLine()) != null) {
				response.append(inputLine);
			} // while
			in.close();
			//store json
			json = new JSONObject(response.toString());
		} catch (MalformedURLException e) {
			e.printStackTrace();
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		} catch (JSONException e) {
			e.printStackTrace();
		} // try/catch
		return json;
	} // GET
} // MyHTTP
