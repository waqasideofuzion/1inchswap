// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IAggregationExecutor.sol";
import "./IAggregationRouterV4.sol";

contract OneInchSwap is Ownable {
    address public immutable AGGREGATION_ROUTER_V4;

    event Swap(
        address sender,
        uint256 srcAmount,
        uint256 spendAmount,
        uint256 returnAmount
    );

    constructor(address router) {
        AGGREGATION_ROUTER_V4 = router;
    }

    receive() external payable {}

    function approveCollateralToOneInch(
        address[] memory _collateralTokens,
        uint256[] memory _amounts
    ) external {
        uint256 lengthCollaterals = _collateralTokens.length;
        require(
            lengthCollaterals == _amounts.length,
            "collateral and amount length mismatch"
        );
        for (uint256 i = 0; i < lengthCollaterals; i++) {
            IERC20(_collateralTokens[i]).approve(
                AGGREGATION_ROUTER_V4,
                _amounts[i]
            );
        }
    }

    function swap(
        IAggregationExecutor caller,
        SwapDescription memory desc,
        bytes memory data
    ) external payable {
 
        (
            uint256 returnAmount,
            uint256 spentAmount,
        ) = IAggregationRouterV4(AGGREGATION_ROUTER_V4).swap{value: msg.value}(
                caller,
                desc,
                data
            );

        emit Swap(_msgSender(), desc.amount, spentAmount, returnAmount);
    }
}