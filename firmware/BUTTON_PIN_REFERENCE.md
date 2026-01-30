# Button Pin Details - Complete Reference

## ESP32 DevKit V1 Pin Locations (Bottom View)

```
Left Side (Pins)          Top USB Port          Right Side (Pins)
┌─ GND                                               GND ─┐
├─ 3.3V                  [Micro USB]                3.3V ├─
├─ D35                   (Programming)               D34 ├─
├─ D36                                               D39 ├─
├─ D4                                                D36 ├─
├─ D2                                                D4  ├─
├─ D15                                               D2  ├─
├─ D13 ──→ BUTTON 7                                 D14 ├─
├─ D12 ──→ BUTTON 6                                 D27 ├─→ BUTTON 4
├─ D14                                               D25 ├─→ BUTTON 2
├─ D27 ──→ BUTTON 4                                 D32 ├─→ BUTTON 0
├─ D25 ──→ BUTTON 2                                 D5  ├─→ BUTTON 9
├─ D32 ──→ BUTTON 0                                 D18 ├─
├─ D5  ──→ BUTTON 9                                 D19 ├─
├─ D18                                               D21 ├─
├─ D19                                               D22 ├─→ OLED SCL
├─ D21                                               D23 ├─
├─ D22 ──→ OLED SCL                                 GND ├─
├─ D23                                               
├─ D26 ──→ BUTTON 3
├─ D3
├─ D1
├─ D4  ──→ BUTTON 8
├─ D0
├─ D35
├─ GND
└─ GND

Key Pins (Highlighted):
Left Side (Input Pins):
  GPIO 4  ──→ BUTTON 8
  GPIO 5  ──→ BUTTON 9
  GPIO 12 ──→ BUTTON 6
  GPIO 13 ──→ BUTTON 7
  GPIO 14 ──→ Available
  GPIO 15 ──→ BUTTON ENTER
  GPIO 25 ──→ BUTTON 2
  GPIO 26 ──→ BUTTON 3
  GPIO 27 ──→ BUTTON 4
  GPIO 32 ──→ BUTTON 0
  GPIO 33 ──→ BUTTON 1

Right Side (I2C/Serial):
  GPIO 16 ──→ RX2 (To Pico TX)
  GPIO 17 ──→ TX2 (To Pico RX)
  GPIO 21 ──→ SDA (OLED)
  GPIO 22 ──→ SCL (OLED)
```

---

## Individual Button Pin Mapping (Ready to Solder)

### BUTTON 0
```
GPIO 32 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 32          │          │
│ │  (BUTTON 0)      │          │
│ └────────┬─────────┘          │
│          │                    │
│        [Orange Wire]          │
│          │                    │
│          ├──→ BUTTON 0        │
│          │                    │
│        [Orange Wire to GND]   │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 32 (Left side, upper section)
- **Wire Color:** Orange
- **Button Connection:** Button 0
- **GND Connection:** GND Bus (Black wire)

---

### BUTTON 1
```
GPIO 33 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 33          │          │
│ │  (BUTTON 1)      │          │
│ └────────┬─────────┘          │
│          │                    │
│        [Red Wire]             │
│          │                    │
│          ├──→ BUTTON 1        │
│          │                    │
│        [Red Wire to GND]      │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 33 (Left side, upper section)
- **Wire Color:** Red
- **Button Connection:** Button 1
- **GND Connection:** GND Bus (Black wire)

---

### BUTTON 2
```
GPIO 25 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 25          │          │
│ │  (BUTTON 2)      │          │
│ └────────┬─────────┘          │
│          │                    │
│        [Yellow Wire]          │
│          │                    │
│          ├──→ BUTTON 2        │
│          │                    │
│        [Yellow Wire to GND]   │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 25 (Left side, middle section)
- **Wire Color:** Yellow
- **Button Connection:** Button 2
- **GND Connection:** GND Bus (Black wire)

---

### BUTTON 3
```
GPIO 26 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 26          │          │
│ │  (BUTTON 3)      │          │
│ └────────┬─────────┘          │
│          │                    │
│        [Green Wire]           │
│          │                    │
│          ├──→ BUTTON 3        │
│          │                    │
│        [Green Wire to GND]    │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 26 (Left side, middle section)
- **Wire Color:** Green
- **Button Connection:** Button 3
- **GND Connection:** GND Bus (Black wire)

---

