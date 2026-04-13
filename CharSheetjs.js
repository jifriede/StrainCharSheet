var modifyhealthButton = document.getElementById("modifyhealthbutton");
var resetButton = document.getElementById("resetbutton");
var confirmResetButton = document.getElementById("confirmresetbutton");
var cancelResetButton = document.getElementById("cancelresetbutton");

function openResetModal() {
    var modal = document.getElementById("resetmodal");
    if (modal) {
        modal.style.display = "block";
    }
}

function closeResetModal() {
    var modal = document.getElementById("resetmodal");
    if (modal) {
        modal.style.display = "none";
    }
}

resetButton.onclick = function() {
    openResetModal();
}

cancelResetButton.onclick = function() {
    closeResetModal();
}

confirmResetButton.onclick = function() {
    document.getElementById('characterSheetForm').reset();
    setEnableSensitive();
    updateFatigueSlots();
    updateSelectedFatigueSlot(1);
    closeResetModal();
}

function openRestModal() {
    var modal = document.getElementById("restmodal");
    if (modal) {
        modal.style.display = "block";
    }
}

function closeRestModal() {
    var modal = document.getElementById("restmodal");
    if (modal) {
        modal.style.display = "none";
    }
}

document.getElementById("takerestbutton").onclick = function() {
    openRestModal();
}

document.getElementById('tempobutton').addEventListener('click', function() {
    const healthInput = document.getElementById('health');
    const healingSurgesInput = document.getElementById('healingsurges');
    const maxhealthInput = document.getElementById('maxhealth');
    const surgeValue = Math.floor(Number(maxhealthInput.value) / 2);
    for (let surge = 0; surge <= 2; surge += 1) {
        if (document.getElementById(`spend${surge}surges`).checked) {
            surgesToSpend = surge;
        }
        document.getElementById(`spend${surge}surges`).checked = false;
    }
    var recoverBoundsSustained = document.getElementById('recoverboundsustained').checked;
    document.getElementById('recoverboundsustained').checked = false;
    if (surgesToSpend > 0 && Number(healingSurgesInput.value) >= surgesToSpend) {
        const outputHealth = Math.min(Number(healthInput.value) + surgeValue * surgesToSpend, Number(maxhealthInput.value));
        document.getElementById('health').value = outputHealth;
        healingSurgesInput.value = Number(healingSurgesInput.value) - surgesToSpend;
    }
    if (recoverBoundsSustained) {
        for (let slot = 1; slot <= 6; slot += 1) {
            document.getElementById(`state${slot}dieinput`).value = '';
            document.getElementById(`fatigue${slot}die`).value = '';
        }
    } else {
        for (let slot = 1; slot <= 6; slot += 1) {
            state = document.getElementById(`state${slot}dieinput`).value;
            if (state === 'Fatigued') {
                document.getElementById(`state${slot}dieinput`).value = '';
                document.getElementById(`fatigue${slot}die`).value = '';
            }
        }
    }
    closeRestModal();
});

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

document.getElementById('extendedrestbutton').addEventListener('click', function() {
    document.getElementById('health').value = document.getElementById('maxhealth').value;
    document.getElementById('healingsurges').value = document.getElementById('maxhealingsurges').value;
    closeRestModal();
    for (let slot = 1; slot <= 6; slot += 1) {
        document.getElementById(`state${slot}dieinput`).value = '';
        document.getElementById(`fatigue${slot}die`).value = '';
    }
});


function openHealthModModal() {
    var modal = document.getElementById("healthmodmodal");
    if (modal) {
        modal.style.display = "block";
    }
}

function closeHealthModModal() {
    var modal = document.getElementById("healthmodmodal");
    if (modal) {
        modal.style.display = "none";
    }
    document.getElementById('modinput').value = 0;
}

modifyhealthButton.onclick = function() {
    openHealthModModal();
}

window.onclick = function(event) {
    var modal = document.getElementById("healthmodmodal");
    if (event.target == modal) {
        closeHealthModModal();
    }
    if (event.target == this.document.getElementById("restmodal")) {
        closeRestModal();
    }
    if (event.target == this.document.getElementById("resetmodal")) {
        closeResetModal();
    }
};

