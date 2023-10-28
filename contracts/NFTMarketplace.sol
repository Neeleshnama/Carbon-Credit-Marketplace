//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTMarketplace is ERC721URIStorage {

    using Counters for Counters.Counter;
    //_tokenIds variable has the most recent minted tokenId
    Counters.Counter private _tokenIds;
    //Keeps track of the number of items sold on the marketplace
    Counters.Counter private _itemsSold;
    //owner is the contract address that created the smart contract
    address payable owner;
    //The fee charged by the marketplace to be allowed to list an NFT
    uint256 listPrice = 0.0001 ether;

    //The structure to store info about a listed token
    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
        uint256 auctionEndTime; // New field for auction end time
        address highestBidder; // New field for the highest bidder
        uint256 highestBid; // New field for the highest bid amount
    }

    //the event emitted when a token is successfully listed
    event TokenListedSuccess (
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );
     event TokenPurchased (
        uint256 indexed tokenId,
        address buyer,
        address seller,
        uint256 price
    );

    //This mapping maps tokenId to token info and is helpful when retrieving details about a tokenId
    mapping(uint256 => ListedToken) private idToListedToken;

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    function updateListPrice(uint256 _listPrice) public payable {
        require(owner == msg.sender, "Only owner can update listing price");
        listPrice = _listPrice;
    }
  // Add this function to your smart contract
   function getCurrentPrice(uint256 tokenId) public view returns (uint256) {
    require(_exists(tokenId), "NFT with this ID does not exist.");
    return idToListedToken[tokenId].price;
     }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    function getListedTokenForId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }
   function getCurrentBid(uint256 tokenId) public view returns (uint256) {
        return idToListedToken[tokenId].highestBid;
    }
    //The first time a token is created, it is listed here
    function createToken(string memory tokenURI, uint256 price, bool auction, uint256 auctionEndTime) public payable returns (uint) {
        //Increment the tokenId counter, which is keeping track of the number of minted NFTs
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        //Mint the NFT with tokenId newTokenId to the address who called createToken
        _safeMint(msg.sender, newTokenId);

        //Map the tokenId to the tokenURI (which is an IPFS URL with the NFT metadata)
        _setTokenURI(newTokenId, tokenURI);
        if (auction) {
            // Create an auction for the NFT
            createAuction(newTokenId, auctionEndTime);
        } 
        else{

        //Helper function to update Global variables and emit an event
        createListedToken(newTokenId, price);}

        return newTokenId;
    }
    function createAuction(uint256 tokenId, uint256 auctionEndTime) private {
        require(msg.value == listPrice, "Please send the correct listing price.");
        require(auctionEndTime > block.timestamp, "Auction end time must be in the future.");
        
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            0, // Price is 0 for auctions
            true,
            auctionEndTime,
            address(0), // Initialize highestBidder as address(0)
            0 // Initialize highestBid as 0
        );

       _transfer(msg.sender, address(this), tokenId);
      // _transfer( address(this),msg.sender, tokenId);
        emit TokenListedSuccess(tokenId, address(this), msg.sender, 0, true);
    }

    function createListedToken(uint256 tokenId, uint256 price) private {
        //Make sure the sender sent enough ETH to pay for listing
        require(msg.value == listPrice, "Hopefully sending the correct price");
        //Just sanity check
        require(price > 0, "Make sure the price isn't negative");

        //Update the mapping of tokenId's to Token details, useful for retrieval functions
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            price,
            true,
            0, // No auction for fixed-price listings
            address(0),
            0
        );

        _transfer(msg.sender, address(this), tokenId);
        //Emit the event for successful transfer. The frontend parses this message and updates the end user
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true
        );
    }
    
    //This will return all the NFTs currently listed to be sold on the marketplace
    // function getAllNFTs() public view returns (ListedToken[] memory) {
    //     uint nftCount = _tokenIds.current();
    //     ListedToken[] memory tokens = new ListedToken[](nftCount);
    //     uint currentIndex = 0;
    //     uint currentId;
    //     //at the moment currentlyListed is true for all, if it becomes false in the future we will 
    //     //filter out currentlyListed == false over here
    //     for(uint i=0;i<nftCount;i++)
    //     {
    //         currentId = i + 1;
    //         ListedToken storage currentItem = idToListedToken[currentId];
    //         tokens[currentIndex] = currentItem;
    //         currentIndex += 1;
    //     }
    //     //the array 'tokens' has the list of all NFTs in the marketplace
    //     return tokens;
    // }

// ListedToken[]  listedTokens;
    // new code to remove purchased tokens nft from market place
    function getAllNFTs() public view returns (ListedToken[] memory) {
    uint nftCount = _tokenIds.current();
    uint listedCount = 0;
    ListedToken[] memory tokens = new ListedToken[](nftCount);
    
    // Iterate through all NFTs and filter out those that are currently listed
    for(uint i = 0; i < nftCount; i++) {
        uint currentId = i + 1;
        ListedToken storage currentItem = idToListedToken[currentId];
        
        if (currentItem.currentlyListed) {
            tokens[listedCount] = currentItem;
            listedCount += 1;
        }
    }
    
    // Create a new array with only the listed NFTs
    ListedToken[] memory listedTokens = new ListedToken[](listedCount);
    for (uint i = 0; i < listedCount; i++) {
        listedTokens[i] = tokens[i];
    }
    
    return listedTokens;
}

