// Manuel d'utilisation AI721_ASTRA_LUZ_2.0, version 2.0, gabarit AI721
const L = require('./lib2');
const { P, H1, H2, H3, UL, OL, table, note, fig, cover, tocBlock, build, CONTENT } = L;
const W = n => Math.round(CONTENT * n);
const SITE = 'https://andje30.github.io/ai721-exam-management/';
const RENDER = 'https://ai721-astra-luz.onrender.com';
const ART = 'https://claude.ai/artifact/KkQC3Twj1ZmETkx8uirYma';
const C = f => 'captures2/' + f + '.jpg';

const body = [
  cover({
    icon: __dirname + '/icone-astra-luz.png', label: 'MANUEL D\'UTILISATION', title: 'AI721_ASTRA_LUZ_2.0',
    subtitle: 'Guide pas à pas pour la coordination, les préfets des études et le secrétariat des évaluations du second cycle, sur ordinateur, tablette et téléphone',
    meta: [
      ['Application', 'AI721_ASTRA_LUZ_2.0 : planning des épreuves, codes-barres d\'anonymat, saisie à la douchette, levée d\'anonymat, éditions PDF'],
      ['Version', '2.0'],
      ['Date', '02/11/2026'],
      ['Public', 'Coordination du second cycle, préfets des études, secrétariat des évaluations, lecteurs (enseignants, direction)'],
      ['Établissement', 'Collège François-Xavier Vogt, Yaoundé'],
      ['Éditeur', 'AI721 TECH STUFF'],
      ['Accès', `${SITE} (site web) ; variante ${RENDER} ; ${ART} (version claude.ai) ; fichier AI721_ASTRA_LUZ_2.0_hors_ligne.html`],
      ['Dépôt', 'https://github.com/ANDJE30/ai721-exam-management']
    ]
  }),
  tocBlock(),

  H1('1. Avant de commencer'),
  P('Ce manuel suit le trajet d\'une épreuve : on se connecte, on règle l\'application une fois, on charge les élèves, on planifie, on prépare les codes-barres, on imprime, on saisit les notes, puis la coordination lève l\'anonymat et publie les résultats. Chaque chapitre correspond à un écran.'),
  P('Les captures montrent des données de démonstration : noms d\'élèves, d\'enseignants et de préfets fictifs, notes tirées au hasard.'),
  H2('1.1 Ce qu\'il faut retenir'),
  UL([
    'Une évaluation se définit par sa situation (1 à 6, le trimestre s\'en déduit), sa matière, ses classes, sa date et son créneau.',
    'Chaque élève reçoit, pour chaque épreuve, un code-barres de douze chiffres qui indique le niveau, la classe, la matière, le trimestre, la situation et la table, jamais le nom.',
    'Pendant la saisie, aucun nom n\'apparaît. Les noms reviennent quand la coordination lève l\'anonymat.',
    'Chaque bouton d\'impression produit un seul PDF, même pour dix classes ou trente salles.',
    'Chacun travaille sous son propre compte ; toutes les actions sensibles s\'inscrivent au journal à son nom.'
  ]),
  H2('1.2 Les rôles'),
  table(['Rôle', 'Ce qu\'il permet'], [
    ['Coordination', 'Tout, dont la levée d\'anonymat, les tables de correspondance, les corrections après levée, la clôture, les suppressions, la restauration et la gestion des comptes'],
    ['Préfet des études', 'Le travail du secrétariat et les paramètres de l\'établissement ; ouvre sa préfecture par défaut'],
    ['Secrétariat des évaluations', 'Imports, planning, répartition, éditions, absences, saisie des notes sous code'],
    ['Lecture seule', 'Consultation et éditions ; aucune modification'],
    ['En attente', 'Aucun accès tant que la coordination n\'a pas attribué de rôle']
  ], [W(.28), W(.72)], { firstBold: true, caption: 'Rôles et droits' }),

  H1('2. Accéder à l\'application'),
  H2('2.1 Adresse et navigateurs'),
  P(`L\'application s\'ouvre à l\'adresse ${SITE} dans Chrome, Edge, Firefox ou Safari, sur ordinateur, tablette ou téléphone. Ajoutez-la aux favoris du navigateur de chaque poste du secrétariat.`),
  H2('2.2 Installer l\'application'),
  P('Une fois la page ouverte, le navigateur propose de l\'installer : icône d\'installation à droite de la barre d\'adresse dans Chrome et Edge, menu Partager puis « Sur l\'écran d\'accueil » sur iPhone, menu ⋮ puis « Installer l\'application » sur Android. L\'icône ASTRA LUZ apparaît alors sur le bureau ou l\'écran d\'accueil.'),
  P('L\'application installée s\'ouvre même sans connexion. Les notes saisies pendant une coupure restent sur le poste et partent vers la base dès le retour du réseau ; d\'ici là, ne videz pas les données du navigateur.'),
  H2('2.3 Autres versions'),
  table(['Version', 'Usage'], [
    ['Site web (base en ligne)', 'Version de référence : comptes nominatifs, données partagées en temps réel entre tous les postes'],
    ['Site web (base locale)', 'Tant que la base en ligne n\'est pas configurée : données dans le navigateur du poste'],
    ['claude.ai', `${ART} : base partagée claude.ai, utile en secours ; chaque utilisateur doit y être invité`],
    ['Fichier hors ligne', 'AI721_ASTRA_LUZ_2.0_hors_ligne.html : un double-clic suffit, aucune connexion nécessaire'],
    ['Démonstration', 'Bouton « Démonstration sans compte » ou « Explorer avec des données fictives » : 29 classes et 1 500 élèves fictifs pour la formation']
  ], [W(.26), W(.74)], { firstBold: true, caption: 'Versions de l\'application' }),
  note('Quand un fichier est produit (PDF, Excel, sauvegarde), le navigateur l\'enregistre dans le dossier Téléchargements. Sur la version claude.ai, une fenêtre de confirmation apparaît d\'abord : acceptez-la.'),

  H1('3. Se connecter et gérer son compte'),
  H2('3.1 Créer son compte'),
  P('Sur la page de connexion, ouvrez l\'onglet « Créer un compte », indiquez votre nom et votre prénom, votre adresse e-mail et un mot de passe d\'au moins 8 caractères, puis « Créer mon compte ».'),
  fig(C('31-creation-compte'), 'Création d\'un compte'),
  P('Le tout premier compte créé sur une base vide devient le compte de coordination. Ce privilège revient au coordonnateur : il crée son compte avant tout le monde.'),
  H2('3.2 Compte en attente'),
  P('Les comptes suivants restent en attente. L\'écran l\'indique ; prévenez la coordination, puis cliquez sur Recharger une fois votre rôle attribué.'),
  fig(C('32-compte-en-attente'), 'Compte en attente de validation'),
  H2('3.3 Se connecter'),
  P('Saisissez votre adresse et votre mot de passe, puis « Se connecter ». Le navigateur garde la session ouverte : sur un poste partagé, déconnectez-vous en fin de journée.'),
  fig(C('30-connexion'), 'Page de connexion'),
  H2('3.4 Mot de passe oublié'),
  P('Saisissez votre adresse e-mail puis cliquez sur « Mot de passe oublié ». Un lien de réinitialisation arrive dans votre boîte ; vérifiez aussi les courriers indésirables.'),
  H2('3.5 Mon compte'),
  P('Le bouton à votre nom, en haut à droite, rappelle votre adresse, votre rôle et votre préfecture. Il envoie un lien de changement de mot de passe et permet de se déconnecter.'),
  fig(C('36-mon-compte'), 'Fenêtre « Mon compte »', 600, 420),

  H1('4. Mise en ligne et premiers réglages'),
  P('Ce chapitre s\'adresse au coordonnateur. Il se fait une seule fois, en début d\'année.'),
  H2('4.1 Activer GitHub Pages'),
  OL(['Sur github.com, connecté au compte ANDJE30, ouvrez le dépôt ai721-exam-management puis Settings › Pages.', 'Sous « Build and deployment », Source : Deploy from a branch.', 'Branche gh-pages, dossier / (root), puis Save.', `Après une à deux minutes, l\'adresse ${SITE} est active.`]),
  P(`Variante : sur dashboard.render.com, New › Blueprint puis le dépôt ai721-exam-management ; le site statique est publié à l\'adresse ${RENDER} (Render ajoute un suffixe si ce nom est pris).`),
  H2('4.2 Créer la base Firebase'),
  OL([
    'Ouvrez console.firebase.google.com avec un compte Google du collège, puis « Créer un projet » (nom proposé : astra-luz-vogt). Google Analytics n\'est pas nécessaire.',
    'Authentication › Commencer › Sign-in method : activez « Adresse e-mail/Mot de passe ».',
    'Firestore Database › Créer une base de données, mode production, emplacement le plus proche.',
    'Onglet Règles de Firestore : remplacez tout le contenu par celui du fichier firestore.rules du dépôt ai721-exam-management, puis Publier.',
    'Authentication › Settings › Domaines autorisés : ajoutez andje30.github.io, et le domaine Render s\'il est utilisé.',
    'Roue dentée › Paramètres du projet › Vos applications › icône </> : enregistrez une application web, puis copiez le bloc firebaseConfig.'
  ]),
  note('Le bloc firebaseConfig n\'est pas un mot de passe : il identifie le projet. La protection des données repose sur les comptes et sur les règles de sécurité publiées à l\'étape 4.'),
  H2('4.3 Connecter l\'application à la base'),
  P('Dans Paramètres et sauvegarde, collez le bloc firebaseConfig dans le cadre « Base en ligne (Firebase) », puis « Connecter ce poste à la base en ligne ». La page se recharge et affiche la page de connexion. Pour que tous les postes soient connectés d\'office, le bloc peut aussi être inscrit une fois pour toutes dans le fichier config.js du site.'),
  fig(C('39-connexion-firebase'), 'Connexion d\'un poste à la base en ligne'),
  H2('4.4 Premier compte et reprise des données'),
  OL(['Avant de connecter le poste, téléchargez une sauvegarde de la base locale ou de la version claude.ai (chapitre 19).', 'Créez le compte de coordination (chapitre 3) : la base est vide.', 'Cliquez sur « Initialiser la structure 2026-2027 » sur l\'accueil, ou restaurez directement la sauvegarde dans Paramètres et sauvegarde.']),
  H2('4.5 Paramètres de l\'établissement'),
  OL([
    'Vérifiez le nom de l\'établissement, la tutelle, l\'année scolaire et le nom des trois préfets.',
    'Le logo du Collège François-Xavier Vogt est déjà en place ; un autre logo se charge avec « Charger le logo ».',
    'Choisissez le modèle d\'en-tête des PDF : établissement (tableau encadré avec logo, par défaut) ou officiel bilingue.',
    'Réglez le seuil de réussite (10), le délai de saisie (7 jours), les copies par bordereau (25) et l\'écart de double correction (3 points).'
  ]),
  fig(C('37-parametres-en-ligne'), 'Paramètres, base en ligne connectée', 520, 820),
  H2('4.6 Utilisateurs et rôles'),
  P('L\'écran « Utilisateurs et rôles » (menu Système) liste les comptes, les plus récents en attente en tête. Pour chacun, choisissez le rôle, cochez la ou les préfectures d\'un préfet, puis Enregistrer. Pour retirer un accès, choisissez « Compte désactivé » : l\'historique du journal est conservé.'),
  fig(C('33-utilisateurs'), 'Validation d\'un compte et attribution d\'un rôle'),

  H1('5. L\'écran d\'accueil'),
  P('L\'accueil présente les trois préfectures. Chaque carte rappelle le préfet, les classes, l\'effectif et les épreuves à venir ; un clic ouvre le tableau de bord de la préfecture. La quatrième carte ouvre la vue de coordination.'),
  fig(C('01-accueil'), 'Accueil : choix de la préfecture'),
  P('La ligne de petites cases sous le titre rappelle la lecture d\'un code-barres. Le panneau Base de données, en bas, indique où sont enregistrées les données.'),

  H1('6. Se repérer'),
  P('Le menu de gauche regroupe les écrans en cinq rubriques : Pilotage, Référentiels, Épreuves, Analyse et éditions, Système. Un compteur signale les épreuves qui attendent une action. Sur téléphone, le menu s\'ouvre par le bouton à trois traits.'),
  UL([
    'Les boutons 2nde, 1re, Tle et Coord. changent de préfecture.',
    'La liste « Situation » fixe la situation suivie par le tableau de bord, la préparation et les statistiques.',
    'Le champ de recherche trouve un élève par nom ou matricule, ou décode un code-barres.',
    'La pastille de couleur indique le stockage : Base en ligne, Base locale ou Démonstration.',
    'Le bouton à votre nom ouvre « Mon compte ».'
  ]),

  H1('7. Le tableau de bord'),
  fig(C('02-tableau-de-bord'), 'Tableau de bord de la préfecture de Seconde'),
  P('Six indicateurs ouvrent l\'écran : classes, élèves inscrits, épreuves de la situation, copies notées, anonymats levés, points d\'attention.'),
  H2('7.1 La matrice de suivi'),
  table(['Couleur', 'État', 'Contenu de la case'], [
    ['Gris', 'Non planifiée', 'Un point'], ['Bleu clair', 'Planifiée', 'Date de l\'épreuve'], ['Bleu soutenu', 'Codes-barres générés', 'Date et « codes »'],
    ['Orangé', 'Composée, saisie en cours', 'Pourcentage de copies notées'], ['Vert', 'Anonymat levé', 'Moyenne de la classe sur 20']
  ], [W(.2), W(.35), W(.45)], { firstBold: true, caption: 'Couleurs de la matrice de suivi' }),
  P('Un clic sur une case ouvre l\'épreuve ; sur une case grise, il ouvre le formulaire de création avec la matière et les classes déjà cochées.'),
  fig(C('03-tableau-suite'), 'Prochaines épreuves, points d\'attention, saisie en cours, moyennes'),
  H2('7.2 Points d\'attention et vue de coordination'),
  P('Les points d\'attention signalent ce qui risque de bloquer une épreuve : chevauchement d\'horaires, salle réservée deux fois, classe sans élèves, matière sans enseignant, élèves inscrits après la génération des codes, saisie en retard, épreuve proche sans codes. Le bouton Coord. affiche les trois préfectures côte à côte et les conflits de salles entre niveaux.'),
  fig(C('24-coordination'), 'Vue de coordination du second cycle'),

  H1('8. Élèves et classes'),
  P('La colonne de gauche liste les classes avec leur effectif ; la partie droite affiche la classe choisie. Le rang de la classe, qui entre dans le code-barres, est rappelé à côté du pôle.'),
  fig(C('04-eleves'), 'Liste d\'une classe'),
  H2('8.1 Importer les listes'),
  OL(['Cliquez sur « Modèle Excel » pour obtenir les bons intitulés de colonnes.', 'Cliquez sur « Importer des listes » puis choisissez le fichier (Excel, OpenDocument ou CSV).', 'Lisez l\'aperçu : lignes valides par classe, lignes écartées et motif.', 'Choisissez « Ajouter » ou « Remplacer les listes des classes concernées ».', 'Cliquez sur Importer.']),
  fig(C('05-import-eleves'), 'Import des élèves'),
  P('Une colonne « Classe » répartit tout un niveau en une fois. Un élève déjà présent (même matricule, ou mêmes nom et date de naissance) est mis à jour. Les dates au format 14/03/2010 ou 2010-03-14 sont reconnues.'),
  H2('8.2 Modifier, transférer, retirer'),
  P('Le crayon en bout de ligne ouvre la fiche de l\'élève : identité, classe (transfert), statut « Sorti de la classe ». La suppression définitive est réservée à la coordination.'),
  note('Un élève ajouté après la génération des codes d\'une épreuve n\'y figure pas. Le tableau de bord le signale : régénérez la répartition tant qu\'aucune note n\'est saisie.', 'warn'),

  H1('9. Matières et enseignants'),
  UL(['Programme des classes : matières au programme, coefficients et enseignant de chaque classe ; « Appliquer ce programme à tout le pôle » copie la liste vers les classes du même pôle.', 'Vue d\'ensemble : enseignant et coefficient pour chaque matière et chaque classe ; postes à pourvoir en orangé.', 'Enseignants : saisie, modification, import Excel (Civilité, Nom, Prénoms, Téléphone).', 'Catalogue des matières : code à deux chiffres, abréviation, intitulé.']),
  fig(C('06-matieres'), 'Programme d\'une classe'),
  note('Le code de la matière fait partie de chaque code-barres : ne le changez pas pour une matière déjà évaluée dans l\'année.', 'warn'),

  H1('10. Salles de composition'),
  P('Chaque salle a un nom, une capacité et un bâtiment. Les indicateurs comparent la capacité totale à l\'effectif de chaque niveau ; la liste « Occupation à venir » montre les salles réservées.'),
  fig(C('07-salles'), 'Salles de composition'),

  H1('11. Planning des évaluations'),
  H2('11.1 Créer une évaluation'),
  P('« Nouvelle évaluation » ouvre le formulaire : situation (le trimestre suit), matière, classes (celles qui ont la matière sont cochées), date, heure de début, heure de fin, barème, double correction, échéance de saisie, consignes. Une classe qui compose déjà sur un créneau qui chevauche est refusée.'),
  fig(C('11-nouvelle-evaluation'), 'Création d\'une évaluation'),
  H2('11.2 Programmer toute une situation'),
  P('« Programmer une situation » crée en une fois les épreuves de toutes les matières d\'un niveau : choisissez le niveau, la situation, le premier jour et le nombre d\'épreuves par jour, puis « Remplir les dates ». Corrigez à la main si besoin, puis « Créer les évaluations ».'),
  fig(C('10-programmer-situation'), 'Programmation d\'une situation'),
  H2('11.3 Consulter, imprimer, importer'),
  P('Le planning s\'affiche par date ou en calendrier ; « Planning PDF » l\'imprime en paysage. Le bouton Modèle fournit le fichier d\'import : Niveau, Situation, Matière, Classes (« Toutes » ou liste), Date, Début, Fin.'),
  fig(C('08-planning'), 'Planning par date'),
  fig(C('09-calendrier'), 'Planning en calendrier'),

  H1('12. Préparer une épreuve'),
  fig(C('12-preparation'), 'Répartition en salles et surveillants'),
  H2('12.1 Répartir les élèves'),
  P('Cochez les salles ; une salle prise sur le même créneau porte la mention « occupée ». Choisissez le mode de placement puis « Générer la répartition et les codes ». Les tables vont de 001 au dernier élève, sans retour à 001 d\'une salle à l\'autre.'),
  table(['Mode', 'Effet'], [
    ['Brassage alterné', 'Classes entrelacées : deux voisins viennent de classes différentes (conseillé)'], ['Classe par classe', 'Élèves de chaque classe à la suite, par ordre alphabétique'],
    ['Ordre alphabétique', 'Tout le niveau par ordre alphabétique'], ['Tirage aléatoire', 'Ordre tiré au sort, reproductible']
  ], [W(.28), W(.72)], { firstBold: true, caption: 'Modes de placement' }),
  note('Dès qu\'une note est saisie, la répartition est verrouillée : la régénérer changerait les codes déjà imprimés.', 'warn'),
  H2('12.2 Surveillants, éditions, contrôle de la douchette'),
  P('Deux surveillants par salle se choisissent à la main ou avec « Désigner automatiquement ». Le bloc 3 propose les éditions de l\'épreuve ; « Dossier complet » réunit émargements, listes de classe et bordereaux dans un PDF. Avant l\'impression en série, scannez une étiquette dans « Contrôle d\'un code ».'),
  fig(C('13-editions-epreuve'), 'Éditions, jour de l\'épreuve et contrôle d\'un code'),
  fig(C('14-etiquettes-dialogue'), 'Étiquettes : contenu et format de planche'),

  H1('13. Le centre d\'impression'),
  P('Le centre d\'impression regroupe les éditions par date : choisissez la date, cochez les épreuves du jour, puis le document. Un bouton, un fichier.'),
  fig(C('21-centre-impression'), 'Centre d\'impression'),
  P('Les PDF portent l\'en-tête du collège : tableau encadré avec le nom de l\'établissement, le logo VOGT, l\'année scolaire, la préfecture, le titre du document, la date d\'édition et le nom du préfet ou du coordonnateur.'),
  fig(C('40-pdf-entete'), 'Liste de classe avec codes-barres (en-tête du collège)', 430, 640),
  UL(['Imprimez à 100 %, sans « ajuster à la page ».', 'Décochez « Tracer les contours » pour les planches prédécoupées.', 'Préférez une imprimante laser, sans mode brouillon.', 'Faites un essai sur papier ordinaire avant les planches d\'étiquettes.']),

  H1('14. Le jour de l\'épreuve'),
  OL(['Les surveillants collent l\'étiquette nominative sur l\'en-tête de chaque copie et l\'étiquette anonyme sur la copie, à la table indiquée.', 'Chaque élève signe l\'émargement à l\'entrée puis à la remise de sa copie.', 'Le secrétariat enregistre les absents : scan du code sur la liste, ou numéro de table, puis Entrée. Un second passage annule.', 'À la fin, « Marquer l\'épreuve comme composée ».', 'Les en-têtes nominatifs sont détachés et rangés sous enveloppe ; les lots de copies partent avec leurs bordereaux.']),

  H1('15. Saisir les notes sans voir les noms'),
  H2('15.1 À la douchette'),
  OL(['Choisissez l\'épreuve, onglet Douchette.', 'Scannez la copie : l\'écran montre la matière, la situation, la table, la salle et la note déjà saisie. Aucun nom.', 'Tapez la note (virgule ou point), ou A (absent), D (dispensé), F (fraude).', 'Entrée : la note est enregistrée et le curseur revient au code.']),
  fig(C('15-saisie-douchette'), 'Saisie à la douchette'),
  P('Une note hors barème, un code à clé fausse ou une copie d\'une autre épreuve sont refusés. Le panneau « Copies sans note » donne, salle par salle, les tables encore vides. Plusieurs postes peuvent saisir en même temps : chaque note apparaît sur les autres en quelques secondes.'),
  fig(C('34-saisie-secretariat'), 'Saisie par un compte du secrétariat (base en ligne)'),
  H2('15.2 À partir d\'un bordereau'),
  P('L\'onglet Bordereau présente les copies dans l\'ordre des tables, par lots. Recopiez les notes ; Entrée passe à la ligne suivante ; « Enregistrer le lot » valide et ouvre le lot suivant.'),
  fig(C('16-saisie-bordereau'), 'Saisie par bordereau'),
  H2('15.3 Double correction'),
  P('La saisie demande alors deux notes ; la note finale est leur moyenne. Si l\'écart atteint le seuil des paramètres, une troisième case d\'arbitrage apparaît et sa note devient la note finale.'),

  H1('16. Lever l\'anonymat et publier'),
  P('L\'écran Désanonymat et résultats affiche trois contrôles : copies traitées, arbitrages en attente, rôle Coordination.'),
  fig(C('17-avant-levee'), 'Contrôles avant la levée d\'anonymat'),
  OL(['Cliquez sur « Lever l\'anonymat » (compte de coordination).', 'Lisez le récapitulatif et confirmez. S\'il reste des copies sans note, le bouton devient « Lever malgré tout » ; ces élèves apparaîtront comme « non rendue » et la levée est marquée forcée au journal.']),
  fig(C('18-confirmation-levee'), 'Confirmation de la levée d\'anonymat'),
  P('Viennent ensuite les indicateurs du niveau et un onglet par classe : nom, matricule, table, note sur 20, rang, appréciation. Les notes sous le seuil sont en rouge.'),
  fig(C('19-resultats'), 'Résultats après levée d\'anonymat'),
  table(['Bouton', 'Résultat'], [
    ['Relevés de toutes les classes (1 PDF)', 'Un relevé par classe avec statistiques et visas'], ['Procès-verbal', 'PV de levée d\'anonymat'], ['Rapport statistique', 'Tableau par classe, graphiques, palmarès'],
    ['Excel', 'Un classeur, une feuille par classe'], ['Clôturer', 'Fige les notes de l\'épreuve']
  ], [W(.38), W(.62)], { firstBold: true, caption: 'Éditions après levée' }),
  P('Une réclamation fondée se corrige depuis la saisie, avec un compte de coordination : un motif est demandé et inscrit au journal, la note porte la mention « corrigée ». Une épreuve clôturée n\'accepte plus de correction.'),

  H1('17. Statistiques'),
  P('Pour chaque niveau, un tableau croise matières et classes : rouge sous le seuil moins deux points, orangé sous le seuil, vert à partir du seuil plus trois points. Un graphique compare les classes pour la matière choisie. Les moyennes sont brutes, sans coefficient.'),
  fig(C('20-statistiques'), 'Moyennes par matière et par classe'),

  H1('18. Recherche, décodeur et fiche élève'),
  P('Le champ de recherche accepte un nom, un matricule ou un code-barres. Scanné ou tapé, un code ouvre la fenêtre de décodage : parties du code, clé, épreuve, salle, note. Le nom n\'apparaît qu\'après la levée ou pour la coordination.'),
  fig(C('26-recherche'), 'Recherche d\'un élève'),
  fig(C('25-decodeur'), 'Décodage d\'un code-barres'),
  fig(C('27-fiche-eleve'), 'Fiche d\'un élève'),

  H1('19. Journal, sauvegardes, nouvelle année'),
  P('Le journal d\'audit liste les 400 dernières actions avec la date, l\'auteur, le rôle et le détail ; « Exporter » produit un fichier Excel complet.'),
  fig(C('38-journal-en-ligne'), 'Journal d\'audit nominatif'),
  P('Dans Paramètres et sauvegarde, « Télécharger la sauvegarde » produit un fichier JSON de toute la base. Faites-le après chaque séance de saisie et rangez le fichier sur la clé USB du secrétariat. « Restaurer » remplace la base par une sauvegarde (coordination). En fin d\'année, « Préparer une nouvelle année » efface épreuves et notes et garde la structure.'),

  H1('20. Dépannage'),
  table(['Situation', 'Cause probable', 'Que faire'], [
    ['« Adresse e-mail ou mot de passe incorrect »', 'Erreur de frappe, majuscules', 'Ressaisir ou utiliser « Mot de passe oublié »'],
    ['« Compte en attente »', 'Rôle non encore attribué', 'Prévenir la coordination, puis Recharger'],
    ['« Votre profil ne permet pas cette opération »', 'Action réservée à un autre rôle', 'Demander à la coordination'],
    ['La connexion par e-mail est refusée par Firebase', 'Méthode non activée dans le projet', 'Authentication › Sign-in method : activer e-mail/mot de passe'],
    ['La douchette tape « &é"\'( » au lieu de chiffres', 'Douchette en QWERTY sur clavier AZERTY', 'L\'application convertit seule ; pour les autres logiciels, régler la douchette en AZERTY'],
    ['La douchette ne valide pas', 'Suffixe Entrée absent', 'Appuyer sur Entrée ou activer le suffixe'],
    ['« Clé de contrôle invalide »', 'Lecture partielle ou chiffre mal tapé', 'Relire ; à défaut, taper les douze chiffres'],
    ['« Cette copie appartient à une autre épreuve »', 'Copie dans le mauvais paquet', 'Mettre de côté, saisir dans la bonne épreuve'],
    ['Étiquettes décalées', 'Impression ajustée ou mauvais format', 'Imprimer à 100 %, choisir le bon format'],
    ['« Quota gratuit du jour atteint »', 'Limite quotidienne Firebase dépassée', 'Reprendre le lendemain ; prévenir la coordination'],
    ['Pastille « Base locale » au lieu de « Base en ligne »', 'Poste non connecté à Firebase', 'Paramètres › Base en ligne (chapitre 4.3)']
  ], [W(.32), W(.28), W(.40)], { firstBold: true, size: 18, caption: 'Dépannage' }),

  H1('Annexe A. Lire un code-barres'),
  table(['Chiffres', 'Sens', 'Exemple : 1 03 02 12 047 73'], [
    ['1er', 'Niveau : 1 Seconde, 2 Première, 3 Terminale', '1 : Seconde'], ['2e et 3e', 'Rang de la classe', '03 : 2C3'], ['4e et 5e', 'Code de la matière', '02 : Anglais'],
    ['6e', 'Trimestre', '1'], ['7e', 'Situation', '2'], ['8e à 10e', 'Numéro de table', '047'], ['11e et 12e', 'Clé de contrôle MOD 97-10', '73']
  ], [W(.18), W(.47), W(.35)], { firstBold: true, caption: 'Lecture du code-barres' }),
  H1('Annexe B. Clavier et douchette'),
  table(['Touche', 'Effet'], [
    ['Entrée après un code', 'Valide la lecture et passe à la note'], ['Entrée après une note', 'Enregistre et revient au code'], ['A, D, F', 'Absent, dispensé, fraude'],
    ['12,5 ou 12.5', 'Note décimale'], ['Échap', 'Annule la copie en cours'], ['Tabulation', 'Case suivante (bordereau)']
  ], [W(.35), W(.65)], { firstBold: true, caption: 'Raccourcis de saisie' }),
  P('Réglages attendus de la douchette : Code 128 activé, émulation clavier (HID), suffixe Entrée (CR).'),
  H1('Annexe C. Check-list d\'une épreuve'),
  table(['Quand', 'Action', 'Fait'], [
    ['J-7', 'Épreuve planifiée, enseignants attribués, aucun point bloquant', ''], ['J-3', 'Répartition générée, surveillants désignés, douchette testée', ''],
    ['J-2', 'Dossier du jour et étiquettes imprimés ; correspondance sous pli', ''], ['J', 'Étiquettes collées, émargement, absents saisis, PV signé, épreuve composée', ''],
    ['J+1', 'En-têtes détachés, lots remis avec les bordereaux', ''], ['Échéance', 'Copies notées, arbitrages faits, sauvegarde téléchargée', ''],
    ['Levée', 'Anonymat levé, PV signé, relevés transmis', ''], ['Après réclamations', 'Épreuve clôturée', '']
  ], [W(.18), W(.70), W(.12)], { firstBold: true, caption: 'Check-list' }),
  H1('Annexe D. Formats d\'import'),
  table(['Fichier', 'Colonnes reconnues', 'Remarques'], [
    ['Élèves', 'Matricule, Nom, Prénoms, Sexe, Date de naissance, Classe, Statut', '« Noms et prénoms » en une colonne accepté ; « Classe » facultative'],
    ['Enseignants', 'Civilité, Nom, Prénoms, Téléphone', 'Doublons ignorés'], ['Salles', 'Salle (ou Nom), Capacité, Bâtiment', 'Salle déjà connue ignorée'],
    ['Planning', 'Niveau, Situation, Matière, Classes, Date, Début, Fin', 'Classes : « Toutes » ou liste ; heures au format 07:30']
  ], [W(.15), W(.45), W(.40)], { firstBold: true, size: 18, caption: 'Formats des fichiers d\'import' })
];

build({ product: 'AI721_ASTRA_LUZ_2.0', docTitle: 'Manuel d\'utilisation', children: body, out: __dirname + '/AI721_ASTRA_LUZ_2.0_Manuel_utilisation.docx' });
