<template>
  <v-dialog
    transition="dialog-bottom-transition"
    max-width="600"
    v-model="$store.state.returnNFTDialog"
  >
    <v-card>
      <v-card-title>Return NFT</v-card-title>
      <v-card-text>
        <div class="text-h5 pa-12"></div>
        <v-text-field
          :color="$store.state.primaryColor"
          hint="Please enter the ID of the NFT your borrowed! e.g. 1"
          label="NFT ID"
        ></v-text-field>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn text @click="$store.state.returnNFTDialog = false">Close</v-btn>
        <v-btn
          style="
            background-color: #6bdcc6;
            color: white;
            border-radius: 5px;
            font-style: italic;
            border-color: #699c79;
            border-width: 1px;
            font-family: cursive;
            font-weight: bold;
            color: white;
          "
          text
          @click="returnNFT"
          >Return</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      nftID: 0,
      nftDetails: [],
    };
  },
  watch: {
    "$store.state.fluidpebbleContract": async function (val) {
      console.log("changed fluidpebbleContract: ", val);
      await this.getLeasedNFTS();
      this.$store.state.isLoading = false;
    },
  },
  mounted() {},
  methods: {
    returnNFT: async function (){
      
    },
    getLeasedNFTS: async function () {
      let _this = this;
      this.$store.state.isLoading = true;
      this.$store.state.fluidpebbleContract.methods
        .totalLeased()
        .call({ from: this.$store.state.userAddress, gas: 5000000 })
        .then(async (totalLeasedTokens, error) => {
          this.$store.state.isLoading = true;
          console.log("found leased totalLeasedTokens: " + totalLeasedTokens);
          for (var i = 0; i < totalLeasedTokens; i++) {
            var tokenDetails =
              await this.$store.state.fluidpebbleContract.methods
                .leasedTokenIds(1)
                .call({ from: this.$store.state.userAddress, gas: 5000000 });
            console.log(tokenDetails);
          }
        })
        .catch((error) => {
          this.$store.state.isLoading = true;
          console.log("error getting leased tokens: ", error);
        });
    },
  },
};
</script>

<style></style>
