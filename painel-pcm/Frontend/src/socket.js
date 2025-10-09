import { io } from "socket.io-client";

const URL = "http://localhost:5000";

export const socket = io(URL, {
  autoConnect: false, 
});


export const on = (eventName, callback) => {
  socket.on(eventName, callback);
};

export const off = (eventName, callback) => {
  socket.off(eventName, callback);
};