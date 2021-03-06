import web3 from './web3';

//const path = require("path");
//const fs = require("fs-extra"); // fs with extra functions

const NotificationFactory = require('./build/NotificationFactory.json');

const instance = new web3.eth.Contract(
    JSON.parse(NotificationFactory.interface),
    NotificationFactory.address
);

export default instance;