### BUTTON 4
```
GPIO 27 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 27          │          │
│ │  (BUTTON 4)      │          │
│ └────────┬─────────┘          │
│          │                    │
│        [Blue Wire]            │
│          │                    │
│          ├──→ BUTTON 4        │
│          │                    │
│        [Blue Wire to GND]     │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 27 (Left side, middle-lower section)
- **Wire Color:** Blue
- **Button Connection:** Button 4
- **GND Connection:** GND Bus (Black wire)

---

### BUTTON 5
```
GPIO 14 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 14          │          │
│ │  (BUTTON 5)      │          │
│ └────────┬─────────┘          │
│          │                    │
│        [Purple Wire]          │
│          │                    │
│          ├──→ BUTTON 5        │
│          │                    │
│        [Purple Wire to GND]   │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 14 (Left side, lower section)
- **Wire Color:** Purple
- **Button Connection:** Button 5
- **GND Connection:** GND Bus (Black wire)

---

### BUTTON 6
```
GPIO 12 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 12          │          │
│ │  (BUTTON 6)      │          │
│ └────────┬─────────┘          │
│          │                    │
│        [Gray Wire]            │
│          │                    │
│          ├──→ BUTTON 6        │
│          │                    │
│        [Gray Wire to GND]     │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 12 (Left side, lower section)
- **Wire Color:** Gray
- **Button Connection:** Button 6
- **GND Connection:** GND Bus (Black wire)

---

### BUTTON 7
```
GPIO 13 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 13          │          │
│ │  (BUTTON 7)      │          │
│ └────────┬─────────┘          │
│          │                    │
│        [Brown Wire]           │
│          │                    │
│          ├──→ BUTTON 7        │
│          │                    │
│        [Brown Wire to GND]    │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 13 (Left side, lower section)
- **Wire Color:** Brown
- **Button Connection:** Button 7
- **GND Connection:** GND Bus (Black wire)

---

### BUTTON 8
```
GPIO 4 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 4           │          │
│ │  (BUTTON 8)      │          │
│ └────────┬─────────┘          │
│          │                    │
│        [White Wire]           │
│          │                    │
│          ├──→ BUTTON 8        │
│          │                    │
│        [White Wire to GND]    │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 4 (Left side, lower section)
- **Wire Color:** White
- **Button Connection:** Button 8
- **GND Connection:** GND Bus (Black wire)

---

### BUTTON 9
```
GPIO 5 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 5           │          │
│ │  (BUTTON 9)      │          │
│ └────────┬─────────┘          │
│          │                    │
│        [Black Wire]           │
│          │                    │
│          ├──→ BUTTON 9        │
│          │                    │
│        [Black Wire to GND]    │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 5 (Left side, lower section)
- **Wire Color:** Black
- **Button Connection:** Button 9
- **GND Connection:** GND Bus (Black wire)

---

### BUTTON ENTER
```
GPIO 15 Connection:
┌────────────────────────────────┐
│ ESP32 Left Side                │
│                                │
│ ┌──────────────────┐          │
│ │ GPIO 15          │          │
│ │  (BUTTON ENTER)  │          │
│ └────────┬─────────┘          │
│          │                    │
│        [Pink Wire]            │
│          │                    │
│          ├──→ BUTTON ENTER    │
│          │                    │
│        [Pink Wire to GND]     │
│          │                    │
│        GND Bus               │
└────────────────────────────────┘
```
- **ESP32 Pin:** GPIO 15 (Left side, lower section)
- **Wire Color:** Pink
- **Button Connection:** Button ENTER
- **GND Connection:** GND Bus (Black wire)

---

## Complete Button Soldering Order (Left to Right on ESP32)

| Order | Button | GPIO | Left/Right | Position | Wire Color | Notes |
|-------|--------|------|-----------|----------|-----------|-------|
| 1 | Button 0 | 32 | LEFT | Upper | Orange | Keypad 0 |
| 2 | Button 1 | 33 | LEFT | Upper | Red | Keypad 1 |
| 3 | Button 2 | 25 | LEFT | Middle | Yellow | Keypad 2 |
| 4 | Button 3 | 26 | LEFT | Middle | Green | Keypad 3 |
| 5 | Button 4 | 27 | LEFT | Middle-Low | Blue | Keypad 4 |
| 6 | Button 5 | 14 | LEFT | Lower | Purple | Keypad 5 |
| 7 | Button 6 | 12 | LEFT | Lower | Gray | Keypad 6 |
| 8 | Button 7 | 13 | LEFT | Lower | Brown | Keypad 7 |
| 9 | Button 8 | 4 | LEFT | Lower | White | Keypad 8 |
| 10 | Button 9 | 5 | LEFT | Lower | Black | Keypad 9 |
| 11 | Button Enter | 15 | LEFT | Lower | Pink | Enter Button |

