# Printosk Kiosk - FINAL WIRING DIAGRAM (Ready for Soldering)

## Complete Component List

| Component | Quantity | Notes |
|-----------|----------|-------|
| ESP32 DevKit V1 | 1 | Main controller |
| Raspberry Pi Pico | 1 | USB printer interface |
| SSD1306 OLED 1.3" I2C | 1 | Display (128x64) |
| Push Buttons | 11 | Numeric 0-9 + Enter |
| Female USB-A Port | 1 | For printer connection |
| Jumper Wires | ~30 | Various colors |
| Resistors 27Ω | 2 | For USB D+ and D- lines |
| Powered USB Hub | 1 | 5V/3A for power distribution |

---

## SECTION 1: OLED I2C Connection (4 Wires)

### OLED Pinout
```
┌─────────────────────┐
│  SSD1306 OLED       │
│  1.3" (128x64)      │
├─────────────────────┤
│ 1: GND              │
│ 2: VCC              │
│ 3: SCL              │
│ 4: SDA              │
└─────────────────────┘
```

### Wiring Table

| OLED Pin | Signal | ESP32 Pin | Wire Color | Solder To |
|----------|--------|-----------|-----------|-----------|
| 1 | GND | GND | Black | ESP32 GND |
| 2 | VCC | 3.3V | Red | ESP32 3.3V |
| 3 | SCL | GPIO 22 | Yellow | ESP32 GPIO 22 |
| 4 | SDA | GPIO 21 | Green | ESP32 GPIO 21 |

### Soldering Steps
```
Step 1: Black wire GND
 OLED Pin 1 ━━ Solder ━━ ESP32 GND

Step 2: Red wire VCC
 OLED Pin 2 ━━ Solder ━━ ESP32 3.3V

Step 3: Yellow wire SCL
 OLED Pin 3 ━━ Solder ━━ ESP32 GPIO 22

Step 4: Green wire SDA
 OLED Pin 4 ━━ Solder ━━ ESP32 GPIO 21
```

---

## SECTION 2: Push Buttons (11 Buttons - No Resistors Needed!)

### Button Configuration
```
Each button uses ESP32 INTERNAL pull-up resistor
Wiring: GPIO ────→ BUTTON ────→ GND
Status: HIGH (3.3V) when released, LOW (0V) when pressed
```

### Button GPIO Assignment

| Button | GPIO | ESP32 Pin | Wire Color | Connection |
|--------|------|-----------|-----------|------------|
| 0 | 32 | GPIO 32 | Orange | Button 0 → GND |
| 1 | 33 | GPIO 33 | Red | Button 1 → GND |
| 2 | 25 | GPIO 25 | Yellow | Button 2 → GND |
| 3 | 26 | GPIO 26 | Green | Button 3 → GND |
| 4 | 27 | GPIO 27 | Blue | Button 4 → GND |
| 5 | 14 | GPIO 14 | Purple | Button 5 → GND |
| 6 | 12 | GPIO 12 | Gray | Button 6 → GND |
| 7 | 13 | GPIO 13 | Brown | Button 7 → GND |
| 8 | 4 | GPIO 4 | White | Button 8 → GND |
| 9 | 5 | GPIO 5 | Black | Button 9 → GND |
| ENTER | 15 | GPIO 15 | Pink | Enter → GND |

### Button Soldering Diagram

```
For Each Button:

        GPIO (e.g., GPIO 32)
             │
             ├────────→ BUTTON
             │             │
        3.3V (via          GND
        internal           │
        pull-up)           Solder
                           │
                        GND Bus
```

### Detailed Soldering Steps

**Button 0:**
- Wire from ESP32 GPIO 32 → Button 0 Terminal
- Wire from Button 0 Terminal → GND Bus

**Button 1:**
- Wire from ESP32 GPIO 33 → Button 1 Terminal
- Wire from Button 1 Terminal → GND Bus

**(Repeat for all 11 buttons)**

