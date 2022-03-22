# fluid-pebble

A generative NFT Market Place that allows users of peblle devices to list their NFTs for others to buy and rent out through the user of superfluid 

# Pre-amptive
Unfortunately i wasnt able to complete this project due to some failure when renting NFTs from the app i keep seeing this error https://kovan.etherscan.io/tx/0xfee53c37513cf90fdf8eb82b03822509905c339ae7b2f5d78d6e58261a07b2f1 and honetly i dont have any more time to spend on this so im just going to share it with others


To be able to interact with the market place you need to follow the instructions below
1. Request testnet IOTEX tokens from here: https://faucet.iotex.io/
2. Create a test pebble device here: https://machine-simulator.vercel.app/ using the same account you requested test IOTEXT tokens here you simply have to click on the 'Add New Device' button located on the bottom right of the screen
3. Once you hav created a new device please Click 'Instant data generation' for ease just please click on 'Generate & Save  To datasets'
4. The dataset you just created should show up under datasets
5. Click on the 'device Inventory' tab select the device you created in step 1
6. Select the dataset you just created using the dropdown menu
7. Once selected flip the device switch  which will turn the device on and off
8. Once its turned on click on the 'Start transmit' this will transmit the data to the iotex network (read about it here:https://docs.iotex.io/verifiable-data/pebble-tracker/overview )
9. Next please navigate to (https://portal-testnet.machinefi.com/device) here yiu will be able to see all devices owned by the current metamask account since we havent registered any we need to Add a new device (https://portal-testnet.machinefi.com/device) using the details of the device we created in the previous website
10. Click trough the screens until you get to the device info page where you will need to input the test pebble device details  once added click on next and accept all tx requests
11. Once completed you can now run the project locally and see if your pebble devices show up under the drop down menu towards the bottom of the screen




# How it works
FluidPebble allows owners of pebble devices to rent out the locations their peble devices locations minted as NFTs for a duration of time, in the future someone could explore the possibility of renting the data owned by a particular device for a specified period of time but this is out of scope because we need to keep things simple

# How to deploy locally (Conracts)
To run the contracts please ensure you have a local instance of Ganache isntalled  (https://trufflesuite.com/ganache/index.html)
0. Before starting the app please ensure you have created a .env file with the following format
``
GOERLI_MNEMONIC=<Your metamask private key>
KOVAN_PROVIDER_URL=<Your kovan infura url>
IOTEX_ACCOUNT_KEY=<Your metamask private key>
NODE_URL_IOTEX=<The iotext testnet url for metamsk if deploying to iotex>


``
1. Create a work space with port 8546 open
2. ``npm i`` or ``yarn``
2. To compile the contracts run ``yarn compile``
3. To deploy to any network run ``yarn deploy`` N.B. please ensure you modify the script options ``    "deploy": "npm run build && RELEASE_VERSION=v1 truffle --network <your network> exec ./scripts/deploy.js"`` to match the network you wish to deploy to under ``scripts`` in package.json file
4. To run tests run ``yarn test``
# How to deploy locally (Vue App)
1. ``npm i`` or ``yarn``
2. Before starting the app please ensure you have created a .env file with the following format
``
VUE_APP_APP_SECRET=<Any string >
VUE_APP_TRUSTREAM_SUBGRAPH =https://dev.iotex.io/v1/graphql
VUE_APP_DEVICE_IMEI=100000000000022
VUE_APP_CEREMIC_NODE_URL=https://ceramic-clay.3boxlabs.com
VUE_APP_CEREMIC_SECRET=<your ceremic secret if using ceremic to store NFT data>
VUE_APP_SEED=<your ceremic seed if using ceremic to store NFT data>
VUE_APP_APP_DEVICE_DATA_URL=https://pebble-simulator.hasura.app/v1/graphql
VUE_APP_APP_SECRET_HASURA ="AJsOaT6tLJEaHwsrLSIm5apB2MPeNN8iyoUUE2BSuwb6UFpIFJ1kcD0BQFSjsHxV"
VUE_APP_APP_GRAPHQL_URL_DEV="https://dev.iotex.io/v1/graphql"
VUE_APP_APP_GRAPHQL_URL_PROD="https://pebble.iotex.me/v1/graphql"
VUE_APP_APP_NODE_URL_HARMONY_TESTNET="https://api.s0.b.hmny.io"
VUE_APP_APP_HARMONEY_ONE_MNEMONIC=<Your metamask key>
VUE_APP_APP_KOVAN_PRC_URL=<Your infura kovan url>
VUE_APP_TOKEN_CONTRACT_ADDRESS=<The NFT token address deployed>
VUE_APP_FLUID_PEBBLE_CONTRACT_ADDRESS=<The FluidPebble contract address deployed>


``
2. ``yarn start``
3. Before minting/renting any NFT please mint some fake dai using the button on the mint NFT screen

# Screenshots
1. ![alt text](https://siasky.net/PALhfMqEE2uZrNVnjFJUwocPeYaKa6HIUJcvZHxWYgH7vw)
2. ![alt text](https://siasky.net/_AwHXieA8tjQPbZgyd-k4QCClT_xejmZxYRvDKn19zDM3g)
3. ![alt text](https://siasky.net/PALIMTXjFdXp6Q51Vbh0QY7HLJQP0iOvD-Yf4CTk6jyMXQ)
4. ![alt text](https://siasky.net/_AFcuLl-E2t6bs3GveJzSgBOogwV8cUpuVKiC2j7IumgAA)
5. ![alt text](https://siasky.net/_Ao6HYz6tlnzsb5tmBks9ILIlgzvKJAd1albLf5dMhbGjQ)
6. ![alt text](https://siasky.net/fAGja5ceDLJpcU2r040b2MTf1aKYQ-2vORa1hfE8Q7BMqw)
7. ![alt text](https://siasky.net/vAPC7JFekQkwH065uUZKoCdLrlLDYPvT0m4w4E2ZkTGlbw)
8. ![alt text](https://siasky.net/fAB9vz8QcMbnB_9lI_ObCO2X8D0dLfCc9DTzm6fpF-USnA)
9. ![alt text](https://siasky.net/PAPE108jXCy5cEWGKwsMGVWWcfdqDcoC4eOfRbrGB6JUOQ)
10. ![alt text](https://siasky.net/PAMImeZb_qpNvLc6sOJaxJRx6p2EwMAmgSdYPwWyuw0Xwg)


# Diagrams 

Coming soon
 
# Contract Deployed
1. Token contract- https://kovan.etherscan.io/address/0xFaf584cd69e20E2286BfE640562F8908a53f969d
2. FluidPebble- https://kovan.etherscan.io/address/0xa9E05F677491Ef4596FF7780D3574d75278C5c37