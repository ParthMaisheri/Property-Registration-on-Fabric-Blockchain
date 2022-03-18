'use strict';

const {Contract} = require('fabric-contract-api');


 // Smart contract for Registrar 
 
class RegistrarContract extends Contract {

	/**
	 *  Initiate constructor with smart contract name for registrar
	 */
	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.property-registration-network.regnet.registrar');
	}

	// 
	/**
	 * Method will be called while instantiating the smart contract to print the success message on console and set few initial set of variables.
	 * @param   ctx - Transaction context object
	 */
	async instantiate(ctx) {
		console.log('Smart Contract -> Registrar Instantiated');
	}

	/**
	 * Approve new user request made  on the network by user
	 * @param  ctx The transaction context
	 * @param  name Name of the user
	 * @param  aadharId Aadhar Id of the user
	 */
	async approveNewUser(ctx, name, aadharId) {
		//composite key for the given user account
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

		//fetch user details from ledger.
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));

		//Update user object
		let updatedUsrObj = JSON.parse(userBuffer.toString());
		
		//reject Tx if status already approved 
		if(updatedUsrObj.status === 'Approved'){
			throw new Error('Duplicate Request: User is already registered on network');
		}
		else{
			updatedUsrObj.upgradCoins = parseInt(0);
			updatedUsrObj.updatedAt = new Date();
			updatedUsrObj.registrarId = ctx.clientIdentity.getID(); 
			updatedUsrObj.status = 'Approved'; //status of the user.
	
			// Convert the JSON object to a buffer
			let dataBuffer = Buffer.from(JSON.stringify(updatedUsrObj));
			await ctx.stub.putState(userKey, dataBuffer);
	
			return updatedUsrObj;
	
		}
	}

	/**
	 * Method to view user details on network
	 * @param  ctx The transaction context
	 * @param  name Name of the user
	 * @param  aadharId Aadhar Id of the user
	 */
	async viewUser(ctx, name, aadharId){
		//composite key for the user
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);


		//using composite key fetch the current state of user object and return
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));

		//user details registered  on the network
		let UsrObj = JSON.parse(userBuffer.toString());

		//return the user detail
		return UsrObj;

	}

	/**
	 * Approve the property registration request by the user. 
	 * @param   ctx The transaction context
	 * @param   propertyId Unique property id of the property
	 */
	async approvePropertyRegistration(ctx, propertyId){

		//composite key for the property id
		const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

		//fetch the request for registration
		let propertyBuffer = await ctx.stub
				.getState(propertyKey)
				.catch(err => console.log(err));

		let PropObj = JSON.parse(propertyBuffer.toString());

		//Update property object
		PropObj.status='registered';
		PropObj.approvedBy = ctx.clientIdentity.getID();
		PropObj.updatedAt = new Date();

		//update property details in ledger.
		let propertyDataBuffer = Buffer.from(JSON.stringify(PropObj));
		await ctx.stub.putState(propertyKey, propertyDataBuffer);

		return PropObj;

	}

	/**
	 * View property details available  on the network.
	 * @param   ctx The transaction context
	 * @param   propertyId Unique property id of the property 
	 */
	async viewProperty(ctx, propertyId){

		//composite key for the details given property id
		const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

		//using composite key fetch the current state of property object
		let propertyBuffer = await ctx.stub
				.getState(propertyKey)
				.catch(err => console.log(err));

		let PropObj = JSON.parse(propertyBuffer.toString());
		
		return PropObj;
	}
}

module.exports = RegistrarContract;