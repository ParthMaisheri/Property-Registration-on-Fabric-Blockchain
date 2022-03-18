'use strict';

const {Contract} = require('fabric-contract-api');


   // Smart contract for Users Organization
 
class UsersContract extends Contract {

	
	 // Constructor method to initiate contract with unique name on the network
	 
	constructor() {
		// Name of the smart contract
		super('org.property-registration-network.regnet.users');
	}

	/**
	 * instantiate the smart contract
	 * @param   ctx  The transaction context
	 */
	async instantiate(ctx) {
		console.log('Smart Contract -> User Instantiated');
	}

	/**
	 *  Request from user to register on the network
	 * @param   ctx  The transaction context
	 * @param   name Name of the user
	 * @param   email Email ID of the user
	 * @param   phoneNumber Phone number of the user
	 * @param   aadharId Aadhar Id of the user
	 */
	async requestNewUser(ctx, name, email, phoneNumber, aadharId) {

		// Create a new composite key for the new student account
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name,aadharId]);

		// Create a student object to be stored in blockchain
		let newUsrObj = {
			name: name,
			email: email,
			phoneNumber: phoneNumber,
			aadharId: aadharId,
			userId: ctx.clientIdentity.getID(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Convert the JSON object to a buffer and send it to blockchain for storage
		let dataBuffer = Buffer.from(JSON.stringify(newUsrObj));
		await ctx.stub.putState(userKey, dataBuffer);

		return newUsrObj;
	}

	/**
	 * Method to recharge the account with the upgradCoins.  Here the coin is retrieved from the bankTransactionId sent in the arguement
	 * @param   ctx   The transaction context
	 * @param   name Name of the user
	 * @param   aadharId  Aadhar Id of the user
	 * @param   bankTransactionId mocked bank transaction id for this project
	 */
	async rechargeAccount(ctx, name, aadharId, bankTransactionId){

		// Bank Transaction ID	with Number of upgradCoins
		let bankTxIdArray = [{'id':'upg100', 'value':100}, {'id':'upg500', 'value':500}, {'id':'upg1000', 'value':1000}];
		
		//Fetch upgradCoins based on the bank transaction id
		let txnDetails ;
		for (var i=0; i < bankTxIdArray.length; i++) {
			if (bankTxIdArray[i].id === bankTransactionId) {
				txnDetails = bankTxIdArray[i];
			}
    	}

		//composite key for the users
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

		//using composite key fetch the current state of user object
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));


		//validate bankTransactionId with the expected value and if the user found on the network
		if(txnDetails && userBuffer){

			//Update user object with new properties
			let UsrObj = JSON.parse(userBuffer.toString());
			if(UsrObj.status === 'Approved'){
				UsrObj.upgradCoins = UsrObj.upgradCoins + txnDetails.value;
				UsrObj.updatedAt = new Date();
	
				// Convert the JSON object to a buffer
				let dataBuffer = Buffer.from(JSON.stringify(UsrObj));
				await ctx.stub.putState(userKey, dataBuffer);
	
				return UsrObj;
	
			}
			else{ 
				throw new Error('User should be registered on network to recharge');
			}
		}
		else{ 
			throw new Error('Invalid Transaction ID: ' + bankTransactionId );
		}
	}

	/**
	 * View user details on the network
	 * @param   ctx  The transaction context
	 * @param   name Name of the user
	 * @param   aadharId Aadhar Id of the user
	 */
	async viewUser(ctx, name, aadharId){
		//composite key for the user
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);


		//using composite key fetch the current state of user object and return
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));
		
		if(userBuffer){
			//user object on the network
			let UsrObj = JSON.parse(userBuffer.toString());
			return UsrObj;

		}
		else{
			throw new Error('User is not available on network');
		}
	}

	/**
	 * Method to request to user's property to be registered on the network.  
	 * @param   ctx  The transaction context
	 * @param   propertyId Unique property id of the property
	 * @param   price Price of the property
	 * @param   name Name of the user (owner) who want to register their property on the network
	 * @param   aadharId Aadhar id of the user (owner) who want to register their property on the network
	 */
	async propertyRegistrationRequest(ctx, propertyId, price, name, aadharId){

		//composite key for the user detail given
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

		//fetch the user details from the ledger using composite key fetch the current state of user object
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));

		let UsrObj = JSON.parse(userBuffer.toString());

		//if user is registered on the network, then proceed, otherwise, decline the transaction
		if(UsrObj.status === 'Approved'){
			//user is valid, then register the property request in the ledger.
			//Use name, aadharId, and propertyId to create new composite key for property
			const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

			// Create a property object to be stored in blockchain
			let PropObj = {
				propertyId: propertyId,
				owner: name+"-"+aadharId,
				price: price,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Convert the JSON object to a buffer and send it to blockchain for storage
			let propertyDataBuffer = Buffer.from(JSON.stringify(PropObj));
			await ctx.stub.putState(propertyKey, propertyDataBuffer);

			// Return value of new property request requested by the user
			return PropObj;
		}
		else{
			throw new Error('User is not registered on network');
		}
	}

	/**
	 * View property details
	 * @param   ctx  The transaction context
	 * @param   propertyId Unique property id of the property
	 */
	async viewProperty(ctx, propertyId){

		//composite key for the details given property id
		const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

		//using composite key fetch the current state of property object and return
		let propertyBuffer = await ctx.stub
				.getState(propertyKey)
				.catch(err => console.log(err));
		if(propertyBuffer){
			let PropObj = JSON.parse(propertyBuffer.toString());
			return PropObj;
		}
		else{
			throw new Error('Property is not found on the network');
		}
	}

	/**
	 *   Method to update property status
	 * @param   ctx  The transaction context
	 * @param   propertyId Unique property id of the property
	 * @param   name Name of the user who owns the property on the network
	 * @param   aadharId Aadhar id of the user who owns the property on the network
	 * @param   propertyStatus Property status to be updated 
	 */
	async updateProperty(ctx, propertyId, name, aadharId, propertyStatus){

		//composite key for the property given.
		const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

		//cretae composite key for the user detail given
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

		//fetch user details from the ledger.
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));

		let UsrObj = JSON.parse(userBuffer.toString());

		//if the user is registered, then proceed.
		if(UsrObj.status === 'Approved'){

			//fetch property details from the ledger.
			//using composite key fetch the current state of property object and return
			let propertyBuffer = await ctx.stub
					.getState(propertyKey)
					.catch(err => console.log(err));

			let PropObj = JSON.parse(propertyBuffer.toString());

			//check whether the owner of the property and the request initiator are same, then proceed.
			if(PropObj.owner === (name + "-" + aadharId)){
				
				PropObj.status = propertyStatus;

				//update property details in ledger.
				let propertyDataBuffer = Buffer.from(JSON.stringify(PropObj));
				await ctx.stub.putState(propertyKey, propertyDataBuffer);
				
				// Return value of new account created to user
				return PropObj;

			}
			else{
				//if request initiated by different user, then reject the transaction as only owner can upate status of the property.
				throw new Error("Not authorized to update tx");
				return false;
			}
		}
		else{
			throw new Error("Not authorized to update tx");
			return false;
		}
	}

	/**
	 *  Method to purchase property request by registered buyer on the network.  
	 *  Buyer will be allowed to purchase only if account balance is greater than property price
	 *  Buyer will be allowed to purchase only if the property status is 'onSale'
	 *  If all the conditions are met, then updates buyer as owner of the property and returns the details of Property, Buyer and Seller
	 * @param   ctx  The transaction context
	 * @param   propertyId Unique property id which buyer wants to purchase
	 * @param   buyerName name of the buyer who is registered on the network
	 * @param   buyerAadharId Aadhar id of the buyer
	 */
	async purchaseProperty(ctx, propertyId, buyerName, buyerAadharId){

		//composite key for property and fetch property details. Proceed further, if the property status is 'onSale'
		//composite key for the buyer and check whether buyer is already registered on the network.
		const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);
		const buyerUserKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [buyerName, buyerAadharId]);

		//fetch user details from the ledger.
		let buyerUserBuffer = await ctx.stub
				.getState(buyerUserKey)
				.catch(err => console.log(err));

		let buyerObject = JSON.parse(buyerUserBuffer.toString());

		//if the user is registered, then proceed.
		if(buyerObject.status === 'Approved'){

			//fetch property details from the ledger.
			//using composite key fetch the current state of property object and return
			let propertyBuffer = await ctx.stub
					.getState(propertyKey)
					.catch(err => console.log(err));

			let PropObj = JSON.parse(propertyBuffer.toString());

			//If the request made for current owner, it should be declined
			if(PropObj.owner === (buyerName+"-"+buyerAadharId)){
				throw new Error("You are already the owner of this property");
			}

			//If the property status is 'onSale' then prceed.
			if(PropObj.status === 'onSale'){
				//then check the buyer has sufficient balance in his/her account

				if(buyerObject.upgradCoins > PropObj.price){
					let ownerDetail = PropObj.owner.split('-');
					console.log('OWNER DETAILS', ownerDetail);
					//get owner details from ledger.
					const ownerUserKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [ownerDetail[0], ownerDetail[1]]);

					//fetch user details from the ledger.
					let ownerUserBuffer = await ctx.stub
							.getState(ownerUserKey)
							.catch(err => console.log(err));

					let ownerObject = JSON.parse(ownerUserBuffer.toString());

					//deduct property price from buyer account
					buyerObject.upgradCoins = parseInt(buyerObject.upgradCoins) - parseInt(PropObj.price);
					buyerObject.updatedAt = new Date();

					//add property price to owner
					ownerObject.upgradCoins = parseInt(ownerObject.upgradCoins) + parseInt(PropObj.price);
					ownerObject.updatedAt = new Date();

					//updated the ownwer of the property as buyer id, status as registered
					PropObj.owner = buyerName+ "-" + buyerAadharId;
					PropObj.status='registered';
					PropObj.updatedAt = new Date();

					//update property details in ledger
					let updateProperty = Buffer.from(JSON.stringify(PropObj));
					await ctx.stub.putState(propertyKey, updateProperty);

					//update buyer details in ledger.
					let updateBuyer = Buffer.from(JSON.stringify(buyerObject));
					await ctx.stub.putState(buyerUserKey, updateBuyer);

					//update owner details in ledger.
					let updateOwner = Buffer.from(JSON.stringify(ownerObject));
					await ctx.stub.putState(ownerUserKey, updateOwner);

					return (JSON.stringify(PropObj) + JSON.stringify(buyerObject) + JSON.stringify(ownerObject));

				}
				else{
					throw new Error("No enough balance");
				}
			}
			else{
				throw new Error("not for sale");
			}
		}
		else{
			throw new Error("User is not registered on network");
		}
	}
}

module.exports = UsersContract;