addEventListener('keyup', function(event) {
    if (event.key === 'Escape') {
        closeHealthModModal();
        closeRestModal();
        closeResetModal();
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

function loadCharacter(file) {
    const reader = new FileReader();

    reader.onload = function(event) {
        const data = JSON.parse(event.target.result);
        console.log(data);
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
    };
    setDisableSensitive();
    reader.readAsText(file);
}

let selectedFatigueSlot = 1;

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

    if (action === 'increase') {
        const currentValue = Number(dieInput.value || 0);
        dieInput.value = currentValue ? Math.min(currentValue + 2, 12) : 4;
        return;
    }

    if (action === 'decrease') {
        const currentValue = Number(dieInput.value || 0);
        dieInput.value = currentValue ? Math.max(currentValue - 2, 4) : 4;
        return;
    }

    if (action === 'remove') {
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
    const damage = document.getElementById('modinput') || { value: 0 };
    if (action === '-10damage') {
        damage.value = damage.value-10;
    }
    if (action === '-5damage') {
        damage.value = damage.value-5;
    }
    if (action === '-1damage') {
        damage.value = damage.value-1;
    }
    if (action === '+1damage') {
        damage.value = Number(damage.value)+1;
    }
    if (action === '+5damage') {
        damage.value = Number(damage.value)+5;
    }
    if (action === '+10damage') {
        damage.value = Number(damage.value)+10;
    }
    document.getElementById('modinput').value = damage.value;
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

document.querySelectorAll('.damagestepbutton').forEach((button) => {
    button.addEventListener('click', function() {
        modifyDamageStep(this.id);
    });
});

const applyDamageButton = document.getElementById('applydamagebutton');
if (applyDamageButton) {
    applyDamageButton.addEventListener('click', function() {
        const healthInput = document.getElementById('health');
        const modInput = document.getElementById('modinput');
        const maxHealthInput = document.getElementById('maxhealth');
        const outputHealth = Math.max(Math.min(Number(healthInput.value) + Number(modInput.value), Number(maxHealthInput.value)), 0);
        document.getElementById('health').value = outputHealth;
        closeHealthModModal();
    });
}

document.getElementById('usehealingsurgebutton').addEventListener('click', function() {
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
});

document.getElementById('health').addEventListener('change', function() {
    const healthValue = Number(this.value);
    const maxHealthValue = Number(document.getElementById('maxhealth').value);
    if (healthValue > maxHealthValue) {
        this.value = maxHealthValue;
    } else if (healthValue < 0) {
        this.value = 0;
    }
});

document.getElementById('gainmilestonebutton').addEventListener('click', function() {
    const currentMilestones = Number(document.getElementById('milestone').value) || 0;
    if (currentMilestones >= 8) {
        document.getElementById('xp').value = Number(document.getElementById('xp').value) + 1;
        return;
    }
    document.getElementById('milestone').value = currentMilestones + 1;
    const currentAttunement = Number(document.getElementById('attunement').value) || 0;
    document.getElementById('attunement').value = currentAttunement + 1;
});

document.getElementById('fatigueButton').addEventListener('click', function() {
    applyActionToSelectedFatigueSlot('fatigue');
});

document.getElementById('bindButton').addEventListener('click', function() {
    applyActionToSelectedFatigueSlot('bind');
});

document.getElementById('sustainButton').addEventListener('click', function() {
    applyActionToSelectedFatigueSlot('sustain');
});

document.getElementById('increaseSizeButton').addEventListener('click', function() {
    applyActionToSelectedFatigueSlot('increase');
});

document.getElementById('decreaseSizeButton').addEventListener('click', function() {
    applyActionToSelectedFatigueSlot('decrease');
});

document.getElementById('removeDieButton').addEventListener('click', function() {
    applyActionToSelectedFatigueSlot('remove');
});

document.getElementById('savebutton').addEventListener('click', function() {
    const characterData = collectCharacterData();
    saveCharacter(characterData, characterData.name || 'character');
});

document.getElementById('loadbutton').addEventListener('click', function() {
    const fileInput = document.getElementById('loadsheet');
    loadCharacter(fileInput.files[0]);
});

document.getElementById('enablesensitivebutton').addEventListener('click', function() {
    setEnableSensitive();
});

document.getElementById('disablesensitivebutton').addEventListener('click', function() {
    setDisableSensitive();
});

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

document.getElementById('scaletextarea').addEventListener('click', function() {
    scaleTextArea();
});

document.getElementById('powerscore').addEventListener('input', updateFatigueSlots);
updateFatigueSlots();
updateSelectedFatigueSlot(1);
scaleTextArea();