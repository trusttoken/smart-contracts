// SPDX-License-Identifier: MIT
pragma solidity 0.6.10;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {ITrueFiCreditOracle} from "./interface/ITrueFiCreditOracle.sol";
import {UpgradeableClaimable} from "../common/UpgradeableClaimable.sol";

/**
 * @title TrueFiCreditOracle
 * @dev Contract which allows the storage of credit scores for
 * TrueFi borrower accounts.
 */
contract TrueFiCreditOracle is ITrueFiCreditOracle, UpgradeableClaimable {
    // ================ WARNING ==================
    // ===== THIS CONTRACT IS INITIALIZABLE ======
    // === STORAGE VARIABLES ARE DECLARED BELOW ==
    // REMOVAL OR REORDER OF VARIABLES WILL RESULT
    // ========= IN STORAGE CORRUPTION ===========

    // @dev Track credit scores for an account
    mapping(address => uint8) score;

    // @dev Track credit scores for an account
    mapping(address => uint256) borrowLimit;

    // Manager role authorized to set credit scores
    address public manager;

    // ======= STORAGE DECLARATION END ============

    event ManagerChanged(address newManager);

    function initialize() public initializer {
        UpgradeableClaimable.initialize(msg.sender);
    }

    modifier onlyManager() {
        require(msg.sender == manager, "TrueFiCreditOracle: Caller is not the manager");
        _;
    }

    /**
     * @dev Get score for `account`
     * Scores are stored as uint8 allowing scores of 0-255
     */
    function getScore(address account) public override view returns (uint8) {
        return score[account];
    }

    /**
     * @dev Set `newScore` value for `account`
     * Scores are stored as uint8 allowing scores of 0-255
     */
    function setScore(address account, uint8 newScore) public onlyManager {
        score[account] = newScore;
    }

    /**
     * @dev Get max borrow limit for `account`
     */
    function getBorrowLimit(address account) public override view returns (uint256) {
        return borrowLimit[account];
    }

    /**
     * @dev Set `newBorrowLimit` value for `account`
     */
    function setBorrowLimit(address account, uint256 newBorrowLimit) public onlyManager {
        borrowLimit[account] = newBorrowLimit;
    }

    /**
     * @dev Set new manager
     */
    function setManager(address newManager) public onlyOwner {
        manager = newManager;
        emit ManagerChanged(newManager);
    }
}
