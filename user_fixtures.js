var id = require('pow-mongodb-fixtures').createObjectId;

exports.user = [{
    "_id" : id("4fb690fc994338e1dfcb292e"),
    "email" : "eduardoad@uaiti.com.br",
    "last" : id("50217565da7e4d6c3f00089c"),
    "login" : "eduardoad@uaiti.com.br",
    "name" : "Eduardo Altibio Dutra",
    "telefone" : "(031) 2512-4330",
    "password" : "645c9d6e956246fd1d9f217ef7c55f95", // 123456
    "language" : "pt_BR",
    "upgrade_lvl" : "1",
    "current_storage" : 100,
    "extra_storage" : 1048576 // + 1 GB
}, {
    "_id" : id("9753812fead234ab3ce8a0a1"),
    "email" : "cs@uaiti.com.br",
    "login" : "cs@uaiti.com.br",
    "name" : "Counter Striker",
    "telefone" : "(031) xxxx-xxxx",
    "password" : "645c9d6e956246fd1d9f217ef7c55f95",
    "last" : id("502d445fc691da6012345678"),
    "language" : "pt_BR",
    "upgrade_lvl" : "0",
    "current_storage" : 204700
}, {
    "_id" : id("502d4716541884b212000002"),
    "email" : "foo@uaiti.com.br",
    "login" : "foo@uaiti.com.br",
    "name" : "Fulano",
    "telefone" : "(031) xxxx-xxxx",
    "password" : "645c9d6e956246fd1d9f217ef7c55f95",
    "language" : "pt_BR",
    "current_storage" : 10354,
    "upgrade_lvl" : "1"
}, { /** usuário sem cliente relacionado */
    "_id" : id("902d4716541884b2120000bd"),
    "email" : "foo2@uaiti.com.br",
    "login" : "foo2@uaiti.com.br",
    "name" : "Fulano Segundo",
    "telefone" : "(031) xxxx-xxxx",
    "password" : "645c9d6e956246fd1d9f217ef7c55f95", // 123456
    "language" : "pt_BR",
    "current_storage" : 100,
    "upgrade_lvl" : "1"
},{ /** usuário com cliente e pagamentos */
    "_id" : id("994338e1dfcb292e4fb690fc"),
    "email" : "userclipay@uaiti.com.br",
    "login" : "userclipay@uaiti.com.br",
    "name" : "Usuario Com Cliente E Pagamentos",
    "telefone" : "(031) xxxx-xxxx",
    "password" : "645c9d6e956246fd1d9f217ef7c55f95", // 123456
    "language" : "pt_BR",
    "current_storage" : 100,
    "upgrade_lvl" : "0"
}]; 