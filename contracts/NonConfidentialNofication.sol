pragma solidity ^0.4.11;

// Notificació certificada no confidencial, d'un sol ús
contract NonConfidentialNofication {
    // Parties involved
    address public sender;
    address public receiver;

    // Message
    string public messageHash;
    string public message;
    // Time limit in days
    uint public term; 

    // Possible states
    enum State {created, cancelled, accepted, finished }
    State public state;

    event StateInfo( State state );

    function NonConfidentialNofication(address _receiver, string _messageHash, uint _term) public {
        sender = msg.sender;
        receiver = _receiver;
        messageHash = _messageHash;
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
        message = _message;
        state = State.finished;
        StateInfo(state);
    }

    function cancel() public {
        require(1==1); // Check term and block.timestamp
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
