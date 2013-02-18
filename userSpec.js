/**
 * Automated test spec for the user object
 *
 * @author Bernardo Figuerêdo Domingues
 */

//var _EADBUILDER = require('../../../../config/config').config;
var SandboxedModule = require('sandboxed-module');

// mocks
var request = require('./request-mock.js').request;
var response = require('./response-mock.js').response;

// Environment is for testing
process.env.NODE_TEST = true;

// Connects to MongoDB
console.log("Fixtures Connect");
var fixtures = require('pow-mongodb-fixtures').connect('test');

var user = require('./user.js');
// Wraps the user route into a sandbox and provides any mocks necessary
var user = SandboxedModule.require('./user.js', {});

describe("Route User", function() {

	describe("User Logout", function() {
		it('should destroy the user session', function() {
			//Precondition
			spyOn(request.session, "destroy").andCallThrough();
			global.loggedin = true;
			//Execution
			user.logout(request, response);
			//Expectation
			expect(request.session.destroy).toHaveBeenCalled();
			expect(response.instanceVars.redirect).toEqual('/');
			expect(global.loggedin).toEqual(false);
		});
	});

	describe("User Login", function() {

		beforeEach(function (done) {
			response.instanceVars = {};
			request.method = 'POST';
			request.session._user = undefined;
			fixtures.clearAndLoad('./user_fixtures.js', function(err) {
				if (err) {
					console.log("Error fixture.clearAndLoad(): " + err);
				}
				done();
			});
		});

		it("should redirect the user to 'index.html' if he's already logged in", function() {
			//Precondition
			request.session._user = {
				_id : "935a12987351297853"
			};
			//Execution
			user.login(request, response);
			//Expectation
			expect(response.instanceVars.redirect).toEqual('/index.html');
		});

		it("should return to the login screen if any information is missing", function() {
			//Precondition
			request.body = {
				login : "",
				password : ""
			};
			spyOn(response, "render");
			//Execution
			user.login(request, response);
			//Expectation
			expect(response.render).toHaveBeenCalledWith('user/login', {
				error : {
					message : "Preencha todos os campos."
				},
				login : ""
			});
		});

		it("should return 'Login/Password not found' if the user inputs an invalid e-mail", function (done) {
			//Precondition
			request.body = {
				login : "wrong@email.com",
				password : "asdasd"
			};
			spyOn(response, "render").andCallThrough();

			//Execution
			user.login(request, response);

			waitsFor(function() {
				return ( typeof response.instanceVars.json != 'undefined');
			}, "User.find()", 1000);

			//Expectation
			runs(function() {
				expect(response.render).toHaveBeenCalledWith('user/login', {
					error : {
						message : "Invalid Login/Password information."
					},
				});
				done();
			});
		});

		it("should return 'Login/Password not found' if the user inputs an invalid password", function (done) {
			//Precondition
			request.body = {
				login : "eduardoad@uaiti.com.br",
				password : "asdasd"
			};
			spyOn(response, "render").andCallThrough();

			//Execution
			user.login(request, response);

			waitsFor(function() {
				return ( typeof response.instanceVars.json != 'undefined');
			}, "User.find()", 1000);

			//Expectation
			runs(function() {
				expect(response.render).toHaveBeenCalledWith('user/login', {
					error : {
						message : "Invalid Login/Password information."
					},
				});
				done();
			});
		});

		it("should login if the user inputs the correct information", function (done) {
			//Precondition
			request.body = {
				login : "eduardoad@uaiti.com.br",
				password : "123456"
			};

			//Execution
			user.login(request, response);

			waitsFor(function() {
				return ( typeof response.instanceVars.redirect != 'undefined');
			}, "User.find()", 1000);

			//Expectation
			runs(function() {
				expect(response.instanceVars.redirect).toEqual('/index.html');
				expect(request.session._user._id.toHexString()).toEqual("4fb690fc994338e1dfcb292e");
				done();
			});
		});

		it("should return user data if the client application pass the 'return' field", function (done) {
			request.body = {
				login: "eduardoad@uaiti.com.br",
				password: "123456",
				return: "1"
			};

			user.login(request, response);

			waitsFor(function() {
				return (typeof response.instanceVars.json != 'undefined');
			}, "User.find()", 1000);

			runs(function() {
				expect(response.instanceVars.json.email).toEqual("eduardoad@uaiti.com.br");
				done();
			});
		});
	});

	describe("Password Change", function() {

		beforeEach(function(done) {
			response.instanceVars = {};
			request.session._user = {
				_id : "4fb690fc994338e1dfcb292e",
				email : "eduardoad@uaiti.com.br",
				last : "50217565da7e4d6c3f00089c",
				login : "eduardoad@uaiti.com.br",
				name : "Eduardo Altibio Dutra",
			};
			fixtures.clearAndLoad('./user_fixtures.js', function(err) {
				if (err) {
					console.log("Error fixture.clearAndLoad(): " + err);
				}
				done();
			});
		});

		it("should change the user's password if the user provided the right information", function() {
			//Precondition
			request.body = {
				oldPasswd : "123456",
				newPasswd : "qwerty"
			}

			//Execution
			user.changePasswd(request, response);
			waitsFor(function() {
				return ( typeof response.instanceVars.redirect != 'undefined');
			}, "User.find() and User.update()", 1000);

			//Expectation
			runs(function() {
				expect(response.instanceVars.redirect).toEqual("/index.html");
			});
		});

		it("should redirect to 'user/login' if the user isn't logged on", function() {
			//Precondition
			request.body = {
				oldPasswd : "whatever",
				newPasswd : "qwerty"
			}
			request.session._user = undefined;

			//Execution
			user.changePasswd(request, response);

			//Expectation
			expect(response.instanceVars.redirect).toEqual('/user/login');
		});

		it("should return JSON error if the user doesn't supply the correct password", function() {
			//Precondition
			request.body = {
				oldPasswd : "wrongPasswd",
				newPasswd : "qwerty"
			}

			//Execution
			user.changePasswd(request, response);
			waitsFor(function() {
				return ( typeof response.instanceVars.json != 'undefined');
			}, "User.find()", 1000);

			//Expectation
			runs(function () {
				expect(response.instanceVars.json).toEqual({
					error : "Senha atual inválida!",
				});
			});
		});
		
		it("should return error JSON if the user data in the session is invalid (not in the DB)", function() {
			//Precondition
			request.session._user._id = '4fb690fc994338e1dfc00000';
			request.body = {
				oldPasswd : "wrongPasswd",
				newPasswd : "qwerty"
			}
			//Execution
			user.changePasswd(request, response);
			waitsFor(function() {
				return ( typeof response.instanceVars.json != 'undefined');
			}, "User.find()", 1000);
			//Expectation
			runs(function() {
				expect(response.instanceVars.json).toEqual({
					error : 'Usuário e/ou senha inválidos.'
				});
			});
		});
	});

	describe("User Create New", function() {

		beforeEach(function(done) {
			fixtures.clearAndLoad('./user_fixtures.js', function(err) {
				if (err) {
					console.log("Error fixture.clearAndLoad(): " + err);
				}
				done();
			});
			response.instanceVars = {};
			request.body = {};
		});

		it("should return error if the e-mail address entered by the user is not a valid e-mail address", function() {
			// Pre-condition
			request.body.user_json = {
				email : "no@email"
			};

			//Execution
			user.create(request, response);
			waitsFor(function() {
				return (response.instanceVars.json != undefined);
			}, "shouldn't timeout", 500);

			//Expectation
			runs(function() {
				expect(response.instanceVars.json).toEqual({
					error : "E-mail inválido",
					servMsg : "Um endereço de e-mail inválido foi inserido no método User.create()"
				});
			});
		});

		it("should return error if the e-mail address entered by the user is already on the DB", function() {
			// Pre-condition
			request.body.user_json = {
				email : "eduardoad@uaiti.com.br"
			};

			//Execution
			user.create(request, response);
			waitsFor(function() {
				return (response.instanceVars.json != undefined);
			}, "User.find()", 500);

			//Expectation
			runs(function() {
				expect(response.instanceVars.json).toEqual({
					error : "Já existe um usuário cadastrado com o e-mail 'eduardoad@uaiti.com.br'",
					servMsg : "Um endereço de e-mail já existente foi inserido no método User.create()"
				});
			});
		});

		it("should create a new user if his sign up process was successful and send him an email with his data", function() {
			// Pre-condition
			request.body.user_json = {
				login : "newuser@email.com",
				email : "newuser@email.com",
				name : "New User",
				telefone : "3555-3555",
				password : "password",
			};
			request.headers['accept-language'] = "en_US;q=0.4,en";
			spyOn(response, "render");
			
			// Execution
			user.create(request, response);
			waitsFor(function() {
				return (response.instanceVars.json != undefined);
			}, "User.find() or User.save()", 1000);

			//Expectation
			runs(function() {
				expect(response.instanceVars.json._id).toBeDefined();
				expect(response.render).toHaveBeenCalledWith('mailing/new_user',jasmine.any(Object),jasmine.any(Function));
			});
		});
	});
	
	describe("User Language Change", function() {
		beforeEach(function(done) {
			fixtures.clearAllAndLoad('./user_fixtures.js', function(err) {
				if (err) {
					console.log("Error fixture.clearAllAndLoad(): " + err);
				}
				done();
			});
			response.instanceVars = {};
		});
		
		it("should redirect to 'user/login' if the user isn't logged on", function() {
			//Precondition
			request.session._user = undefined;
			request.body = {
				lang: "en_US"
			};

			//Execution
			user.changeLang(request, response);

			//Expectation
			expect(response.instanceVars.redirect).toEqual('/user/login');
		});
		
		it("should change the language of the user with the one specified", function () {
			//Precondition
			request.body = {
				lang: "en_US"
			};
			request.session._user = {
				_id : "4fb690fc994338e1dfcb292e"
			};
			
			//Execution
			user.changeLang(request,response);
			waitsFor(function() {
				return ( typeof response.instanceVars.json != 'undefined');
			}, "User.changeLang()", 1000);
			//Expectation
			runs(function () {
				expect(response.instanceVars.json).toEqual({
					message: "en_US"
				});
			});
		});
	});

	describe("User Update", function() {
		beforeEach(function(done) {
			//global.loggedin = true;

			response.instanceVars = {};
			request.body = {};

			fixtures.clearAndLoad('./user_fixtures.js', function(err) {
				if (err) {
					console.log("Error fixture.clearAndLoad(): " + err);
				}
				done();
			});
		});

		it("should redirect to 'user/login' if the user isn't logged on", function() {
			//Precondition
			request.session._user = undefined;

			//Execution
			user.update(request, response);
			waitsFor(function() {
				return (typeof response.instanceVars.redirect != 'undefined');
			}, 'User.update', 1000);

			runs(function() {
				//Expectation
				expect(response.instanceVars.redirect).toEqual('/user/login');
			});
		});

		it('should update user when new data is passed', function() {
			//Precondition
			request.session._user = {
				"_id": "9753812fead234ab3ce8a0a1"
			};
			request.body = {
				"name": "Updated User",
				"telefone": "(31) 9655-6229"
			};
			user.update(request, response);

			waitsFor(function() {

				return (typeof response.instanceVars.json != 'undefined');
			}, "User.update", 1000);

			runs(function() {
				expect(response.instanceVars.json.ok).toEqual(1);
			});
		});

		it('should return error if new data is invalid', function() {
			//Precondition
			request.session._user = {
				"_id": "9753812fead234ab3ce8a0a1"
			};
			request.body = {
				"name": "",
				"email": "teste"
			};
			user.update(request, response);

			waitsFor(function() {
				return (typeof response.instanceVars.json != 'undefined');
			}, 'User.update', 1000);

			runs(function() {
				console.log(response.instanceVars);
				expect(response.instanceVars.json.ok).toEqual(0);
				expect(response.instanceVars.json.error).toEqual('Dados do usuário inválidos!');
			});
		});
	});

	describe("Password Recovery", function() {
		var body = {};
		beforeEach(function (done) {
			response.instanceVars = {};
			request.method = 'POST';
			request.body = {
				login : 'eduardoad@uaiti.com.br'
			};
			request.session = {};

			global.loggedin = false;

			fixtures.clearAndLoad('./user_fixtures.js', function(err) {
				if (err) {
					console.log("Error fixture.clearAndLoad(): " + err);
				}
				done();
			});
		});

		it('Deveria redirecionar o usuário para tela inicial caso o mesmo esteja logado', function() {
			global.loggedin = true;
			request.session = {
				_user : {}
			};

			user.recover(request, response);

			waitsFor(function() {
				return ( typeof response.instanceVars.redirect != 'undefined');
			}, "Erro timeout", 1000);

			runs(function() {
				expect(response.instanceVars.redirect).toEqual('/index.html');
			});
		});

		it('Deveria retornar uma mensagem de erro ao usário caso o e-mail não seja informado', function() {
			request.body = {
				login : ''
			};
			user.recover(request, response);

			waitsFor(function() {
				//console.log('instanceVars: ');
				//console.log(response.instanceVars.json.error);
				return ( typeof response.instanceVars.json.error != 'undefined');
			}, "Erro timeout", 1000);

			runs(function() {
				expect(response.instanceVars.json.error).not.toEqual(undefined);
			});
		});

		it('Deveria retornar uma mensagem de erro ao usário caso seu e-mail não esteja cadastrado', function() {
			//request.body = { login: 'eduardoad@uaiti.com.br' };
			request.body = {
				login : 'fake@uaiti.com.br'
			};
			user.recover(request, response);

			waitsFor(function() {
				//console.log('instanceVars: ');
				//console.log(response.instanceVars);
				if (!response.instanceVars.json) {
					return false;
				}

				return ( typeof response.instanceVars.json != 'undefined');
			}, "Erro timeout", 1000);

			runs(function() {
				expect(response.instanceVars.json.error).not.toEqual(undefined);
			});
		});

		it('Deveria verificar se o usuário está cadastrado retornando um object com os seus dados', function() {
			request.body = {
				login : 'eduardoad@uaiti.com.br'
			};
			//request.body = { login: 'fake@uaiti.com.br' };
			user.recover(request, response);

			waitsFor(function() {
				//console.log('instanceVars: ');
				//console.log(response.instanceVars);

				return ( typeof response.instanceVars.json != 'undefined');
			}, "Erro timeout", 1000);

			runs(function() {
				expect(response.instanceVars.json.user).not.toEqual(undefined);
			});
		});

		it('Deveria retornar a rota com o template de e-mail', function() {

			user.recover(request, response);

			waitsFor(function() {
				//console.log('instanceVars: ');
				//console.log(response.instanceVars);

				return ( typeof response.instanceVars.redirect != 'undefined');
			}, "Erro timeout", 1000);

			runs(function() {
				expect(response.instanceVars.redirect).toEqual('mailing/recover.ejs');
			});
		});

		it('Deveria logar com um usuário que solicitou redefinição de senha', function() {
			user.recover(request, response);

			waitsFor(function() {
				return ( typeof response.instanceVars.redirect != 'undefined');
			}, "Erro timeout", 1000);

			runs(function() {
				var passwd = response.instanceVars.json.usermail_pass;
				request.method = 'POST';
				request.session._user = undefined;
				request.body = {
					login : "eduardoad@uaiti.com.br",
					password : passwd
				};
				response.instanceVars = {};

				user.login(request, response);
			});

			waitsFor(function() {
				return ( typeof response.instanceVars.redirect != 'undefined');
			}, "User.find()", 1000);

			//Expectation
			runs(function() {
				expect(response.instanceVars.redirect).toEqual('/index.html');
				expect(request.session._user._id.toHexString()).toEqual("4fb690fc994338e1dfcb292e");
			});
		});
	});
});

describe('Exit tests', function() {
	it("Closing connections", function (done) {		
		var mongoose = require('./base_model')(mongoose).mongoose;
		mongoose.connection.close(function() {
			// Fecha a conexão do fixture
			console.log("Mongoose closed")
			fixtures.close(function () {
				console.log("Fixtures closed");
				done();
			});
		});
	});
});
