import json

lines = 10 # When lines in char were 7, lines was 10 (so +3).

class Character:
    def __init__(self, name, level, power_source, role, resilience, evasion, potency_w, potency_m):
        self.name = name
        self.level = level
        self.power_source = power_source
        self.role = role
        self.HP = 32
        self.healing_surge = 8
        self.XP = 0
        self.momentum = 0
        self.attunement = 4
        self.resilience = resilience
        self.evasion = evasion
        self.potency_w = potency_w
        self.potency_m = potency_m
        self.features = ""
        self.inventory = ""
        self.fatigue_pool = []

    def PrintSheet(self, start_row=1, start_col=1):
        # Print each line at an exact row/column so multiple sheets can coexist.
        lines = [
            f"{self.name} - Level {self.level} {self.power_source} {self.role}",
            f"HP: {self.HP}, Healing Surges: {self.healing_surge}",
            f"XP: {self.XP}, Momentum: {self.momentum}, Attunement: {self.attunement}",
            f"Resilience: {self.resilience}, Evasion: {self.evasion}",
            f"Weapon Potency: {self.potency_w}, Magic Potency: {self.potency_m}",
            f"Features: {self.features}",
            f"Inventory: {self.inventory}",
        ]

        for offset, line in enumerate(lines):
            print(f"\033[{start_row + offset};{start_col}H{line}", end="")

    def Damage(self, damage):
        self.HP = max(0, self.HP - damage)

    def Heal(self):
        self.healing_surge -= 1
        self.HP = min(32, self.HP + 16)
    
    def GainMomentum(self, amount):
        self.momentum += amount
        self.attunement = min(12, self.attunement + 4)
    
    def Tempo(self):
        self.fatigue_pool = []

    def Rest(self):
        self.HP = 32
        self.healing_surge = 8
        self.XP += self.momentum
        self.momentum = 0
        self.attunement = 4
        self.fatigue_pool = []
    
    def SaveChar(self):
        temp = self.fatigue_pool
        del self.fatigue_pool
        with open(f"{self.name}.json", 'w') as file:
            json.dump(self.__dict__, file)
        self.fatigue_pool = temp

def LoadChar(name):
    try:
        with open(f"{name}.json", 'r') as file:
            data = json.load(file)
            init_fields = Character.__init__.__code__.co_varnames
            required_fields = [field for field in init_fields if field != "self"]
            character_data = {k: data[k] for k in required_fields if k in data}

            missing = [field for field in required_fields if field not in character_data]
            if missing:
                print(f"Character file for '{name}' is missing fields: {', '.join(missing)}")
                return None

            character = Character(**character_data)

            for key, value in data.items():
                if key not in required_fields:
                    setattr(character, key, value)

            if not hasattr(character, "fatigue_pool"):
                character.fatigue_pool = []
            return character
    except FileNotFoundError:
        print("Character not found.")
        return None

def NewChar():
    name = input("Enter character name: ").lower()
    level = int(input("Enter character level: "))
    power_source = input("Enter power source: ")
    role = input("Enter role: ")
    resilience = int(input("Enter resilience: "))
    evasion = int(input("Enter evasion: "))
    potency_w = int(input("Enter weapon potency: "))
    potency_m = int(input("Enter magic potency: "))

    character = Character(name, level, power_source, role, resilience, evasion, potency_w, potency_m)
    character.SaveChar()
    print(f"Character {name} created and saved.")
    return character

characters = {}

print("\033[2J\033[H", end="")
update = ""
while True:
    if characters:
        print("\033[2J\033[H", end="")
        sheet_width = 45
        for i, character in enumerate(characters.values()):
            character.PrintSheet(start_row=1, start_col=1 + (i * sheet_width))
        print(f"\033[{lines};1H", end="")
        print(f">>> {update}")
        choice = input("(S)ave, (L)oad, (N)ew character, (E)xit, (I)nteract\t>>>").upper()
        if choice == 'E':
            exit()
        elif choice == 'S':
            for character in characters.values():
                character.SaveChar()
            update = "Saved"
        elif choice == 'L':
            name = input("Character name\t>>>").lower()
            character = LoadChar(name)
            if character:
                characters[name] = character
            update = f"Loaded character: {name}"
        elif choice == 'N':
            character = NewChar()
            characters[character.name] = character
            update = f"Created character: {character.name}"
        elif choice == 'I':
            name = input("Character name\t>>>: ")
            if name in characters:
                character = characters[name]
                action = input("Choose action: (D)amage, (H)eal, Gain (M)omentum, (T)empo, (R)est\t>>>").upper()
                if action == 'D':
                    damage = int(input("Enter damage amount: "))
                    character.Damage(damage)
                    update = f"{name} took {damage} damage"
                elif action == 'H':
                    character.Heal()
                    update = f"{name} healed"
                elif action == 'M':
                    amount = int(input("Enter momentum amount: "))
                    character.GainMomentum(amount)
                    update = f"{name} +{amount} momentum"
                elif action == 'T':
                    character.Tempo()
                    update = f"{name} Tempo"
                elif action == 'R':
                    character.Rest()
                    update = f"Rested {name}"
    else:
        setupLoop = True
        while setupLoop:
            choice = input(f"{len(characters)} characters loaded. Create (N)ew character, (L)oad character, or (E)xit\n").upper()
            if choice == 'E':
                if characters:
                    setupLoop = False
                else:
                    exit()
            elif choice == 'L':
                name = input("Enter character name to load: ").lower()
                character = LoadChar(name)
                characters[name] = character
            elif choice == 'N':
                character = NewChar()
                characters[character.name] = character