import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController, NavParams, Content } from 'ionic-angular';
import * as io from 'socket.io-client';


@Component({
	selector: 'page-chat',
	templateUrl: 'chat.html'
})
export class ChatPage implements OnInit {

	@ViewChild(Content) content: Content;
	TYPING_TIMER_LENGTH = 400;
	COLORS = [
		'#e21400', '#91580f', '#f8a700', '#f78b00',
		'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
		'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
	];

	typing: boolean = false;
	lastTypingTime: any;
	connected: boolean;
	number_message: any;

	nickname: string;
	socket: any;
	chat_input: string;
	messages = [];

	public _self = this;

	constructor(public navCtrl: NavController, public params: NavParams) {
		this.nickname = params.get('nickname')
	}

	//Initial to Page
	ngOnInit() {
		//init variable socket
		this.socket = io('https://socketio-chat.now.sh/');

		//Is Connect	
		this.socket.on("connect", (socket) => {
			this.connected = true
			console.log('um usuario conectou ');
		});

		//Add user
		this.socket.emit('add user', this.nickname);

		// On login display welcome message
		this.socket.on('login', (data) => {
			//Set the value of connected flag
			console.log('Login: ' + data.numUsers)
			this.connected = true;
			this.number_message = this.messageNumberOfMember(data.numUsers);

		});

		// Whenever the server emits 'new message', update the chat body
		this.socket.on('new message', (data) => {
			if (data.message && data.username) {
				this.addMessageToList(data.username, true, data.message);
			}
		});

		// Whenever the server emits 'user joined', log it in the chat body
		this.socket.on('user joined', (data) => {
			this.addMessageToList("", false, data.username + " joined");
			this.addMessageToList("", false, this.messageNumberOfMember(data.numUsers));
		});

		// Whenever the server emits 'user left', log it in the chat body
		this.socket.on('user left', (data) => {
			this.addMessageToList("", false, data.username + " left");
			this.addMessageToList("", false, this.messageNumberOfMember(data.numUsers));
		});

		//Whenever the server emits 'typing', show the typing message
		this.socket.on('typing', (data) => {
			this.addChatTyping(data);
		});

		// Whenever the server emits 'stop typing', kill the typing message
		this.socket.on('stop typing', (data) => {
			this.removeChatTyping(data.username);
		});

		this.socket.on("disconnect", () => {
			console.log('usuario desconectou');
		});

	}

	//function called when user hits the send button
	sendMessage = () => {
		this.socket.emit('new message', this.chat_input)
		this.addMessageToList(this.nickname, true, this.chat_input)
		this.socket.emit('stop typing');
		this.chat_input = ""
	}

	//function called on Input Change
	updateTyping = () => {
		this.sendUpdateTyping()
	}

	// Display message by adding it to the message list
	addMessageToList(username, style_type, message) {
		//username = $sanitize(username)
		this.removeChatTyping(username)
		var color = style_type ? this.getUsernameColor(username) : null
		this.messages.push({ content: message, style: style_type, username: username, color: color })
		this.content.scrollToBottom(300);
	}

	//Generate color for the same user.
	getUsernameColor(username) {
		// Compute hash code
		var hash = 7;
		for (var i = 0; i < username.length; i++) {
			hash = username.charCodeAt(i) + (hash << 5) - hash;
		}
		// Calculate color
		var index = Math.abs(hash % this.COLORS.length);
		return this.COLORS[index];
	}

	// Updates the typing event
	sendUpdateTyping() {

		if (this.connected) {
			if (!this.typing) {
				this.typing = true;
				this.socket.emit('typing');
			}
		}

		this.lastTypingTime = (new Date()).getTime();
		setTimeout( () => {
			var typingTimer = (new Date()).getTime();
			var timeDiff = typingTimer - this.lastTypingTime;
			if (timeDiff >= this.TYPING_TIMER_LENGTH && this.typing) {
				this.socket.emit('stop typing');
				this.typing = false;
			}

		}, this.TYPING_TIMER_LENGTH);
	}

	// Adds the visual chat typing message
	addChatTyping(data) {
		this.addMessageToList(data.username, true, " is typing");
	}

	// Removes the visual chat typing message
	removeChatTyping(username) {
		this.messages = this.messages.filter(function (element) { return element.username != username || element.content != " is typing" })
	}

	// Return message string depending on the number of users
	messageNumberOfMember(number_of_users) {
		return number_of_users === 1 ? "there's 1 participant" : "there are " + number_of_users + " participants"
	}

}