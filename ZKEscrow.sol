// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZKEscrow {
    // State Variables
    address public client;
    address public freelancer;
    uint256 public paymentAmount;
    bytes32 public workHash; // Stores the cryptographic proof of work
    
    enum EscrowState { AWAITING_WORK, WORK_SUBMITTED, COMPLETED, REFUNDED }
    EscrowState public currentState;

    // Events (Crucial for frontend tracking)
    event WorkSubmitted(bytes32 indexed cryptographicHash);
    event FundsReleased(address indexed freelancer, uint256 amount);
    event FundsRefunded(address indexed client, uint256 amount);

    // Modifiers to restrict access securely
    modifier onlyClient() {
        require(msg.sender == client, "Only the client can perform this action");
        _;
    }

    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "Only the freelancer can perform this action");
        _;
    }

    modifier inState(EscrowState _state) {
        require(currentState == _state, "Invalid state for this action");
        _;
    }

    /// @notice Initialize contract with freelancer address and deposit funds
    /// @param _freelancer The wallet address of the developer
    constructor(address _freelancer) payable {
        require(msg.value > 0, "You must fund the escrow with AVAX");
        require(_freelancer != address(0), "Invalid freelancer address");
        
        client = msg.sender;
        freelancer = _freelancer;
        paymentAmount = msg.value;
        currentState = EscrowState.AWAITING_WORK;
    }

    /// @notice Freelancer submits the cryptographic proof of work without leaking the files
    /// @param _workHash The SHA-256 or Keccak256 hash of the finished project files
    function submitProofOfWork(bytes32 _workHash) external onlyFreelancer inState(EscrowState.AWAITING_WORK) {
        require(_workHash != bytes32(0), "Hash cannot be empty");
        workHash = _workHash;
        currentState = EscrowState.WORK_SUBMITTED;
        
        emit WorkSubmitted(_workHash);
    }

    /// @notice Client approves the proof and releases funds directly to the freelancer
    function approveAndRelease() external onlyClient inState(EscrowState.WORK_SUBMITTED) {
        currentState = EscrowState.COMPLETED;
        
        // Secure low-level transfer pattern
        (bool success, ) = payable(freelancer).call{value: paymentAmount}("");
        require(success, "AVAX Transfer to freelancer failed");

        emit FundsReleased(freelancer, paymentAmount);
    }

    /// @notice Emergency refund if freelancer fails to submit proof
    function refundClient() external onlyClient inState(EscrowState.AWAITING_WORK) {
        currentState = EscrowState.REFUNDED;
        
        (bool success, ) = payable(client).call{value: paymentAmount}("");
        require(success, "Refund failed");

        emit FundsRefunded(client, paymentAmount);
    }
}
