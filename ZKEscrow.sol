// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZKEscrow {
    address public client;
    address public freelancer;
    uint256 public paymentAmount;
    bytes32 public zkProofHash; 

    enum EscrowState { AWAITING_WORK, WORK_SUBMITTED, RELEASED, REFUNDED }
    EscrowState public currentState;

    event FundsDeposited(address indexed client, uint256 amount);
    event WorkSubmitted(bytes32 proofHash);
    event FundsReleased(address indexed freelancer, uint256 amount);
    event FundsRefunded(address indexed client, uint256 amount);

    modifier onlyClient() {
        require(msg.sender == client, "Only client can call this");
        _;
    }

    modifier inState(EscrowState _state) {
        require(currentState == _state, "Invalid contract state");
        _;
    }

    constructor(address _freelancer) {
        client = msg.sender;
        freelancer = _freelancer;
        currentState = EscrowState.AWAITING_WORK;
    }

    function depositFunds() external payable {
        require(msg.value > 0, "Must deposit more than 0 AVAX");
        paymentAmount += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    function submitProofOfWork(bytes32 _proofHash) external {
        zkProofHash = _proofHash;
        currentState = EscrowState.WORK_SUBMITTED;
        emit WorkSubmitted(_proofHash);
    }

    function approveAndRelease(string memory _passcode) external onlyClient inState(EscrowState.WORK_SUBMITTED) {
        require(keccak256(abi.encodePacked(_passcode)) == zkProofHash, "Invalid ZK passcode proof");
        
        uint256 amount = paymentAmount;
        require(amount > 0, "No funds to release");
        
        paymentAmount = 0;
        currentState = EscrowState.RELEASED;

        (bool success, ) = payable(freelancer).call{value: amount}("");
        require(success, "Transfer to freelancer failed");

        emit FundsReleased(freelancer, amount);
    }

    function refundClient() external onlyClient {
        uint256 amount = paymentAmount;
        require(amount > 0, "No funds to refund");

        paymentAmount = 0;
        currentState = EscrowState.REFUNDED;

        (bool success, ) = payable(client).call{value: amount}("");
        require(success, "Refund failed");

        emit FundsRefunded(client, amount);
    }

    receive() external payable {
        paymentAmount += msg.value;
    }
}
