exports.create = function(req, res) {	
	var User = require('./user_model')().User;
	var user_json = req.body.user_json;
	user_json.register_date = Math.round((new Date()).getTime() / 1000);
	// Primeiro cadastro - conta FREE
	user_json.upgrade_lvl = 0;
	user_json.current_storage = 0;
	user_json.extra_storage = 0;
	/*
	 * Primeiro checa se o e-mail enviado pelo usuário é um endereço de e-mail válido
	 */

	if (validateEmail(user_json.email)) {
		/**
		 * Consulta se existe um usuário com o mesmo login no banco de dados
		 **/

		User.find({
			login : user_json.email
		}, function(error, result) {
			if (error) {
				res.json({
					error : 'Erro ao verificar usuário', //@gettext@
					servMsg : 'Erro do MongoDB ao verificar se o usuário cadastrado já existe (User.create())'
				});
			} else {
				if (result.length === 0) {

					// gera o md5 da senha
					var crypto = require('crypto');
					var md5sum = crypto.createHash('md5');
					var usermail_pass = user_json.password;
					var senha = user_json.password;

					md5sum.update(senha + global._SALT);
					senha = md5sum.digest('hex');
					user_json.password = senha;
					user_json.language = "en_US";
					user_json.user_storage = 0;

					// Pega o IP do usuário
					var ip = (req.headers['x-forwarded-for'] != undefined) ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;

					var novo_user = new User(user_json);
					console.log(novo_user);
					novo_user.save(function(err, user) {
						if (err) {
							console.log(err);
							res.json({
								error : 'Não foi possível salvar o usuário no servidor.', //@gettext@
								servMsg : 'Erro do MongoDB ao salvar um novo usuário: ' + err
							});
						} else {
							res.render('mailing/new_user', {
								layout : false,
								user : user,
								usermail_pass : usermail_pass
							}, function(n, str) {
								sendMail(user.email, str);
								// Manda e-mail para o EAD contendo apenas nome, e-mail, telefone e IP do Usuário
								sendAdminMail(user_json, ip);
							});

							res.json({
								_id : user._id
							});
						}
					});
				} else {
					var resp = {
						error : "Já existe um usuário cadastrado com o e-mail '" + user_json.email + "'", //@gettext@
						servMsg : "Um endereço de e-mail já existente foi inserido no método User.create()"
					};
					res.json(resp);
				}
			}
		});
	} else {
		res.json({
			error : "E-mail inválido", //@gettext@
			servMsg : "Um endereço de e-mail inválido foi inserido no método User.create()"
		});
	}
};

exports.recover = function(req, res) {
	var crypto = require('crypto');
	var md5sum = crypto.createHash('md5');
	var user = {};

	// verifica se o usuário ja'está logado
	if ( typeof req.session._user != 'undefined') {
		res.redirect('/index.html');
		return;
	}

	if (req.method == 'POST' && typeof req.body.login != 'undefined') {
		if ("" === req.body.login || "nome@examplo.com.br" === req.body.login) {
			res.render('user/recover', {
				error : {
					message : 'Preencha todos os campos.'
				},
				login : req.body.login
			});
		} else {

			var User = require('./user_model')().User;

			//@comment
			// busca o usuário com o e-mail enviado

			User.find({
				email : req.body.login
			}, function(error, result) {
				if (error) {
					res.render('user/recover', {
						error : 'Erro ao recuperar informações de usuário.', //@gettext@
						servMsg : 'Erro do MongoDB ao recuperar User'
					});
					console.log('Erro ao tentar buscar usuário: ' + error);
				} else if (result.length === 0) {

					//@comment
					// usuário não foi encontrado no banco de dados

					res.render('user/recover', {
						error : {
							message : 'Desculpe, mas o seu e-mail não foi encontrado em nosso banco de dados.'
						}
					});
				} else {

					result = result[0];
					user = result;

					var uid = result._id;
					var senha = RandPasswd(result._id);
					var senhaCrypto = Md5Passwd(senha);
					user.password = senhaCrypto;

					//@comment
					// Atualiza senha do usuário no servidor

					User.update({
						_id : uid
					}, {
						password : senhaCrypto
					}, {
						multi : false
					}, function(err) {
						if (err) {

							// @log
							console.log('Erro ao tentar atualizar a senha do usuario: ' + err + 'uid: ' + uid);

							var resp = {
								_id : uid,
								error : 'Erro ao tentar atualizar a senha do usuario: ' + err + 'uid: ' + uid //@gettext@
							};
							res.json(resp);
						} else {

							//@comment
							//Envia e-mail com a nova senha gerado para o usuário

							res.render('mailing/recover.ejs', {
								layout : false,
								user : user,
								usermail_pass : senha
							}, function(n, str) {
								sendMail(user.email, str);
								res.render('user/recover', {
									accept : {
										message : 'Seus dados de acesso foram enviados para o e-mail informado. <br />Clique <a href="/user/login" style="color:#333"> aqui </a>para ir a página de login.'
									}
								});
							});
						}
					});
				}
			});
		}
	} else {
		res.render('user/recover');
	}

	function RandPasswd(str) {
		var ascii = [[64, 90], [97, 122]];
		var i = Math.floor(Math.random() * ascii.length);
		var charCode = String.fromCharCode(Math.floor(Math.random() * (ascii[i][1] - ascii[i][0])) + ascii[i][0]);

		var passwd = str + charCode;

		passwd = Md5Passwd(passwd).substring(0, 5) + charCode;

		return passwd;
	}

	function Md5Passwd(str) {
		var strReturned = '';
		var crypto = require('crypto');
		var md5sum = crypto.createHash('md5');
		md5sum.update(str + global._SALT);
		strReturned = md5sum.digest('hex');

		return strReturned;
	}

};

