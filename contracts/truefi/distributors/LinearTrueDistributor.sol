// SPDX-License-Identifier: MIT
pragma solidity 0.6.10;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";

import {ITrueDistributor, IERC20} from "../interface/ITrueDistributor.sol";
import {Ownable} from "../upgradeability/UpgradeableOwnable.sol";

/**
 * @title LinearTrueDistributor
 * @notice Distribute TRU in a linear fashion
 * @dev Distributor contract which uses a linear distribution
 *
 * Contracts are registered to receive distributions. Once registered, 
 * a farm contract can claim TRU from the distributor.
 * - Distributions are based on time.
 * - Owner can withdraw funds in case distribution need to be re-allocated
 */
contract LinearTrueDistributor is ITrueDistributor, Ownable {
    using SafeMath for uint256;

    IERC20 public override trustToken;
    uint256 public distributionStart;
    uint256 public duration;
    uint256 public totalAmount;
    uint256 public lastDistribution;
    uint256 public distributed;

    address public farm;

    /**
     * @dev Emitted when the farm address is changed
     * @param
     */
    event FarmChanged(address newFarm);

    /**
     * @dev Emitted when a distribution occurs
     * @param farm Farm this distribution is sent to
     */
    event Distributed(address farm);

    /**
     * @dev Initialize distributor
     * @param _distributionStart
     * @param _duration
     * @param _amount
     * @param _trustToken
     */
    function initialize(
        uint256 _distributionStart,
        uint256 _duration,
        uint256 _amount,
        IERC20 _trustToken
    ) public initializer {
        Ownable.initialize();
        distributionStart = _distributionStart;
        lastDistribution = _distributionStart;
        duration = _duration;
        totalAmount = _amount;
        trustToken = _trustToken;
    }

    /**
     * @dev Set contract to receive distributions
     * @param newFarm New farm for distribution
     */
    function setFarm(address newFarm) external onlyOwner {
        farm = newFarm;
        FarmChanged(newFarm);
    }

    /**
     * @dev Distribute tokens to farm
     */
    function distribute(address) public override {
        if (block.timestamp < distributionStart) {
            return;
        }

        uint256 amount = totalAmount.sub(distributed);
        if (block.timestamp < distributionStart.add(duration)) {
            amount = block.timestamp.sub(lastDistribution).mul(totalAmount).div(duration);
        }

        lastDistribution = block.timestamp;
        if (amount == 0) {
            return;
        }
        distributed = distributed.add(amount);

        require(trustToken.transfer(farm, amount));
    }

    function empty() public override onlyOwner {
        require(trustToken.transfer(msg.sender, trustToken.balanceOf(address(this))));
    }
}
