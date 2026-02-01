#!/usr/bin/env python3
"""
Proper ELF to UF2 converter based on Raspberry Pi's official implementation
"""

import struct
import sys

UF2_MAGIC_START0 = 0x0A324655  # "UF2\n"
UF2_MAGIC_START1 = 0x9E5D5157
UF2_MAGIC_END = 0x0AB16F30
RP2040_FAMILY = 0xe48bff56
BLOCK_SIZE = 256

def convert_elf_to_uf2(elf_file, uf2_file):
    """Convert ELF to UF2 using proper binary extraction"""
    try:
        from elftools.elf.elffile import ELFFile
        has_elftools = True
    except ImportError:
        has_elftools = False
        print("Warning: elftools not available, using simple binary conversion")
    
    blocks = []
    
    if has_elftools:
        # Proper ELF parsing
        with open(elf_file, 'rb') as f:
            elf = ELFFile(f)
            segments = []
            
            for segment in elf.iter_segments():
                if segment['p_type'] == 'PT_LOAD':
                    data = segment.data()
                    addr = segment['p_paddr']
                    segments.append((addr, data))
            
            if not segments:
                print("No loadable segments found!")
                return False
            
            # Sort by address
            segments.sort(key=lambda x: x[0])
            
            for addr, data in segments:
                print(f"Segment at 0x{addr:08x}, size {len(data)} bytes")
                
                # Create UF2 blocks
                for i in range(0, len(data), BLOCK_SIZE):
                    block_data = data[i:i+BLOCK_SIZE]
                    if len(block_data) < BLOCK_SIZE:
                        block_data += b'\x00' * (BLOCK_SIZE - len(block_data))
                    
                    block = struct.pack('<8I',
                        UF2_MAGIC_START0,
                        UF2_MAGIC_START1,
                        0x00002000,  # FINAL_BLOCK flag
                        addr + i,    # Target address
                        len(block_data),
                        len(blocks),  # Block number
                        len(blocks),  # Total blocks (will update)
                        RP2040_FAMILY
                    ) + block_data + struct.pack('<I', UF2_MAGIC_END)
                    
                    blocks.append((block, addr + i))
            
            # Update total block count in all blocks
            total = len(blocks)
            final_blocks = []
            for i, (block, addr) in enumerate(blocks):
                # Re-pack with correct total
                header = struct.pack('<8I',
                    UF2_MAGIC_START0,
                    UF2_MAGIC_START1,
                    0x00002000,
                    addr,
                    BLOCK_SIZE,
                    i,
                    total,
                    RP2040_FAMILY
                )
                # Skip old header, use new one + data + footer
                final_blocks.append(header + block[32:-4] + struct.pack('<I', UF2_MAGIC_END))
            
            blocks = final_blocks
    else:
        # Fallback: simple binary conversion
        with open(elf_file, 'rb') as f:
            data = f.read()
        
        # Assume RP2040 load address
        addr = 0x10000000
        for i in range(0, len(data), BLOCK_SIZE):
            block_data = data[i:i+BLOCK_SIZE]
            if len(block_data) < BLOCK_SIZE:
                block_data += b'\x00' * (BLOCK_SIZE - len(block_data))
            
            block = struct.pack('<8I',
                UF2_MAGIC_START0,
                UF2_MAGIC_START1,
                0x00002000,
                addr + i,
                BLOCK_SIZE,
                len(blocks),
                len(data) // BLOCK_SIZE + 1,
                RP2040_FAMILY
            ) + block_data + struct.pack('<I', UF2_MAGIC_END)
            
            blocks.append(block)
    
    # Write UF2 file
    try:
        with open(uf2_file, 'wb') as f:
            for block in blocks:
                f.write(block)
        print(f"✅ Successfully wrote {len(blocks)} blocks to {uf2_file}")
        print(f"   UF2 file size: {len(blocks) * 512} bytes")
        return True
    except Exception as e:
        print(f"❌ Error writing UF2: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 elf2uf2_proper.py input.elf [output.uf2]")
        sys.exit(1)
    
    elf_file = sys.argv[1]
    uf2_file = sys.argv[2] if len(sys.argv) > 2 else elf_file.replace('.elf', '.uf2')
    
    if convert_elf_to_uf2(elf_file, uf2_file):
        print(f"✅ UF2 ready: {uf2_file}")
    else:
        sys.exit(1)
