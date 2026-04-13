const STORAGE_KEY = 'straincharactersheet';
const SETTINGS_KEY = 'straincharactersheetsettings';
let sensitiveMode = false;

document.body.addEventListener('click', function(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (sensitiveMode && button.classList.contains('sensitive')) {
        console.log('Sensitive button clicked, but action prevented.');
        return;
    }

    const action = button.dataset.action;
    const modal = button.dataset.modal;

    if (button.classList.contains('damagestepbutton')) {
        modifyDamageStep(action);
        return;
    }

    if (action === "confirm-reset") {
        document.getElementById('characterSheetForm').reset();
        setEnableSensitive();
        updateFatigueSlots();
        updateSelectedFatigueSlot(1);
        ModalManager.close("resetmodal");
        ModalManager.close("saveloadmodal");
        return;
    } else if (action === "cancel-reset") {
        ModalManager.close("resetmodal");
        ModalManager.close("saveloadmodal");
        return;
    }

    if (action === "taketempo") {
        const healthInput = document.getElementById('health');
        const healingSurgesInput = document.getElementById('healingsurges');
        const maxhealthInput = document.getElementById('maxhealth');
        const surgeValue = Math.floor(Number(maxhealthInput.value) / 2);
        let surgesToSpend = 0;
        if (document.getElementById('spend1surges').checked) {
            surgesToSpend = 1;
        } else if (document.getElementById('spend2surges').checked) {
            surgesToSpend = 2;
        }
        var recoverBoundsSustained = document.getElementById('recoverboundsustained').checked;
        if (surgesToSpend > 0 && Number(healingSurgesInput.value) >= surgesToSpend) {
            const outputHealth = Math.min(Number(healthInput.value) + surgeValue * surgesToSpend, Number(maxhealthInput.value));
            document.getElementById('health').value = outputHealth;
            healingSurgesInput.value = Number(healingSurgesInput.value) - surgesToSpend;
        }
        for (let slot = 1; slot <= 6; slot += 1) {
            const stateInput = document.getElementById(`state${slot}dieinput`);
            const dieInput = document.getElementById(`fatigue${slot}die`);
            if (recoverBoundsSustained) {
                stateInput.value = '';
                dieInput.value = '';
            } else if (stateInput.value === 'Fatigued') {
                stateInput.value = '';
                dieInput.value = '';
            }
        }
        ModalManager.close("restmodal");
        return;
    }

    if (action === "takeextendedrest") {
        document.getElementById('health').value = document.getElementById('maxhealth').value;
        document.getElementById('healingsurges').value = document.getElementById('maxhealingsurges').value;
        ModalManager.close("restmodal");
        for (let slot = 1; slot <= 6; slot += 1) {
            document.getElementById(`state${slot}dieinput`).value = '';
            document.getElementById(`fatigue${slot}die`).value = '';
        }
        return;
    }

    if (action === "usehealingsurge") {
        usehealingsurge();
        return;
    }

    if (action === "gainmilestone") {
        gainmilestone();
        return;
    }

    if (action === "scale-textarea") {
        scaleTextArea();
        return;
    }

    if (["fatigue", "bind", "sustain", "increase-size", "decrease-size", "remove-die"].includes(action)) {
        applyActionToSelectedFatigueSlot(action);
        console.log(`Applied action ${action} to selected fatigue slot.`);
        return;
    }

    if (action === "save-char") {
        const characterData = collectCharacterData();
        const name = characterData.name || 'character';
        const settings = getSettings();
        if (settings.saveLocally) {
            SaveCharacterLocal(characterData, name);
        } else {
            saveCharacter(characterData, name);
        }
        ModalManager.close("saveloadmodal");
        return;
    } else if (action === "load-char") {
        const settings = getSettings();
        if (settings.saveLocally) {
            const characters = loadLocalCharacters();
            const names = Object.keys(characters);
            if (names.length === 0) {
                alert('No locally saved characters found.');
                return;
            }
            const choice = prompt(`Enter the name of the character to load:\n${names.join('\n')}`);
            if (!choice || !characters[choice]) return;
            populateForm(characters[choice]);
        } else {
            promptForCharacterFile();
        }
        ModalManager.close("saveloadmodal");
        return;
    }

    if (action === "enable-sensitive") {
        setEnableSensitive();
        ModalManager.close("settingsmodal");
        return;
    } else if (action === "disable-sensitive") {
        setDisableSensitive();
        ModalManager.close("settingsmodal");
        return;
    }

    if (action === "open-modal") {
        ModalManager.open(modal);
        return;
    } else if (action === "close-modal") {
        if (modal === "healthmodmodal") {
            let healthValue = document.getElementById('health').value;
            const modValue = document.getElementById('modinput').value;
            healthValue = Math.max(0, Math.min(Number(healthValue) + Number(modValue), Number(document.getElementById('maxhealth').value)));
            document.getElementById('health').value = healthValue;
        }
        ModalManager.close(modal);
        return;
    }
});

