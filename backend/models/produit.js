const db = require('../config/db');

const Produit = {

    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO produits_agricoles (produit_nom, produit_date_maj, produit_description, produit_unite, produit_categorie) VALUES (?, ?, ?, ?, ?)`,
            [data.nom, data.date_maj, data.description || null, data.unite || 'kg', data.categorie || null]
        );
        return result.insertId;
    },

    async trouverTous() {
        const [produits] = await db.execute(
            `SELECT * FROM produits_agricoles ORDER BY produit_id DESC`
        );
        for (const produit of produits) {
            const [marches] = await db.execute(
                `SELECT m.marche_id, m.marche_nom, m.marche_localisation, m.marche_quantite, m.prix_agricole as prix,
                        m.marche_utilisateur_id as vendeur_id, u.utilisateur_nom as vendeur_nom
                FROM marches m
                LEFT JOIN utilisateurs u ON u.utilisateur_id = m.marche_utilisateur_id
                WHERE m.produit_id = ?`,
                [produit.produit_id]
            );
            produit.marches = marches;
        }
        return produits;
    },

    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT * FROM produits_agricoles WHERE produit_id = ?`,
            [id]
        );
        return rows[0];
    },

    async modifier(id, data) {
        const [result] = await db.execute(
            `UPDATE produits_agricoles SET produit_nom = ?, produit_date_maj = ?, produit_description = ?, produit_unite = ?, produit_categorie = ? WHERE produit_id = ?`,
            [data.nom, data.date_maj, data.description || null, data.unite || 'kg', data.categorie || null, id]
        );
        return result.affectedRows;
    },

    async supprimer(id) {
        const [result] = await db.execute(
            `DELETE FROM produits_agricoles WHERE produit_id = ?`,
            [id]
        );
        return result.affectedRows;
    },

    async ajouterMarche(data) {
        const [result] = await db.execute(
            `INSERT INTO marches (produit_id, marche_nom, marche_localisation, prix_agricole, marche_utilisateur_id, marche_quantite) VALUES (?, ?, ?, ?, ?, ?)`,
            [data.produit_id, data.nom, data.localisation, data.prix, data.utilisateur_id || null, data.quantite || null]
        );
        return result.insertId;
    },

    async trouverMarches(produit_id) {
        const [rows] = await db.execute(
            `SELECT m.*, u.utilisateur_nom as vendeur_nom
            FROM marches m
            LEFT JOIN utilisateurs u ON u.utilisateur_id = m.marche_utilisateur_id
            WHERE m.produit_id = ?`,
            [produit_id]
        );
        return rows;
    },

    // periode : '30j' | '6mois' | '1an' | absent (tout l'historique). L'intervalle vient d'une
    // liste blanche fixe (jamais interpole depuis la valeur brute du client) pour rester injection-safe
    // malgre l'unite d'INTERVAL qui ne peut pas etre un parametre lie.
    async historiquePrix(produit_id, periode) {
        const INTERVALLES = { '30j': '30 DAY', '6mois': '6 MONTH', '1an': '1 YEAR' };
        const intervalle = INTERVALLES[periode];
        const filtreDate = intervalle ? `AND m.created_at >= DATE_SUB(NOW(), INTERVAL ${intervalle})` : '';

        const [rows] = await db.execute(
            `SELECT m.*, p.produit_nom, u.utilisateur_nom as vendeur_nom
            FROM marches m
            JOIN produits_agricoles p ON m.produit_id = p.produit_id
            LEFT JOIN utilisateurs u ON u.utilisateur_id = m.marche_utilisateur_id
            WHERE m.produit_id = ? ${filtreDate}
            ORDER BY m.created_at ASC`,
            [produit_id]
        );
        return rows;
    }
};

module.exports = Produit;