### GND Bus Connection
All button ground wires connect to single GND Bus which connects to ESP32 GND

---

## SECTION 3: ESP32 to Pico Serial (UART2 - 3 Wires)

### ⚠️ CRITICAL: TX and RX Must Be CROSSED ⚠️

| ESP32 | Direction | Pico | Wire Color |
|-------|-----------|------|-----------|
| GPIO 17 (TX2) | → Data → | GPIO 9 (RX) | Yellow |
| GPIO 16 (RX2) | ← Data ← | GPIO 8 (TX) | Blue |
| GND | Power | GND | Black |

### Soldering Diagram

```
ESP32 Side:
┌─────────────────────┐
│  GPIO 17 (TX2)      │
│     │               │
│   Yellow ━━━━━━┓    │
│                │    │
│  GPIO 16 (RX2) │    │
│     │          │    │
│   Blue  ━━━━━━┼┐   │
│                ││   │
│  GND ──────────┼┼┓  │
│                │││  │
└────────────────┼┼┼──┘
                 │││
          ┌──────┘││
          │  ┌────┘│
          │  │  ┌──┘
          ▼  ▼  ▼
        Pico Side:
        ┌────────────────┐
        │  GPIO 9 (RX)   │ ← Yellow
        │  GPIO 8 (TX)   │ ← Blue
        │  GND           │ ← Black
        └────────────────┘
```

### Soldering Steps

**Step 1: TX Cross (Yellow)**
- Solder ESP32 GPIO 17 (TX2) to Pico GPIO 9 (RX)
- Use Yellow wire

**Step 2: RX Cross (Blue)**
- Solder ESP32 GPIO 16 (RX2) to Pico GPIO 8 (TX)
- Use Blue wire

**Step 3: Ground (Black)**
- Solder ESP32 GND to Pico GND
- Use Black wire
- Important: Ensure common ground!

---

## SECTION 4: Pico to Printer USB (Female USB-A Port - 4 Wires)

### USB-A Female Port Pinout
```
Female USB-A Port (PCB Receptacle)
┌───────────────┐
│ 1  2  3  4    │
└───────────────┘
 R  W  G  B
 │  │  │  │
 │  │  │  └─ Pin 4: GND (Black)
 │  │  └───── Pin 3: D+ (Green)
 │  └──────── Pin 2: D- (White)
 └─────────── Pin 1: VCC (Red)
```

### Pico USB Pinout (RP2040)
```
Pico Right Edge (Bottom View):
┌─────────────────────────────┐
│ GND (38)  │  3.3V           │
│ GP0 (39)  │  5V             │
│ GP1 (40)  │  GND (optional) │
└─────────────────────────────┘
```

### Wiring Table

| Pico Pin | Pico GPIO | USB-A Port | Color | Component |
|----------|-----------|-----------|-------|-----------|
| 40 | GP1 | Pin 3 (D+) | Green | D+ (via 27Ω resistor) |
| 39 | GP0 | Pin 2 (D-) | White | D- (via 27Ω resistor) |
| 5V | 5V | Pin 1 (VCC) | Red | Power |
| 38 | GND | Pin 4 (GND) | Black | Ground |

### Soldering Diagram

```
Pico (Right Side):
┌──────────────────────────────────┐
│                                  │
│  Pico GP1 (40) ──[27Ω]──→ USB D+ (Green)
│  Pico GP0 (39) ──[27Ω]──→ USB D- (White)
│  Pico 5V  ────────────────→ USB VCC (Red)
│  Pico GND  ────────────────→ USB GND (Black)
│                                  │
└──────────────────────────────────┘
                 │
                 ↓
        ┌────────────────┐
        │ Female USB-A   │
        │ Port           │
        │                │
        │ 1: VCC (Red)   │
        │ 2: D- (White)  │
        │ 3: D+ (Green)  │
        │ 4: GND (Black) │
        │                │
        └────────────────┘
```

### Soldering Steps

