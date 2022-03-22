const { web3tx, toWad, wad4human } = require("@decentral.ee/web3-helpers");

const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const FluidPebble = artifacts.require("FluidPebble");
const TokenContract = artifacts.require("TokenContract");
let FluidPebbleERC20Token = artifacts.require("FluidPebbleERC20Token");
const bigNumber = require("bignumber.js");
let initialAmount = new bigNumber(229999999999999999).toFixed();
var etherConverter = require("ether-converter");

const traveler = require("ganache-time-traveler");
const TEST_TRAVEL_TIME = 3600 * 2; // 1 hours

contract("FluidPebble", (accounts) => {
  const errorHandler = (err) => {
    if (err) throw err;
  };

  const names = ["Admin", "Alice", "Bob"];
  accounts = accounts.slice(0, names.length);
  let fluidpebbleTokenDeployed, FluidPebbleERC20TokenDeployed;
  let sf;
  let dai;
  let daix;
  let app;
  let tokenIds = [];
  const u = {}; // object with all users
  const aliases = {};

  before(async function() {
    //process.env.RESET_SUPERFLUID_FRAMEWORK = 1;
    await deployFramework(errorHandler, {
      web3,
      from: accounts[0],
      newTestResolver: true,
    });

    await deployTestToken(errorHandler, [":", "fDAI"], {
      web3,
      from: accounts[0],
    });
    await deploySuperToken(errorHandler, [":", "fDAI"], {
      web3,
      from: accounts[0],
    });

    sf = new SuperfluidSDK.Framework({
      web3,
      version: "test",
      tokens: ["fDAI"],
    });

    await sf.initialize();
    daix = sf.tokens.fDAIx;
    dai = await sf.contracts.TestToken.at(await sf.tokens.fDAI.address);

    for (var i = 0; i < names.length; i++) {
      u[names[i].toLowerCase()] = sf.user({
        address: accounts[i],
        token: daix.address,
      });
      u[names[i].toLowerCase()].alias = names[i];
      aliases[u[names[i].toLowerCase()].address] = names[i];
    }
    for (const [, user] of Object.entries(u)) {
      if (user.alias === "App") return;
      await web3tx(dai.mint, `${user.alias} mints many dai`)(
        user.address,
        toWad(999000000000),
        {
          from: user.address,
        }
      );
      await web3tx(dai.approve, `${user.alias} approves daix`)(
        daix.address,
        toWad(999000000000),
        {
          from: user.address,
        }
      );
    }
    //u.zero = { address: ZERO_ADDRESS, alias: "0x0" };
    console.log(u.admin.address);
    console.log(sf.host.address);
    console.log(sf.agreements.cfa.address);
    console.log(daix.address);
    fluidpebbleTokenDeployed = await TokenContract.new(
      "FluidPebble",
      "FluidPebble"
    );
    FluidPebbleERC20TokenDeployed = await FluidPebbleERC20Token.new();
    console.log(
      "deployed FluidPebble ERC20 token: ",
      FluidPebbleERC20TokenDeployed.address
    );
    var receipt = await FluidPebbleERC20TokenDeployed.init(
      "FluidPebble",
      "FluidPebble",
      18,
      initialAmount
    );
    console.log("initialised fluidpebble token details ", receipt);
    console.log(
      "fluidpebbleTokenDeployed.address: " + fluidpebbleTokenDeployed.address,
      "sf.host.address: " + sf.host.address,
      "sf.agreements.cfa.address: " + sf.agreements.cfa.address,
      "daix.address: " + daix.address,
      "FluidPebbleERC20TokenDeployed.address: " +
        FluidPebbleERC20TokenDeployed.address,
      "sf.agreements.ida.address: " + sf.agreements.ida.address,
      "accounts[0]: " + accounts[0]
    );
    app = await web3tx(FluidPebble.new, "Deploying FluidPebble")(
      fluidpebbleTokenDeployed.address,
      sf.host.address,
      sf.agreements.cfa.address,
      daix.address,
      {
        gas: "5000000",
        from: accounts[0],
      }
    );

    console.log("deployed FluidPebble contract: ", app.address);
    receipt = await fluidpebbleTokenDeployed.setContractFluidPebbleAddress(
      app.address
    );
    console.log("set setContractFluidPebbleAddress in nft contract: ", receipt);

    //  await traveler.advanceTimeAndBlock(TEST_TRAVEL_TIME);
    // await logUsers();
  });

  async function checkBalance(user) {
    console.log("Balance of ", user.alias);
    console.log(
      "balance DAIx: ",
      (await daix.balanceOf(user.address)).toString()
    );
  }
  async function checkBalanceAddress(address) {
    console.log("Balance of ", address);
    console.log("DAI: ", (await dai.balanceOf(address)).toString());
  }
  async function checkBalances(accounts) {
    for (let i = 0; i < accounts.length; ++i) {
      await checkBalance(accounts[i]);
    }
  }

  async function checkBalance(user) {
    console.log("Balance of ", user.alias);
    console.log("DAIx: ", (await daix.balanceOf(user.address)).toString());
  }

  async function upgrade(_accounts) {
    for (let i = 0; i < _accounts.length; ++i) {
      await web3tx(daix.upgrade, `${_accounts[i].alias} upgrades many DAIx`)(
        toWad(999000000000),
        { from: _accounts[i].address }
      );
      await checkBalance(_accounts[i]);
    }
  }
  describe("Mint NFT", async function() {
    it("should mint a new token", async () => {
      var tokenPrice = etherConverter(0.01, "eth", "wei");
      var receipt = await web3tx(app.mintToken, `${u[1]} mints new token`)(
        JSON.stringify({
          snr: 16400,
          vbat: 447,
          latitude: 487392578,
          longitude: 945399780,
          gasResistance: 94500,
          pressure: 45878,
          humidity: 2907,
          light: 68082,
          temperature2: 3498,
          gyroscope: [-6, 7, -3919],
          accelerometer: [3364, 3642, 3919],
          random: "380696d4c6edc426",
        }),
        tokenPrice,
        true,
        2,
        { gas: "5000000", from: accounts[0] }
      );
      console.log(
        "newTokenMinted: ",
        new bigNumber(receipt.logs[0].tokenId).toFixed(0)
      );
      tokenIds.push(receipt.logs[0].tokenId);
      assert.isTrue(receipt.logs.length > 0);
    });
    it("should check the owner of the token minted ", async () => {
      console.log("token ids: ", tokenIds);
      var owner = await fluidpebbleTokenDeployed.ownerOf(1);
      console.log("owner: ", owner, " minter: ", accounts[0]);
      assert.strictEqual(
        app.address == owner,
        true,
        "Token not delegated to contract"
      );
    });

    it("should buy a token with index 1", async () => {
      var tokenPrice = etherConverter(1, "eth", "wei");
      var token = await web3tx(app.buyToken, `${u[1]} mints new token`)(1, {
        gas: "5000000",
        from: accounts[1],
        value: tokenPrice,
      });
      console.log("token bought: ", token);
      assert.isTrue(token.logs.length > 0);
    });
    it("should check the owner of the token minted bought by account[1]", async () => {
      var owner = await fluidpebbleTokenDeployed.ownerOf(1);
      console.log("owner: ", owner, " minter account[1]: ", accounts[1]);
      assert.strictEqual(accounts[1] == owner, true, "account[1] not owner");
    });
    it("should mint a new token", async () => {
      var tokenPrice = toWad(0.001);
      var receipt = await web3tx(app.mintToken, `${u[1]} mints new token`)(
        JSON.stringify({
          snr: 16400,
          vbat: 447,
          latitude: 487392578,
          longitude: 945399780,
          gasResistance: 94500,
          pressure: 45878,
          humidity: 2907,
          light: 68082,
          temperature2: 3498,
          gyroscope: [-6, 7, -3919],
          accelerometer: [3364, 3642, 3919],
          random: "380696d4c6edc426",
        }),
        tokenPrice,
        true,
        3,
        { gas: "5000000", from: accounts[0] }
      );
      console.log("newTokenMinted: ", receipt.logs[0]);
      tokenIds.push(receipt.logs[0].tokenId);
      assert.isTrue(receipt.logs.length > 0);
    });
    it("should mint another new token", async () => {
      var tokenPrice = toWad(0.001);
      var receipt = await web3tx(app.mintToken, `${u[1]} mints new token`)(
        JSON.stringify({
          snr: 16400,
          vbat: 447,
          latitude: 487392578,
          longitude: 945399780,
          gasResistance: 94500,
          pressure: 45878,
          humidity: 2907,
          light: 68082,
          temperature2: 3498,
          gyroscope: [-6, 7, -3919],
          accelerometer: [3364, 3642, 3919],
          random: "380696d4c6edc426",
        }),
        tokenPrice,
        true,
        3,
        { gas: "5000000", from: accounts[0] }
      );
      console.log("newTokenMinted: ", receipt.logs[0]);
      tokenIds.push(receipt.logs[0].tokenId);
      assert.isTrue(receipt.logs.length > 0);
    });
    it("should rent an NFT", async () => {
      const { alice } = u;
      const monthlyAmount = toWad(0.001);
      const calculatedFlowRate = Math.floor(monthlyAmount / 3600 / 24 / 30);
      console.log("calculated flow: ", calculatedFlowRate);
      var approved = await web3tx(dai.approve, `${alice.alias} approves daix`)(
        daix.address,
        monthlyAmount,
        {
          from: alice.address,
        }
      );
      const upgraded = await web3tx(
        daix.upgrade,
        `${alice.alias} upgrades ${monthlyAmount} DAIx`
      )(monthlyAmount, { from: alice.address });

      const transfered = await web3tx(
        daix.transfer,
        `${alice.alias} upgrades ${monthlyAmount} DAIx`
      )(app.address, monthlyAmount, { from: alice.address });

      console.log(
        "approved daxi: ",
        approved,
        " upgraded: ",
        upgraded,
        " transfered: ",
        transfered
      );
      var rentNFT = await web3tx(app.rentNFT, `${alice.alias} renting nft`)(
        2,
        1,
        calculatedFlowRate,
        {
          from: alice.address,
          gas: "5000000",
        }
      );
      var owner = await fluidpebbleTokenDeployed.ownerOf(2);
      console.log("rent nft: ", rentNFT.logs, " owner: ", owner);
      assert.isTrue(rentNFT.logs.length > 0 && owner === alice.address);
    });
    it("should rent an NFT", async () => {
      const { alice } = u;
      const monthlyAmount = toWad(0.001);
      const calculatedFlowRate = Math.floor(monthlyAmount / 3600 / 24 / 30);
      console.log("calculated flow: ", calculatedFlowRate);
      var approved = await web3tx(dai.approve, `${alice.alias} approves daix`)(
        daix.address,
        monthlyAmount,
        {
          from: alice.address,
        }
      );
      const upgraded = await web3tx(
        daix.upgrade,
        `${alice.alias} upgrades ${monthlyAmount} DAIx`
      )(monthlyAmount, { from: alice.address });

      const transfered = await web3tx(
        daix.transfer,
        `${alice.alias} upgrades ${monthlyAmount} DAIx`
      )(app.address, monthlyAmount, { from: alice.address });

      console.log(
        "approved daxi: ",
        approved,
        " upgraded: ",
        upgraded,
        " transfered: ",
        transfered
      );
      var rentNFT = await web3tx(app.rentNFT, `${alice.alias} renting nft`)(
        3,
        1,
        calculatedFlowRate,
        {
          from: alice.address,
          gas: "5000000",
        }
      );
      var owner = await fluidpebbleTokenDeployed.ownerOf(2);
      console.log("rent nft: ", rentNFT.logs, " owner: ", owner);
      assert.isTrue(rentNFT.logs.length > 0 && owner === alice.address);
    });
    it("should check if the flow has started", async function() {
      var availableBalanceBefore, depositBefore, owedDepositBefore;
      var balanceBefore = await app.getNFTRealTimeBalance(1);
      console.log("balanceBefore: ", balanceBefore);
      availableBalanceBefore = balanceBefore[0];
      depositBefore = balanceBefore[1];
      owedDepositBefore = balanceBefore[2];
      await traveler.advanceTimeAndBlock(TEST_TRAVEL_TIME);
      var availableBalanceAfter, depositAfter, owedDepositAfter;

      var balanceAfter = await app.getNFTRealTimeBalance(1);
      console.log("balanceAfter: ", balanceAfter);
      availableBalanceAfter = balanceAfter[0];
      depositAfter = balanceAfter[1];
      owedDepositAfter = balanceAfter[2];
      console.log(
        "availableBalanceBefore: ",
        new bigNumber(availableBalanceBefore).toFixed(0),
        " balanceAfter: ",
        new bigNumber(availableBalanceAfter).dividedBy(10 ** 18).toFixed()
      );
      assert.isTrue(availableBalanceAfter >= availableBalanceBefore);
    });
    it("should get token details", async () => {
      console.log("app.getTokenDetails: ", app);

      var tokenDetails = await web3tx(
        app.getTokenDetails,
        `${u[1]} gets token details`
      )(2, { gas: "5000000", from: accounts[0] });
      console.log("tokenDetails: ", tokenDetails);
      assert.isTrue(tokenDetails[5]);
    });
    it("should get the total number leased tokens", async () => {
      console.log("app.leasedTokenIds: ", app);
      var leasedTokenIds = await web3tx(
        app.leasedTokenIds,
        `${u[1]} get total number of leased tokens`
      )(new bigNumber(0));
      leasedTokenIds = new bigNumber(leasedTokenIds).toFixed(0);
      console.log("leasedTokenIds: ", leasedTokenIds);
      assert.isTrue(leasedTokenIds.length >= 1);
    });
    it("should get the of the leased tokens", async () => {
      console.log(" app.leasedTokenIds: ", app.leasedTokenIds);
      var totalLeased = await web3tx(
        app.totalLeased,
        `${u[1]} get total number of leased tokens`
      )();
      totalLeased = new bigNumber(totalLeased).toFixed(0);
      console.log("leasedTokenIds: ", totalLeased);
      for (var i = 0; i < totalLeased.length; i++) {
        var leasedToken = await web3tx(
          app.leasedTokenIds,
          `${u[1]} get the leased token id`
        )(new bigNumber(i));
        leasedTokenId = new bigNumber(leasedToken).toFixed(0);
        var tokenDetails = await web3tx(
          app.getTokenDetails,
          `${u[1]} gets token details`
        )(leasedTokenId, { gas: "5000000", from: accounts[0] });
        console.log("tokenDetails in loop: ", tokenDetails);
      }
    });
    it("should return the borrowed nft", async function() {
      const { alice } = u;
      const transferToOwner = await web3tx(
        fluidpebbleTokenDeployed.transferFrom,
        `${alice.alias} returns nft`
      )(alice.address, accounts[0], 2, {
        from: alice.address,
        gas: "5000000",
      });
      console.log("token tranfered: ", transferToOwner);
      var returnNFT = await web3tx(app.returnNFT, `${alice.alias} returns nft`)(
        2,
        {
          from: alice.address,
          gas: "5000000",
        }
      );
      console.log("return: ", returnNFT.logs);
      assert.isTrue(returnNFT.logs.length > 0);
    });
  });
});
