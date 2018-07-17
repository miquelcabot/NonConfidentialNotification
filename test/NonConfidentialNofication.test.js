const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let nonConfidentialNofication;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  nonConfidentialNofication = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode, arguments: [accounts[1], web3.utils.keccak256("Test message"), 600] }) // term = 600 seconds = 10 minutes
    .send({ from: accounts[0], gas: '1000000', value: '1' });  // Value: '1' sets the deposit to 1 wei
});

describe('NonConfidentialNofication Contract', () => {
  it('deploys a contract', () => {
    assert.ok(nonConfidentialNofication.options.address);
  });

  it("state is created and has a hash message", async function () {
    var messageHash = await nonConfidentialNofication.methods.messageHash().call();
    var state = await nonConfidentialNofication.methods.getState().call();
    assert.equal(messageHash, web3.utils.keccak256("Test message"));
    assert.equal(state, "created");
  });

  it("only receiver can accept message", async function() {
    try { 
      await nonConfidentialNofication.methods.accept().send({ from: accounts[2] });
      assert(false);
    } catch (err) {
      assert(err);
    } 
  });

  it("receiver can accept message", async function() {
    await nonConfidentialNofication.methods.accept().send({ from: accounts[1] });
    var state = await nonConfidentialNofication.methods.getState().call();
    assert.equal(state, "accepted");
  });

  it("only sender can finish message", async function() {
    await nonConfidentialNofication.methods.accept().send({ from: accounts[1] });
    try { 
      await nonConfidentialNofication.methods.finish("Test message").send({ from: accounts[2] });
      assert(false);
    } catch (err) {
      assert(err);
    } 
  });

  it("sender can finish message", async function() {
    await nonConfidentialNofication.methods.accept().send({ from: accounts[1] });
    await nonConfidentialNofication.methods.finish("Test message").send({ from: accounts[0] });
    var message = await nonConfidentialNofication.methods.message().call();
    var state = await nonConfidentialNofication.methods.getState().call();
    assert.equal(message, "Test message");
    assert.equal(state, "finished");
  });

});
