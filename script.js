//Equivalent du thread.sleep() en java
const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Permet d'attendre d'avoir la table avant d'executer le code
 */
async function getTable(){
    let table = document.querySelector('tbody>tr') //Entête du tableau
    while(!table){
        table = document.querySelector('tbody>tr')
        await delay(2000)
    }
}

/**
 * Permet de créer un élement de type lien qui servira de bouton
 * @param {text du bouton} label 
 * @param {titre équivalent au tooltip donnant l'info de l'action} title 
 * @returns 
 */
function createBtn(label, title){
    let btn = document.createElement("a")
    btn.innerText = label
    btn.setAttribute("title", title)
    btn.setAttribute("style", "cursor:pointer; margin-right: 5px;")
    return btn;
}


/**
 * Permet de créer un bouton de suppression de ligne
 * @returns Un bouton de suppression de ligne (avec le listener)
 */
function createDeleteBtn(){
    let deleteBtn = createBtn("❌", "supprimer")
    deleteBtn.addEventListener("click", (e)=>{e.target.parentNode.parentNode.remove(); doubleLine()})
    return deleteBtn;
}

/**
 * Permet de créer un bouton de déplacement de ligne
 * @returns Un bouton de suppression de ligne (avec le listener)
 */
function createMoveBtn(){
    let dragHandler = createBtn("☰", "déplacer")
    dragHandler.setAttribute("draggable", "true")
    dragHandler.addEventListener("dragstart", (ev) => {
        ev.target.classList.add("dragged")
        ev.dataTransfer.effectAllowed = "move";
    })
    return dragHandler;
}

/**
 * Permet de créer un bouton d'ajout de ligne
 * @returns Un bouteau d'ajout de ligne (avec le listener)
 */
function createAddBtn(){
    let addBtn = createBtn("➕", "ajouter")
    addBtn.addEventListener("click", (e)=>{
        let currentLine = e.target.parentNode.parentNode;
        let newLine = currentLine.cloneNode(true)
        let i = 0;
        newLine.querySelectorAll('td').forEach(el => {
            if(i!==0) el.innerText="";
            i++;
        });
        newLine.setAttribute('style', "")
        newLine.lastChild.appendChild(createDeleteBtn())
        newLine.lastChild.appendChild(createAddBtn())
        newLine.lastChild.appendChild(createMoveBtn())
        currentLine.after(newLine)
        setContentEditable();
        addListeners();
        addDragListenerForTr(newLine)
        doubleLine();
    })
    return addBtn;
}

/**
 * Fonction qui permet d'ajouter les listener en lien avec le drag n drop pour chaque tr
 */
function addDragListeners(){
    document.querySelectorAll('.tab>tbody>tr').forEach((el)=> {
        addDragListenerForTr(el)
    })
}

/**
 * Fonction qui ajoute les listener sur un tr permettant de déplacer
 * la ligne sélectionnée en dessous
 * @param el
 */
function addDragListenerForTr(el){
    el.addEventListener("drop", (ev) => {
        ev.preventDefault()
        let tr = document.querySelector(".dragged")
        tr.classList.remove("dragged")
        doubleLine();
    })
    el.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        let dropElement = document.querySelector(".dragged")
        if(dropElement) ev.target.closest('tr').after(dropElement.parentNode.parentNode)
    })
}



/**
 * Fonction qui permet d'ajouter les listener sur les td pour actualiser le temps après l'input
 */
function addListeners(){
    document.querySelectorAll('[contenteditable="true"]').forEach(el=>{
        el.addEventListener('input', ()=>{
            timeCalculator();
            doubleLine()
        })})
}

/**
 * Fonction qui s'execute quand la page à chargée
 * Elle ajoute la colonne d'action, la rend non imprimable, puis rend le tableau editable
 */
window.addEventListener('load', async function() {
    await getTable();
    if(document.querySelector("form")) return;
    document.styleSheets[0].insertRule("@media print{.no-print {display: none !important;}}")
    let actionsHead = document.createElement('th')
    actionsHead.classList.add("no-print")
    actionsHead.innerText = "Actions"
    let header = document.querySelector('tbody>tr') //Entête du tableau
    header.appendChild(actionsHead);
    while (header.nextElementSibling){
        header = header.nextElementSibling
        let td = document.createElement("td")
        td.classList.add("no-print")
        let deleteBtn = createDeleteBtn();
        let addBtn = createAddBtn();
        let moveBtn = createMoveBtn();
        td.appendChild(deleteBtn)
        td.appendChild(addBtn)
        td.appendChild(moveBtn)
        header.appendChild(td)
    }
    setContentEditable();
    addDragListeners();
    timeCalculator();
    addListeners();
})

/**
 * Rend tous les td éditable s'ils n'ont pas d'enfant
 */
function setContentEditable(){
    document.querySelectorAll('td').forEach(el => {
        if(el.children.length < 1){
            let contentEditable = document.createElement("div")
            contentEditable.setAttribute("contenteditable","true")
            if(el.innerText !== ""){
                contentEditable.innerText = el.innerText
            }
            el.innerText = ""
            el.appendChild(contentEditable)
        }
    })
}

/**
 * Calcul le temps total avec les durée et l'affiche en bas
 */
function timeCalculator(){
    //Récupère tout les headers
    let headers = document.querySelector('tbody>tr').children;
    //On trouve le header du tableau ou il y a marqué "Horaire"
    let horraireObj = Array.from(headers).find(el => el.textContent === "Horaire")
    //On récupère son index
    let indexHorraire = Array.from(headers).indexOf(horraireObj)
    let seconds = 0; 
    document.querySelectorAll('tr').forEach((tr)=>{
        let caseHoraire = tr.children[indexHorraire]
        //@TODO a trouver meilleur expression
        let regExpHorraire = "(^([0-1][0-9]|2[0-3]):([0-5][0-9])-([0-1][0-9]|2[0-3]):([0-5][0-9]))$"
        if(caseHoraire && caseHoraire.innerText.match(regExpHorraire)){
            let startHour = caseHoraire.innerText.split('-')[0]
            let endHour = caseHoraire.innerText.split('-')[1]
            let startDate = new Date("01/01/2007"+" "+startHour)
            let endDate = new Date("01/01/2007"+" "+endHour)
            seconds+=(endDate-startDate)/1000
        }
    })
    let hours = Math.floor(seconds/60/60)
    let minutes = Math.floor((seconds - hours*60*60)/60)
    let time = hours+"h"+minutes
    document.querySelector('td[align="left"]').innerText = ": "+time

}

/**
 * Fonction qui gère la double ligne sur les nouveau jours
 * Enlève toutes les elements qui la possède
 * Puis parcours tous les <td> et à chaque nouvelle date, créer une nouvelle ligne
 */
function doubleLine(){
    let firstRow = document.querySelector('tbody>tr');
    //Récupère tout les headers
    let headers = firstRow.children;
    //On trouve le header du tableau ou il y a marqué "Date"
    let dateObj = Array.from(headers).find(el => el.textContent === "Date")
    //On récupère son index
    let dateIndex = Array.from(headers).indexOf(dateObj)
    let lastdate = ""
    document.querySelectorAll('tr[style="border-top:double; border-color:red"]').forEach(tr => tr.setAttribute('style', ""))
    document.querySelectorAll('tr').forEach((tr) => {
        let caseDate = tr.children[dateIndex]
        if (caseDate.innerText !== lastdate && tr !== firstRow) {
            tr.setAttribute('style', "border-top:double; border-color:red")
            lastdate = caseDate.innerText;
        }
    })
}