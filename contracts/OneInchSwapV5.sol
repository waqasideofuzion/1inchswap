// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAggregationExecutor.sol";
import "./interfaces/IAggregationRouterV5.sol";

contract OneInchSwapV5 is Ownable {
    address public immutable AGGREGATION_ROUTER_V5;

    event Swap(
        address sender,
        uint256 srcAmount,
        uint256 spendAmount,
        uint256 returnAmount
    );

    constructor(address router) {
        AGGREGATION_ROUTER_V5 = router;
    }

    receive() external payable {}

    function approveCollateralToOneInch(
        address[] memory _collateralTokens,
        uint256[] memory _amounts
    ) external onlyOwner {
        uint256 lengthCollaterals = _collateralTokens.length;
        require(
            lengthCollaterals == _amounts.length,
            "collateral and amount length mismatch"
        );
        for (uint256 i = 0; i < lengthCollaterals; i++) {
            IERC20(_collateralTokens[i]).approve(
                AGGREGATION_ROUTER_V5,
                _amounts[i]
            );
        }
    }

    function swap(
        IAggregationExecutor executor,
        SwapDescription calldata desc,
        bytes calldata permit,
        bytes calldata data
    ) external onlyOwner returns (uint256 returnAmount, uint256 spentAmount) {
        (returnAmount, spentAmount) = IAggregationRouterV5(
            AGGREGATION_ROUTER_V5
        ).swap(executor, desc, permit, data);

        emit Swap(_msgSender(), desc.amount, spentAmount, returnAmount);
    }

    function withdrawNative() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawToken(address _token) external onlyOwner {
        uint256 tokenBalance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(msg.sender, tokenBalance);
    }
}