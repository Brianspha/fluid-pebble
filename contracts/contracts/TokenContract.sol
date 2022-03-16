pragma solidity >=0.6.2;
//"SPDX-License-Identifier: UNLICENSED"

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Initializable.sol";



//@dev contract definition
contract TokenContract is ERC721, Ownable, Initializable {
using Counters for Counters.Counter;
  Counters.Counter private tokenIds;

//@dev modifier
modifier onlyfluidPebble (){
  require(msg.sender ==fluidPebbleAddress, "Only FluidPebble contract can make this call");
  _;
}
//@dev contract variables

address public fluidPebbleAddress;
//@dev function definitions
 constructor(string memory name, string memory symbol)
     initializer
    ERC721(name, symbol)
  {

  }

  /**
    *@dev init contract variables
   
     */

  function setContractFluidPebbleAddress(address _fluidPebbleAddress) onlyOwner  public{
    require(_fluidPebbleAddress != address(0), "invalid FluidPebble address");
    fluidPebbleAddress=_fluidPebbleAddress;
  }
  function mintToken(address tokenOwner, string memory tokenURI)
    public onlyfluidPebble
    returns (uint256)
  {
    tokenIds.increment();
    _mint(tokenOwner, tokenIds.current());
    _setTokenURI(tokenIds.current(), tokenURI);
    return tokenIds.current();
  }


  function tokenExists (uint256 tokenId) public view returns(bool){
    return _exists(tokenId);
  }

   function totalSupply() public view override returns (uint256) {
        // _tokenOwners are indexed by tokenIds, so .length() returns the number of tokenIds
        return tokenIds.current();
    }
    function burnToken(uint256 tokenId)  public onlyfluidPebble returns (bool) {
      _burn(tokenId);
      return tokenExists(tokenId);
    }
 
}