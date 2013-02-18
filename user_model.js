"use strict";

var _SALT = "undefined",
	mongoose;
	

function createNewUserModel() {
	// A Scheme for a user entry on the DB - pretty standard stuff
	mongoose = require('./base_model')(mongoose).mongoose;	

	var UserSchema = new mongoose.Schema({
		name : String,
		email : String,
		login : String,
		password : String,
		phone : String,
		language : String,
		register_date : Number,
		last : mongoose.Schema.ObjectId,
		upgrade_lvl : Number,
		current_storage : Number,
		extra_storage : Number
	}, {
		collection : 'user'
	});

	// Schema's static methods

	/**
	 * User data verifier
	 * @param string email
	 * @param string password - plain-text
	 * @param function cb Callback
	 */
	UserSchema.statics.verifyCredentials = function(email, password, cb) {
		var crypto = require('crypto');
		var md5sum = crypto.createHash('md5');
		// Generate password MD5 hash
		md5sum.update(password + _SALT);
		password = md5sum.digest('hex');
		// search for e-mail and password
		this.find({email: email, password: password}, function (error, result) {
			var ret_error, ret_result = null;
			if (error) {
				ret_error = {
					error : 'Error retrieving user information.',
					servMsg : 'MongoDB error while retrieving User: ' + error
				};
				console.log('Error while fetching user: ' + error);
			} else if (result.length === 0) {
				ret_error = {
					error: 'Invalid Login/Password information.'
				};
				console.log('Invalid Login/Password information.');
			} else {
				ret_result = result;
			}
			// Calls external callback
			cb(ret_error, ret_result);
		});
	};

	return mongoose.model('User', UserSchema);
}


module.exports = function()
{
        var model;
        mongoose = require('./base_model')(mongoose).mongoose;
        try {
                model = mongoose.model('User');
        } catch (err) {
                if (err.name == "MissingSchemaError") {
                        model = createNewUserModel();
                } else {
                        throw err;
                }
        }

        return {
                User : model
        };
};