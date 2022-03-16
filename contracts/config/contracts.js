const bigNumber = require("bignumber.js");
let initialAmount = new bigNumber(9991112121212111231190990211212).toFixed();
console.log("initialAmount: ", initialAmount);
const SuperfluidSDK = require("@superfluid-finance/js-sdk");

module.exports = {
  // default applies to all environments
  default: {
    // order of connections the dapp should connect to
    dappConnection: [
      "$WEB3", // uses pre existing web3 object if available (e.g in Mist)
    ],

    // Automatically call `ethereum.enable` if true.
    // If false, the following code must run before sending any transaction: `await EmbarkJS.enableEthereum();`
    // Default value is true.
    // dappAutoEnable: true,

    gas: "auto",

    // Strategy for the deployment of the contracts:
    // - implicit will try to deploy all the contracts located inside the contracts directory
    //            or the directory configured for the location of the contracts. This is default one
    //            when not specified
    // - explicit will only attempt to deploy the contracts that are explicitly specified inside the
    //            contracts section.
    strategy: "explicit",

    // minimalContractSize, when set to true, tells Embark to generate contract files without the heavy bytecodes
    // Using filteredFields lets you customize which field you want to filter out of the contract file (requires minimalContractSize: true)
    // minimalContractSize: false,
    // filteredFields: [],

    deploy: {
      FluidPebble: {
        address: "0x6c69d1eF70Ce99e80A3B1fa300e14991c1D8811d",
        abiDefinition:require('../build/contracts/FluidPebble.json').abi,
      },
      TokenContract: {
        address: "0xf719409092B8f021423376E1E0F53440D1C3D4be",
        abiDefinition:require('../build/contracts/TokenContract.json').abi,
      },
      // SimpleStorage: {
      //   fromIndex: 0,
      //   args: [100]
      // }
    },
    afterDeploy: async ({ contracts, web3, logger }) => {
     
    },
  },

  // default environment, merges with the settings in default
  // assumed to be the intended environment by `embark run`
  development: {
    dappConnection: [
      "ws://localhost:8546",
      "http://localhost:8546",
      "$WEB3", // uses pre existing web3 object if available (e.g in Mist)
    ],
  },
  strategy: "explicit",
  // merges with the settings in default
  // used with "embark run privatenet"
  harmony: {
    deploy: {
      FluidPebble: {
        address: "0x6c69d1eF70Ce99e80A3B1fa300e14991c1D8811d",
        abiDefinition:require('../build/contracts/FluidPebble.json').abi,
      },
      TokenContract: {
        address: "0xf719409092B8f021423376E1E0F53440D1C3D4be",
        abiDefinition:require('../build/contracts/TokenContract.json').abi,
      },
      // SimpleStorage: {
      //   fromIndex: 0,
      //   args: [100]
      // }
    },
    afterDeploy: async ({ contracts, web3, logger }) => {
     
    },
  },
  iotex: {
    deploy: {
      FluidPebble: {
        address: "0x6c69d1eF70Ce99e80A3B1fa300e14991c1D8811d",
        abiDefinition:require('../build/contracts/FluidPebble.json').abi,
      },
      TokenContract: {
        address: "0xf719409092B8f021423376E1E0F53440D1C3D4be",
        abiDefinition:require('../build/contracts/TokenContract.json').abi,
      },
      // SimpleStorage: {
      //   fromIndex: 0,
      //   args: [100]
      // }
    },
    afterDeploy: async ({ contracts, web3, logger }) => {
     
    },
  },
  kovan: {
    strategy: "explicit",
    deploy: {
      FluidPebble: {
        address: "0x6c69d1eF70Ce99e80A3B1fa300e14991c1D8811d",
        abiDefinition:require('../build/contracts/FluidPebble.json').abi,
      },
      TokenContract: {
        address: "0xf719409092B8f021423376E1E0F53440D1C3D4be",
        abiDefinition:require('../build/contracts/TokenContract.json').abi,
      },
      // SimpleStorage: {
      //   fromIndex: 0,
      //   args: [100]
      // }
    },
    afterDeploy: async ({ contracts, web3, logger }) => {
     
    },
  },

  // merges with the settings in default
  // used with "embark run testnet"
  testnet: {},

  // merges with the settings in default
  // used with "embark run livenet"
  livenet: {},

  // you can name an environment with specific settings and then specify with
  // "embark run custom_name" or "embark blockchain custom_name"
  // custom_name: {}
};
