import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReplserviceService {

  constructor() { }
  REPLTest() {
    return "Hello";
  }
  
}
