pragma solidity >=0.6.2;
pragma experimental ABIEncoderV2;
import "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
//"SPDX-License-Identifier: UNLICENSED"

/// @title
/// @author brianspha
/// @notice Responsible for creating/cancelling streams for a user
/// @dev May contain bugs and not optimised for gas

contract StreamManager {
    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken acceptedToken
    ) {
        require(address(host) != address(0), "Invalid host address");
        require(address(cfa) != address(0), "Invalid CFA address");
        require(
            address(acceptedToken) != address(0),
            "Invalid supertoken address"
        );
        _host = host;
        _cfa = cfa;
        _acceptedToken = acceptedToken;
    }

     function createFlow(address to, int96 flowRate) public {
        if (to == address(this) || to == address(0)) return;
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.createFlow.selector,
                _acceptedToken,
                to,
                flowRate,
                new bytes(0)
            ),
            new bytes(0)
        );
    }

    function deleteFlow(address from, address to) public {
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.deleteFlow.selector,
                _acceptedToken,
                from,
                to,
                new bytes(0) // placeholder
            ),
            new bytes(0)
        );
    }

     function getRealTimeBalance(address owner)
        public
        view
        returns (
            int256,
            uint256,
            uint256
        )
    {
        int256 availableBalance;
        uint256 deposit;
        uint256 owedDeposit;
        uint256 timestamp;
        (availableBalance, deposit, owedDeposit, timestamp) = _acceptedToken
            .realtimeBalanceOfNow(owner);
        return (availableBalance, deposit, owedDeposit);
    }
}
