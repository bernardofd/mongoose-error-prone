module.exports = function(mongoose)
{
	if ( typeof mongoose == 'undefined') {
		mongoose = require('mongoose');

		/*mongoose.connection.on('close', function()
		{
			console.log('Connection to MongoDB closed!');
		});

		mongoose.connection.on('open', function()
		{
			console.log('Opening connection to MongoDB');
		});*/
	}
	
	function connect(mongoose)
	{
		if ( typeof process.env.NODE_TEST == 'undefined') {
			mongoose.connect('mongodb://localhost/app');
		}
		else {
			mongoose.connect('mongodb://localhost/test');
		}
	}

	// Reads connection status and reconnect if it is the case
	if (mongoose.connection.readyState != 1 && mongoose.connection.readyState != 2) {
		connect(mongoose);
	}

	return {
		mongoose : mongoose
	};
};
