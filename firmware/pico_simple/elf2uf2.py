#!/usr/bin/env python3
"""
Simple ELF to UF2 converter for Raspberry Pi Pico
Usage: python3 elf2uf2.py input.elf output.uf2
"""

import struct
import sys

def read_elf_binaries(filename):
    """Read ELF file and extract loadable sections"""
    import elftools
    from elftools.elf.elffile import ELFFile
    
    with open(filename, 'rb') as f:
        elf = ELFFile(f)
        
        for section in elf.iter_sections():
            if section.header['sh_flags'] & 0x2:  # SHF_ALLOC flag
                data = section.data()
                addr = section.header['sh_addr']
                if data:
                    yield (addr, data)

def convert_elf_to_uf2(elf_file, uf2_file):
    """Convert ELF to UF2 format"""
    UF2_MAGIC_START0 = 0x0A324655  # "UF2\n"
    UF2_MAGIC_START1 = 0x9E5D5157
    UF2_MAGIC_END = 0x0AB16F30
    RP2040_FAMILY = 0xe48bff56
    
    block_size = 256
    blocks = []
    
    # Read binary data
    try:
        with open(elf_file, 'rb') as f:
            data = f.read()
    except:
        print(f"Could not open {elf_file}")
        return False
    
    # Strip ELF header and create binary blocks
    # For Pico, load address is 0x10000000
    num_blocks = (len(data) + block_size - 1) // block_size
    
    print(f"Converting {len(data)} bytes into {num_blocks} UF2 blocks...")
    
    for block_num in range(num_blocks):
        start = block_num * block_size
        end = min(start + block_size, len(data))
        block_data = data[start:end]
        
        # Pad with zeros
        if len(block_data) < block_size:
            block_data += b'\x00' * (block_size - len(block_data))
        
        block = struct.pack('<8I',
            UF2_MAGIC_START0,
            UF2_MAGIC_START1,
            0x00002000,  # FINAL_BLOCK flag
            0x10000000 + start,  # RP2040 load address
            block_size,
            block_num,
            num_blocks,
            RP2040_FAMILY
        ) + block_data + struct.pack('<I', UF2_MAGIC_END)
        
        blocks.append(block)
    
    # Write UF2 file
    try:
        with open(uf2_file, 'wb') as f:
            for block in blocks:
                f.write(block)
        print(f"Successfully wrote {len(blocks)} blocks to {uf2_file}")
        print(f"UF2 file size: {len(blocks) * 512} bytes")
        return True
    except Exception as e:
        print(f"Error writing UF2: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 elf2uf2.py input.elf [output.uf2]")
        sys.exit(1)
    
    elf_file = sys.argv[1]
    uf2_file = sys.argv[2] if len(sys.argv) > 2 else elf_file.replace('.elf', '.uf2')
    
    if convert_elf_to_uf2(elf_file, uf2_file):
        print(f"✅ Done! UF2 ready for flashing: {uf2_file}")
    else:
        print("❌ Conversion failed")
        sys.exit(1)
