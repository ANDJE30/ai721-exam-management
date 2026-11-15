// Cahier des charges AI721_ASTRA_LUZ_2.0, version 2.0, gabarit AI721
const L = require('./lib2');
const { P, H1, H2, H3, UL, OL, table, note, fig, cover, tocBlock, signatureBlock, build, CONTENT } = L;
const subjects = require('./subjects.json').list;
const W = n => Math.round(CONTENT * n);
const SITE = 'https://andje30.github.io/ai721-exam-management/';
const RENDER = 'https://ai721-astra-luz.onrender.com';
const ART = 'https://claude.ai/artifact/KkQC3Twj1ZmETkx8uirYma';
const T = (head, rows, ws, cap, o = {}) => table(head, rows, ws.map(W), { firstBold: true, caption: cap, ...o });

const body = [
  cover({
    icon: __dirname + '/icone-astra-luz.png', label: 'CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE', title: 'AI721_ASTRA_LUZ_2.0',
    subtitle: 'Application web de suivi des évaluations du second cycle avec anonymat par code-barres, pour le Collège François-Xavier Vogt de Yaoundé, année scolaire 2026-2027',
    meta: [
      ['Projet', 'AI721_ASTRA_LUZ_2.0, application du secrétariat des évaluations du second cycle'],
      ['Établissement', 'Collège François-Xavier Vogt, Yaoundé (Secrétariat à l\'Éducation de l\'Archidiocèse de Yaoundé)'],
      ['Commanditaire', 'M. ANDJE IBOT Georges, coordonnateur d\'informatique du second cycle'],
      ['Éditeur', 'AI721 TECH STUFF'],
      ['Document', 'Cahier des charges (spécifications fonctionnelles, techniques et conception UML)'],
      ['Version', '2.0'],
      ['Date', '02/11/2026'],
      ['Statut', 'Soumis à validation ; application livrée et publiée'],
      ['Historique', '1.0 : application sur claude.ai, code PIN de coordination. 2.0 : site web gratuit (GitHub Pages, variante Render) ; base Firebase avec comptes et rôles contrôlés par le serveur ; application installable et hors connexion ; en-tête PDF au modèle du collège, logo VOGT ; douchettes en QWERTY reconnues.'],
      ['Accès', `${SITE} (GitHub Pages, chapitre 10) ; variante ${RENDER} ; version claude.ai sur invitation ; dépôt github.com/ANDJE30/ai721-exam-management`],
      ['Destinataires', 'Chef d\'établissement, préfets des études de Seconde, de Première et de Terminale, secrétariat des évaluations'],
      ['Rédaction', 'Coordination d\'informatique du second cycle (AI721)']
    ]
  }),
  tocBlock(),

  H1('1. Présentation du projet'),
  H2('1.1 Contexte'),
  P('Le second cycle du Collège François-Xavier Vogt compte 29 classes en 2026-2027, réparties entre trois préfectures des études. Chaque préfecture réunit des classes d\'enseignement général organisées en groupe, une classe solo littéraire, une classe solo scientifique et des classes d\'enseignement technique.'),
  table(['Préfecture', 'Pôle', 'Classes', 'Nb'], [
    ['Seconde', 'Enseignement général, groupe', '2C1, 2C2, 2C3, 2C4, 2C5, 2C6', '6'],
    ['', 'Solo littéraire', '2A', '1'], ['', 'Solo scientifique', '2TI', '1'], ['', 'Enseignement technique, solo', '2SES1, 2SES2', '2'],
    ['Première', 'Enseignement général, groupe', 'PC1, PC2, PCE, PD1, PD2, PD3, PDE', '7'],
    ['', 'Solo littéraire', 'PA', '1'], ['', 'Solo scientifique', 'PTI', '1'], ['', 'Enseignement technique, solo', 'PSES', '1'],
    ['Terminale', 'Enseignement général, groupe', 'TC, TCE, TD1, TD2, TD3, TDE', '6'],
    ['', 'Solo littéraire', 'TA', '1'], ['', 'Solo scientifique', 'TTI', '1'], ['', 'Enseignement technique, solo', 'TSES', '1'],
    ['Total', '', '', '29']
  ], [W(.17), W(.33), W(.42), W(.08)], { firstBold: true, caption: 'Classes du second cycle par préfecture' }),
  P('L\'année compte trois trimestres et six situations d\'évaluation, deux par trimestre. À chaque situation, chaque matière de chaque classe donne lieu à une épreuve, et les classes d\'un même niveau composent souvent la même matière le même jour. Avec 1 500 élèves et douze matières, une situation produit 18 000 copies ; l\'année en produit 108 000.'),
  P('Chaque copie doit recevoir un numéro anonyme, partir chez le correcteur, revenir avec une note et retrouver son auteur sans erreur. La version 1.0, publiée sur claude.ai, a montré que le circuit tient en une seule application. La version 2.0 la rend autonome : site web public gratuit, base de données du collège, comptes personnels.'),
  note('La demande initiale nomme « PTI » la classe scientifique solo de Seconde, comme celle de Première. Pour éviter deux classes homonymes, l\'application l\'appelle 2TI. Le nom se change en une minute si la préfecture de Seconde en utilise un autre.', 'warn'),
  H2('1.2 Problématique'),
  UL([
    'Comment garantir qu\'aucun correcteur ne connaisse l\'auteur d\'une copie, sans perdre une seule note au retour ?',
    'Comment imprimer en une fois les listes de toutes les classes d\'un niveau pour une matière et une date ?',
    'Comment empêcher qu\'une classe compose deux épreuves au même moment, ou qu\'une salle soit réservée deux fois ?',
    'Comment saisir 18 000 notes par situation sans erreur de report ni copie oubliée ?',
    'Comment réserver la levée d\'anonymat aux seules personnes habilitées, et en garder la trace ?',
    'Comment continuer à travailler pendant une coupure d\'Internet ou d\'électricité ?',
    'Comment héberger tout cela sans budget de fonctionnement ?'
  ]),
  H2('1.3 Objectifs'),
  table(['Objectif', 'Indicateur de réussite'], [
    ['Anonymiser chaque copie', 'Code-barres de 12 chiffres par élève et par épreuve ; aucun nom affiché pendant la saisie'],
    ['Imprimer vite et en une fois', 'Listes de classe d\'un niveau (10 classes, 485 élèves) dans un seul PDF de 36 pages, généré sur le poste'],
    ['Saisir sans erreur', 'Clé de contrôle MOD 97-10 sur chaque code ; note hors barème refusée ; copie d\'une autre épreuve refusée'],
    ['Retrouver les copies manquantes', 'Liste des copies sans note par salle, à tout moment'],
    ['Contrôler la levée d\'anonymat', 'Levée réservée au rôle Coordination, vérifiée par le serveur, inscrite au journal, procès-verbal imprimable'],
    ['Partager entre postes', 'Une note saisie sur un poste apparaît sur les autres en quelques secondes'],
    ['Travailler hors connexion', 'Application installable ; écritures mises en file et envoyées au retour du réseau'],
    ['Coût d\'hébergement nul', 'GitHub Pages et Firebase, offres gratuites, sans carte bancaire']
  ], [W(.32), W(.68)], { firstBold: true, caption: 'Objectifs du projet' }),
  H2('1.4 Périmètre'),
  P('Sont inclus : la structure du second cycle (préfectures, classes, élèves, matières, enseignants, salles), la planification des six situations, la répartition en salles, les codes-barres et leurs éditions PDF, la saisie anonyme, la double correction, la levée d\'anonymat, les relevés, les statistiques, les exports Excel, les comptes et rôles, le journal d\'audit, les sauvegardes et le mode de démonstration.'),
  P('Sont exclus de la version 2.0 : le calcul des moyennes trimestrielles pondérées et des bulletins (les notes s\'exportent en Excel classe par classe), les emplois du temps, l\'assiduité hors épreuves, la scolarité et les paiements.'),

  H1('2. Acteurs et profils utilisateurs'),
  P('Chaque personne se connecte avec un compte nominatif (adresse e-mail et mot de passe). Le premier compte créé sur une base vide devient le compte de coordination ; les suivants attendent qu\'un rôle leur soit attribué. Les droits sont vérifiés par les règles de sécurité de la base, pas seulement par l\'écran.'),
  table(['Profil', 'Qui', 'Ce qu\'il fait'], [
    ['Coordination', 'Coordonnateur du second cycle', 'Tout, dont : levée d\'anonymat, tables de correspondance, correction d\'une note après levée, clôture, suppressions, restauration, gestion des comptes et des rôles'],
    ['Préfet des études', 'Un par niveau', 'Travail du secrétariat, paramètres de l\'établissement, suivi de sa préfecture (ouverte par défaut)'],
    ['Secrétariat des évaluations', 'Agents du secrétariat', 'Imports, planning, répartition, éditions, absences, saisie des notes sous code'],
    ['Lecture seule', 'Enseignants, direction', 'Consultation des plannings, des résultats désanonymisés et des éditions ; aucune écriture'],
    ['En attente / désactivé', 'Nouveau compte, ancien agent', 'Aucun accès aux données'],
    ['Surveillant, correcteur', 'Enseignants', 'Sans compte obligatoire : liste d\'émargement, PV de salle, bordereau de notation imprimés']
  ], [W(.22), W(.22), W(.56)], { firstBold: true, caption: 'Profils et droits' }),

  H1('3. Exigences fonctionnelles'),
  P('P1 : exigence obligatoire pour la mise en service. P2 : exigence souhaitée, livrée elle aussi dans la version 2.0.'),
  H2('3.1 Accueil, tableau de bord et structure'),
  T(['Réf.', 'Exigence', 'Prio.'], [
    ['EF-01', 'L\'accueil présente les trois préfectures (Seconde, Première, Terminale) et une vue de coordination, avec pour chacune le préfet, les classes, l\'effectif et les épreuves à venir.', 'P1'],
    ['EF-02', 'Le tableau de bord d\'une préfecture donne, pour la situation choisie : classes, élèves, épreuves, pourcentage de copies notées, anonymats levés, points d\'attention.', 'P1'],
    ['EF-03', 'Une matrice classes × matières montre l\'état de chaque épreuve (non planifiée, planifiée, codes générés, saisie en %, moyenne après levée) ; un clic ouvre ou crée l\'épreuve.', 'P1'],
    ['EF-04', 'La vue de coordination agrège les trois préfectures et signale les conflits de salles entre niveaux.', 'P2'],
    ['EF-05', 'La structure contient les 29 classes avec leur pôle et leur rang dans le niveau, repris dans le code-barres.', 'P1']
  ], [.09, .81, .10], 'Exigences de l\'accueil et du tableau de bord'),
  H2('3.2 Comptes, rôles et sécurité d\'accès'),
  T(['Réf.', 'Exigence', 'Prio.'], [
    ['EF-06', 'Page de connexion : adresse e-mail et mot de passe ; création de compte (nom, e-mail, mot de passe d\'au moins 8 caractères) ; lien de réinitialisation du mot de passe envoyé par e-mail.', 'P1'],
    ['EF-07', 'Le premier compte créé sur une base vide devient Coordination ; tout autre nouveau compte est « en attente » et ne lit aucune donnée.', 'P1'],
    ['EF-08', 'L\'écran « Utilisateurs et rôles » (Coordination) liste les comptes, attribue un rôle et, pour un préfet, sa ou ses préfectures.', 'P1'],
    ['EF-09', 'Les droits de chaque rôle sont appliqués par les règles de sécurité de la base : un compte qui contourne l\'écran reçoit un refus du serveur.', 'P1'],
    ['EF-10', 'Le menu « Mon compte » affiche le rôle, envoie un lien de changement de mot de passe et permet de se déconnecter.', 'P1'],
    ['EF-11', 'Sans base en ligne (version hors ligne, base locale), un code PIN de coordination protège les actions sensibles.', 'P2']
  ], [.09, .81, .10], 'Exigences des comptes et des rôles'),
  H2('3.3 Référentiels'),
  T(['Réf.', 'Exigence', 'Prio.'], [
    ['EF-12', 'Import des élèves depuis Excel, OpenDocument ou CSV, par classe ou pour tout un niveau grâce à une colonne « Classe » ; ajout ou remplacement ; doublons détectés ; aperçu avant validation.', 'P1'],
    ['EF-13', 'Fiche élève (matricule, nom, prénoms, sexe, date de naissance, statut) ; transfert et sortie de classe sans perte d\'historique.', 'P1'],
    ['EF-14', 'Catalogue des matières avec un code à deux chiffres, une abréviation et un intitulé.', 'P1'],
    ['EF-15', 'Programme de chaque classe : matières, coefficients, enseignant ; copie possible vers les classes du même pôle.', 'P1'],
    ['EF-16', 'Enseignants et salles saisis ou importés ; capacité totale des salles comparée à l\'effectif de chaque niveau.', 'P1']
  ], [.09, .81, .10], 'Exigences des référentiels'),
  H2('3.4 Planification des évaluations'),
  T(['Réf.', 'Exigence', 'Prio.'], [
    ['EF-17', 'Une évaluation se définit par la situation (1 à 6, le trimestre s\'en déduit), la matière, une ou plusieurs classes du niveau, la date, l\'heure de début, l\'heure de fin, le barème, la double correction, l\'échéance de saisie et les consignes.', 'P1'],
    ['EF-18', 'Une situation complète se programme en une opération ; les dates se remplissent sur les jours ouvrables puis s\'ajustent.', 'P2'],
    ['EF-19', 'Import Excel du planning (niveau, situation, matière, classes, date, début, fin).', 'P2'],
    ['EF-20', 'Refus d\'une épreuve qui chevauche une autre pour une même classe ; alerte sur toute salle réservée deux fois sur le même créneau.', 'P1'],
    ['EF-21', 'Planning en liste ou en calendrier mensuel, imprimable en PDF paysage.', 'P1']
  ], [.09, .81, .10], 'Exigences du planning'),
  H2('3.5 Préparation des épreuves et anonymat'),
  T(['Réf.', 'Exigence', 'Prio.'], [
    ['EF-22', 'Répartition en salles selon quatre modes : brassage alterné des classes, classe par classe, ordre alphabétique du niveau, tirage aléatoire reproductible ; option d\'équilibrage.', 'P1'],
    ['EF-23', 'Numérotation continue des tables de 001 à 999 sur l\'épreuve, une plage par salle ; refus si la capacité ne suffit pas.', 'P1'],
    ['EF-24', 'Un code-barres par élève et par épreuve (chapitre 9) ; répartition figée dès qu\'une note est saisie.', 'P1'],
    ['EF-25', 'Deux surveillants par salle, désignés à la main ou automatiquement (sans enseignant de la matière, sans double surveillance sur le créneau).', 'P2'],
    ['EF-26', 'Absences enregistrées en scannant le code ou en tapant le numéro de table ; zone de contrôle de la douchette.', 'P1']
  ], [.09, .81, .10], 'Exigences de préparation'),
  H2('3.6 Éditions'),
  T(['Réf.', 'Exigence', 'Prio.'], [
    ['EF-27', 'Pour une date et une matière, les listes de toutes les classes du niveau avec le code-barres de chaque élève sortent dans un seul PDF, une classe par page.', 'P1'],
    ['EF-28', 'Toute édition qui porte sur plusieurs classes, salles, lots ou épreuves produit un seul fichier PDF.', 'P1'],
    ['EF-29', 'En-tête au modèle du collège (tableau encadré : établissement, logo VOGT, année scolaire, titre, date, responsable) ou en-tête officiel bilingue, au choix ; pied « Page x sur y ».', 'P1'],
    ['EF-30', 'Codes-barres vectoriels, nets à toute résolution d\'impression.', 'P1']
  ], [.09, .81, .10], 'Exigences des éditions'),
  H2('3.7 Saisie, levée d\'anonymat et résultats'),
  T(['Réf.', 'Exigence', 'Prio.'], [
    ['EF-31', 'Saisie à la douchette sans aucun nom à l\'écran : lecture du code, affichage de la matière, de la situation, de la table et de la salle, frappe de la note, Entrée.', 'P1'],
    ['EF-32', 'Refus d\'un code dont la clé est fausse et d\'une copie d\'une autre épreuve ; codes A (absent), D (dispensé), F (fraude) ; note hors barème refusée.', 'P1'],
    ['EF-33', 'Saisie par bordereau, dans l\'ordre des tables, par lots de taille paramétrable.', 'P1'],
    ['EF-34', 'Double correction avec moyenne et arbitrage obligatoire au-delà d\'un écart paramétrable (3 points par défaut).', 'P2'],
    ['EF-35', 'Liste des copies sans note par salle, sous forme de numéros de table.', 'P1'],
    ['EF-36', 'Levée d\'anonymat par la Coordination après contrôles et confirmation ; levée forcée possible et signalée.', 'P1'],
    ['EF-37', 'Après levée : relevés par classe (note sur 20, rang, appréciation, statistiques), procès-verbal, rapport statistique, export Excel.', 'P1'],
    ['EF-38', 'Correction après levée avec motif obligatoire, inscrite au journal ; clôture définitive de l\'épreuve.', 'P1']
  ], [.09, .81, .10], 'Exigences de saisie et de résultats'),
  H2('3.8 Analyse et administration'),
  T(['Réf.', 'Exigence', 'Prio.'], [
    ['EF-39', 'Statistiques matières × classes par situation ou pour l\'année, comparaison des classes, rapport PDF, export Excel.', 'P1'],
    ['EF-40', 'Recherche d\'un élève par nom ou matricule ; décodage de tout code-barres ; fiche de suivi d\'un élève ou de toute une classe en PDF.', 'P2'],
    ['EF-41', 'Journal d\'audit horodaté et nominatif ; export Excel.', 'P1'],
    ['EF-42', 'Paramètres : identité, logo, en-tête, préfets, situation courante, seuil de réussite, délai de saisie, taille des lots, écart de double correction, connexion à la base en ligne.', 'P1'],
    ['EF-43', 'Sauvegarde complète en JSON, restauration, préparation de la nouvelle année.', 'P1'],
    ['EF-44', 'Mode de démonstration avec 29 classes et environ 1 500 élèves fictifs, sans effet sur la base réelle.', 'P2']
  ], [.09, .81, .10], 'Exigences d\'analyse et d\'administration'),

  H1('4. Règles de gestion'),
  T(['Réf.', 'Règle'], [
    ['RG-01', 'Le trimestre se déduit de la situation : situations 1-2 au trimestre 1, 3-4 au trimestre 2, 5-6 au trimestre 3.'],
    ['RG-02', 'Une classe ne compose qu\'une épreuve à la fois : deux créneaux qui se chevauchent sur une même classe sont refusés.'],
    ['RG-03', 'Les numéros de table d\'une épreuve sont uniques et continus, de 001 au nombre d\'élèves ; ils ne repartent pas à 001 dans chaque salle.'],
    ['RG-04', 'Le code-barres d\'une copie est N CC MM T S TTT KK (chapitre 9) ; il est calculé, jamais saisi.'],
    ['RG-05', 'Une répartition ne se regénère plus dès qu\'une note de l\'épreuve est enregistrée.'],
    ['RG-06', 'Une note se saisit sur le barème de l\'épreuve (10, 20, 40 ou 100) et se ramène sur 20 pour les résultats.'],
    ['RG-07', 'En double correction, la note finale est la moyenne des deux corrections ; si l\'écart atteint le seuil, la note d\'arbitrage la remplace.'],
    ['RG-08', 'Appréciation : moins de 5 très insuffisant ; 5 insuffisant ; 8 médiocre ; 10 passable ; 12 assez bien ; 14 bien ; 16 très bien ; 18 excellent.'],
    ['RG-09', 'Rangs : deux notes égales reçoivent le même rang ; le rang suivant tient compte des ex æquo.'],
    ['RG-10', 'Seule la Coordination lève l\'anonymat, modifie une note après levée, clôture une épreuve, supprime une épreuve notée et restaure une sauvegarde.'],
    ['RG-11', 'Une modification après levée exige un motif, conservé avec la note et au journal.'],
    ['RG-12', 'Une épreuve clôturée n\'accepte plus aucune modification.'],
    ['RG-13', 'Le premier compte d\'une base vide devient Coordination ; aucun compte ne peut s\'attribuer lui-même un rôle.'],
    ['RG-14', 'L\'échéance de saisie vaut, par défaut, la date de l\'épreuve plus le délai fixé dans les paramètres (7 jours).']
  ], [.10, .90], 'Règles de gestion'),

  H1('5. Exigences non fonctionnelles'),
  H2('5.1 Sécurité (« security by design »)'),
  UL([
    'Comptes nominatifs gérés par Firebase Authentication ; mots de passe jamais stockés par l\'application.',
    'Règles de sécurité Firestore par rôle (fichier [[firestore.rules]]) : un compte en attente ne lit rien ; le secrétariat ne peut ni lever l\'anonymat, ni modifier les paramètres, ni s\'attribuer un rôle.',
    'Aucun nom à l\'écran pendant la saisie ; le décodeur ne révèle le nom qu\'après levée ou au rôle Coordination.',
    'Journal d\'audit horodaté, au nom de l\'auteur de chaque action sensible.',
    'Échanges chiffrés (HTTPS) avec GitHub Pages et Firebase ; site exclu des moteurs de recherche ([[robots.txt]]).',
    'Le dépôt public ne contient aucune donnée d\'élève : les données vivent dans la base Firebase du collège ou dans le navigateur du poste.'
  ]),
  H2('5.2 Performance et disponibilité'),
  P('Le site est servi par le réseau de diffusion de GitHub. Les éditions PDF et Excel sont calculées sur le poste : la liste de 485 élèves d\'un niveau sort sans aller-retour avec un serveur. Les bibliothèques lourdes (PDF, Excel, Firebase) ne se chargent qu\'au premier besoin.'),
  P('Après une première visite, le service worker garde l\'application sur le poste : elle s\'ouvre sans réseau. Firestore conserve une copie locale des données et met les écritures en file pendant une coupure ; elles partent au retour de la connexion.'),
  H2('5.3 Ergonomie et accessibilité'),
  UL(['Interface en français, typographie française, thème clair ou sombre selon l\'appareil.', 'Utilisable sur ordinateur, tablette et téléphone, sans défilement horizontal.', 'Installable comme une application (icône sur le bureau ou l\'écran d\'accueil).', 'Saisie entièrement au clavier et à la douchette ; touche Entrée pour valider, Échap pour annuler.']),
  H2('5.4 Compatibilité'),
  P('Versions récentes de Chrome, Edge, Firefox et Safari. Douchettes 1D USB ou sans fil en émulation clavier ; une douchette restée en QWERTY sur un clavier AZERTY est reconnue. Fichiers produits : PDF, Excel (.xlsx), JSON.'),
  H2('5.5 Maintenabilité et extensibilité'),
  P('Le code tient en une douzaine de fichiers sources sans dépendance à un serveur propre. Un script de construction produit trois versions du même code : site web, version claude.ai et fichier hors ligne. Le stockage passe par une interface unique (lecture, écriture, fusion, liste, abonnement), ce qui a permis d\'ajouter Firebase sans toucher aux écrans.'),
  table(['Élément', 'Limite de la version 2.0'], [
    ['Élèves par épreuve', '999 (numéro de table sur 3 chiffres)'], ['Classes par niveau', '99 (rang sur 2 chiffres)'], ['Matières au catalogue', '99 (code sur 2 chiffres)'],
    ['Taille d\'une épreuve dans la base', 'environ 55 Kio pour 547 élèves, notes comprises (limite Firestore : 1 Mio par document)'],
    ['Volume annuel estimé', 'quelques centaines de documents et une dizaine de mégaoctets, pour 1 Gio gratuit']
  ], [W(.38), W(.62)], { firstBold: true, caption: 'Capacités' }),

  H1('6. Conception UML'),
  P('Les diagrammes sont écrits en Mermaid (dossier [[docs/uml]]) et rendus en images par le script [[scripts/render-uml.cjs]].'),
  H2('6.1 Diagramme de cas d\'utilisation'),
  fig('uml/01_cas_utilisation.png', 'Cas d\'utilisation par profil'),
  H2('6.2 Diagramme de classes'),
  fig('uml/02_classes.png', 'Diagramme de classes du domaine'),
  H2('6.3 Modèle physique de données'),
  P('La base Firestore est documentaire : une collection par grande entité, un document par classe et par épreuve. La répartition et les notes d\'une épreuve vivent dans son document, ce qui permet de saisir une note par une écriture fusionnée sur une seule clé.'),
  fig('uml/03_donnees.png', 'Collections Firestore', 460),
  H2('6.4 Diagrammes de séquence'),
  fig('uml/04_seq_comptes.png', 'Création et validation d\'un compte'),
  fig('uml/05_seq_saisie.png', 'Saisie d\'une note à la douchette'),
  fig('uml/06_seq_levee.png', 'Levée d\'anonymat'),
  H2('6.5 Diagramme d\'états-transitions'),
  fig('uml/07_etats_epreuve.png', 'États d\'une épreuve', 360),
  H2('6.6 Diagramme d\'activités'),
  fig('uml/08_activite_epreuve.png', 'Circuit complet d\'une épreuve', 380, 820),
  H2('6.7 Diagramme de composants et de déploiement'),
  fig('uml/09_deploiement.png', 'Déploiement : postes, GitHub Pages, Firebase', 560),

  H1('7. Architecture technique et choix technologiques'),
  table(['Couche', 'Technologie', 'Rôle'], [
    ['Interface', 'HTML, CSS, JavaScript sans cadriciel', 'Écrans, navigation, thèmes, PWA'],
    ['Éditions', 'jsPDF 2.5.1, jsPDF-AutoTable 3.8.2', 'PDF générés sur le poste'],
    ['Codes-barres', 'JsBarcode 3.11.6 (Code 128 jeu C)', 'Codes à l\'écran et barres vectorielles des PDF'],
    ['Tableurs', 'SheetJS 0.18.5', 'Imports et exports Excel, CSV, ODS'],
    ['Base en ligne', 'Firebase 10.12.2 : Authentication et Cloud Firestore', 'Comptes, données partagées, temps réel, cache hors connexion'],
    ['Base locale', 'IndexedDB du navigateur', 'Version hors ligne, démonstration, poste non connecté'],
    ['Hébergement', 'GitHub Pages (branche gh-pages du dépôt ai721-exam-management) ; variante Render', 'Site HTTPS public, sans serveur applicatif'],
    ['Polices', 'Public Sans, Bricolage Grotesque, JetBrains Mono (fichiers embarqués)', 'Affichage identique sans appel à un service externe']
  ], [W(.17), W(.43), W(.40)], { firstBold: true, caption: 'Choix technologiques' }),
  P('Toutes les bibliothèques sont copiées dans le site : la page ne fait appel à aucun réseau de diffusion tiers. Seules les connexions à Firebase sortent du domaine, et seulement quand la base en ligne est configurée.'),
  H2('7.1 Organisation du code source'),
  table(['Fichier', 'Contenu'], [
    ['[[src/js/00-core.js]]', 'Constantes, structure 2026-2027, stockage local, état, journal, jeu de démonstration'],
    ['[[src/js/10-model.js]]', 'Évaluations, répartition, codes-barres, statistiques, contrôles de cohérence'],
    ['[[src/js/20-pdf.js]]', 'Toutes les éditions PDF et leurs en-têtes'],
    ['[[src/js/30-ui.js]]', 'Icônes, fenêtres, notifications, graphiques, lecture et écriture Excel'],
    ['[[src/js/40-shell.js]] à [[45-analyse.js]]', 'Accueil, navigation, tableau de bord, référentiels, planning, épreuves, analyse, paramètres'],
    ['[[src/js/46-cloud.js]]', 'Base en ligne Firebase, connexion, comptes, rôles'],
    ['[[src/js/90-boot.js]]', 'Démarrage, choix du stockage, synchronisation, service worker'],
    ['[[src/web/firestore.rules]]', 'Règles de sécurité par rôle'],
    ['[[src/web/sw.js]], [[config.js]]', 'Service worker ; configuration Firebase du site'],
    ['[[src/build.py]]', 'Construction des versions web, claude.ai et hors ligne'],
    ['[[scripts/render-uml.cjs]]', 'Rendu des diagrammes UML']
  ], [W(.36), W(.64)], { caption: 'Organisation du code source' }),

  H1('8. Dictionnaire de données'),
  table(['Champ', 'Type', 'Description'], [
    ['etab, sigle, tutelle, ville', 'texte', 'Identité de l\'établissement'], ['annee', 'texte', 'Année scolaire (2026-2027)'],
    ['coordo, prefets', 'texte, objet', 'Coordonnateur ; préfet de chaque niveau'], ['enteteFR, enteteEN', 'texte', 'En-tête officiel bilingue (une ligne par niveau)'],
    ['logo, pdfStyle, departement', 'image, texte', 'Logo ; modèle d\'en-tête PDF ; service affiché'],
    ['sitCourante, seuilReussite, delaiSaisie, tailleLot, ecartDouble', 'nombres', 'Règles d\'évaluation']
  ], [W(.36), W(.14), W(.50)], { firstBold: true, caption: 'Document cfg/settings' }),
  table(['Champ', 'Type', 'Description'], [
    ['id, level, nom, pole, rang', 'texte, nombre', 'Identifiant, niveau (2nde, 1ere, tle), nom, pôle, rang dans le code'],
    ['students[]', 'liste', 'id, mat (matricule), nom, prenom, sexe, dn (naissance), statut'],
    ['subjects[]', 'liste', 'm (code matière), coef, prof (enseignant)'], ['titulaire', 'texte', 'Professeur principal']
  ], [W(.30), W(.16), W(.54)], { firstBold: true, caption: 'Collection classes' }),
  table(['Champ', 'Type', 'Description'], [
    ['level, subj, trim, sit', 'texte, nombres', 'Niveau, code matière, trimestre, situation'],
    ['date, start, end', 'texte', 'Date (AAAA-MM-JJ), heures de début et de fin'],
    ['classes[]', 'liste', 'Identifiants des classes concernées'],
    ['bareme, double, deadline, consignes', 'divers', 'Barème, double correction, échéance de saisie, consignes'],
    ['status', 'texte', 'planifiee, preparee, composee, saisie, desanonymisee, cloturee'],
    ['placement.list[]', 'liste', '(élève, classe, table, nom) pour chaque élève'],
    ['placement.rooms[]', 'liste', 'Salle, première et dernière table, surveillants'],
    ['marks.{table}', 'objet', 'n, n2, n3, st (P, ABS, DISP, FRAUDE), by, at, corr (motif)'],
    ['anon', 'objet', 'lifted, at, by, forced, missing']
  ], [W(.30), W(.16), W(.54)], { firstBold: true, caption: 'Collection evals' }),
  table(['Champ', 'Type', 'Description'], [
    ['users/{uid} : name, email, role, levels, lastSeen', 'divers', 'Compte, rôle, préfectures, dernière connexion'],
    ['cfg/owner : uid, email, at', 'divers', 'Propriétaire de la base (premier compte), écrit une seule fois'],
    ['logs/{AAAAMMJJ} : entries', 'objet', 'at, who, uid, role, action, detail, level']
  ], [W(.46), W(.12), W(.42)], { firstBold: true, caption: 'Collections users, cfg/owner et logs' }),

  H1('9. Le code-barres d\'anonymat'),
  P('Le code compte douze chiffres et ne contient aucun nom. Le lien entre un code et un élève n\'existe que dans la base et dans la table de correspondance imprimée pour la coordination.'),
  table(['Position', 'Long.', 'Contenu', 'Valeurs', 'Exemple'], [
    ['1', '1', 'Niveau', '1 Seconde, 2 Première, 3 Terminale', '1'], ['2-3', '2', 'Rang de la classe', '01 à 99 (annexe A)', '03 (2C3)'],
    ['4-5', '2', 'Code de la matière', '01 à 99 (annexe B)', '02 (Anglais)'], ['6', '1', 'Trimestre', '1 à 3', '1'], ['7', '1', 'Situation', '1 à 6', '2'],
    ['8-10', '3', 'Numéro de table', '001 à 999', '047'], ['11-12', '2', 'Clé de contrôle', 'ISO 7064 MOD 97-10', '73']
  ], [W(.11), W(.08), W(.27), W(.34), W(.20)], { firstBold: true, caption: 'Structure du code-barres' }),
  P('Le code [[1 03 02 12 047 73]] désigne la copie de l\'élève de 2C3 assis à la table 047 pour l\'épreuve d\'anglais du trimestre 1, situation 2. La clé vaut 98 moins le reste de la division par 97 des dix premiers chiffres multipliés par 100 ; un code est valide quand le nombre de douze chiffres laisse un reste de 1. Elle détecte toute erreur sur un chiffre et toute inversion de deux chiffres voisins.'),
  P('Les barres utilisent le Code 128 en jeu C (101 modules, environ 30 mm de large avec un module de 0,30 mm). Toute douchette 1D vendue pour le commerce le lit, en émulation clavier avec la touche Entrée comme suffixe.'),
  note('Essai du 2 novembre 2026 : les pages de listes de classe, d\'émargement, de bordereaux et d\'étiquettes, rendues à 200 et 300 points par pouce, ont été décodées par la bibliothèque ZXing. Les 59 codes présents ont été lus et leurs clés sont valides.'),
  P('Le code révèle le niveau, la classe et la table, pas le nom. Le brassage alterné place côte à côte des élèves de classes différentes : sans la table de correspondance, sous pli scellé jusqu\'à la levée, un correcteur ne peut pas remonter à l\'élève.'),

  H1('10. Hébergement et déploiement'),
  H2('10.1 Comparatif des hébergeurs gratuits'),
  table(['Hébergeur', 'Avantages', 'Limites', 'Usage recommandé'], [
    ['GitHub Pages', 'Gratuit pour un dépôt public ; HTTPS ; pas de mise en veille ; déjà relié au compte ANDJE30', 'Site statique seulement ; 1 Go au plus ; environ 100 Go de trafic par mois (limite souple)', 'Retenu pour servir l\'application'],
    ['Firebase, offre Spark', 'Sans carte bancaire ; comptes e-mail ; base temps réel avec cache hors connexion ; règles de sécurité', 'Firestore : 1 Gio stocké, 50 000 lectures et 20 000 écritures par jour ; au-delà, offre Blaze payante', 'Retenu pour la base et les comptes'],
    ['Cloudflare Pages', 'Site statique rapide, trafic sans plafond annoncé', 'Base de données à programmer soi-même (Workers, D1)', 'Solution de repli pour le site'],
    ['Netlify (offre gratuite)', 'Déploiement simple, HTTPS', 'Quotas mensuels de trafic et de construction ; pas de base intégrée', 'Non retenu'],
    ['Render (offre gratuite)', 'Site statique gratuit déployé en un clic depuis le dépôt ; déjà utilisé pour AI721 SchoolX CM', 'Le service web gratuit (serveur) se met en veille après inactivité ; base PostgreSQL gratuite supprimée après 30 jours', 'Variante pour le site (fichier render.yaml fourni) ; non retenu pour la base'],
    ['Supabase (offre Free)', 'PostgreSQL et comptes', 'Projet mis en pause après une semaine de faible activité', 'Non retenu (vacances scolaires)'],
    ['claude.ai (artefact)', 'Déjà en service, base partagée', 'Chaque utilisateur doit être invité et disposer d\'un compte claude.ai', 'Version de secours et de démonstration']
  ], [W(.17), W(.29), W(.32), W(.22)], { firstBold: true, size: 18, caption: 'Comparatif des hébergeurs gratuits' }),
  H2('10.2 Choix retenu'),
  P('Le couple GitHub Pages et Firebase donne une application publique, gratuite et sans mise en veille, une base partagée en temps réel et des comptes contrôlés par le serveur. Les quotas Firestore laissent une marge large : une journée de saisie de 3 000 notes consomme 3 000 écritures sur 20 000.'),
  H2('10.3 Procédures'),
  H3('Activer GitHub Pages (une fois)'),
  OL(['Sur github.com, ouvrir le dépôt ANDJE30/ai721-exam-management, puis Settings › Pages.', 'Source : Deploy from a branch ; branche gh-pages, dossier / (root) ; Save.', `Attendre une à deux minutes : l\'adresse ${SITE} s\'affiche.`]),
  H3('Variante : publier aussi sur Render'),
  P(`Sur dashboard.render.com, New › Blueprint, puis le dépôt ANDJE30/ai721-exam-management : le fichier [[render.yaml]] crée le site statique ai721-astra-luz, publié à l\'adresse ${RENDER} (Render ajoute un suffixe si ce nom est déjà pris).`),
  H3('Créer la base Firebase (une fois, environ 10 minutes)'),
  OL(['console.firebase.google.com › Créer un projet (nom proposé : astra-luz-vogt).', 'Authentication › Sign-in method : activer « Adresse e-mail/Mot de passe ».', 'Firestore Database › Créer une base, mode production, emplacement le plus proche.', 'Onglet Rules : coller le contenu de [[firestore.rules]] puis Publier.', 'Authentication › Settings › Authorized domains : ajouter andje30.github.io (et le domaine Render s\'il est utilisé).', 'Paramètres du projet › Vos applications › icône </> : enregistrer une application web et copier le bloc firebaseConfig.', 'Coller ce bloc dans l\'application (Paramètres › Base en ligne) ou le transmettre pour qu\'il soit inscrit dans [[config.js]] du site.', 'Créer le premier compte : il devient Coordination. Restaurer ensuite la sauvegarde de la base locale ou de la version claude.ai.']),
  H3('Mettre à jour l\'application'),
  P('Le code source vit sur la branche [[main]] du dépôt ANDJE30/ai721-exam-management. Le script [[src/build.py]] reconstruit le site dans [[dist/web]] ; ce dossier remplace le contenu de la branche gh-pages et du dossier [[site]] lu par Render. Les postes reçoivent la nouvelle version à l\'ouverture suivante.'),

  H1('11. Recette et assurance qualité'),
  P('Les essais R-01 à R-18 ont été joués le 2 novembre 2026 : sur le jeu de démonstration pour les écrans, et sur les émulateurs officiels de Firebase (Authentication et Firestore, avec les règles de sécurité du chapitre 5) pour les comptes et la base en ligne.'),
  table(['Réf.', 'Essai', 'Résultat attendu', 'Résultat'], [
    ['R-01', 'Import Excel de deux classes, une ligne à classe inconnue', 'Élèves bien répartis, ligne fautive écartée', 'Conforme'],
    ['R-02', 'Deux épreuves qui se chevauchent pour une classe', 'Création refusée, message explicite', 'Conforme'],
    ['R-03', 'Répartition de 485 élèves en brassage alterné', 'Tables 001 à 485, voisins de classes différentes', 'Conforme'],
    ['R-04', 'Listes de classe d\'une matière pour tout le niveau', 'Un seul PDF, une classe par page', 'Conforme (36 pages)'],
    ['R-05', 'Décodage des codes imprimés', 'Tous lus, clé valide', 'Conforme (59 sur 59)'],
    ['R-06', 'Saisie de 12,5 ; 8 ; A ; 15.75 ; 19 ; 25', 'Cinq notes enregistrées, 25 refusé', 'Conforme'],
    ['R-07', 'Code d\'une autre épreuve', 'Copie refusée', 'Conforme'],
    ['R-08', 'Levée avec un PIN faux puis bon (base locale)', 'Refus puis levée inscrite au journal', 'Conforme'],
    ['R-09', 'Relevés, PV, statistiques, correspondance, planning', 'Un fichier par édition', 'Conforme'],
    ['R-10', 'Affichage sur téléphone', 'Aucun défilement horizontal', 'Conforme (390 et 400 px)'],
    ['R-11', 'Premier compte sur base vide', 'Rôle Coordination', 'Conforme (émulateur)'],
    ['R-12', 'Nouveau compte suivant', 'En attente, aucune lecture possible', 'Conforme (refus du serveur)'],
    ['R-13', 'Validation du compte par la Coordination', 'Accès selon le rôle après rechargement', 'Conforme'],
    ['R-14', 'Note saisie par le secrétariat', 'Visible sur le poste de coordination', 'Conforme (temps réel)'],
    ['R-15', 'Levée d\'anonymat forcée par écriture directe du secrétariat', 'Refus du serveur', 'Conforme'],
    ['R-16', 'Auto-attribution du rôle Coordination', 'Refus du serveur', 'Conforme'],
    ['R-17', 'Restauration d\'une sauvegarde dans la base en ligne', '29 classes et 65 épreuves restaurées', 'Conforme'],
    ['R-18', 'PDF et Excel depuis le site web', 'Fichiers produits, aucun appel externe', 'Conforme'],
    ['R-19', 'Ouverture du site sans connexion après une visite', 'Application disponible', 'À faire sur le site publié (le service worker ne s\'active qu\'en HTTPS)'],
    ['R-20', 'Projet Firebase réel et site GitHub Pages activé', 'Connexion depuis deux postes du collège', 'À faire après activation'],
    ['R-21', 'Douchette USB réelle', 'Lecture et validation par Entrée', 'À faire au collège']
  ], [W(.08), W(.36), W(.32), W(.24)], { firstBold: true, size: 18, caption: 'Cahier de recette' }),

  H1('12. Planning, livrables et maintenance'),
  table(['Phase', 'Période', 'Contenu'], [
    ['1. Mise en ligne', 'Novembre 2026', 'Activation de GitHub Pages ; création du projet Firebase ; premier compte de coordination ; restauration des données'],
    ['2. Paramétrage', 'Avant la situation 2', 'Préfets, programmes des classes, enseignants, salles, import des élèves ; comptes du secrétariat'],
    ['3. Formation', 'Même période', 'Séance en mode démonstration, manuel d\'utilisation'],
    ['4. Pilote', 'Situation 2 (trimestre 1)', 'Circuit complet sur une préfecture'],
    ['5. Généralisation', 'Situation 3 (trimestre 2)', 'Trois préfectures ; recette définitive (R-20, R-21)'],
    ['6. Bilan', 'Fin de la situation 6', 'Archivage, demandes d\'évolution, préparation de 2027-2028']
  ], [W(.20), W(.22), W(.58)], { firstBold: true, caption: 'Planning de mise en œuvre' }),
  P('Livrables : le présent cahier des charges et le manuel d\'utilisation (Word et PDF) ; le site publié ; la version claude.ai ; le fichier hors ligne ; le code source avec son script de construction et ses diagrammes. La maintenance se limite aux mises à jour de l\'application et à la surveillance des quotas Firebase, visibles dans la console du projet.'),
  H2('Validation'),
  signatureBlock(['Le Coordonnateur', 'Les Préfets des études', 'Le Chef d\'établissement']),

  H1('13. Évolutions et extensions prévues'),
  UL(['Calcul des moyennes trimestrielles pondérées et export vers le logiciel de bulletins.', 'Lecture des codes-barres par la caméra d\'un téléphone.', 'Envoi des résultats aux parents par SMS ou WhatsApp après levée d\'anonymat.', 'Statistiques pluriannuelles par enseignant et par matière.', 'Nom de domaine propre au collège.']),

  H1('14. Glossaire'),
  table(['Terme', 'Définition'], [
    ['Situation', 'Période d\'évaluation ; six par an, deux par trimestre'], ['Préfecture', 'Ensemble des classes d\'un niveau suivi par un préfet des études'],
    ['Levée d\'anonymat', 'Rattachement des notes saisies sous code aux noms des élèves'], ['Brassage alterné', 'Placement qui intercale les classes pour que deux voisins viennent de classes différentes'],
    ['Code 128', 'Symbologie de code-barres linéaire ; le jeu C code les chiffres par paires'], ['MOD 97-10', 'Méthode de clé de contrôle de la norme ISO 7064, utilisée aussi par l\'IBAN'],
    ['Douchette', 'Lecteur de codes-barres qui tape le code comme un clavier'], ['Bordereau de notation', 'Feuille anonyme où le correcteur reporte les notes d\'un lot de copies'],
    ['PWA', 'Application web installable, utilisable hors connexion'], ['Firestore', 'Base de données documentaire de Google Firebase'],
    ['Règles de sécurité', 'Conditions vérifiées par Firestore avant toute lecture ou écriture'], ['GitHub Pages', 'Service gratuit de GitHub qui publie un site statique']
  ], [W(.26), W(.74)], { firstBold: true, caption: 'Glossaire' }),

  H1('Annexe A. Rang des classes dans le code'),
  table(['Seconde', 'Rang', 'Première', 'Rang', 'Terminale', 'Rang'], [
    ['2C1', '01', 'PC1', '01', 'TC', '01'], ['2C2', '02', 'PC2', '02', 'TCE', '02'], ['2C3', '03', 'PCE', '03', 'TD1', '03'], ['2C4', '04', 'PD1', '04', 'TD2', '04'], ['2C5', '05', 'PD2', '05', 'TD3', '05'], ['2C6', '06', 'PD3', '06', 'TDE', '06'], ['2A', '07', 'PDE', '07', 'TA', '07'], ['2TI', '08', 'PA', '08', 'TTI', '08'], ['2SES1', '09', 'PTI', '09', 'TSES', '09'], ['2SES2', '10', 'PSES', '10', '', '']
  ], [W(.2), W(.13), W(.2), W(.13), W(.2), W(.14)], { caption: 'Rang des classes' }),
  H1('Annexe B. Catalogue des matières proposé'),
  P('Ce catalogue et le programme attribué par défaut à chaque classe sont une base de départ que les préfets vérifient avant la première génération de codes, car le code de la matière entre dans chaque code-barres.'),
  table(['Code', 'Abréviation', 'Intitulé'], subjects.map(s => [s.code, s.abbr, s.nom]), [W(.12), W(.18), W(.70)], { firstBold: true, size: 18, caption: 'Catalogue des matières' })
];

build({ product: 'AI721_ASTRA_LUZ_2.0', docTitle: 'Cahier des charges', children: body, out: __dirname + '/AI721_ASTRA_LUZ_2.0_Cahier_des_charges.docx' });
