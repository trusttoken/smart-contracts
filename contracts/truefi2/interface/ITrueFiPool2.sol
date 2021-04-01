// SPDX-License-Identifier: MIT
pragma solidity 0.6.10;

import {ERC20, IERC20} from "../../common/UpgradeableERC20.sol";

interface ITrueFiPool2 is IERC20 {
    function initialize(
        ERC20 _token,
        ERC20 _stakingToken,
        address __owner
    ) external;

    function token() external view returns (IERC20);

    /**
     * @dev borrow from pool
     * 1. Transfer TUSD to sender
     * 2. Only lending pool should be allowed to call this
     */
    function borrow(uint256 amount, uint256 fee) external;

    /**
     * @dev pay borrowed money back to pool
     * 1. Transfer TUSD from sender
     * 2. Only lending pool should be allowed to call this
     */
    function repay(uint256 currencyAmount) external;
}
