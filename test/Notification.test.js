const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../src/ethereum/build/NotificationFactory.json');
const compiledNotification = require('../src/ethereum/build/Notification.json');

let accounts;
let factory;
let notificationAddress;
let notification;
let gasPrice;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    gasPrice = await web3.eth.getGasPrice();

    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({ data: compiledFactory.bytecode, arguments: [] })
        .send({ from: accounts[0], gas: '3000000' });
    
    await factory.methods.createNotification(accounts[1], web3.utils.keccak256("Test message"), 600)
        .send({ from: accounts[0], gas: '3000000', value: '100' });
    
    const addresses = await factory.methods.getNotifications().call();
    notificationAddress = addresses[0];
    
    notification = await new web3.eth.Contract(JSON.parse(compiledNotification.interface), notificationAddress);
});

describe('Notifications', () => {
    it('deploys a factory and a notification', () => {
        assert.ok(factory.options.address);
        assert.ok(notification.options.address);
    });

    it('factory has saved sender notifications', async () => {
        const senderaddresses = await factory.methods.getSenderNotifications(accounts[0]).call();
        assert.equal(senderaddresses[0], notificationAddress);
    });

    it('factory has saved receiver notifications', async () => {
        const receiveraddresses = await factory.methods.getReceiverNotifications(accounts[1]).call();
        assert.equal(receiveraddresses[0], notificationAddress);
    });

    it("notification state is created and has a hash message", async function () {
        var messageHash = await notification.methods.messageHash().call();
        var state = await notification.methods.getState().call();
        assert.equal(messageHash, web3.utils.keccak256("Test message"));
        assert.equal(state, "created");
      });

      it("only receiver can accept notification", async function() {
        try { 
          await notification.methods.accept().send({ from: accounts[2] });
          assert(false);
        } catch (err) {
          assert(err);
        } 
      });

      it("receiver can accept notification", async function() {
        await notification.methods.accept().send({ from: accounts[1] });
        var state = await notification.methods.getState().call();
        assert.equal(state, "accepted");
      });

      it("only sender can finish notification", async function() {
        await notification.methods.accept().send({ from: accounts[1] });
        try { 
          await notification.methods.finish("Test message").send({ from: accounts[2] });
          assert(false);
        } catch (err) {
          assert(err);
        } 
      });

      it("sender can finish notification", async function() {
        await notification.methods.accept().send({ from: accounts[1] });
        await notification.methods.finish("Test message").send({ from: accounts[0] });
        var message = await notification.methods.message().call();
        var state = await notification.methods.getState().call();
        assert.equal(message, "Test message");
        assert.equal(state, "finished");
      });

      it("sender receives the refund of the deposit", async function() {
        await notification.methods.accept().send({ from: accounts[1] });

        var balanceSender1 = await web3.eth.getBalance(accounts[0]);
        var balanceContract = await web3.eth.getBalance(notification.options.address);
        var transaction = await notification.methods.finish("Test message").send({ from: accounts[0] });

        var receipt = await web3.eth.getTransactionReceipt(transaction.transactionHash);

        var balanceSender2 = await web3.eth.getBalance(accounts[0]);

        assert(((balanceSender2-balanceSender1)+(receipt.cumulativeGasUsed*gasPrice))>=balanceContract);
      });
});