function relistNFT(uint256 tokenId, uint256 newPrice) public {
    require(_exists(tokenId), "NFT with this ID does not exist.");
    require(ownerOf(tokenId) == msg.sender, "Only the owner of the NFT can relist it.");
    
    ListedToken storage nft = idToListedToken[tokenId];
    
    require(!nft.currentlyListed, "NFT is already listed.");
    
    // Ensure that the new price is greater than zero
    require(newPrice > 0, "Make sure the price isn't negative.");
//      idToListedToken[tokenId].seller = payable(msg.sender);
//    // _transfer(address(this), msg.sender, tokenId);
//         //approve the marketplace to sell NFTs on your behalf
//     approve(address(this), tokenId);

//         //Transfer the listing fee to the marketplace creator
//     payable(owner).transfer(listPrice);
    
    // Update the NFT's price and set it as currently listed
    nft.price = newPrice;
    nft.currentlyListed = true;
    
    emit TokenListedSuccess(tokenId, address(this), msg.sender, newPrice, true);
}





    
    //Returns all the NFTs that the current user is owner or seller in
    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        uint currentId;
        //Important to get a count of all the NFTs that belong to the user before we can make an array for them
        for(uint i=0; i < totalItemCount; i++)
        {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender){
                itemCount += 1;
            }
        }

        //Once you have the count of relevant NFTs, create an array then store all the NFTs in it
        ListedToken[] memory items = new ListedToken[](itemCount);
        for(uint i=0; i < totalItemCount; i++) {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender) {
                currentId = i+1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
 function buyNFT(uint256 tokenId) public payable {
    require(_exists(tokenId), "NFT with this ID does not exist.");

    ListedToken storage nft = idToListedToken[tokenId];

    require(nft.currentlyListed, "NFT is not currently listed for sale.");
    require(msg.sender != nft.seller, "You cannot buy your own NFT.");

    // Check if it's an auction
    if (nft.auctionEndTime > 0) {
        if (block.timestamp < nft.auctionEndTime) {
            require(msg.value > nft.highestBid, "Please submit a higher bid.");
            
            // Refund the previous highest bidder
            if (nft.highestBidder != address(0)) {
                payable(nft.highestBidder).transfer(nft.highestBid);
            }

            // Update the highest bid and bidder
            nft.highestBid = msg.value;
            nft.highestBidder = payable(msg.sender);
        } else {
            // Auction has ended
            require(msg.sender == nft.highestBidder, "Only the highest bidder can claim the NFT.");
            require(msg.value == nft.highestBid, "Please enter your bid amount.");
            //  ListedToken storage currentIte = idToListedToken[tokenId];
            // currentIte.currentlyListed=false;
            executeSaleauction(tokenId);
            // nft.currentlyListed = false; // Mark the NFT as sold
            // _itemsSold.increment();
           
            // _transfer(address(this),msg.sender, tokenId);
            //   approve(address(this), tokenId);
            // payable(owner).transfer(listPrice);
            //  payable(nft.seller).transfer(listPrice);
           // payable(seller).transfer(msg.value);

        }
    } else {
        // It's not an auction, it's a fixed-price purchase
        require(msg.value == nft.price, "Please submit the correct price to purchase the NFT.");
        nft.currentlyListed = false;
        _itemsSold.increment();
        _transfer(address(this), msg.sender, tokenId);
        payable(owner).transfer(listPrice);
        payable(nft.seller).transfer(msg.value);
    }

    emit TokenPurchased(tokenId, msg.sender, nft.seller, msg.value);
}





   function executeSaleauction(uint256 tokenId) public payable {
         ListedToken storage currentIte = idToListedToken[tokenId];
        //uint price = idToListedToken[tokenId].price;
        address seller = idToListedToken[tokenId].seller;
        //require(msg.value == price, "Please submit the asking price in order to complete the purchase");

        //update the details of the token
        //idToListedToken[tokenId].currentlyListed = false;
        currentIte.currentlyListed=false;
        idToListedToken[tokenId].seller = payable(msg.sender);
        _itemsSold.increment();

        //Actually transfer the token to the new owner
        _transfer(address(this), msg.sender, tokenId);
        //approve the marketplace to sell NFTs on your behalf
        approve(address(this), tokenId);

        //Transfer the listing fee to the marketplace creator
        payable(owner).transfer(listPrice);
        //Transfer the proceeds from the sale to the seller of the NFT
        payable(seller).transfer(msg.value);
    }
    function executeSale(uint256 tokenId) public payable {
         ListedToken storage currentIte = idToListedToken[tokenId];
        uint price = idToListedToken[tokenId].price;
        address seller = idToListedToken[tokenId].seller;
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");

        //update the details of the token
        //idToListedToken[tokenId].currentlyListed = false;
        currentIte.currentlyListed=false;
        idToListedToken[tokenId].seller = payable(msg.sender);
        _itemsSold.increment();

        //Actually transfer the token to the new owner
        _transfer(address(this), msg.sender, tokenId);
        //approve the marketplace to sell NFTs on your behalf
        approve(address(this), tokenId);

        //Transfer the listing fee to the marketplace creator
        payable(owner).transfer(listPrice);
        //Transfer the proceeds from the sale to the seller of the NFT
        payable(seller).transfer(msg.value);
    }





    
    //Currently NFTs are listed by default
}
