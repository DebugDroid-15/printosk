# Printosk Kiosk - Complete Wiring Setup Guide

## Overview
This guide provides detailed wiring instructions for connecting all components of the Printosk kiosk system.

**Total Components:**
- 1× ESP32 DevKit V1
- 1× Raspberry Pi Pico
- 1× SSD1306 OLED Display (1.3", I2C)
- 11× Push Buttons
- 1× EPSON L3115 Thermal Printer
- Connecting wires (jumper wires)
- Power supply

---

## 1. ESP32 DevKit V1 - GPIO Pin Map

### Pin Layout (Top View)
```
GND  3.3V  D35  D34  D39  D36  D4   D2   D15  D13  D12  D14  D27  D25  D32  D35
D23  D22   D21  D19  D18  D5   D17  D16  D4   D0   D2   D4   D5   D18  D19  D21

ESP32 DevKit V1
Micro USB Port: Connect to PC for programming
```

### GPIO Assignment Table

| Function | GPIO | Type | Connection |
|----------|------|------|------------|
| **OLED I2C** | | | |
| SDA | 21 | I2C | OLED Pin 2 |
| SCL | 22 | I2C | OLED Pin 3 |
| **Button Inputs** | | | |
| Button 0 | 32 | INPUT_PULLUP | Button 0 → GND |
| Button 1 | 33 | INPUT_PULLUP | Button 1 → GND |
| Button 2 | 25 | INPUT_PULLUP | Button 2 → GND |
| Button 3 | 26 | INPUT_PULLUP | Button 3 → GND |
| Button 4 | 27 | INPUT_PULLUP | Button 4 → GND |
| Button 5 | 14 | INPUT_PULLUP | Button 5 → GND |
| Button 6 | 12 | INPUT_PULLUP | Button 6 → GND |
| Button 7 | 13 | INPUT_PULLUP | Button 7 → GND |
| Button 8 | 4 | INPUT_PULLUP | Button 8 → GND |
| Button 9 | 5 | INPUT_PULLUP | Button 9 → GND |
| Button Enter | 15 | INPUT_PULLUP | Enter → GND |
| **UART2 (Pico)** | | | |
| TX2 | 17 | UART | Pico GPIO 9 (RX) |
| RX2 | 16 | UART | Pico GPIO 8 (TX) |
| **Power** | | | |
| 3.3V | 3V3 | POWER | OLED VCC, Buttons VCC |
| 5V | 5V | POWER | - |
| GND | GND | POWER | OLED GND, All buttons GND, Pico GND |

---

## 2. OLED Display (SSD1306) - I2C Connection

### Display Pinout
```
┌─────────────────┐
│ SSD1306 OLED    │
│ 1.3" 128x64     │
├─────────────────┤
│ 1: GND ─────────┼─── GND
│ 2: VCC ─────────┼─── 3.3V
│ 3: SCL ─────────┼─── GPIO 22
│ 4: SDA ─────────┼─── GPIO 21
└─────────────────┘
```

### Wiring Table

| OLED Pin | Signal | ESP32 GPIO | Wire Color |
|----------|--------|-----------|-----------|
| 1 | GND | GND | Black |
| 2 | VCC | 3.3V | Red |
| 3 | SCL | GPIO 22 | Yellow |
| 4 | SDA | GPIO 21 | Green |

### Connection Steps
1. Connect OLED GND (pin 1) to ESP32 GND
2. Connect OLED VCC (pin 2) to ESP32 3.3V
3. Connect OLED SCL (pin 3) to ESP32 GPIO 22
4. Connect OLED SDA (pin 4) to ESP32 GPIO 21
5. Use 4.7kΩ pull-up resistors (if not integrated)

---

## 3. Push Buttons (11 Total) - GPIO Connection

### Button Layout (Front View)
```
┌─────────────────────────────────────┐
│                                     │
│    [1]  [2]  [3]                   │
│    [4]  [5]  [6]                   │
│    [7]  [8]  [9]                   │
│         [0]  [Enter]               │
│                                     │
└─────────────────────────────────────┘
```

### Button Wiring Details

**Each Button Requires:**
- One push button (momentary switch)
- One 10kΩ pull-up resistor
- Two jumper wires

**Button Circuit:**
```
ESP32 GPIO ──┬─────[10kΩ]─────[3.3V]
             │
          Button (push = GND)
             │
            GND
```

### Button GPIO Assignment Table

| Button | GPIO | Wire Color | Status |
|--------|------|-----------|--------|
| 0 | 32 | Orange | Active when pressed |
| 1 | 33 | Red | Active when pressed |
| 2 | 25 | Yellow | Active when pressed |
| 3 | 26 | Green | Active when pressed |
| 4 | 27 | Blue | Active when pressed |
| 5 | 14 | Purple | Active when pressed |
| 6 | 12 | Gray | Active when pressed |
| 7 | 13 | Brown | Active when pressed |
| 8 | 4 | White | Active when pressed |
| 9 | 5 | Black | Active when pressed |
| ENTER | 15 | Pink | Active when pressed |

### Installation
1. Mount 11 push buttons on control panel
2. Connect each button's pin to corresponding GPIO
3. Connect each button's other pin to GND rail
4. Add 10kΩ pull-up resistor for each button
5. Test each button with multimeter (continuity check)

---

## 4. Raspberry Pi Pico - GPIO Connection

### Pico Pinout (Top View)
```
GND   GP0   GP1   GP2   GP3   GP4   GP5   GND
3.3V  GP6   GP7   GP8   GP9   GP10  GP11  5V

           USB Port
```

### UART1 Configuration (ESP32 Communication)

| Pico GPIO | Signal | ESP32 Signal | ESP32 GPIO |
|-----------|--------|-------------|-----------|
| GPIO 8 | TX1 | RX2 | GPIO 16 |
| GPIO 9 | RX1 | TX2 | GPIO 17 |
| GND | GND | GND | GND |

### Pico-to-Printer USB Connection

| USB Signal | Pico | Printer |
|-----------|------|---------|
| VCC (5V) | 5V | Pin 1 |
| GND | GND | Pin 4 |
| D+ | GPIO (via controller) | Pin 2 |
| D- | GPIO (via controller) | Pin 3 |

### Wiring Steps
1. Connect Pico GPIO 8 (TX) → ESP32 GPIO 16 (RX) via Yellow wire
2. Connect Pico GPIO 9 (RX) → ESP32 GPIO 17 (TX) via Blue wire
3. Connect Pico GND → ESP32 GND via Black wire
4. Connect Pico USB port to printer via USB-B cable

---

## 5. Complete Wiring Diagram (ASCII)

### Layout Overview
```
┌────────────────────────────────────────────────────────────────────┐
│                         PRINTOSK KIOSK                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────┐         ┌──────────────────┐             │
│  │  OLED Display       │         │  Control Panel   │             │
│  │ (I2C: 21, 22)       │         │                  │             │
│  │                     │         │  ┌─ Button 0     │             │
│  │  SDA ──────┬───────┼─────────┼──┤  GPIO 32      │             │
│  │  SCL ──────┼───────┬─────────┼──┤                │             │
│  │  GND ──────┼───┐   │         │  ├─ Button 1     │             │
│  │  VCC ──────┼───┼───┐        │  ├─ Button 2     │             │
│  │            │   │   │        │  ├─ ... (11 total)             │
│  └────────────┘   │   │        │  │  GPIO 32-33   │             │
│                   │   │        │  │  GPIO 25-27   │             │
│                   │   │        │  │  GPIO 14, 12-13 │           │
│                   │   │        │  │  GPIO 4, 5    │             │
│                   │   │        │  │  GPIO 15      │             │
│                   │   │        └──┤────────────────┘             │
│                   │   │           │                              │
│        ┌──────────┴───┴───────────┴─────────┐                    │
│        │                                    │                    │
│        │      ESP32 DevKit V1               │                    │
│        │                                    │                    │
│        │  Micro USB (Programming)           │                    │
│        │  TX2 (17) ──► Serial2             │                    │
│        │  RX2 (16) ◄── Serial2             │                    │
│        │                                    │                    │
│        └────────────────┬───────────────────┘                    │
│                         │                                        │
│                 Yellow ──┴─── Blue wire                          │
│             (TX crossover RX)                                    │
│                         │                                        │
│        ┌────────────────▼───────────────────┐                    │
│        │                                    │                    │
│        │   Raspberry Pi Pico                │                    │
│        │                                    │                    │
│        │  UART1 (GPIO 8, 9)                │                    │
│        │  USB Port                          │                    │
│        │                                    │                    │
│        └────────────────┬───────────────────┘                    │
│                         │                                        │
│                    USB-B Cable                                   │
│                         │                                        │
│        ┌────────────────▼───────────────────┐                    │
│        │  EPSON L3115 Printer               │                    │
│        │  (USB Thermal Printer)             │                    │
│        │                                    │                    │
│        └────────────────────────────────────┘                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Power Supply Requirements

### Voltage & Current
| Component | Voltage | Current | Power |
|-----------|---------|---------|-------|
| ESP32 DevKit | 3.3V / 5V | 500mA | 2.5W |
| OLED Display | 3.3V | 50mA | 0.17W |
| 11 Buttons | 3.3V | 0mA | 0W (passive) |
| Pico Board | 5V | 100mA | 0.5W |
| Printer | 5V USB | 2A peak | 10W |
| **Total** | | **2.7A** | **13W** |

### Recommended Power Supply
- **USB Hub with Power**: 5V / 3A output minimum
- Connect ESP32 micro USB to powered hub
- Connect Pico USB to powered hub (via USB extension)
- Connect printer to powered hub

---

## 7. Step-by-Step Wiring Instructions

### Phase 1: OLED Display (10 minutes)

1. **Prepare ESP32 Breadboard**
   - Place ESP32 on breadboard
   - Locate GPIO 21, 22 and GND, 3.3V pins

2. **Connect OLED**
   ```
   OLED Pin 1 (GND)  → ESP32 GND (black wire)
   OLED Pin 2 (VCC)  → ESP32 3.3V (red wire)
   OLED Pin 3 (SCL)  → ESP32 GPIO 22 (yellow wire)
   OLED Pin 4 (SDA)  → ESP32 GPIO 21 (green wire)
   ```

3. **Test**
   - Power on with USB
   - Check if OLED turns on (should see startup test)

### Phase 2: Push Buttons (20 minutes)

1. **Prepare Button Panel**
   - Drill 11 holes for buttons
   - Mount buttons in numeric layout (0-9, Enter)
   - Label each button

2. **Wiring Buttons**
   ```
   For each button:
   - Button → GPIO (via jumper)
   - Button → GND (via jumper)
   - Add 10kΩ resistor between GPIO and 3.3V (pull-up)
   ```

3. **Button GPIO Map**
   ```
   ESP32 GPIO 32 → Button 0
   ESP32 GPIO 33 → Button 1
   ESP32 GPIO 25 → Button 2
   ESP32 GPIO 26 → Button 3
   ESP32 GPIO 27 → Button 4
   ESP32 GPIO 14 → Button 5
   ESP32 GPIO 12 → Button 6
   ESP32 GPIO 13 → Button 7
   ESP32 GPIO 4  → Button 8
   ESP32 GPIO 5  → Button 9
   ESP32 GPIO 15 → Button Enter
   ```

4. **Test**
   - Connect battery or USB power
   - Press each button
   - Check Serial Monitor for input detection

### Phase 3: Pico Serial Connection (10 minutes)

1. **Prepare Pico**
   - Identify GPIO 8, 9 on Pico board
   - Identify TX2 (GPIO 17), RX2 (GPIO 16) on ESP32

2. **Cross-Connect Serial (IMPORTANT: TX ↔ RX)**
   ```
   ESP32 GPIO 17 (TX2)  → Pico GPIO 9 (RX1) [Yellow]
   ESP32 GPIO 16 (RX2)  → Pico GPIO 8 (TX1) [Blue]
   ESP32 GND            → Pico GND [Black]
   ```

3. **Verify Connections**
   - Trace each wire carefully
   - Double-check TX/RX are crossed
   - Check GND connection is solid

4. **Test**
   - Upload both firmwares
   - Check Serial Monitor for handshake message

### Phase 4: Printer USB (5 minutes)

1. **Connect Pico to Printer**
   - Connect Pico USB micro to printer USB-B port
   - Use powered USB hub for power
   - Verify printer powers on

2. **Test**
   - Print test command from Pico firmware
   - Check printer output

---

## 8. Wiring Checklist

### Before Power-On
- [ ] All wires securely connected
- [ ] No exposed contacts touching
- [ ] Correct GPIO pins matched to components
- [ ] Pull-up resistors installed on buttons
- [ ] OLED display secured
- [ ] All buttons tested manually

### Power-On Tests
- [ ] ESP32 LED turns on
- [ ] OLED display shows welcome screen
- [ ] Pico LED turns on
- [ ] Serial communication established (handshake)
- [ ] Each button press registers
- [ ] Printer powers on

### Troubleshooting
| Issue | Cause | Solution |
|-------|-------|----------|
| OLED not displaying | SDA/SCL reversed | Check GPIO 21/22 connections |
| Button not responding | GPIO not configured | Reload firmware, check GPIO number |
| Serial not connecting | TX/RX not crossed | Swap ESP32 TX/RX pins |
| Printer not responding | USB not powered | Use powered hub for Pico |
| Display garbled | I2C address wrong | Set to 0x3C in config.h |

---

## 9. Connection Summary Table

### All Connections at a Glance

| From | Pin/GPIO | To | Pin/GPIO | Wire Color |
|------|----------|----|-|-----------|
| ESP32 | GPIO 21 | OLED | SDA | Green |
| ESP32 | GPIO 22 | OLED | SCL | Yellow |
| ESP32 | 3.3V | OLED | VCC | Red |
| ESP32 | GND | OLED | GND | Black |
| ESP32 | GPIO 32 | Button 0 | Input | Orange |
| ESP32 | GPIO 33 | Button 1 | Input | Red |
| ESP32 | GPIO 25 | Button 2 | Input | Yellow |
| ESP32 | GPIO 26 | Button 3 | Input | Green |
| ESP32 | GPIO 27 | Button 4 | Input | Blue |
| ESP32 | GPIO 14 | Button 5 | Input | Purple |
| ESP32 | GPIO 12 | Button 6 | Input | Gray |
| ESP32 | GPIO 13 | Button 7 | Input | Brown |
| ESP32 | GPIO 4 | Button 8 | Input | White |
| ESP32 | GPIO 5 | Button 9 | Input | Black |
| ESP32 | GPIO 15 | Button Enter | Input | Pink |
| ESP32 | GPIO 17 | Pico | GPIO 9 | Yellow |
| ESP32 | GPIO 16 | Pico | GPIO 8 | Blue |
| ESP32 | GND | Pico | GND | Black |
| Pico | USB | Printer | USB-B | USB Cable |

---

## 10. Final Assembly

### Component Placement
```
Front Panel (User Facing):
┌─────────────────────────────────────┐
│                                     │
│   OLED Display                      │
│   (Top center, 128x64)              │
│                                     │
│   Buttons (Numeric Keypad)          │
│   [1]  [2]  [3]                    │
│   [4]  [5]  [6]                    │
│   [7]  [8]  [9]                    │
│        [0]  [Enter]                 │
│                                     │
└─────────────────────────────────────┘

Back Panel (Electronics):
- ESP32 breadboard (center)
- Pico connected via USB hub
- Printer connected to USB hub
- All wires organized with cable ties
```

---

## Ready for Testing!

Once all connections are complete:
1. Connect USB power
2. ESP32 should boot and show welcome screen
3. Press any button to verify operation
4. System ready for print job testing

**Total Assembly Time: ~45 minutes**
