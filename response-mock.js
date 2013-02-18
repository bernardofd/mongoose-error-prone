exports.response = {
	instanceVars: {},
	json: function(obj) {
		this.instanceVars.json = obj;
	},
	redirect: function(url) {
	    this.instanceVars.redirect = url;
	},
    render: function(url, obj) {
        this.instanceVars.redirect = url;
        this.instanceVars.json = obj;
    },
    send: function(content) {
    	this.instanceVars.content = content;
    }
};