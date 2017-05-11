# Twitchy (CSCI 4300 Web Programming Final Project)

Authors: Brandon Canaday, Lamia Masud, Songpei Yang, Afua Acheampong

## Idea

A lightweight stream-viewing tool powered by the Twitch API. The main idea is that the current Twitch.tv interface, a website that lets you watch live streams of people playing video games, just has too much going on for the casual viewer (e.g. a live chat interface, section asking you to signup/login, channel rules/description, ads, etc.). Also, the click-path to get to a particular stream seems to be mostly linear, so accidental discovery of something new and cool is limited. Our lightweight solution utilizes real-time filtering of the global set of available live streams. When a first-time user connects to Twitchy, they wilI see a page of live streams loaded on their page (with infinite scroll providing access to more). This is accomplished with the Twitch.tv API. In our UI, there are a set of text inputs that let the user enter restrictions on what streams they want to see loaded on their page. In real time, the shown streams will update to reflect the filter changes. When a user wants to watch a stream, they will click on a stream thumbnail (much like Youtube). This will open a modal window on the same page to enable viewing via the Twitch stream player (also available via the API). To avoid a login page and yet still maintain some level of user persistence, we utilize a cookie that enables identification of a user and their 'watch later' playlist- a playlist from which they can add/remove live streams as they please. This is visible to the user via a slide-out section on the same page. Within this tab, the user can click on a video thumbnail (again, much like youtube) and view that live stream as if they had clicked on the actual stream within the main section of the page. In order to maintain a lightweight, user-friendly feel, we managed to keep the application to a single page. This way, it truly feels like a Twitch.tv utility, as it was meant to be, and not a clone.

## Objectives

−	Goals: slim down the Twitch stream-viewing experience to just that: viewing. 
−	Functions: allow the user to easily discover new content, as well as find relevant streams quickly
−	Benefits: easily understood, and, thus, less headache and more enjoyment while watching
−	Features: clean design, responsive, catchy name, and is a Twitch utility, NOT a clone

## Technologies
−	Java Servlet: requests data from the Twitch API in response to AJAX call  
−	HTML5/CSS3: minimalist user interface
−	JavaScript: cookies, stream filters, stream-viewing modal, infinite scroll, various UI effects, etc.
−	AJAX: application backbone. updates viewable streams based on filter text

## End Users
-   Causal Twitch.tv users and/or random video game fans (of course, everyone in our class, too)