**Step 1: D+ Line (Green Wire)**
- Pico GP1 (Pin 40) → 27Ω resistor → USB-A Pin 3 (D+, Green)
- Resistor goes BETWEEN Pico and USB port

**Step 2: D- Line (White Wire)**
- Pico GP0 (Pin 39) → 27Ω resistor → USB-A Pin 2 (D-, White)
- Resistor goes BETWEEN Pico and USB port

**Step 3: Power (Red Wire)**
- Pico 5V → USB-A Pin 1 (VCC, Red)
- Powered from USB Hub

**Step 4: Ground (Black Wire)**
- Pico GND (Pin 38) → USB-A Pin 4 (GND, Black)
- Connect to GND Bus

---

## SECTION 5: Power Distribution & GND Bus

### Power Supply
```
Powered USB Hub (5V / 3A)
     │
     ├─→ ESP32 Micro USB
     ├─→ Pico USB
     └─→ Printer USB-B
```

### GND Bus (Common Ground)
All GND connections must tie to single GND Bus:

| Component | GND Connection |
|-----------|---|
| ESP32 | GND |
| Pico | GND |
| OLED | GND |
| All Buttons | GND |
| USB-A Port | GND (Pin 4) |

---

## SECTION 6: Complete Soldering Checklist

### Phase 1: OLED (4 Connections)
- [ ] OLED GND (Pin 1) → ESP32 GND
- [ ] OLED VCC (Pin 2) → ESP32 3.3V
- [ ] OLED SCL (Pin 3) → ESP32 GPIO 22
- [ ] OLED SDA (Pin 4) → ESP32 GPIO 21

### Phase 2: Buttons (22 Connections)
- [ ] Button 0 GPIO → ESP32 GPIO 32
- [ ] Button 0 GND → GND Bus
- [ ] Button 1 GPIO → ESP32 GPIO 33
- [ ] Button 1 GND → GND Bus
- [ ] Button 2 GPIO → ESP32 GPIO 25
- [ ] Button 2 GND → GND Bus
- [ ] Button 3 GPIO → ESP32 GPIO 26
- [ ] Button 3 GND → GND Bus
- [ ] Button 4 GPIO → ESP32 GPIO 27
- [ ] Button 4 GND → GND Bus
- [ ] Button 5 GPIO → ESP32 GPIO 14
- [ ] Button 5 GND → GND Bus
- [ ] Button 6 GPIO → ESP32 GPIO 12
- [ ] Button 6 GND → GND Bus
- [ ] Button 7 GPIO → ESP32 GPIO 13
- [ ] Button 7 GND → GND Bus
- [ ] Button 8 GPIO → ESP32 GPIO 4
- [ ] Button 8 GND → GND Bus
- [ ] Button 9 GPIO → ESP32 GPIO 5
- [ ] Button 9 GND → GND Bus
- [ ] Button Enter GPIO → ESP32 GPIO 15
- [ ] Button Enter GND → GND Bus

### Phase 3: ESP32 to Pico Serial (3 Connections)
- [ ] ESP32 GPIO 17 (TX) → Pico GPIO 9 (RX) - Yellow
- [ ] ESP32 GPIO 16 (RX) → Pico GPIO 8 (TX) - Blue
- [ ] ESP32 GND → Pico GND - Black

### Phase 4: Pico to USB (4 Connections)
- [ ] Pico GP1 (GPIO 1) → [27Ω] → USB-A Pin 3 (D+) - Green
- [ ] Pico GP0 (GPIO 0) → [27Ω] → USB-A Pin 2 (D-) - White
- [ ] Pico 5V → USB-A Pin 1 (VCC) - Red
- [ ] Pico GND → USB-A Pin 4 (GND) - Black

### Phase 5: Verification
- [ ] All connections soldered securely
- [ ] No cold solder joints
- [ ] No bridged connections
- [ ] GND bus properly connected to all components
- [ ] 27Ω resistors installed on USB D+/D- lines
- [ ] Power connections verified (no short circuits)

