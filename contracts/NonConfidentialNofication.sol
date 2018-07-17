pragma solidity ^0.4.11;

// Notificació certificada no confidencial, d'un sol ús
contract NonConfidentialNofication {
    // Parties involved
    address public sender;
    address public receiver;

    // Message
    bytes32 public messageHash;
    string public message;
    // Time limit (in seconds)
    // See units: http://solidity.readthedocs.io/en/develop/units-and-global-variables.html?highlight=timestamp#time-units
    uint public term; 
    // Start time
    uint public start; 

    // Possible states
    enum State {created, cancelled, accepted, finished }
    State public state;

    event StateInfo( State state );

    function NonConfidentialNofication(address _receiver, bytes32 _messageHash, uint _term) public {
        sender = msg.sender;
        receiver = _receiver;
        messageHash = _messageHash;
        start = now; // now = block.timestamp
        term = _term;
        state = State.created;
        StateInfo(state);
    }

    function accept() public {
        require (msg.sender==receiver && state==State.created);
        state = State.accepted;
        StateInfo(state);
    }

    function finish(string _message) public {
        require (msg.sender==sender && state==State.accepted);
        require (messageHash==keccak256(_message));
        message = _message;
        state = State.finished;
        StateInfo(state);
    }

    function cancel() public {
        require(now >= start+term); // Check term and now (block.timestamp)
        require((msg.sender==sender && state==State.created) || (msg.sender==receiver && state==State.accepted));
        state = State.cancelled;
        StateInfo(state);
    }

    function getState() public view returns (string) {
        if (state==State.created) {
            return "created";
        } else if (state==State.cancelled) {
            return "cancelled";
        } else if (state==State.accepted) {
            return "accepted";
        } else if (state==State.finished) {
            return "finished";
        } 
    }
}
