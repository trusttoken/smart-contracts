// SPDX-License-Identifier: MIT
pragma solidity 0.6.10;

import {UpgradeableClaimable as Claimable} from "../common/UpgradeableClaimable.sol";
import {OwnedProxyWithReference} from "../proxy/OwnedProxyWithReference.sol";
import {ERC20} from "../common/UpgradeableERC20.sol";

import {IPoolFactory} from "./interface/IPoolFactory.sol";
import {ITrueFiPool2} from "./interface/ITrueFiPool2.sol";
import {ITrueLender2} from "./interface/ITrueLender2.sol";
import {ImplementationReference} from "../proxy/ImplementationReference.sol";

/**
 * @title PoolFactory
 * @dev Factory used to create pools for a chosen asset
 * This contract creates a new pool and transfer its ownership to the governance contract
 * Anyone can create a new pool, however the token has to be whitelisted
 * Initially created pools hold the same implementation, which can be changed later on individually
 */
contract PoolFactory is IPoolFactory, Claimable {
    // ================ WARNING ==================
    // ===== THIS CONTRACT IS INITIALIZABLE ======
    // === STORAGE VARIABLES ARE DECLARED BELOW ==
    // REMOVAL OR REORDER OF VARIABLES WILL RESULT
    // ========= IN STORAGE CORRUPTION ===========

    // @dev Mapping of ERC20 token's addresses to its pool's addresses
    mapping(address => address) public pool;
    mapping(address => bool) public override isPool;

    // @dev Whitelist for tokens, which can have pools created
    mapping(address => bool) public isAllowed;
    bool public allowAll;

    ImplementationReference public poolImplementationReference;

    ERC20 public stakingToken;

    ITrueLender2 public trueLender;

    // ======= STORAGE DECLARATION END ===========

    /**
     * @dev Event to show creation of the new pool
     * @param token Address of token, for which the pool was created
     * @param pool Address of new pool's proxy
     */
    event PoolCreated(address token, address pool);

    /**
     * @dev Event to show that token is now allowed/disallowed to have a pool created
     * @param token Address of token
     * @param status New status of allowance
     */
    event AllowedStatusChanged(address token, bool status);

    /**
     * @dev Event to show that allowAll status has been changed
     * @param status New status of allowAll
     */
    event AllowAllStatusChanged(bool status);

    /**
     * @dev Throws if token already has an existing corresponding pool
     * @param token Token to be checked for existing pool
     */
    modifier onlyNotExistingPools(address token) {
        require(pool[token] == address(0), "PoolFactory: This token already has a corresponding pool");
        _;
    }

    /**
     * @dev Throws if token is not whitelisted for creating new pool
     * @param token Address of token to be checked in whitelist
     */
    modifier onlyAllowed(address token) {
        require(allowAll || isAllowed[token], "PoolFactory: This token is not allowed to have a pool");
        _;
    }

    /**
     * @dev Initialize this contract with provided parameters
     * @param _poolImplementationReference First implementation reference of TrueFiPool
     */
    function initialize(
        ImplementationReference _poolImplementationReference,
        ERC20 _stakingToken,
        ITrueLender2 _trueLender
    ) external initializer {
        Claimable.initialize(msg.sender);

        stakingToken = _stakingToken;
        poolImplementationReference = _poolImplementationReference;
        trueLender = _trueLender;
    }

    /**
     * @dev Create a new pool behind proxy. Update new pool's implementation.
     * Transfer ownership of created pool to Factory owner.
     * @param token Address of token which the pool will correspond to.
     */
    function createPool(address token) external onlyAllowed(token) onlyNotExistingPools(token) {
        OwnedProxyWithReference proxy = new OwnedProxyWithReference(this.owner(), address(poolImplementationReference));
        pool[token] = address(proxy);
        isPool[address(proxy)] = true;

        ITrueFiPool2(address(proxy)).initialize(ERC20(token), stakingToken, trueLender, this.owner());

        emit PoolCreated(token, address(proxy));
    }

    /**
     * @dev Change token allowed status
     * @param token Address of token to be allowed or disallowed
     * @param status New status of allowance for token
     */
    function whitelist(address token, bool status) external onlyOwner {
        isAllowed[token] = status;
        emit AllowedStatusChanged(token, status);
    }

    /**
     * @dev Change allowAll status
     * @param status New status of allowAll
     */
    function setAllowAll(bool status) external onlyOwner {
        allowAll = status;
        emit AllowAllStatusChanged(status);
    }
}