exports.login = function(req, res) {
	// verifica se o usuário ja'está logado
	if ( typeof req.session._user != 'undefined') {
		res.redirect('/index.html');
		return;
	}

	if (req.method == 'POST' && typeof req.body.login != 'undefined' && typeof req.body.password != 'undefined') {

		if ("" === req.body.login || "" === req.body.password) {
			res.render('user/login', {
				error : {
					message : 'Preencha todos os campos.'
				},
				login : req.body.login
			});
		} else {
			var senha = req.body.password;
			var User = require('./user_model')().User;
			// busca o usuário
			User.verifyCredentials(req.body.login, senha, function(error, result) {
				if (error) {
					if (typeof req.body["return"] != 'undefined' && req.body["return"] == "1") {
						//res.json({error : error.error});
						res.json(error);
					} else {
							res.render('user/login', {error: {message: error.error}});
					}
				} else {
					result = result[0];
					// Fallback para usuários antes da versão com múltiplos planos
					if (typeof result.upgrade_lvl === 'undefined' || typeof result.extra_storage === 'undefined') {
						result.upgrade_lvl = 0;
						result.extra_storage = 0;
						User.update({
							_id : result._id
						}, {
							upgrade_lvl : 0,
							extra_storage : 0
						}, function (err) {
							if (err) {
								console.log("Erro Fallback Upgrade_LVL: " + err);
							}
						});
					}
					req.session._user = {
						_id : result._id,
						email : result.email,
						last : result.last,
						login : result.login,
						language : result.language,
						name : result.name,
						upgrade_lvl : result.upgrade_lvl,
						current_storage : result.current_storage,
						total_storage : 1000 // Whatever
					};
					if ( typeof req.body["return"] != 'undefined' && req.body["return"] == "1") {
						res.json(req.session._user);
					} else {
						res.redirect('/index.html');
					}
				}
			});
		}
	} else {
		res.render('user/login');
	}
};

exports.changePasswd = function(request, response) {
	var crypto = require('crypto');
	var User = require('./user_model')().User;
	var md5sum_old = crypto.createHash('md5');
	var md5sum_new = crypto.createHash('md5');
    
	// verifica se o usuário já está logado
	if ( typeof request.session._user != 'undefined') {
		// Faz o hash MD5 das senhas
		oldPasswd = request.body.oldPasswd;
		md5sum_old.update(oldPasswd + global._SALT);
		oldPasswd = md5sum_old.digest('hex');

		newPasswd = request.body.newPasswd;
		md5sum_new.update(newPasswd + global._SALT);
		newPasswd = md5sum_new.digest('hex');

		//Verifica se a senha antiga bate com a informação do usuário
		User.find({
			_id : request.session._user._id
		}, function(error, result) {
			if (error) {
				// Log Error
				console.log("Erro ao buscar as informações do usuário %s", request.session._user.login);
				response.json({
					error : 'Erro ao atualizar os dados.', //@gettext@
					servMsg : 'Erro do MongoDB ao atualizar dados do Usuário (User Change Passwd)'
				});
			} else {
				if (result.length === 0) {
					request.session._user = undefined;
					response.render('user/login', {
						error : 'Usuário e/ou senha inválidos.' //@gettext@
					});
				} else {
					var currentUser = result[0];
					if (oldPasswd == currentUser.password) {
						// Atualiza a senha do usuário no banco
						User.update({
							_id : currentUser._id
						}, {
							password : newPasswd
						}, {
							multi : false
						}, function(error) {
							if (error) {
								// Log Error
								console.log("Erro ao atualizar senha do usuário %s", request.session._user.login);
								response.json({
									error : 'Erro ao atualizar os dados.', //@gettext@
									servMsg : 'Erro do MongoDB ao atualizar dados do Usuário (User Change Passwd)'
								});
							} else {
								// Tudo ok!
								response.redirect('/index.html');
							}
						});
					} else {
						response.json({
							error : "Senha atual inválida!", //@gettext@
						});
					}
				}
			}
		});
	} else {
		response.redirect('/user/login');
		return;
	}
};

