/***********/
/** TODO **/
/*********/
/*  >
 *	>
 *  >
 *  >
 *  > CORRESPONDANCE ENTRE LES DATADEFAULTS ET LES DATATYPES (TYPE DES DATADEFAULTS)
 *  > IDENTIFICATION : CONSULTATION, MODIFICATION, ADMINISTRATION >> EN COURS
 * 	>
 *	>
 *	>
 *	>
 *	> CODES D'ERREUR DANS LES CALLBACK (GESTION PLUS FINE QUE OK, KO) >> Renvoyer l'objet entier sur OK > Quasiment fait
 *	>
 *	>
 *	> CREER DES VUES EN CONSULTATION UNIQUEMENT >> plus ou moins possible sur user.level = 0
 *	>
 *	> Meilleure gestion des callback d'erreur. > oh oui
 *	>
 *	>
 *	>
 *	>
 *	>
 *	> Niveaux d'accès : fonctionnalités, vues, groupes
 *	>
 *	>
 *	>
 *	>
 *	>
 *	>
 *	>
 *	>
 *	> File upload >> Coté client aussi...
 *	> route : maintenance/function non utilisée >> que faire avec ?
 *	>
 *	>
 *	>
 *	>
 *	>
 *	>
 *	> A la création d'une table ajouter une box 'coloration ?' (ou niveaux)
 *	>	> Ajoute un champ spécial dans la table pour spécifier le niveau et la couleur.
 *	>	> Liaison avec une table spécialement créée de type "Niveau" (id, code, label, couleur) > Les couleurs sont basées sur celles dispo dans bs par ex.
 *	>	> A la création de la table un champ niveau est automatiquement ajouté (possibilité de renommer ou non ?) = jointure avec la table niveau spécifiée.
 *	>	> Lors de la récupération des données si la table est de type colorée == ajout dans le <td>
 *	>
 *	> Possibilité de créer des tables personnalisées != getAll >> OK pour le GET sur une table simple (test) -- A approfondir
 *	>	> Un requête custom est spécifiée coté serveur
 *	>	> Une vue est automatiquement ajoutée coté client ?
 *	>	> A la création de la table >> spécifier l'url sur laquelle récupérer les données par ex. (+ autres méthodes) --> tester url ? recuperer champs auto ?
 *	>	> Nouveau type de table = par ex requete = url des données est spécifiée dans le viewObject
 *	>	> La structure de la table doit également être définie à un moment
 *	>
 *	> Contrainte d'unicité lors de l'ajout d'un champ pour une vue ?
 *	>
 *	> File upload générique
 *	>
 *	>
 *	>
 *	> Patchs pour les bases de données > Nouveaux champs, .. > Faciliter les montées de version
 *	>	>> Parent Group et Custom (__OBJECT) + Config de base dans une db
 *	>
 *	> Vérifier les enable/disable
 *	>
 *	>
 *	> Unification des retours {msg : 'OK' | 'KO', obj: [] | 'Err msg'} >> Back + Front
 *	>
 *	>
 *	> Refresh apres insert
 *	> Chargement de la config de bd generique
 *	>
 *	> schema, tables, fields to lowercase ? >> OK
 *	>
 *	>
 *	>
 *	> Bootstrap les écrans de config avec le FW
 *	>	-> Deux type d'écrans à prévoir ; Tableau (standard) / Formulaire (avec différents types d'objets)
 *	>
 *	>
 *	>
 *	>
 *	>
 *	>	Diviser le fichier de conf
 *	> -> Un fichier pour les params généraux (fichier d'entrée)
 *	> -> Des fichiers séparer pour la conf des modules (db, functions custom)
 *	>
 *	>
 *	>
 *	> Field prop -> isNullable
 *	>
 *	> Documentation de l'API !!
 *	>
 *	>
 *	>
 *	>
 *	>
 *	>
 *	>
**/

