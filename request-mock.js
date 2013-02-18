exports.request = {
	params: {},
	session: {
		destroy: function () 
		{
			global.loggedin = false;
		},
		_user: {}
	},
	connection: {
		remoteAddress : "127.0.0.1"
	},
	headers: {
		'accept-language': 'pt-BR,pt;q=0.8,en-US;q=0.6,en;q=0.4'
	},
	files: [],
	body: [],
};
