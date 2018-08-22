pragma solidity ^0.4.24;

contract NotificationFactory {
    mapping(address => address[]) public senderNotifications;
    mapping(address => address[]) public receiverNotifications;
    address[] public notifications;

    function createNotification(address _receiver, bytes32 _messageHash, uint _term) public payable {
        address newNotification = (new Notification).value(msg.value)(msg.sender, _receiver, _messageHash, _term);
        notifications.push(newNotification);
        senderNotifications[msg.sender].push(newNotification);
        receiverNotifications[_receiver].push(newNotification);
    }

    function getSenderNotifications(address _sender) public view returns (address[]) {
        return senderNotifications[_sender];
    }

    function getSenderNotificationsCount(address _sender) public view returns (uint) {
        return senderNotifications[_sender].length;
    }

    function getReceiverNotifications(address _receiver) public view returns (address[]) {
        return receiverNotifications[_receiver];
    }

    function getReceiverNotificationsCount(address _receiver) public view returns (uint) {
        return receiverNotifications[_receiver].length;
    }

    function getNotifications() public view returns (address[]) {
        return notifications;
    }

    function getNotificationsCount() public view returns (uint) {
        return notifications.length;
    }
}

// Notificació certificada no confidencial, d'un sol ús
contract Notification {  //NonConfidentialNotification
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

    constructor (address _sender, address _receiver, bytes32 _messageHash, uint _term) public payable {
        require (msg.value>0); // Requires that the sender send a deposit of minimum 1 wei (>0 wei)
        sender = _sender;
        receiver = _receiver;
        messageHash = _messageHash;
        start = now; // now = block.timestamp
        term = _term;
        state = State.created;
        emit StateInfo(state);
    }

    function accept() public {
        require (msg.sender==receiver && state==State.created);
        state = State.accepted;
        emit StateInfo(state);
    }

    function finish(string _message) public {
        require(now < start+term); // It's not possible to finish after deadline
        require (msg.sender==sender && state==State.accepted);
        require (messageHash==keccak256(_message));
        message = _message;
        sender.transfer(this.balance); // Sender receives the refund of the deposit
        state = State.finished;
        emit StateInfo(state);
    }

    function cancel() public {
        require(now >= start+term); //  It's not possible to cancel before deadline
        require((msg.sender==sender && state==State.created) || (msg.sender==receiver && state==State.accepted));
        if (msg.sender==sender && state==State.created) {
            sender.transfer(this.balance); // Sender receives the refund of the deposit
        }
        state = State.cancelled;
        emit StateInfo(state);
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

    function getSummary() public view returns (address, address, uint, bytes32, string, uint, uint, string) {
        string memory _state;
        if (state==State.created) {
            _state = "created";
        } else if (state==State.cancelled) {
            _state = "cancelled";
        } else if (state==State.accepted) {
            _state = "accepted";
        } else if (state==State.finished) {
            _state = "finished";
        } 
        return (
          sender,
          receiver,
          this.balance,
          messageHash,
          message,
          term,
          start,
          _state
        );
    }
}