/**************/
/** JOURNAL **/
/************/
/*	> 16/10/2015
 *		- Changement d'ordre des colonnes ok.
 *		- Découverte d'un "bug" de dblite empechant les inserts sur certaines tables (corrigé voir dblite.node.js) - l.75
 *	> 21/10
 *		- Gestion des dates via un calendrier
 *		- Génération des champs auto-générés nuls via un bouton lors de la modification.
 *	> 29/10
 *		- dblite ne supporte pas des requêtes contenant une clause with
 *		- Avant tout SELECT un regex test est effectué pour contrôler la présence d'un mot clé SELECT dans la requête
 *		- Si dblite ne trouve pas le mot, il bascule automatiquement sur un autre type de requête
 *		- Ajout du mot clé WITH dans la regex, seulement maintenant toute requête commençant par WITH est interprétée comme étant un SELECT
 *		- TODO : Corriger la regex pour différencier les requêtes commençant par WITH
 *	> 27/11
 *		- Regroupement des deux db sur la même connexion dans deux schemas via ATTACH
 *		- TODO : Modifier les requêtes pour utiliser cette connexion. >> OK
 *	> 04/12
 *		- Changer dblite pour mapbox/node-sqlite3 ?
 *	> 09/12
 *		- Owner field on each row.
 *	> 05/01
 *		- Bug à l'ajout d'une colonne foreign >> Résolu ! [20-01-2016]
 *	> 20/01/2016
 *		- Ajout des champs referencedObject et referencedField
 *		- Correction de addColumn, postCreate, postModify
 *		- Edit field data !
 *	> 21/01
 *		- Remove field ok avec le nouveau schema
 *		- Edit field avec une suppression des données intelligente
 *	> 22/01
 *		- Utilisation des headers intégrés à dblite. Suppresion du parametre Object des requetes. >> A tester dans toutes les requetes.
 *			>> Touts les champs renvoyés sont des String attention aux possibles conversions de type...
 *		- Sur error fermeture de la connexion et ouverture d'une nouvelle.
 *	> 26/01
 *		- Affectation d'une nouvelle vue par défaut si la vue par défaut est supprimée.
 *			>> Affectation pour la vue avec min(id) >>> min(pos) ???
 *	> 19/02
 *		- Renommage de toutes les champs de la base STORAGE en minuscule pour éviter les problèmes de noms dans le front (id et valid notamment).
 *	> 14/03
 *		- Sortie des routes custom du code principal (il faut toujours les charger dans le code principal).
 *		- Séparation des libs customs en plusieurs sous-libs pour chaque projet. Le chargement de ces libs est maintenant indépendant.
 *		- Meilleure gestion du CORS
 *	> 15/03
 *		- Gestion du HTTPS
 *		- Possibilité de redirection automatique HTTP >> HTTPS
 *	> 17/03
 *		- Configuration externalisée dans un fichier.
 *	> 24/03
 *		- Séparation des routes et des controleurs du fichier principal.
 *		- Possibilité d'ajouter une condition dans le getAll >> getMany(where_clause)
 *	> 28/03
 *		- Mise en place du clustering.
 *		- Ajout du dev mode en fichier de config
 *	> 01/04
 *		- Modification des noms des tables du schema de conf : __OBJECT >> OBJECT
 *		- Remplacement de dblite par knex (début)
 *	> 03/04
 *		- Dblite to Knex : CRUD OK
 *		- Knex : Modification de dialects/sqlite3/schema/compiler.js [hasTable] qui ne fonctionnait pas en cas d'ATTACH - l.25 : Attention lors de la mise à jour
 *	> 22/05
 *		- Retrait des opérateurs de comparaison abstraits
 *	> 25/09
 *		- Tous le code db (ouverture connexion, gestion user) dans la DbLib
 *
 *
 *
 *
 *
 *
 *
**/

/** Chargement des librairies **/

const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const Auth0Strategy = require('passport-auth0')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const flash = require('connect-flash')
const mustacheExpress = require('mustache-express')
const helmet = require('helmet')
const multer = require('multer')
const useragent = require('express-useragent')
const compress = require('compression')
const config = require('config')
const https = require('https')
const cluster = require('cluster')

/** SERVER **/

const main = _ => {
	const configFile = loadConfigFile()

	if(!configFile.devMode) {
		process.on('uncaughtException', (err) => {
		    console.error(err)
		})
	}

	if (configFile.clusteringEnabled) {
		if (cluster.isMaster) {
			for(let i = 0; i < configFile.maxUsedCpus; i++) {
				cluster.fork()
			}

			cluster.on('online', (worker) => {
				console.log('Worker ' + worker.process.pid + ' is online.');
			});

			cluster.on('exit', (worker, code, signal) => {
				cluster.fork()
			});
		}
		else {
			startServer(configFile)
		}
	}
	else {
		startServer(configFile)
	}
}

/** SERVER CONFIGURATION **/

