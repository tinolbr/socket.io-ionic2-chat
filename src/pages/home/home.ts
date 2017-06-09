import { ChatPage } from './../chat/chat';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
 
  nickname:string;

  constructor(public navCtrl: NavController) {
  }

  login() {
    if (this.nickname) {
        this.navCtrl.push(ChatPage, {
          nickname: this.nickname
        })
    }
  }

}