---

## SECTION 7: Quick Reference - GPIO Pin Summary

```
ESP32 GPIO Allocation:

I2C (OLED):
  GPIO 21: SDA (OLED)
  GPIO 22: SCL (OLED)

UART2 (Pico):
  GPIO 16: RX2
  GPIO 17: TX2

Buttons (11 total):
  GPIO 32: Button 0
  GPIO 33: Button 1
  GPIO 25: Button 2
  GPIO 26: Button 3
  GPIO 27: Button 4
  GPIO 14: Button 5
  GPIO 12: Button 6
  GPIO 13: Button 7
  GPIO 4:  Button 8
  GPIO 5:  Button 9
  GPIO 15: Button Enter

Power:
  3.3V: OLED, Buttons pull-up
  5V: (unused on ESP32)
  GND: OLED, Buttons, Pico, USB

Pico GPIO Allocation:

UART1 (ESP32):
  GPIO 8 (Pin 39): TX1 (to ESP32 RX)
  GPIO 9 (Pin 40): RX1 (to ESP32 TX)

USB (Printer):
  GPIO 0 (Pin 39): D- (via 27Ω)
  GPIO 1 (Pin 40): D+ (via 27Ω)

Power:
  5V: USB power (from hub)
  GND: Common ground
```

---

## SECTION 8: Soldering Tools & Materials

### Tools Needed
- [ ] Soldering iron (30-40W)
- [ ] Solder (60/40 tin/lead or lead-free)
- [ ] Soldering flux (helps with connections)
- [ ] Wire strippers
- [ ] Helping hands (third-hand soldering tool)
- [ ] Solder sucker or desoldering braid
- [ ] Multimeter (for continuity testing)
- [ ] Tweezers

### Materials
- [ ] Jumper wires (assorted colors, 22-24 AWG)
- [ ] 27Ω resistors (×2 for USB D+/D-)
- [ ] Heat shrink tubing (for insulation)
- [ ] Solder (lead-free recommended)

---

## SECTION 9: Soldering Tips

1. **Use different wire colors** - Makes debugging easier
2. **Heat both pads** - Don't just heat one side
3. **Use flux** - Makes soldering easier and more reliable
4. **Keep solder joints small** - Just enough to connect
5. **Let cool naturally** - Don't blow on joints
6. **Test with multimeter** - Verify continuity after each connection
7. **Apply heat shrink** - Protect solder joints from shorts
8. **Double-check TX/RX crossing** - Most common mistake!

---

## SECTION 10: Testing After Soldering

### Pre-Power Testing (Multimeter)
```
Test continuity (beep) between:
✓ ESP32 GPIO 22 to OLED SCL (should beep)
✓ ESP32 GPIO 21 to OLED SDA (should beep)
✓ ESP32 GND to OLED GND (should beep)
✓ ESP32 GPIO 32 to Button 0 (should beep)
... (test all connections)
```

### Power-On Testing (First Boot)
```
✓ ESP32 LED turns on
✓ OLED display shows startup screen
✓ Pico LED turns on
✓ Serial communication handshake occurs
```

### Button Testing
```
✓ Press Button 0 → Serial shows "Button 0 pressed"
✓ Press Button 1 → Serial shows "Button 1 pressed"
... (test all 11 buttons)
```

### USB Testing
```
✓ Pico detects USB device (printer)
✓ Serial shows "Printer connected"
```

---

## FINAL SUMMARY

**Total Solder Joints: 33**
- OLED: 4 joints
- Buttons: 22 joints
- Serial: 3 joints
- USB: 4 joints

**Total Wires: ~30 jumper wires**
**Total Resistors: 2 × 27Ω**
**Estimated Soldering Time: 2-3 hours**

---

## Ready to Solder!

This is your final wiring guide. Follow it exactly and your kiosk will work perfectly. Good luck with the soldering!
