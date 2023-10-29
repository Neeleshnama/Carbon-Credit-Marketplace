import Navbar from "./Navbar";
import axie from "../tile.jpeg";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState ,useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
import "../loader.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



export default function NFTPage (props) {
const [formParams, updateFormParams] = useState({pricevalue: ''});
const [prices,setprice]=useState('');

const [loading, setLoading] = useState(false);
const [data, updateData] = useState({});
const [dataFetched, updateDataFetched] = useState(false);
const [message, updateMessage] = useState("");
const [currAddress, updateCurrAddress] = useState("0x");
const [currentPrice, setCurrentPrice] = useState(0);
let sale;
const [currentBid, setCurrentBid] = useState(0);
 const [isBidding, setIsBidding] = useState(false);
 
//const storedData = JSON.parse(localStorage.getItem('formPrams')) || [];
let date;
async function getNFTData(tokenId) {
   

    const ethers = require("ethers");
    //After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    //Pull the deployed contract instance
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
    //create an NFT Token
    var tokenURI = await contract.tokenURI(tokenId);
    // sale= await contract. getCurrentPrice(tokenId)
    const listedToken = await contract.getListedTokenForId(tokenId);
    tokenURI = GetIpfsUrlFromPinata(tokenURI);
    let meta = await axios.get(tokenURI);
    meta = meta.data;
    console.log(listedToken);

    let item = {
        price: meta.price,
        tokenId: tokenId,
        seller: listedToken.seller,
        owner: listedToken.owner,
        image: meta.image,
        name: meta.name,
        description: meta.description,
        credits:meta.credits,
        timestamp: meta.timestamp,
        auction:meta.auction,
        auctionEndtime: meta.auctionEndTime,
    }
    console.log(item);
    updateData(item);
    updateDataFetched(true);
    console.log("address", addr)
    updateCurrAddress(addr);
    
}
let a=0;

// fetching the current price


function  getItemById(data, id) {
    var i, len,i;
    //var data = JSON.parse(data);
    i=id;
    for (i = 0, len = data.length; i < len; i += 1) {
        if(i == data[i].token) {
            return data[i];
        }
    }

    return undefined;
}
function getItemHrefById(json, itemId){
    return json.filter(function(testItem){return testItem.token == itemId;})[0].href;
}

//testItem = getItemById(data, 'item-3');
const handlePlaceBid = async () => {
    try {
        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        let salePrice;
      
            salePrice = ethers.utils.parseUnits(currentBid, 'ether')
            updateMessage("Placing bid... Please Wait (Upto 20-30 seconds)");
        // }
      // For auction NFTs, place a bid by calling the bid function
      // Make sure to send the correct amount of Ether (currentBid)
      await contract.buyNFT(tokenId, {value:salePrice});
      toast.success("bid placed successfully!");
      updateMessage("");

      // Handle success
    } catch (error) {
        alert(error);
      // Handle error
    }
  }
  useEffect(() => {
    // Fetch the current highest bid for the auction NFT
    async function fetchCurrentBid() {
      try {
        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        const currentBid = await contract.getCurrentBid(tokenId);
        const etherAmount = ethers.utils.formatEther(currentBid);
        //let cbid=ethers.utils.parseUnits(currentBid, 'ether');
        setCurrentBid(etherAmount.toString());
      } catch (error) {
        // Handle error
        alert(error);
      }
    }

    if (data.auction) {
      fetchCurrentBid();
      
     
      //date = datetime.datetime.utcfromtimestamp(unix_timestamp)
      
    }
  }, [ data.auction]);
date = new Date(data.auctionEndtime * 1000); 
date= date.toLocaleString();


async function buyNFT(tokenId) {
    try {
        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        let salePrice;
      
            salePrice = ethers.utils.parseUnits(data.price, 'ether')
        // }



       
      //salePrice = ethers.utils.parseUnits(data.price, 'ether')
        //console.log(sale);
        //salePrice = ethers.utils.parseUnits(st, 'ether')

        setLoading(true);

        updateMessage("Buying the NFT... Please Wait (Upto 20-30 seconds)")
        //run the executeSale function
      
        // else{
        //     // updating the entries when the coreesponding 

        //     salePrice = ethers.utils.parseUnits(formParams.pricevalue, 'ether')
        //     updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
        // }
        let transaction = await contract.executeSale(tokenId,{value:salePrice});
        await transaction.wait();
        setLoading(false);
        //alert('You successfully bought the NFT!');
        toast.success("NFT purchased successfully!");
        updateMessage("");
    }
    catch(e) {
        toast.error("Error purchasing NFT. Please try again.");
        //alert("Upload Error"+e)
    }
}
// NEW UPDATE for relisting the purchased NFT
async function relistNFT(tokenId) {
    try {
         a=1;
        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        //let data={price:formParams.pricevalue,token:tokenId};
        //storedData.push(data);// update via stored data
       // localStorage.setItem('formPrams', JSON.stringify(storedData));
 
        const salePrice = ethers.utils.parseUnits(data.price, 'ether')
        setLoading(true);
        updateMessage("relisting the NFT... Please Wait (Upto 5 mins)")
        //run the executeSale function
        let transaction = await contract.relistNFT(tokenId,salePrice);
        await transaction.wait();
        setLoading(false);
        //alert('You successfully relisted the NFT!');
        toast.success("You successfully relisted the NFT!");
        updateMessage("");
    }
    catch(e) {
        toast.error("Error in relisting.");
        alert("Upload Error"+e);
    }
}
   
    const params = useParams();
    const tokenId = params.tokenId;
    if(!dataFetched)
        getNFTData(tokenId);
        
    if(typeof data.image == "string")
        data.image = GetIpfsUrlFromPinata(data.image);
         
    return(
        <div style={{"min-height":"100vh"}}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5 rounded-full" />
                <div className="text-xl italic ml-20 space-y-8 text-white shadow-2xl rounded-lg  p-5">
                <div>
                        Issuing : {data.timestamp}
                    </div>
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Credits: {data.credits}
                    </div>
                    <div>
                        Price: <span className="">{data.price + " ETH"}</span>
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div>
                         Auction End:{ data.auction &&( <span className="text-sm"> <strong>{date}</strong></span>)}
                         {!data.auction && ( <span className="text-sm"> <strong>not listed for auction</strong></span>)}
                       
                    </div>
                    <div>
                    {!data.auction &&( currAddress != data.owner && currAddress != data.seller ?
                        <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
                        : <div className="text-emerald-700">You are the owner of this NFT <br />
                         <div className="mb-6">
                        {/* <label className="block text-white text-sm font-bold mb-2" htmlFor="price">Price (in ETH)</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" placeholder="Min 0.0001 ETH" step="0.0001" value={formParams.pricevalue} onChange={e => updateFormParams({...formParams, pricevalue: e.target.value})}></input> */}
                    </div> </div>
                    )}
                    {data.auction && (
                        currAddress != data.owner && currAddress != data.seller ?
        <div>
          <p>Current Highest Bid: {currentBid} Ether</p>
          <br />
          <label>
            <br />
            Your Bid (in Ether):
            <input type="number" value={currentBid} onChange={(e) => setCurrentBid(e.target.value)} />
          </label>
          <br />
          <br />
          <button style={{backgroundColor:'red',border:'2px solid black',borderRadius:'5px',color:'black'}} onClick={handlePlaceBid}>Place Bid</button>
        </div> : <div className="text-emerald-700"> Bid completed You are the owner of this NFT or you can't buy your own nft <br />
       <p style={{color:'white'}}>Purchased in : {currentBid} Ether</p> 
        </div>
                         
      )}
                    
                    <div className="text-green text-center mt-3">{message}</div>
                    {loading && <div className="loader"></div>}
                   <ToastContainer autoClose={3000} position="top-right" />
                    </div>
                </div>
            </div>
        </div>
    )
}