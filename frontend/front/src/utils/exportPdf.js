import jsPDF from 'jspdf';

// Genere un rapport PDF simple pour une exploitation : infos generales + liste des cultures.
// Volontairement basique (pas de mise en page complexe) mais utile en vrai (dossier de pret
// agricole, partage avec un cooperative, archive personnelle).
export function exporterRapportExploitation(exploitation, cultures = []) {
    const doc = new jsPDF();
    const vert = [45, 106, 79]; // #2D6A4F, couleur primaire de la charte

    doc.setFillColor(...vert);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('AgriSmart — Rapport d\'exploitation', 14, 18);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.text(exploitation.exploitation_nom || 'Exploitation', 14, 40);

    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    const dateCreation = exploitation.exploitation_date_creation
        ? new Date(exploitation.exploitation_date_creation).toLocaleDateString('fr-FR')
        : '—';
    doc.text(`Superficie : ${exploitation.exploitation_superficie ?? '—'} ares`, 14, 48);
    doc.text(`Date de creation : ${dateCreation}`, 14, 54);
    doc.text(`Genere le : ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`, 14, 60);

    doc.setDrawColor(...vert);
    doc.line(14, 66, 196, 66);

    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(`Cultures (${cultures.length})`, 14, 76);

    let y = 86;
    if (cultures.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text('Aucune culture enregistree pour cette exploitation.', 14, y);
    } else {
        cultures.forEach((c, idx) => {
            if (y > 275) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(11);
            doc.setTextColor(30, 30, 30);
            doc.text(`${idx + 1}. ${c.culture_type}`, 14, y);
            doc.setFontSize(9);
            doc.setTextColor(110, 110, 110);
            const datePlantation = c.culture_date_plantation
                ? new Date(c.culture_date_plantation).toLocaleDateString('fr-FR')
                : '—';
            doc.text(`Plantee le ${datePlantation} — statut : ${c.culture_statut || '—'}`, 20, y + 5);
            y += 14;
        });
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Genere automatiquement par AgriSmart — Plateforme agricole intelligente', 14, 290);

    doc.save(`rapport-${(exploitation.exploitation_nom || 'exploitation').replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
