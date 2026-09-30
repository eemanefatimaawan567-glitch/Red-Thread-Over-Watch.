# RED THREAD // OVERWATCH

> *Three victims. One relay. A voice that should be dead.*

Chapter 04 of **RED THREAD**: an infiltration mission where you pick a lead, choose a cover identity, and collect three pieces of evidence to stop the next broadcast. Built for the RevenueCat Shipaton 2026.

---

## Screenshots

| Chapter intro | Mission setup | Gameplay |
|---|---|---|
| <img src="chapter-intro.png" width="300"> | <img src="mission-setup.png" width="300"> | <img src="gameplay.png" width="300"> |

---

## Game Flow

```mermaid
flowchart TD
    A([Launch]) --> B[Mission Setup: OVERWATCH]
    B --> C{Choose tonight's lead}
    C -->|Director Han| D[Cover identity]
    C -->|Mira Sol| D
    C -->|Unknown 04| D
    D --> E{Mission mode}
    E -->|Story: more time, lighter damage| F[Confirm Operation]
    E -->|Agent: tactical challenge| F
    F --> G[Chapter title: The Smile Before the Shot]
    G --> H[Begin Infiltration]
    H --> I[Gameplay]
    I --> J{3 signal files secured?}
    J -->|No| I
    J -->|Yes| K[Stop the broadcast]
    K --> L([Mission complete])
```

## Gameplay Loop

```mermaid
flowchart LR
    A[Explore the sector] --> B[Find glowing clues]
    B --> C{Guards nearby?}
    C -->|Yes| D[Stealth / Distract with PIP / Overwatch]
    C -->|No| E[Interact E / F]
    D --> E
    E --> F[Signal file secured]
    F --> G{Signals 3/3?}
    G -->|No| A
    G -->|Yes| H[Transmission stopped]
```

## Store / Wardrobe Flow (RevenueCat)

```mermaid
flowchart TD
    A[Open Field Wardrobe] --> B{Skin unlocked?}
    B -->|Yes| C[Equip skin]
    B -->|No| D{Store online?}
    D -->|Yes| E[RevenueCat purchase]
    E -->|Success| C
    E -->|Cancelled| A
    D -->|No| F[Show Store offline message]
    A --> G[Restore purchases]
    G --> B
```

---

## Controls

| Key | Action |
|---|---|
| WASD / Arrows | Move |
| Space / Click | Fire |
| E / F | Interact |
| C | Stealth |
| Q | Overwatch |
| X / Tap | PIP: distract guards |

## Setup

```bash
git clone https://github.com/eemanefatimaawan567-glitch/Red-Thread-Over-Watch.git
cd Red-Thread-Over-Watch
npm install
```

Create a `.env` file in the project root:

```
VITE_REVENUECAT_API_KEY=your_revenuecat_public_sdk_key
```

Then run:

```bash
npm run dev
```

Without the key the store runs offline and purchasable skins stay locked.

## Tech

- Vite web app
- RevenueCat SDK for in-app purchases (Unlock All, Restore purchases)

## Author

Eeman e Fatima Awan, Institute of Space Technology (IST)