const startServer = (configFile) => {
	const app = express()
	const releases = multer({dest: __dirname + '/uploads/releases'})

	const DbLib = require(configFile.databaseLib)


	DbLib.openDb(configFile.databaseSystem, config)
	app.use(helmet())
	app.use(compress())
	app.use(express.static(__dirname + '/public', {maxAge: 86400}))
	app.use(bodyParser.json({limit: '5mb'}))
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(cookieParser())
	app.use(session({ secret: 'secret', resave: false, saveUninitialized: true, cookie: {}}))
	app.use(flash())
	app.use(passport.initialize())
	app.use(passport.session())
	app.use((req, res, next) => {
	    res.setHeader('Access-Control-Allow-Origin', configFile.allowedRemoteHosts.join(' '))
	    res.setHeader('Access-Control-Allow-Methods', configFile.allowedRemoteMethods.join(', '))
	    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
	    res.setHeader('Access-Control-Allow-Credentials', true)
    	next()
	})

	app.engine('mst', mustacheExpress())
	app.set('views', 'views')
	app.set('view engine', 'mst')
	// Http to https redirection
	if (configFile.httpsPort !== 0) {
		app.use(requireHttps(configFile.httpsPort));
		const sCert = fs.readFileSync('./certs/' + configFile.certFile)
		const sKey = fs.readFileSync('./certs/' + configFile.keyFile)
		https.createServer({cert: sCert, key: sKey}, app).listen(configFile.httpsPort)
	}

	const server = app.listen(configFile.httpPort, function () {
		console.log('Server listening on http://' + configFile.serverIp + ':' + configFile.httpPort)
		configFile.httpsPort != 0 && console.log('Server listening on https://' + configFile.serverIp + ':' + configFile.httpsPort)
	})

	if (configFile.authenticationMethod === 'auth0') {
		const strategy = new Auth0Strategy({
			domain: process.env.AUTH0_DOMAIN,
			clientID: process.env.AUTH0_CLIENT_ID,
			clientSecret: process.env.AUTH0_CLIENT_SECRET,
			callbackURL: process.env.AUTH0_CALLBACK_URL || 'http://' + configFile.serverIp + ':' + configFile.httpPort + '/callback'
		},
		(accessToken, refreshToken, extraParams, profile, done) => done(null, profile))
	}
	else {
		var strategy = new LocalStrategy(
			(username, password, done) => DbLib.authenticate(username, password, done))
	}

	passport.use(strategy)

	passport.serializeUser((user, done) => {
		done(null, user.id_user);
	})
	passport.deserializeUser((id, done) => {
		DbLib.deserializeUser(id, done);
	})

	/** ROUTES **/

	loadCustomRoutes(app, configFile)
	app.use('/api', require('./routes/main'))
	// require('./routes/main.js')({app: app, passport: passport, dblib: DbLib, conf: configFile, storage: releases})
}

const loadConfigFile = _ => {
	let configFile = {
		appName : config.get('App.Name'),
		serverIp : config.get('App.Host'),
		httpPort : config.get('App.HttpPort'),
		devMode : config.has('App.Mode') && (config.get('App.Mode') == 'DEV'),
		databaseLib : require('path').join(__dirname, 'libs', 'db', config.get('App.DatabaseDriver') + '.js'),
		allowedRemoteHosts : config.get('CORS.AllowedHosts'),
		allowedRemoteMethods : config.get('CORS.AllowedMethods'),
		databaseSystem : config.get('Database.Client'),
		customRoutes : config.has('CustomRoutes') ? config.get('CustomRoutes') : [],
		httpsPort : config.has('Https.Port') && config.get('Https.Port') !== '' ? config.get('Https.Port') : 0,
		certFile: null,
		keyFile: null,
		clusteringEnabled: false,
		maxUsedCpus: 0,
		authenticationMethod: 'standard'
	}

	if (configFile.httpsPort !== 0) {
		configFile.certFile = config.get('Https.CertFile')
		configFile.keyFile = config.get('Https.KeyFile')
	}
	configFile.clusteringEnabled = config.has('Clustering.Enabled') && config.get('Clustering.Enabled') !== '' ? config.get('Clustering.Enabled') : false
	configFile.maxUsedCpus = configFile.clusteringEnabled && config.has('Clustering.MaxCpus') && config.get('Clustering.MaxCpus') !== '' ? config.get('Clustering.MaxCpus') : require('os').cpus().length
	configFile.authenticationMethod = config.has('Authentication') ? config.get('Authentication') : 'standard'

	return configFile
}

const validateConfigFile = _ => {

}

// Custom functions and routes definition
const loadCustomRoutes = (app, configFile) => {
	configFile.customRoutes.forEach((route) => {
		require('./routes/custom/' + route)(app)
	})
}

const requireHttps = (httpsPort) => {
	return (req, res, next) => {
		if(!req.secure) {
			console.log('https://' + req.headers.host.split(':')[0] + ':' + httpsPort + req.url);
			return res.redirect('https://' + req.headers.host.split(':')[0] + ':' + httpsPort + req.url)
		}
		else {
			console.log('next')
			next()
		}
	}
}

const _throw = (m) => {
	throw m
}

main() // Entry point
