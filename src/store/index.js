import Vue from "vue";
import Vuex from "vuex";
import swal from "sweetalert2";
import createPersistedState from "vuex-persistedstate";
import { SkynetClient, genKeyPairFromSeed } from "skynet-js";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { randomBytes } from "@stablelib/random";
import CeramicClient from "@ceramicnetwork/http-client";
import KeyDidResolver from "key-did-resolver";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import { DID } from "dids";
import SecureLS from "secure-ls";
import simpleBrowserFingerprint from "simple-browser-fingerprint";
import detectEthereumProvider from "@metamask/detect-provider";
import Web3 from "web3";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import web3Utils from "web3-utils";
const { wad4human } = require("@decentral.ee/web3-helpers");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");

const Contract = require("web3-eth-contract");
Contract.setProvider(process.env.VUE_APP_APP_KOVAN_PRC_URL);
const ls = new SecureLS({
  encodingType: "aes",
  encryptionSecret: simpleBrowserFingerprint(),
  isCompression: true,
});

const bigNumber = require("bignumber.js");
const resolver = {
  ...KeyDidResolver.getResolver(),
  ...ThreeIdResolver.getResolver(ceramic),
};
const did = new DID({ resolver });
const { publicKey, privateKey } = genKeyPairFromSeed(
  process.env.VUE_APP_APP_SECRET
);

const seed = new Uint8Array(process.env.VUE_APP_SEED.split(","));
const ceremicProvider = new Ed25519Provider(seed);
let ceramic = new CeramicClient(process.env.VUE_APP_CEREMIC_NODE_URL);
ceramic.did = did;
ceramic.did.setProvider(ceremicProvider);
const ApolloClient = require("apollo-client").ApolloClient;
const createHttpLink = require("apollo-link-http").createHttpLink;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;
const crossFetch = require("cross-fetch").default;
const gql = require("graphql-tag").default;
Vue.use(Vuex);
const client = new SkynetClient("https://siasky.net/");

