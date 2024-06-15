import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'
import Navbar from "../Component/Course/Nav";

import { ToastContainer, toast } from 'react-toastify';
import { notification } from 'antd';

import {Web3} from 'web3';
import {
  marketplaceAddress
} from '../config'

import NFTMarketplace from '../abi/marketplace.json'








export default function Home() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')



  useEffect(() => {

    async function  test(){

      const networks = {
        zkSyncSepoliaTestnet: {
        chainId: `0x${Number(300).toString(16)}`,
        chainName: "zkSyncSepoliaTestnet",
        nativeCurrency: {
          name: "zkSyncSepoliaTestnet",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: ["https://sepolia.era.zksync.dev"],
      },
    };
    if(typeof window.ethereum =="undefined"){
      console.log("PLease install the metamask");
  }
  let web3 =  new Web3(window.ethereum);
 
  if(web3.network !=="zkSyncSepoliaTestnet"){
      await window.ethereum.request({
          method:"wallet_addEthereumChain",
          params:[{
              ...networks["zkSyncSepoliaTestnet"]
          }]
      })
  }
}
async function checkNetworkAndLoadNFTs() {
  try {
    const web3 = new Web3(window.ethereum);
    const currentChainId = await web3.eth.getChainId();
    localStorage.setItem("ChainId",currentChainId);

   
    
  

    let chk = localStorage.getItem("ChainId");




    if (chk !== '300') { 
      await test();
    }

    loadNFTs();
  } catch (error) {
    console.error('Error checking network or loading NFTs:', error);
  }
}

checkNetworkAndLoadNFTs();
  }, [])




  async function loadNFTs() {
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, provider)
    const data = await contract.fetchMarketItems()

    /*
    *  map over items returned from smart contract and format 
    *  them as well as fetch their token metadata
    */
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await contract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
        cid1:meta.data.cid1,
      }
      console.log(item)
      return item
    }))
    console.log(items);
    setNfts(items)
    setLoadingState('loaded') 
  }
  async function buyNft(nft) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)

    /* user will be prompted to pay the asking proces to complete the transaction */
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')   
    const transaction = await contract.createMarketSale(nft.tokenId, {
      value: price
    })
    await transaction.wait()
    loadNFTs()
  }
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-white text-3xl">No Item in marketplace</h1>)
  return (
    <>
  
    <div className="flex mrkt  justify-center">
      {/* <Navbar/> */}
      <div className="px-10" style={{ maxWidth: '1600px' }}>
        <div className="grid flex  grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 unmrk">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border rounded-t-md  umrkt shadow rounded-xl overflow-hidden">
                <img   height="25px"  className = " w-full rounded-t-md duration-200 hover:scale-110 hover:overflow-hidden" src={nft.image} />
                <div className="p-1">
                  <p style={{ height: '100%' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                 
                </div>
              
                <div className="p-1  umrk bg-black">
                  <p className="text-2xl font-bold text-white">{nft.price} ETH</p>
                  <button className=" hover:rotate-2 delay-100 transition ease-in-out   text-center border hover:bg-gray-100 hover:shadow-md border-gray-500 rounded-md mt-4 w-full bg-green-500 text-cyan font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                </div>
                
              </div>
            ))
          }
        </div>
      </div>
    </div>
    </>)
}