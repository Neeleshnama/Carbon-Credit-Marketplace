import logo from '../logo_3.png';
import fullLogo from '../full_logo.png';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import "../stylenavbar.css";

function Navbar() {

const [connected, toggleConnect] = useState(false);
const location = useLocation();
const [currAddress, updateAddress] = useState('0x');

async function getAddress() {
  const ethers = require("ethers");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const addr = await signer.getAddress();
  updateAddress(addr);
}

function updateButton() {
  const ethereumButton = document.querySelector('.enableEthereumButton');
  ethereumButton.textContent = "Connected to your wallet";
  ethereumButton.classList.remove("hover:bg-blue-70");
  ethereumButton.classList.remove("bg-blue-500");
  ethereumButton.classList.add("hover:bg-green-70");
  ethereumButton.classList.add("bg-green-500");
}

async function connectWebsite() {

    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if(chainId !== '0x5')
    {
      //alert('Incorrect network! Switch your metamask network to Rinkeby');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x5' }],
     })
    }  
    await window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(() => {
        updateButton();
        console.log("here");
        getAddress();
        window.location.replace(location.pathname)
      });
}

  useEffect(() => {
    if(window.ethereum == undefined)
      return;
    let val = window.ethereum.isConnected();
    if(val)
    {
      console.log("here");
      getAddress();
      toggleConnect(val);
      updateButton();
    }

    window.ethereum.on('accountsChanged', function(accounts){
      window.location.replace(location.pathname)
    })
  });

    return (
      <div className="">
        <nav className="w-screen navbar">
          <ul className='flex items-end justify-between py-3 bg-transparent text-white pr-5'>
          <li className='flex items-end ml-5 pb-2'>
            <Link to="/">
            <img src={fullLogo} alt="" width={120} height={120} className="inline-block -mt-2"/>
            <div className='inline-block font-bold italic text-2xl ml-2 text-white'>
              Carbon Credit  Marketplace
            </div>
            </Link>
          </li>
          <li className='w-2/6 inside'>
            <ul className='lg:flex justify-between font-bold mr-10 text-lg'>
              {location.pathname === "/" ? 
              <li className='border-b-2  bg-gradient-to-r from-purple-500 to-white-500 text-black-700 rounded-xl hover:pb-0 p-2'>
                <Link to="/">Buy a carbon credit</Link>
              </li>
              :
              <li className='hover:border-b-2  bg-gradient-to-r from-purple-500 to-white-500 text-black-700 rounded-xl hover:pb-0 p-2 text-red'>
                <Link to="/">Buy a carbon credit</Link>
              </li>              
              }
              {location.pathname === "/sellNFT" ? 
              <li className='border-b-2  bg-gradient-to-r from-purple-500 to-white-500 text-black-700 rounded-xl hover:pb-0 p-2'>
                <Link to="/sellNFT">Sell Carbon Credit</Link>
              </li>
              :
              <li className='hover:border-b-2  bg-gradient-to-r from-purple-500 to-white-500 text-black-700 rounded-xl hover:pb-0 p-2'>
                <Link to="/sellNFT">Sell Carbon Credit</Link>
              </li>              
              }              
              {location.pathname === "/profile" ? 
              <li className='border-b-2  bg-gradient-to-r from-purple-500 to-white-500 text-black-700 rounded-xl hover:pb-0 p-2'>
                <Link to="/profile">Track Credits</Link>
              </li>
              :
              <li className='hover:border-b-2  bg-gradient-to-r from-purple-500 to-white-500 text-black-700 rounded-xl hover:pb-0 p-2'>
                <Link to="/profile">Track Credits</Link>
              </li>              
              }  
              <li className='wallet'>
                <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={connectWebsite}>{connected? "Connected":"Connect Wallet"}</button>
              </li>
            </ul>
          </li>
          </ul>
        </nav>
        <div className='text-white text-bold text-right mr-10 text-sm'>
          {currAddress !== "0x" ? "Connected to":"Not Connected. Please login to view NFTs"} {currAddress !== "0x" ? (currAddress.substring(0,15)+'...'):""}
        </div>
      </div>
    );
  }

  export default Navbar;