---

## ESP32 Left Pin Strip (Soldering Points)

```
ESP32 Left Side Pin Strip:

┌─────────────────────────────┐
│ GND  (Top) ─── ALL GROUNDS  │
│ 3.3V (Top) ─── UNUSED       │
│                             │
│ ▌ GPIO 32 ─→ BUTTON 0       │ ← 1st solder point
│ ▌ GPIO 33 ─→ BUTTON 1       │ ← 2nd solder point
│ ▌ (unused)                  │
│ ▌ (unused)                  │
│ ▌ GPIO 25 ─→ BUTTON 2       │ ← 3rd solder point
│ ▌ GPIO 26 ─→ BUTTON 3       │ ← 4th solder point
│ ▌ GPIO 27 ─→ BUTTON 4       │ ← 5th solder point
│ ▌ GPIO 14 ─→ BUTTON 5       │ ← 6th solder point
│ ▌ GPIO 12 ─→ BUTTON 6       │ ← 7th solder point
│ ▌ GPIO 13 ─→ BUTTON 7       │ ← 8th solder point
│ ▌ GPIO 4  ─→ BUTTON 8       │ ← 9th solder point
│ ▌ GPIO 5  ─→ BUTTON 9       │ ← 10th solder point
│ ▌ GPIO 15 ─→ BUTTON ENTER   │ ← 11th solder point
│ ▌                           │
│ ▌ (power section below)     │
│ ▌                           │
│ GND  (Bottom) ─ Connect here│
└─────────────────────────────┘

Solder sequence: Top to bottom
All GND lines → Common GND Bus (one black wire)
```

---

## GND Bus Collection Point

```
ALL BUTTON GROUNDS → Single GND Bus Wire

      Button 0 GND ──┐
      Button 1 GND ──┤
      Button 2 GND ──┤
      Button 3 GND ──┤
      Button 4 GND ──┤
      Button 5 GND ──┤  ← Twist together or use PCB trace
      Button 6 GND ──┤
      Button 7 GND ──┤
      Button 8 GND ──┤
      Button 9 GND ──┤
      Button Enter GND ┤
                      │
                [Black Wire]
                      │
                 ESP32 GND
```

---

## Soldering Sequence (Recommended Order)

### Stage 1: OLED First (Fastest)
1. Solder OLED SDA (GPIO 21)
2. Solder OLED SCL (GPIO 22)
3. Solder OLED GND
4. Solder OLED VCC

### Stage 2: Buttons (Left to Right)
5. Solder Button 0 (GPIO 32)
6. Solder Button 1 (GPIO 33)
7. Solder Button 2 (GPIO 25)
8. Solder Button 3 (GPIO 26)
9. Solder Button 4 (GPIO 27)
10. Solder Button 5 (GPIO 14)
11. Solder Button 6 (GPIO 12)
12. Solder Button 7 (GPIO 13)
13. Solder Button 8 (GPIO 4)
14. Solder Button 9 (GPIO 5)
15. Solder Button Enter (GPIO 15)

### Stage 3: GND Bus
16. Collect all button GND lines
17. Solder GND Bus to ESP32 GND

### Stage 4: Serial (ESP32 to Pico)
18. Solder TX (GPIO 17 → Pico GPIO 9)
19. Solder RX (GPIO 16 → Pico GPIO 8)
20. Solder GND (Common ground)

### Stage 5: USB (Pico to Printer)
21. Solder D+ with 27Ω resistor
22. Solder D- with 27Ω resistor
23. Solder VCC (5V)
24. Solder GND

---

## Quick Copy-Paste Soldering Reference

```
BUTTONS (Copy this to your notes):

GPIO 32 → Button 0   (Orange)
GPIO 33 → Button 1   (Red)
GPIO 25 → Button 2   (Yellow)
GPIO 26 → Button 3   (Green)
GPIO 27 → Button 4   (Blue)
GPIO 14 → Button 5   (Purple)
GPIO 12 → Button 6   (Gray)
GPIO 13 → Button 7   (Brown)
GPIO 4  → Button 8   (White)
GPIO 5  → Button 9   (Black)
GPIO 15 → Button Enter (Pink)

All buttons → GND Bus → ESP32 GND
```

Ready to start soldering! Follow left-to-right and you'll be done with buttons in ~30 minutes!