const ModalManager = {
    modals: {},

    init() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.modals[modal.id] = modal;
        });
    },

    open(id) {
        const modal = this.modals[id];
        if (modal) modal.classList.add('open');
    },

    close(id) {
        const modal = this.modals[id];
        if (modal) modal.classList.remove('open');
        if (id === 'healthmodmodal') {
            document.getElementById('modinput').value = 0;
        } else if (id === "restmodal") {
            document.getElementById('spend0surges').checked = true;
            document.getElementById('spend1surges').checked = false;
            document.getElementById('spend2surges').checked = false;
            document.getElementById('recoverboundsustained').checked = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ModalManager.init();
});

function getSettings(){
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { saveLocally: false };
}

function setSaveLocally(value) {
    const settings = getSettings();
    settings.saveLocally = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

for (let surge = 0; surge <= 2; surge += 1) {
    document.getElementById(`spend${surge}surges`).addEventListener('change', function() {
        if (this.checked) {
            for (let otherSurge = 0; otherSurge <= 2; otherSurge += 1) {
                if (otherSurge !== surge) {
                    document.getElementById(`spend${otherSurge}surges`).checked = false;
                }
            }
        }
    });
}

window.onclick = function(event) {
    if (event.target == this.document.getElementById("healthmodmodal")) {
        ModalManager.close("healthmodmodal");
    } else if (event.target == this.document.getElementById("restmodal")) {
        ModalManager.close("restmodal");
    } else if (event.target == this.document.getElementById("resetmodal")) {
        ModalManager.close("resetmodal");
    } else if (event.target == this.document.getElementById("saveloadmodal")) {
        ModalManager.close("saveloadmodal");
    } else if (event.target == this.document.getElementById("settingsmodal")) {
        ModalManager.close("settingsmodal");
    }
};

addEventListener('keyup', function(event) {
    if (event.key === 'Escape') {
        ModalManager.close("healthmodmodal");
        ModalManager.close("restmodal");
        ModalManager.close("resetmodal");
        ModalManager.close("saveloadmodal");
        ModalManager.close("settingsmodal");
    }
})

function setDisableSensitive() {
    document.querySelectorAll('.sensitive').forEach((element) => {
        element.disabled = true;
    });
}

function setEnableSensitive() {
    document.querySelectorAll('.sensitive').forEach((element) => {
        element.disabled = false;
    });
}

function collectCharacterData() {
    const fields = document.querySelectorAll('#characterSheetForm input, #characterSheetForm select, #characterSheetForm textarea');
    const data = {};

    fields.forEach((field) => {
        if (!field.name) return;
        if (field.type === 'file') return;
        if (field.type === 'checkbox') {
            data[field.name] = field.checked;
        } else if (field.type === 'number') {
            data[field.name] = field.value === '' ? '' : Number(field.value);
        } else {
            data[field.name] = field.value;
        }
    });

    return data;
}

function loadLocalCharacters() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

function saveLocalCharacters(characters){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

function SaveCharacterLocal(data, name) {
    const characters = loadLocalCharacters();
    const id = name || `character_${Date.now()}`;
    characters[id] = data;
    saveLocalCharacters(characters);
}

function saveCharacter(data, name) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_character_sheet.json`;
    a.click();

    URL.revokeObjectURL(url);
}

function populateForm(data) {
    const fields = document.querySelectorAll('#characterSheetForm input, #characterSheetForm select, #characterSheetForm textarea');
    fields.forEach((field) => {
        if (!field.name) return;
        if (field.type === 'file') return;
        if (data[field.name] === undefined) return;

        if (field.type === 'checkbox') {
            field.checked = data[field.name];
        } else if (field.type === 'number') {
            field.value = data[field.name] === '' ? '' : Number(data[field.name]);
        } else {
            field.value = data[field.name];
        }
    });

    updateFatigueSlots();
}

function loadCharacter(file) {
    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        const data = JSON.parse(event.target.result);
        populateForm(data);
    };
    setDisableSensitive();
    reader.readAsText(file);
}

function promptForCharacterFile() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', function() {
        const selectedFile = this.files && this.files[0];
        if (!selectedFile) {
            fileInput.remove();
            return;
        }

        loadCharacter(selectedFile);
        ModalManager.close('saveloadmodal');
        fileInput.remove();
    }, { once: true });

    document.body.appendChild(fileInput);
    fileInput.click();
}

let selectedFatigueSlot = 1;
for (let slot = 1; slot <= 6; slot += 1) {
    document.getElementById(`selectfatigue${slot}`).checked = false;
}
document.getElementById('selectfatigue1').checked = true;


function getFatigueSlotElements(slotNumber) {
    return {
        cell: document.getElementById(`fatigue-slot-${slotNumber}`),
        dieInput: document.getElementById(`fatigue${slotNumber}die`),
        stateInput: document.getElementById(`state${slotNumber}dieinput`)
    };
}

function updateSelectedFatigueSlot(slotNumber) {
    selectedFatigueSlot = slotNumber;

    for (let slot = 1; slot <= 6; slot += 1) {
        const { cell } = getFatigueSlotElements(slot);
        cell.classList.toggle('selected-fatigue-slot', slot === slotNumber);
    }
}

function getVisibleFatigueSlots(powerScore) {
    const visibleSlots = [];

    for (let slot = 1; slot <= 6; slot += 1) {
        if (powerScore >= slot) {
            visibleSlots.push(slot);
        }
    }

    return visibleSlots;
}

function updateFatigueSlots() {
    const powerScoreInput = document.getElementById('powerscore');
    const powerScore = powerScoreInput.value === '' ? 6 : Number(powerScoreInput.value);
    const visibleSlots = getVisibleFatigueSlots(powerScore);

    for (let slot = 1; slot <= 6; slot += 1) {
        const { cell } = getFatigueSlotElements(slot);
        cell.style.display = powerScore >= slot ? '' : 'none';
    }

    if (!visibleSlots.includes(selectedFatigueSlot)) {
        updateSelectedFatigueSlot(visibleSlots[visibleSlots.length - 1] || 1);
    }
}

function applyActionToSelectedFatigueSlot(action) {
    const { dieInput, stateInput } = getFatigueSlotElements(selectedFatigueSlot);

    if (action === 'increase-size') {
        const currentValue = Number(dieInput.value || 0);
        dieInput.value = currentValue ? Math.min(currentValue + 2, 12) : 4;
        return;
    }

    if (action === 'decrease-size') {
        const currentValue = Number(dieInput.value || 0);
        dieInput.value = currentValue ? Math.max(currentValue - 2, 4) : 4;
        return;
    }

    if (action === 'remove-die') {
        dieInput.value = '';
        stateInput.value = '';
        return;
    }

    if (!dieInput.value) {
        dieInput.value = 4;
    }

    if (action === 'fatigue') {
        stateInput.value = 'Fatigued';
        return;
    }

    if (action === 'bind') {
        stateInput.value = 'Bound';
        return;
    }

    if (action === 'sustain') {
        stateInput.value = 'Sustained';
        return;
    }
}

function modifyDamageStep(action) {
    const changehealth = document.getElementById('modinput') || { value: 0 };
    changehealth.value = Number(changehealth.value) + Number(action);
    document.getElementById('modinput').value = changehealth.value;
}

document.querySelectorAll('.fatigueselector').forEach((checkbox) => {
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            const slotNumber = Number(this.id.replace('selectfatigue', ''));
            updateSelectedFatigueSlot(slotNumber);
            for (let i = 1; i <= 6; i++) {
                if (i !== slotNumber) {
                    document.getElementById(`selectfatigue${i}`).checked = false;
                }
            }
        }
    });
});

document.querySelectorAll('.skillbutton').forEach((button) => {
    button.addEventListener('click', function() {
        const skillInput = this.nextElementSibling;
        const currentValue = Number(skillInput.value || 0);
        if (this.checked) {
            skillInput.value = currentValue + 2;
        } else {
            skillInput.value = currentValue - 2;
        }
    });
});

function usehealingsurge() {
    const healthInput = document.getElementById('health');
    const healingSurgesInput = document.getElementById('healingsurges');
    const maxhealthInput = document.getElementById('maxhealth');
    const surgeValue = Math.floor(Number(maxhealthInput.value) / 2);
    if (healthInput.value === maxhealthInput.value) {
        return;
    }
    if (Number(healingSurgesInput.value) > 0) {
        const outputHealth = Math.min(Number(healthInput.value) + surgeValue, Number(maxhealthInput.value));
        document.getElementById('health').value = outputHealth;
        healingSurgesInput.value = Number(healingSurgesInput.value) - 1;
    }
}

document.getElementById('health').addEventListener('change', function() {
    const healthValue = Number(this.value);
    const maxHealthValue = Number(document.getElementById('maxhealth').value);
    if (healthValue > maxHealthValue) {
        this.value = maxHealthValue;
    } else if (healthValue < 0) {
        this.value = 0;
    }
});

document.getElementById('savelocally').addEventListener('change', function() {
    setSaveLocally(this.checked);
});

const settingsWhenLoading = getSettings();
document.getElementById('savelocally').checked = settingsWhenLoading.saveLocally;

function gainmilestone() {
    const currentMilestones = Number(document.getElementById('milestone').value) || 0;
    if (currentMilestones >= 8) {
        document.getElementById('xp').value = Number(document.getElementById('xp').value) + 1;
        return;
    }
    document.getElementById('milestone').value = currentMilestones + 1;
    const currentAttunement = Number(document.getElementById('attunement').value) || 0;
    document.getElementById('attunement').value = currentAttunement + 1;
}

function scaleTextArea() {
    const textarea = document.getElementById('notes');
    const rightColumn = document.querySelector('.rightcolumn');
    const footer = document.querySelector('footer');
    const textareaTop = textarea.getBoundingClientRect().top;
    const footerHeight = footer ? footer.getBoundingClientRect().height : 0;
    const availableHeight = window.innerHeight - textareaTop - footerHeight;

    const columnwidth = rightColumn.clientWidth;
    textarea.style.width = `${columnwidth - 10}px`;
    textarea.style.height = `${Math.max(availableHeight, 100)}px`;
}

document.getElementById('powerscore').addEventListener('input', updateFatigueSlots);
updateFatigueSlots();
updateSelectedFatigueSlot(1);
scaleTextArea();