exports.logged = function(req, res) {
	if ( typeof req.session._user == 'undefined') {
		res.json({
			error : 'Usuário deslogado' //@gettext@
		});}
	else {
		var User = require('./user_model')().User;
		User.findById(req.session._user._id, function (err, result) {
			if (err) {
				res.json({
					ok : 0,
					error : "Erro ao buscar usuário!", //@gettext@
					servMsg : "User.findById(): " + err
				})
			} else if (result) {
				res.json({
					_id : result._id,
					email : result.email,
					last : result.last,
					login : result.login,
					language : result.language,
					name : result.name,
					upgrade_lvl : result.upgrade_lvl,
					current_storage : result.current_storage,
					total_storage : 1000, // Whatever
					telefone: result.telefone
				});
			} else {
				res.json({
					ok : 0,
					error : "Usuário Inexistente!", //@gettext@
				})
			}
		});
	}
};

exports.logout = function(req, res) {
	req.session.destroy();
	res.redirect('/');
};

exports.changeLang = function(request, response) {"use strict";
	var User = require('./user_model')().User;
	// verifica se o usuário já está logado
	if ( typeof request.session._user != 'undefined') {
		User.find({
			_id : request.session._user._id
		}, function(error, result) {
			if (error) {
				console.log("Erro do MongoDB em User.find(): " + error);
				response.json({
					error : 'Erro ao recuperar informações de usuário.', //@gettext@
					servMsg : "Erro do MongoDB em User.find(): " + error
				});
			} else {
				if (result.length === 0) {
					request.session._user = undefined;
					response.render('user/login', {
						error : 'Usuário e/ou senha inválidos.' //@gettext@
					});
				} else {
					User.update({
						_id : request.session._user._id
					}, {
						language : request.body.lang
					}, {
						multi : false
					}, function(error) {
						if (error) {
							// Log Error
							console.log("Erro do MongoDB em User.update(): " + error);
							response.json({
								error : 'Erro ao atualizar as informações do usuário.', //@gettext@
								servMsg : "Erro do MongoDB em User.update(): " + error
							});
						} else {
						    /* TODO*/
						    request.session._user.language = request.body.lang;
							response.json({
								message: request.body.lang
							});
						}
					});
				}
			}
		});
	} else {
		response.redirect('/user/login');
	}
}

exports.update = function(request, response)
{
	if (typeof request.session._user == 'undefined') {
		response.redirect('/user/login');
		return null;
	}

	var User = require('./user_model')().User;
	var dados = request.body;
	var valid_keys = ['name', 'email', 'telefone'];
	var user_data = {}, empty = true;
	for (var i in valid_keys) {
		if (typeof dados[valid_keys[i]] != 'undefined') {
			// se tem erro, pára e pula para o erro
			if (
				(dados[valid_keys[i]] == "") ||
				(valid_keys[i] == 'email' && !validateEmail(dados[valid_keys[i]]))
			) { // valida se está vazio e se for email, se está correto
				empty = true;
				break;
			}
			empty = false;
			user_data[valid_keys[i]] = dados[valid_keys[i]];
		}
	}

	if (!empty) {
		console.log(user_data);
		User.update({
			_id: request.session._user._id
		}, 
		user_data, 
		function(error) {
			if (error) {
				response.json({ok: 0, error: "Dados do usuário inválidos!"});
			} else {
				response.json({ok: 1});
			}
		});
	} else {
		response.json({ok: 0, error: "Dados do usuário inválidos!"});
	}
};


/**********************************
 * Send user mail
 *
 **/
function sendMail(_to, msg) {
	console.log("Would send a new user an E-mail, but no!")
}

/**
 * Send Admin Mail
 **/

function sendAdminMail(user_json, ip) {
	console.log("Would send us a mail containing basic info of the user, but no!")
}

/**
 * validateEmail retorna true se o endereço de e-mail parece ser um e-mail válido
 */

function validateEmail(email) {
	/*
	 * A função validateEmail retorna true se as condições a seguir forem satisfeitas:
	 *  1) Deve existir pelo menos um '@' e um '.'
	 *  2) O último '@' deve estar antes do último '.'
	 *  3) O usuário deve ter algo escrito antes do último '@'
	 *  4) Não deve existir arrobas duplas ('@@')
	 *  5) Deve existir pelo menos dois caracteres após o último '.'
	 *  6) Devem existir pelo menos 3 caracteres antes do último '.'
	 *  Código adaptado de http://stackoverflow.com/a/5166806
	 */
	var lastAtPos = email.lastIndexOf('@');
	var lastDotPos = email.lastIndexOf('.');

	return (lastAtPos > 0 && lastAtPos < lastDotPos && email.indexOf('@@') == -1 && (email.length - lastDotPos) >= 2 && lastDotPos > 2);
}
