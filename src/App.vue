<template>
  <!-- App.vue -->
  <!-- App.vue -->

  <v-app>
    <!-- Sizes your content based upon application components -->
    <v-main>
      <!-- Provides the application the proper gutter -->
      <v-container fluid>
        <!-- If using vue-router -->
        <router-view></router-view>
      </v-container>
    </v-main>
    <v-overlay
      :z-index="$store.state.loadinZIndex"
      :value="$store.state.isLoading"
    >
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>
<script>
import Web3 from "web3";
import EmbarkJS from "../contracts/embarkArtifacts/embarkjs";
import MintNFTModal from "./modals/MintNFTModal.vue";
const {
  web3tx,
  toWad,
  toBN,
  wad4human,
} = require("@decentral.ee/web3-helpers");
import detectEthereumProvider from "@metamask/detect-provider";

export default {
  name: "App",
  components: { MintNFTModal },
  created() {
    this.authenticate();
  },
  mounted() {
    /* this.$store.dispatch("warning", {
      warning: "Please note the website is still under development",
    });*/
  },
  methods: {
    authenticate() {
      this.$store.state.isLoading = true;
      this.init();
      //this.$store.state.isLoading = false;
    },
    detectPageReload() {
      if (window.performance) {
        console.info("window.performance works fine on this browser");
      }
      console.info(performance.navigation.type);
      if (performance.navigation.type == performance.navigation.TYPE_RELOAD) {
        console.info("This page is reloaded");
        window.location.href = "./index.html";
      } else {
        console.info("This page is not reloaded");
      }
    },
    isMetaMaskConnected() {
      //Have to check the ethereum binding on the window object to see if it's installed
      const { ethereum } = window;
      return Boolean(ethereum && ethereum.isMetaMask);
    },
    switchNetworks: async function () {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2A" }],
        });
      } catch (addError) {
        console.error(addError);
      }
    },
    init: async function () {
      return new Promise(async (resolve) => {
        this.$store.state.isLoading = true;
        let _this = this;
        this.detectPageReload();
        await this.$store.dispatch("connectWallet");
        console.log("window: ", window.web3);
        window.ethereum.on("accountsChanged", function (accounts) {
          _this.$store.state.userAddress = accounts[0];
          window.location.reload();
        });
        const chainId = await web3.eth.getChainId();
        console.log("chainId: ", chainId);
        if (chainId !== 42) {
          await this.switchNetworks();
        }
        window.ethereum.on("chainChanged", (chainId) => {
          console.log("chainChanged: ", chainId);
          if (chainId !== "0x2A" || chainId !== "0x2a") {
            this.$store.dispatch("error", {
              error: "The DApp only works on the Kovan testnetwork",
              onTap: async () => {
                await this.switchNetworks();
              },
            });
          } else {
            window.location.reload();
          }
          // Handle the new chain.
          // Correctly handling chain changes can be complicated.
          // We recommend reloading the page unless you have good reason not to.
        });
        await this.$store.dispatch("loadSkyData");
        //this.$store.state.isLoading = false;
      });
    },
  },
  data: () => ({
    drawer: false,
  }),
};
</script>