/* eslint-disable no-new */
const store = new Vuex.Store({
  state: {
    dappLoaded:false,
    returnNFTDialog: false,
    //sampleLocationData: require("../data/location.json"),
    showMyLocationsOnly: false,
    totalStaked: 0,
    tokenContract: {},
    fluidpebbleContract: {},
    loadinZIndex: 500,
    mintNFTDialog: false,
    testIMEI: process.env.VUE_APP_DEVICE_IMEI,
    userData: {
      imeis: [],
      data: [],
    },
    ceramicClient: ceramic,
    ceremicProvider: ceremicProvider,
    graphClient: new ApolloClient({
      link: createHttpLink({
        uri: process.env.VUE_APP_TRUSTREAM_SUBGRAPH,
        fetch: crossFetch,
        cache: new InMemoryCache(),
      }),
      cache: new InMemoryCache(),
    }),
    device_telemetry_query: gql`
    {
      deviceRecords(where: { imei:"${process.env.VUE_APP_DEVICE_IMEI}"}) {
        raw # !! Protobuf encoded sensors values
        imei
        signature
      }
    }
    `,
    true_stream_sub_graph: process.env.VUE_APP_TRUSTREAM_SUBGRAPH,
    appSecret: process.env.VUE_APP_APP_SECRET,
    skyClient: client,
    privateKey: privateKey,
    publicKey: publicKey,
    etherConverter: require("ether-converter"),
    utils: require("web3-utils"),
    showNFTDetailsDialog: false,
    selectedDataPoint: {},
    data: [],
    isLoading: false,
    userAddress: "",
    primaryColor: "green darken-1",
    secondaryColor: "#699c79",
    selectedNFT: {},
    streamId: process.env.VUE_APP_CEREMIC_SECRET,
    tile: {},
    dappNFTs: [],
    deviceDetailsDialog: false,
    selectedDevice: {},
    revision: 1,
    connected: false,
    allDAppNFTs: [],
    deviceData: [],
    daix: {},
    dai: {},
    sf: {},
    userDAIBalance: 0,
  },
  plugins: [
    createPersistedState({
      storage: {
        getItem: (key) => ls.get(key),
        setItem: (key, value) => ls.set(key, value),
        removeItem: (key) => ls.remove(key),
      },
    }),
  ],
  modules: {},
  mutations: {
    userAddress: (state, address) =>
      address ? (state.userAddress = address) : (state.userAddress = ""),
    isConnected: (state, connected) =>
      connected ? (state.connected = connected) : (state.connected = false),
  },
  actions: {
    getUserDevices: async function () {
      store.state.isLoading = true;
      const axios = require("axios").default;
      var data = JSON.stringify({
        operationName: "getDevices",
        variables: {},
        query: `query getDevices {\n  pebble_device(limit: 10, where: {owner: {_eq: "${store.state.userAddress}"}}) {\n    id\n    owner\n  }\n}\n`,
      });
      axios({
        method: "post",
        url: process.env.VUE_APP_APP_GRAPHQL_URL_DEV,
        data: data,
      })
        .then(async (devices) => {
          console.log("devices: ", devices);
          if (
            Object.prototype.hasOwnProperty.call(devices.data, "error") ||
            devices.data.data.pebble_device.length === 0
          ) {
            console.log("no devices found for this user");
            //  this.$store.state.userData.imeis=["100000000000225", "100000000000211"]
          } else {
            console.log("found user device: ", devices.data.data.pebble_device);
            store.state.userData.imeis = devices.data.data.pebble_device.map(
              (device) => {
                return device.id;
              }
            );
          }
        })
        .catch((error) => {
          console.log("error getting user registred devices: ", error);
          store.state.isLoading = false;
        });
    },
    initContracts: async function (){
      const tokenContractJSON = require("../../contracts/build/contracts/TokenContract.json");
      store.state.tokenContract = new window.web3.eth.Contract(
        tokenContractJSON.abi,
        process.env.VUE_APP_TOKEN_CONTRACT_ADDRESS,
        {
          from: window.web3.eth.defaultAccount, // default from address
          gasPrice: "20000000000", // default gas price in wei, 20 gwei in this case
        }
      );
      const fluidPebbleJSON = require("../../contracts/build/contracts/FluidPebble.json");
      store.state.fluidpebbleContract = new window.web3.eth.Contract(
        fluidPebbleJSON.abi,
        process.env.VUE_APP_FLUID_PEBBLE_CONTRACT_ADDRESS,
        {
          from: window.web3.eth.defaultAccount, // default from address
          gasPrice: "20000000000", // default gas price in wei, 20 gwei in this case
        }
      );
    },
    connectWallet: async function () {
      store.state.isLoading = true;
      const provider = await detectEthereumProvider();
      if (provider) {
        try {
          await ethereum.enable();
          var web3Instance = new Web3(window.web3.currentProvider);
          window.we3 = web3Instance;
          var accounts = await window.web3.eth.getAccounts();
          console.log("window.web3.eth.getDefaultAccount: ", web3Instance);
          window.web3.eth.defaultAccount = accounts[0];
          await store.dispatch("initContracts")
          store.state.userAddress = window.web3.eth.defaultAccount;
          store.state.isConnected = true;
          console.log("found default account: ", store.state.userAddress);
          store.state.isLoading = false;
          store.state.connected = true;
          await store.dispatch("getUserDevices");
        } catch (error) {
          console.log("error connectin wallet: ", error);
          store.state.isLoading = false;
          store.dispatch("error", {
            error: "There was an error enabling metamask",
          });
        }
      } else {
        store.state.isLoading = false;
        store.dispatch(
          "errorWithFooterMetamask",
          "Seems like you dont have metamask installed please use the below link to download"
        );
      }
    },
    loadSkyData: async function () {
      var content = await store.dispatch("getSkyData");
      /*    content.data = [];
      content.leaderboard = [];
      await store.dispatch("saveSkyData", content);  */
      console.log("foundData: ", content.data);
      console.log("leaderboard: ", content.leaderboard);
      for (var index in content.data) {
        var data = content.data[index];
        if (
          Object.prototype.hasOwnProperty.call(data, "userAddress") &&
          data.userAddress.toUpperCase() ===
            store.state.userAddress.toUpperCase()
        ) {
          store.state.userData = data;
        }
        if (Object.prototype.hasOwnProperty.call(data, "userAddress")) {
          data.data.map((nft) => {
            nft.nfts.map((minted) => {
              console.log("dappNFTs: ", minted);
              store.state.dappNFTs.push(minted);
            });
          });
        }
        for (
          var indexInner = 0;
          indexInner < store.state.dappNFTs.length;
          indexInner++
        ) {
          await store.state.fluidpebbleContract.methods
            .getTokenDetails(store.state.dappNFTs[indexInner].tokenId)
            .call({ from: store.state.userAddress, gas: 6000000 })
            .then((details, error) => {
              store.state.dappNFTs[indexInner].price = new bigNumber(
                store.state.etherConverter(details[1], "wei", "eth")
              ).toFixed(7);
              store.state.dappNFTs[indexInner].originalPrice = new bigNumber(
                store.state.etherConverter(details[2], "wei", "eth")
              ).toFixed(7);
              store.state.dappNFTs[indexInner].owner = details[0];
              store.state.dappNFTs[indexInner].isDelegated = details[4];
            })
            .catch((error) => {
              console.log("error getting token details: ", error);
              delete store.state.dappNFTs[index];
            });
        }
        console.log("dappNFTs: ", store.state.dappNFTs);
        store.state.deviceData = store.state.dappNFTs;
        store.state.allDAppNFTs = store.state.dappNFTs;
      }

      /*  if (store.state.dappNFTs.length === 0) {
        store.dispatch("warning", {
          warning: "Seems like arent any listed fluidpebbles",
          onTap: function() {},
        });
      }*/

      store.state.isLoading = false;
    },
    approveUpgradeAndTransferDaixAndRentNFT: async function (
      context,
      rentData
    ) {
      try {
        console.log("rentData: ",rentData)
        store.state.isLoading = true;
        const sf = new SuperfluidSDK.Framework({
          web3: web3,
          version: "test", //@dev in prod change this accordingly
          tokens: ["fDAI"],
        });
        await sf.initialize();
        const fDaiAddress = await sf.tokens.fDAI.address;
        console.log("fDaiAddress: ", fDaiAddress);
        const dai = await sf.contracts.TestToken.at(fDaiAddress);
        const daix = sf.tokens.fDAIx;
        var approvedApp = await dai.approve(
          daix.address,
          rentData.monthlyAmount,
          { gas: 6000000, from: store.state.userAddress }
        );
        var upgraded = await daix.upgrade(rentData.monthlyAmount, {
          gas: 6000000,
          from: store.state.userAddress,
        });
        var transfer = await daix.transfer(
          store.state.fluidpebbleContract.options.address,
          rentData.monthlyAmount,
          { gas: 6000000, from: store.state.userAddress }
        );
        await store.dispatch("initContracts")
        var rentNFT = await store.state.fluidpebbleContract.methods
          .rentNFT(rentData.tokenId, rentData.duration, rentData.monthlyAmount)
          .send({ gas: 6000000, from: store.state.userAddress });
        console.log(
          " upgradedTX: ",
          upgraded,
          " transferTX: ",
          transfer,
          " rentNFTTX: ",
          rentNFT,
          "approvedAppTX: ",
          approvedApp
        );
        store.state.isLoading = false;
        store.dispatch(
          "success",
          "Succesfully leased NFT for " +
            rentData.duration +
            " days, please ensure you return it before the duration ends"
        );
      } catch (error) {
        store.dispatch("error", {
          error:
            "Somthing went wrong while attempting to lease NFT,please ensure you have minted enough DAIX to continue and try again",
        });
        store.state.isLoading = false;
        console.log("error renting NFT: " + error);
      }
    },
    loadData: async function () {
      console.log("fetching data");
      store.state.dappNFTs = [];
      store.state.isLoading = true;
      var content = await store.dispatch("getCeramicData");
      /*  content.data = [];
      content.leaderboard = [];
      await store.dispatch("saveSkyData", content);*/
      console.log("foundData: ", content.data);
      for (var index in content.data) {
        var data = content.data[index];
        if (
          data.userAddress.toUpperCase() ===
          store.state.userAddress.toUpperCase()
        ) {
          store.state.userData = data;
        }
        data.data.map((nft) => {
          nft.nfts.map((minted) => {
            console.log("dappNFTs: ", minted);
            store.state.dappNFTs.push(minted);
          });
        });
      }
      for (
        var indexInner = 0;
        indexInner < store.state.dappNFTs.length;
        indexInner++
      ) {
        await store.state.fluidpebbleContract.methods
          .getTokenDetails(store.state.dappNFTs[indexInner].tokenId)
          .call({ from: store.state.userAddress, gas: 6000000 })
          .then((details, error) => {
            store.state.dappNFTs[indexInner].price = new bigNumber(
              store.state.etherConverter(details[1], "wei", "eth")
            ).toFixed(7);
            store.state.dappNFTs[indexInner].originalPrice = new bigNumber(
              store.state.etherConverter(details[2], "wei", "eth")
            ).toFixed(7);
            store.state.dappNFTs[indexInner].owner = details[0];
            store.state.dappNFTs[indexInner].isDelegated = details[4];
          })
          .catch((error) => {
            console.log("error getting token details: ", error);
            delete store.state.dappNFTs[index];
          });
      }

      /*  if (store.state.dappNFTs.length === 0) {
        store.dispatch("warning", {
          warning: "Seems like arent any listed fluidpebbles",
          onTap: function() {},
        });
      }*/
      console.log("dappNFTs: ", store.state.dappNFTs);
      store.state.deviceData = store.state.dappNFTs;
      store.state.allDAppNFTs = store.state.dappNFTs;
      store.state.isLoading = false;
    },
    getCeramicData: async function () {
      const tileDocument = await TileDocument.load(
        ceramic,
        this.state.streamId
      );
      store.state.tile = tileDocument;
      return tileDocument.content;
    },
    saveCeramicData: async function (context, data) {
      console.log("saving ceremic data: ", data);
      const doc = await TileDocument.load(
        this.state.ceramicClient,
        this.state.streamId
      );
      await doc.update(
        data,
        {},
        {
          controllers: [this.state.ceramicClient.did.id],
        }
      );
    },
    getSkyData: async function () {
      var test = await this.state.skyClient.db.getJSON(
        this.state.publicKey,
        this.state.appSecret
      );
      if (test.data === null) {
        test = {
          data: [],
          leaderboard: [],
        };
        return test;
      }
      return test.data;
    },
    saveSkyData: async function (context, data) {
      const results = await client.db.setJSON(
        this.state.privateKey,
        this.state.appSecret,
        data
      );
    },
    success(context, message) {
      swal.fire({
        position: "top-end",
        icon: "success",
        title: "Success",
        showConfirmButton: false,
        timer: null,
        text: message,
      });
    },
    warning(context, message) {
      swal.fire({
        icon: "info",
        title: "Info",
        text: message.warning,
        denyButtonText: `Close`,
      });
    },
    error(context, message) {
      swal.fire("Error!", message.error, "error").then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (
          result.isConfirmed &&
          Object.prototype.hasOwnProperty.call(message, "onTap")
        ) {
          message.onTap();
        }
      });
    },
    successWithFooter(context, message) {
      swal.fire({
        icon: "success",
        title: "Success",
        text: message.message,
        footer: `<a href= https://testnet.iotexscan.io/tx/${message.txHash}> View on iotex Explorer</a>`,
      });
    },
    errorWithFooterMetamask(context, message) {
      swal.fire({
        icon: "error",
        title: "Error!",
        text: message,
        footer: `<a href= https://metamask.io> Download Metamask</a>`,
      });
    },
    mintDaiToken: async function (context, _) {
      store.state.isLoading = true;
      const sf = new SuperfluidSDK.Framework({
        web3: web3,
        version: "test", //@dev in prod change this accordingly
        tokens: ["fDAI"],
      });
      await sf.initialize();
      const fDaiAddress = await sf.tokens.fDAI.address;
      console.log("fDaiAddress: ", fDaiAddress);
      const dai = await sf.contracts.TestToken.at(fDaiAddress);
      const daix = sf.tokens.fDAIx;
      dai
        .mint(
          store.state.userAddress,
          web3Utils.toWei("1000000000000", "ether"),
          { from: store.state.userAddress, gas: 6000000 }
        )
        .then(async (results, error) => {
          store.state.userDAIBalance = wad4human(
            await dai.balanceOf.call(store.state.userAddress)
          );
          store.state.isLoading = false;
          store.dispatch(
            "success",
            "Succesfully minted test DAI\n Please import this token address to your metamask to see your balance\n0xb64845d53a373d35160b72492818f0d2f51292c0"
          );
        })
        .catch((error) => {
          console.log("error minting fake dai: ", error);
          store.dispatch("error", {
            error: "Something went wrong while minting test DAI",
          });
          store.state.isLoading = false;
        });
      ///call contRACT
    },
  },
});

export default store;
