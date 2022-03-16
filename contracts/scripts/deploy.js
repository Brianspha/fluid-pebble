const FluidPebble = artifacts.require("FluidPebble");
const fluidPebbleToken = artifacts.require("TokenContract");
const Web3 = require("web3");
const bigNumber = require("bignumber.js");
let initialAmount = new bigNumber(9991112121212111231190990211212).toFixed();
const { web3tx } = require("@decentral.ee/web3-helpers");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
module.exports = async function(callback) {
  console.log("initialAmount: ", initialAmount);
  global.web3=web3
  try {
    const version = process.env.RELEASE_VERSION || "test";
    const sf = new SuperfluidSDK.Framework({
    //  web3: web3,
      version: version,
      tokens: ["fDAI"],
      isTruffle:true,
    });
    await sf.initialize();
    const fDaiAddress = await sf.tokens.fDAI.address;
    console.log("fDaiAddress: ", fDaiAddress);
    dai = await sf.contracts.TestToken.at(fDaiAddress);
    daix = sf.tokens.fDAIx;
    console.log("daix: ", daix);
    const FluidPebbleTokenDeployed = await fluidPebbleToken.new(
      "FluidPebble",
      "FluidPebble"
    );
    console.log(
      "deployed nft token contract: ",
      FluidPebbleTokenDeployed.address
    );
    const fluidpebbleDeployed = await FluidPebble.new(
      FluidPebbleTokenDeployed.address,
      sf.host.address,
      sf.agreements.cfa.address,
      daix.address,
    );
    console.log("deployed fluidpebble: ", fluidpebbleDeployed.address);
    console.log("deployed FluidPebble contract: ", fluidpebbleDeployed.address);
    receipt = await FluidPebbleTokenDeployed.setContractFluidPebbleAddress(
      fluidpebbleDeployed.address
    );
    console.log("set setContractFluidPebbleAddress in nft contract: ", receipt);
    console.log("DONE WITH DEPLOYMENTS");
    callback();
  } catch (err) {
    callback(err);
  }
};
