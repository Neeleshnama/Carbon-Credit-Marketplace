import Navbar from "./Navbar";
import { useEffect, useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import Marketplace from '../Marketplace.json';
import { useLocation } from "react-router";
import "../loader.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


 
// useEffect(() => {
//     SetDate();
// },[]);

export default function SellNFT () {
    const [formParams, updateFormParams] = useState({ name: '', description: '', price: '',credits:'',timestamp:Date(),auction:'' ,auctionEndTime:0});
    const [fileURL, setFileURL] = useState(null);
    const ethers = require("ethers");
    const [message, updateMessage] = useState('');
    const location = useLocation();
    const [loading, setLoading] = useState(false);
//     const [isAuction, setIsAuction] = useState(false);
//   const [auctionEndTime, setAuctionEndTime] = useState(0);

//   const handleListingTypeChange = (event) => {
//     setIsAuction(event.target.value === 'auction');
//   };

    async function disableButton() {
        const listButton = document.getElementById("list-button")
        listButton.disabled = true
        listButton.style.backgroundColor = "grey";
        listButton.style.opacity = 0.3;
    }

    async function enableButton() {
        const listButton = document.getElementById("list-button")
        listButton.disabled = false
        listButton.style.backgroundColor = "#A500FF";
        listButton.style.opacity = 1;
    }

    //This function uploads the NFT image to IPFS
    async function OnChangeFile(e) {
        var file = e.target.files[0];
        //check for file extension
        try {
            //upload the file to IPFS
            setLoading(true);
            disableButton();
            updateMessage("Uploading image.. please dont click anything!")
            const response = await uploadFileToIPFS(file);
            setLoading(false);
            toast.success("image uploaded sucessfully!");
            if(response.success === true) {

                enableButton();
                updateMessage("")
                console.log("Uploaded image to Pinata: ", response.pinataURL)
                setFileURL(response.pinataURL);
                
            }
        }
        catch(e) {
            setLoading(false);
            toast.error("Error in uploading please check your img size .");
            console.log("Error during file upload", e);
        }
    }

    //This function uploads the metadata to IPFS
    async function uploadMetadataToIPFS() {
        const {name, description, price,credits,timestamp,auction,auctionEndTime} = formParams;
        //Make sure that none of the fields are empty
        if( !name || !description || !price || !fileURL || !credits || !timestamp  )
        {
            updateMessage("Please fill all the fields!")
            return -1;
        }
      
        const nftJSON = {
            name, description, price, image: fileURL ,credits, timestamp,auction,auctionEndTime
        }

        try {
            //upload the metadata JSON to IPFS
            const response = await uploadJSONToIPFS(nftJSON);
            if(response.success === true){
                console.log("Uploaded JSON to Pinata: ", response)
                return response.pinataURL;
            }
        }
        catch(e) {
            toast.error("Error in listing NFT..");
            console.log("error uploading JSON metadata:", e)
        }
    }

    async function listNFT(e) {
        e.preventDefault();

        //Upload data to IPFS
        try {
            const metadataURL = await uploadMetadataToIPFS();
            if(metadataURL === -1)
                return;
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            setLoading(true);
            disableButton();
            updateMessage("Uploading NFT(takes 20-30 sec).. please dont click anything!")

            //Pull the deployed contract instance
            let contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer)

            //massage the params to be sent to the create NFT request
            const price = ethers.utils.parseUnits(formParams.price, 'ether')
            let listingPrice = await contract.getListPrice()
            listingPrice = listingPrice.toString()
           // let endtime=BigInt(formParams.auctionEndTime);
            let transaction;

            if (formParams.auction) {
       transaction= await contract.createToken(metadataURL, price, true,formParams.auctionEndTime,{ value: listingPrice });
      
    }
    else{
            //actually create the NFT
            transaction = await contract.createToken(metadataURL, price,false,0, { value: listingPrice })
            
        }
        await transaction.wait();
            setLoading(false);
            toast.success("NFT listed successfully!");

            //alert("Successfully listed your NFT!");
            enableButton();
            updateMessage("");
            updateFormParams({ name: '', description: '', price: '',credits:'',timestamp:'',auction:'',auctionEndTime:0});
            window.location.replace("/")
        }
        catch(e) {
            toast.error("Error in uploading  NFT. Please try again.");
            alert( "Upload error"+e )
        }
    }

    console.log("Working", process.env);
    return (
        <div className="">
        <Navbar></Navbar>
        <div className="flex flex-col place-items-center mt-10" id="nftForm" >
            <form className="shadow-md rounded px-8 pt-4 pb-8 mb-4">
            <h3 className="text-center font-bold text-green-500 rounded-lg border mb-8">Upload your NFT to the marketplace</h3>
                <div className="mb-4">
                    <label className="block text-white text-sm font-bold mb-2" htmlFor="name">NFT Name</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Axie#4563" onChange={e => updateFormParams({...formParams, name: e.target.value})} value={formParams.name}></input>
                </div>
                <div className="mb-6">
                    <label className="block text-white text-sm font-bold mb-2" htmlFor="description">NFT Description</label>
                    <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" cols="40" rows="5" id="description" type="text" placeholder="Axie Infinity Collection" value={formParams.description} onChange={e => updateFormParams({...formParams, description: e.target.value})}></textarea>
                </div>
                <div className="mb-6">
                    <label className="block text-white text-sm font-bold mb-2" htmlFor="price">Price (in ETH)</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" placeholder="Min 0.0001 ETH" step="0.0001" value={formParams.price} onChange={e => updateFormParams({...formParams, price: e.target.value})}></input>
                </div>
                {/* // adding the extra fields  */}
                <div className="mb-6">
                    <label className="block text-white text-sm font-bold mb-2" htmlFor="price">Credits </label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" placeholder="Min 5 credits ..." step="1" value={formParams.credits} onChange={e => updateFormParams({...formParams, credits: e.target.value})}></input>
                </div>

                {/* <div className="mb-6">
                    <label className="block text-white text-sm font-bold mb-2" htmlFor="price">Time stamp</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" id="myDate"  placeholder="enter issuing date and time"  value={formParams.timestamp} onChange={e => updateFormParams({...formParams, timestamp:SetDate()})}></input>
                </div> */}
                <div>
                    <label className="block text-white text-sm font-bold mb-2" htmlFor="image">Upload Image (&lt;500 KB)</label>
                    <input type={"file"} onChange={OnChangeFile}></input>
                </div>
                {/* //auction related */}
                <label style={{color:'white'}}>
        Listing Type:
        <select  style={{color:'black'}} onChange={e =>updateFormParams({...formParams, auction:e.target.value })} >
          <option  style={{color:'black'}} value={''} >fix</option>
          <option style={{color:'black'}} value={true} >auction</option>
        </select>
      </label>
      {formParams.auction && (
        
        <label style={{color:'white'}}>
            <br />
          Auction End Time (Unix Timestamp):
          <input type="number" style={{color:'black'}} value={formParams.auctionEndTime} onChange={e => updateFormParams({...formParams, auctionEndTime: e.target.value})} />
        </label>
      )}
                <br></br>
                <div className="text-red-500 text-center">{message}</div>
                <button onClick={listNFT} className="font-bold mt-10 w-full bg-red-500 text-white rounded p-2 shadow-lg" id="list-button">
                    List NFT
                </button>
                {loading && <div className="loader"></div>}
                <ToastContainer autoClose={3000} position="top-right" />
            </form>
        </div>
        </div>
    )
}