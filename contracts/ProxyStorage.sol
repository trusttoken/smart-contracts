pragma solidity ^0.4.23;
import "../registry/contracts/Registry.sol";
import "./modularERC20/BalanceSheet.sol";
import "./modularERC20/AllowanceSheet.sol";

/*
Defines the storage layout of the implementaiton (TrueUSD) contract. Any newly declared 
state variables in future upgrades should be appened to the bottom. Never remove state variables
from this list
 */
contract ProxyStorage {
    address public owner;
    address public pendingOwner;

    bool initialized;
    
    BalanceSheet balances_Deprecated;
    AllowanceSheet allowances_Deprecated;

    uint256 totalSupply_;
    
    bool private paused_Deprecated = false;
    address private globalPause_Deprecated;

    uint256 public burnMin = 0;
    uint256 public burnMax = 0;

    Registry public registry;

    string name_Deprecated = "TrueUSD";
    string symbol_Deprecated = "TUSD";

    uint[] gasRefundPool_Deprecated;
    uint256 private redemptionAddressCount_Deprecated;
    uint256 public minimumGasPriceForFutureRefunds;
}
